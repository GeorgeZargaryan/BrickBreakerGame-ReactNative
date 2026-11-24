import { Canvas, Circle, Rect, RoundedRect, Path, DashPathEffect, Skia } from "@shopify/react-native-skia";
import { View, Text, StyleSheet, useWindowDimensions, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useSharedValue, useFrameCallback, runOnJS, useAnimatedStyle, useDerivedValue } from "react-native-reanimated";
import { useCallback, useRef, useState } from "react";
import { GestureDetector } from "react-native-gesture-handler";
import { BrickState, createInitialBall, createInitialPaddle } from "@/game/entities";
import { handleAllCollisions, checkGameOver, type Board } from "@/game/collisions";
import { getBrickDisplayColor } from "@/game/colorUtils";
import { getBoardSize, PADDLE_CONFIG, MAX_BOUNCE_ANGLE } from "@/game/config";
import { useTheme } from "@/context/ThemeContext";
import { useSettings } from "@/context/SettingsContext";
import { usePlayerName } from "@/context/PlayerNameContext";
import { API_BASE, submitScore } from "@/services/leaderboardApi";
import { getOrCreateProfileToken } from "@/services/playerProfile";
import { useRouter, useFocusEffect } from "expo-router";
import { triggerPaddleHaptic, triggerBrickHaptic, triggerGameOverHaptic } from "@/game/haptics";
import { usePauseOnBackground } from "@/hooks/usePauseOnBackground";
import { usePaddlePhysics } from "@/hooks/usePaddlePhysics";
import { usePowerUps, WIDEN_COLOR, SLOW_COLOR } from "@/hooks/usePowerUps";
import { useLevelProgression } from "@/hooks/useLevelProgression";
import { usePersonalBest } from "@/hooks/usePersonalBest";
import { useComboSystem } from "@/hooks/useComboSystem";
import { useAiming } from "@/hooks/useAiming";
import { PowerUpBadge } from "@/components/game/PowerUpBadge";

const AIM_LINE_LENGTH_FACTOR = 0.6;
const POWER_UP_HUD_HEIGHT = 32;

export function GameCanvas() {
    const { theme } = useTheme();
    const { hapticsEnabled } = useSettings();
    const { playerName } = usePlayerName();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const HEADER_HEIGHT_ESTIMATE = 60;
    const VERTICAL_MARGIN = 24;
    const availableHeight = windowHeight - insets.top - insets.bottom - HEADER_HEIGHT_ESTIMATE - POWER_UP_HUD_HEIGHT - VERTICAL_MARGIN;
    const { width: boardWidth, height: boardHeight, scale } = getBoardSize(windowWidth, availableHeight);
    const board: Board = { width: boardWidth, height: boardHeight };

    const initialPaddle = createInitialPaddle(
        boardWidth / 2 - (PADDLE_CONFIG.width * scale) / 2,
        boardHeight - PADDLE_CONFIG.height * scale - 10 * scale,
        PADDLE_CONFIG.width * scale,
        PADDLE_CONFIG.height * scale,
        theme.paddle,
        6
    );
    const makeNewBall = () => createInitialBall(boardWidth / 2, boardHeight - 30 * scale, theme.ball, 8 * scale);
    const [initialBall] = useState(makeNewBall);

    const ballX = useSharedValue(initialBall.xCoord);
    const ballY = useSharedValue(initialBall.yCoord);
    const ballXDir = useSharedValue(initialBall.xDirection);
    const ballYDir = useSharedValue(initialBall.yDirection);

    const [isAimingUI, setIsAimingUI] = useState(true);
    const aiming = useAiming();

    const powerUps = usePowerUps(scale);
    const levelProgression = useLevelProgression(scale, theme);

    const pauseState = usePauseOnBackground();
    const personalBest = usePersonalBest();
    const combo = useComboSystem();
    const [displayStreak, setDisplayStreak] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const [scoreUploadStatus, setScoreUploadStatus] = useState<"saving" | "saved" | "failed" | null>(null);
    const runScore = useSharedValue(0);
    const runVersion = useRef(0);
    const boardOffset = useSharedValue({ x: 0, y: 0 });
    const serveY = initialPaddle.yCoord - initialBall.radius;
    const controlsEnabled = !isGameOver && !levelProgression.isTransitioning && !pauseState.isPaused;
    const paddlePhysics = usePaddlePhysics(
        initialPaddle, boardWidth, aiming,
        { ballXDir, ballYDir }, initialBall.speed, MAX_BOUNCE_ANGLE,
        () => setIsAimingUI(false),
        { boardOffset, originY: serveY, enabled: controlsEnabled },
    );
    const { paddleX, paddleWidthSV, panGesture, computeVelocity } = paddlePhysics;

    const announceAnimatedStyle = useAnimatedStyle(() => ({
        opacity: levelProgression.announceOpacity.value,
    }));

    const aimLinePath = useDerivedValue(() => {
        const builder = Skia.PathBuilder.Make();
        const originX = paddleX.value + paddleWidthSV.value / 2;
        const rad = aiming.aimAngleDeg.value * (Math.PI / 180);
        const length = aiming.aimDistance.value || boardHeight * AIM_LINE_LENGTH_FACTOR;
        const endX = originX + length * Math.sin(rad);
        const endY = serveY - length * Math.cos(rad);
        builder.moveTo(originX, serveY);
        builder.lineTo(endX, endY);
        return builder.detach();
    });

    const hasTriggeredGameOver = useSharedValue(0);

    function resetAllSystems() {
        hasTriggeredGameOver.value = 0;
        const freshBall = makeNewBall();
        ballX.value = freshBall.xCoord;
        ballY.value = freshBall.yCoord;
        ballXDir.value = freshBall.xDirection;
        ballYDir.value = freshBall.yDirection;
        paddlePhysics.reset(initialPaddle);
        powerUps.reset();
        combo.reset();
        setDisplayStreak(0);
        aiming.reset();
        setIsAimingUI(true);
    }

    async function handleGameOver(finalScore: number, level: number) {
        setIsGameOver(true);
        triggerGameOverHaptic(hapticsEnabled);
        const version = runVersion.current;
        void personalBest.checkAndUpdate(finalScore, level).catch((err) => {
            console.error("Personal best update failed:", err);
        });

        const name = playerName.trim();
        if (!API_BASE || !name) return;

        setScoreUploadStatus("saving");
        try {
            const token = await getOrCreateProfileToken(name);
            await submitScore(name, finalScore, level, token);
            if (runVersion.current === version) setScoreUploadStatus("saved");
        } catch {
            if (runVersion.current === version) setScoreUploadStatus("failed");
        }
    }

    function resetRun() {
        runVersion.current += 1;
        runScore.value = 0;
        setScoreUploadStatus(null);
        setIsGameOver(false);
        personalBest.reset();
    }

    function resetGame() {
        resetRun();
        levelProgression.restart(resetAllSystems);
    }

    function togglePause() {
        if (isGameOver || levelProgression.isTransitioning) return;
        pauseState.setIsPaused((prev) => !prev);
    }

    useFocusEffect(
        useCallback(() => {
            resetRun();
            levelProgression.startInitialLevel(1, resetAllSystems);
        }, [])
    );

    useFrameCallback((frameInfo) => {
        "worklet";
        if (!controlsEnabled || hasTriggeredGameOver.value === 1) return;

        if (aiming.isAiming.value === 1) {
            ballX.value = paddleX.value + paddleWidthSV.value / 2;
            ballY.value = serveY;
            return;
        }
        const dt = (frameInfo.timeSincePreviousFrame ?? 16.67) / 16.67;
        if (dt <= 0) return;
        const paddleVelocityX = computeVelocity(dt);
        const { paddleWidthMultiplier, ballSpeedMultiplier } = powerUps.getActiveMultipliers(frameInfo.timestamp);
        paddleWidthSV.value = initialPaddle.width * paddleWidthMultiplier;

        const field = levelProgression.collisionField.value;
        if (!field) return;
        const { layout, bricks } = field;
        const paddle = { xCoord: paddleX.value, yCoord: initialPaddle.yCoord, width: paddleWidthSV.value, height: initialPaddle.height, color: initialPaddle.color, speed: paddleVelocityX, moveLeft: false, moveRight: false };

        const totalDx = ballXDir.value * dt * ballSpeedMultiplier;
        const totalDy = ballYDir.value * dt * ballSpeedMultiplier;
        const totalDist = Math.sqrt(totalDx * totalDx + totalDy * totalDy);
        const maxStepDist = Math.min(initialBall.radius, layout.brickWidth / 2, layout.brickHeight / 2);
        const steps = Math.max(1, Math.ceil(totalDist / maxStepDist));

        const ball = { xCoord: ballX.value, yCoord: ballY.value, xDirection: ballXDir.value, yDirection: ballYDir.value, color: initialBall.color, radius: initialBall.radius, angle: initialBall.angle, speed: initialBall.speed };

        for (let i = 0; i < steps; i++) {
            ball.xCoord += (ball.xDirection * dt * ballSpeedMultiplier) / steps;
            ball.yCoord += (ball.yDirection * dt * ballSpeedMultiplier) / steps;

            handleAllCollisions(
                ball, board, paddle, bricks, layout,
                (brick, wasDestroyed) => {
                    let multiplier = 1;
                    if (wasDestroyed) {
                        const newStreak = combo.onBrickDestroyed();
                        multiplier = combo.getMultiplier(newStreak);
                        runScore.value += Math.round(brick.points * multiplier);
                        runOnJS(setDisplayStreak)(newStreak);
                    }
                    runOnJS(levelProgression.handleBrickHit)(brick.id, brick.hp, brick.points, wasDestroyed, hapticsEnabled, resetAllSystems, multiplier);
                    runOnJS(triggerBrickHaptic)(hapticsEnabled, wasDestroyed);
                    if (wasDestroyed) powerUps.trySpawn(brick.xCoord, brick.yCoord, brick.width, frameInfo.timestamp);
                },
                () => {
                    combo.onPaddleHit();
                    runOnJS(setDisplayStreak)(0);
                    runOnJS(triggerPaddleHaptic)(hapticsEnabled);
                }
            );
        }

        ballX.value = ball.xCoord;
        ballY.value = ball.yCoord;
        ballXDir.value = ball.xDirection;
        ballYDir.value = ball.yDirection;

        powerUps.step(dt, frameInfo.timestamp, board, paddle, hapticsEnabled);
        if (checkGameOver(ball, board)) {
            hasTriggeredGameOver.value = 1;
            runOnJS(handleGameOver)(runScore.value, levelProgression.currentLevel);
        }
    });

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <Pressable onPress={() => router.back()} hitSlop={12}>
                    <Text style={[styles.backText, { color: theme.paddle }]}>{"←"}</Text>
                </Pressable>
                <Text style={[styles.scoreText, { color: theme.text }]}>
                    Level {levelProgression.currentLevel} · Score: {levelProgression.score}
                    {displayStreak >= 3 ? ` · x${combo.getMultiplier(displayStreak)}` : ""}
                </Text>
                <Pressable onPress={togglePause} hitSlop={12}>
                    <Text style={[styles.backText, { color: theme.paddle }]}>{pauseState.isPaused ? "▶" : "❚❚"}</Text>
                </Pressable>
            </View>

            <View pointerEvents="none" style={styles.powerUpHud}>
                <PowerUpBadge fraction={powerUps.widenRemainingFraction} color={WIDEN_COLOR} label="Wider paddle" />
                <PowerUpBadge fraction={powerUps.slowRemainingFraction} color={SLOW_COLOR} label="Slow ball" />
            </View>

            <GestureDetector gesture={panGesture}>
                <View style={styles.playArea}>
                    <View
                        style={{ width: boardWidth, height: boardHeight }}
                        onLayout={({ nativeEvent: { layout: { x, y } } }) => { boardOffset.value = { x, y }; }}
                    >
                        <View style={styles.boardShadowWrapper}>
                            <View style={[styles.boardClip, { width: boardWidth, height: boardHeight }]}>
                                <Canvas style={{ width: boardWidth, height: boardHeight }}>
                                    <Rect x={0} y={0} width={boardWidth} height={boardHeight} color={theme.background} />
                                    {levelProgression.bricks.filter((b): b is BrickState => b !== null && !b.isDestroyed).map((brick) => (
                                        <Rect key={brick.id} x={brick.xCoord} y={brick.yCoord} width={brick.width} height={brick.height} color={getBrickDisplayColor(brick.color, brick.hp, brick.maxHp)} />
                                    ))}
                                    {levelProgression.bricks.filter((b): b is BrickState => b !== null && !b.isDestroyed && b.maxHp > 1).map((brick) => (
                                        <Rect key={`${brick.id}-border`} x={brick.xCoord} y={brick.yCoord} width={brick.width} height={brick.height} color="rgba(255,255,255,0.7)" style="stroke" strokeWidth={2} />
                                    ))}
                                    <Path path={aimLinePath} color={theme.text} style="stroke" strokeWidth={2} opacity={aiming.isAiming}>
                                        <DashPathEffect intervals={[8, 6]} />
                                    </Path>
                                    <RoundedRect x={paddleX} y={initialPaddle.yCoord} width={paddleWidthSV} height={initialPaddle.height} r={4 * scale} color={initialPaddle.color} />
                                    <Circle cx={ballX} cy={ballY} r={initialBall.radius} color={initialBall.color} />
                                    <Circle cx={powerUps.pickupX} cy={powerUps.pickupY} r={powerUps.POWERUP_RADIUS_FACTOR * scale} color={powerUps.pickupColor} opacity={powerUps.pickupActive} />
                                </Canvas>
                            </View>
                        </View>

                        {isAimingUI && !levelProgression.isTransitioning && (
                            <View style={styles.aimHintWrap} pointerEvents="none">
                                <Text style={[styles.aimHint, { color: theme.text }]}>Point to aim, release to launch</Text>
                            </View>
                        )}

                        {levelProgression.isTransitioning && (
                            <Animated.View style={[styles.announceOverlay, announceAnimatedStyle]}>
                                <Text style={styles.announceText}>{levelProgression.announceText}</Text>
                            </Animated.View>
                        )}

                        {pauseState.isPaused && !isGameOver && (
                            <View style={styles.overlay}>
                                <Text style={styles.overlayTitle}>Paused</Text>
                                <Pressable style={[styles.button, { backgroundColor: theme.paddle }]} onPress={() => pauseState.setIsPaused(false)}>
                                    <Text style={[styles.buttonText, { color: theme.buttonText }]}>Resume</Text>
                                </Pressable>
                            </View>
                        )}

                        {isGameOver && (
                            <View style={styles.overlay}>
                                <Text style={styles.overlayTitle}>Game Over</Text>
                                {personalBest.isNewBest && <Text style={styles.newBestText}>New Personal Best!</Text>}
                                <Text style={styles.overlayScore}>Reached Level {levelProgression.currentLevel} · Score: {levelProgression.score}</Text>
                            {scoreUploadStatus && (
                                <Text accessibilityLiveRegion="polite" style={styles.uploadStatus}>
                                    {scoreUploadStatus === "saving" ? "Saving score to leaderboard..." :
                                        scoreUploadStatus === "saved" ? "Score added to leaderboard" : "Could not upload score"}
                                </Text>
                            )}
                                <Pressable style={[styles.button, { backgroundColor: theme.paddle }]} onPress={resetGame}>
                                    <Text style={[styles.buttonText, { color: theme.buttonText }]}>Play Again</Text>
                                </Pressable>
                                <Pressable style={[styles.buttonOutline, { borderColor: theme.text }]} onPress={() => router.back()}>
                                    <Text style={[styles.buttonOutlineText, { color: theme.text }]}>Main Menu</Text>
                                </Pressable>
                            </View>
                        )}
                    </View>
                </View>
            </GestureDetector>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12 },
    backText: { fontSize: 22, fontWeight: "700" },
    scoreText: { fontSize: 14, fontWeight: "600" },
    playArea: { flex: 1, alignItems: "center", justifyContent: "center" },
    boardShadowWrapper: { borderRadius: 16, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
    boardClip: { borderRadius: 16, overflow: "hidden" },
    aimHintWrap: { position: "absolute", top: 40, left: 0, right: 0, alignItems: "center" },
    aimHint: { fontSize: 13, opacity: 0.7 },
    announceOverlay: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(11,10,18,0.6)", borderRadius: 16 },
    announceText: { color: "#EDEAF6", fontSize: 32, fontWeight: "800" },
    overlay: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(11,10,18,0.85)", alignItems: "center", justifyContent: "center", borderRadius: 16 },
    overlayTitle: { color: "#EDEAF6", fontSize: 28, fontWeight: "700", marginBottom: 8 },
    overlayScore: { color: "#EDEAF6", fontSize: 18, marginBottom: 20 },
    uploadStatus: { color: "#EDEAF6", fontSize: 13, marginBottom: 12 },
    newBestText: { color: "#FFD700", fontSize: 16, fontWeight: "700", marginBottom: 12 },
    button: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
    buttonText: { fontWeight: "700", fontSize: 16 },
    buttonOutline: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, borderWidth: 1, marginTop: 10 },
    buttonOutlineText: { fontWeight: "600", fontSize: 16 },
    powerUpHud: {
        height: POWER_UP_HUD_HEIGHT,
        paddingHorizontal: 20,
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "flex-end",
        gap: 6,
    },
});
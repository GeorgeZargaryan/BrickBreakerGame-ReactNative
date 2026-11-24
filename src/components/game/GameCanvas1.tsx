import { Canvas, Circle, Rect, RoundedRect } from "@shopify/react-native-skia";
import { View, Text, StyleSheet, useWindowDimensions, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
    useSharedValue,
    useFrameCallback,
    runOnJS,
    withTiming,
    withSequence,
    withDelay,
} from "react-native-reanimated";
import { useCallback, useState } from "react";
import * as Haptics from "expo-haptics";
import { createInitialBall, createInitialPaddle, type BrickState } from "@/game/entities";
import { generateLevel } from "@/game/levelGenerator";
import { handleAllCollisions, checkGameOver, type Board } from "@/game/collisions";
import { getBrickDisplayColor } from "@/game/colorUtils";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { getBoardSize, PADDLE_CONFIG } from "@/game/config";
import { useTheme } from "@/context/ThemeContext";
import { useSettings } from "@/context/SettingsContext";
import { useRouter, useFocusEffect } from "expo-router";
import { AppState } from "react-native";
import { useEffect } from "react";

function triggerPaddleHaptic(enabled: boolean) {
    if (!enabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}
function triggerBrickHaptic(enabled: boolean, wasDestroyed: boolean) {
    if (!enabled) return;
    Haptics.impactAsync(wasDestroyed ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
}
function triggerGameOverHaptic(enabled: boolean) {
    if (!enabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}
function triggerLevelUpHaptic(enabled: boolean) {
    if (!enabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export function GameCanvas() {
    const { theme } = useTheme();
    const { hapticsEnabled } = useSettings();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [isPaused, setIsPaused] = useState(false);


    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const HEADER_HEIGHT_ESTIMATE = 60;
    const VERTICAL_MARGIN = 24;
    const availableHeight = windowHeight - insets.top - insets.bottom - HEADER_HEIGHT_ESTIMATE - VERTICAL_MARGIN;
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
    const paddleWidth = initialPaddle.width;

    const makeNewBall = () =>
        createInitialBall(boardWidth / 2, boardHeight - 30 * scale, theme.ball, 8 * scale);

    const [initialBall] = useState(makeNewBall);

    const ballX = useSharedValue(initialBall.xCoord);
    const ballY = useSharedValue(initialBall.yCoord);
    const ballXDir = useSharedValue(initialBall.xDirection);
    const ballYDir = useSharedValue(initialBall.yDirection);
    const paddleX = useSharedValue(initialPaddle.xCoord);
    const prevPaddleX = useSharedValue(initialPaddle.xCoord);
    const announceOpacity = useSharedValue(0);

    const panGesture = Gesture.Pan().onChange((event) => {
        "worklet";
        const next = paddleX.value + event.changeX;
        paddleX.value = Math.max(0, Math.min(next, board.width - paddleWidth));
    });

    const [bricks, setBricks] = useState<BrickState[]>([]);
    const [score, setScore] = useState(0);
    const [currentLevel, setCurrentLevel] = useState(1);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [announceText, setAnnounceText] = useState("");

    function announceLevel(text: string, onDone: () => void) {
        setAnnounceText(text);
        setIsTransitioning(true);
        announceOpacity.value = withSequence(
            withTiming(1, { duration: 300 }),
            withDelay(
                900,
                withTiming(0, { duration: 300 }, (finished) => {
                    if (finished) runOnJS(onDone)();
                })
            )
        );
    }

    function startLevel(level: number, keepScore: boolean) {
        const freshBall = makeNewBall();
        ballX.value = freshBall.xCoord;
        ballY.value = freshBall.yCoord;
        ballXDir.value = freshBall.xDirection;
        ballYDir.value = freshBall.yDirection;
        paddleX.value = initialPaddle.xCoord;
        prevPaddleX.value = initialPaddle.xCoord;
        setBricks(generateLevel(level, scale, theme.bricks));
        setCurrentLevel(level);
        if (!keepScore) setScore(0);
        setIsGameOver(false);
    }

    function handleBrickHit(brickId: string, points: number, wasDestroyed: boolean) {
        setBricks((prev) => {
            const updated = prev.map((b) =>
                b.id === brickId ? { ...b, hp: b.hp - 1, isDestroyed: wasDestroyed } : b
            );
            if (wasDestroyed && updated.every((b) => b.isDestroyed)) {
                triggerLevelUpHaptic(hapticsEnabled);
                const next = currentLevel + 1;
                announceLevel(`Level ${next}`, () => {
                    startLevel(next, true);
                    setIsTransitioning(false);
                });
            }
            return updated;
        });
        if (wasDestroyed) setScore((prev) => prev + points);
    }

    function handleGameOver() {
        setIsGameOver(true);
        triggerGameOverHaptic(hapticsEnabled);
    }

    function resetGame() {
        startLevel(1, false);
    }


    useEffect(() => {
        const sub = AppState.addEventListener("change", (state) => {
            if (state !== "active") setIsPaused(true);
        });
        return () => sub.remove();
    }, []);

    useFocusEffect(
        useCallback(() => {
            startLevel(1, false);
            announceLevel("Level 1", () => setIsTransitioning(false));
        }, [])
    );

    useFrameCallback((frameInfo) => {
        "worklet";
        if (isGameOver || isTransitioning) return;

        const dt = (frameInfo.timeSincePreviousFrame ?? 16.67) / 16.67;
        const paddleVelocityX = (paddleX.value - prevPaddleX.value) / dt;
        prevPaddleX.value = paddleX.value;

        const ball = { xCoord: ballX.value, yCoord: ballY.value, xDirection: ballXDir.value, yDirection: ballYDir.value, color: initialBall.color, radius: initialBall.radius, angle: initialBall.angle, speed: initialBall.speed };
        const paddle = { xCoord: paddleX.value, yCoord: initialPaddle.yCoord, width: initialPaddle.width, height: initialPaddle.height, color: initialPaddle.color, speed: paddleVelocityX, moveLeft: false, moveRight: false };

        handleAllCollisions(
            ball, board, paddle, bricks,
            (brick, wasDestroyed) => {
                runOnJS(handleBrickHit)(brick.id, brick.points, wasDestroyed);
                runOnJS(triggerBrickHaptic)(hapticsEnabled, wasDestroyed);
            },
            () => runOnJS(triggerPaddleHaptic)(hapticsEnabled)
        );

        ballX.value = ball.xCoord + ball.xDirection * dt;
        ballY.value = ball.yCoord + ball.yDirection * dt;
        ballXDir.value = ball.xDirection;
        ballYDir.value = ball.yDirection;

        if (checkGameOver(ball, board)) runOnJS(handleGameOver)();
    });

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <Pressable onPress={() => router.back()} hitSlop={12}>
                    <Text style={[styles.backText, { color: theme.paddle }]}>{"←"}</Text>
                </Pressable>
                <Text style={[styles.scoreText, { color: theme.text }]}>
                    Level {currentLevel} · Score: {score}
                </Text>
                <View style={styles.headerSpacer} />
            </View>

            <GestureDetector gesture={panGesture}>
                <View style={styles.playArea}>
                    <View style={{ width: boardWidth, height: boardHeight }}>
                        <View style={styles.boardShadowWrapper}>
                            <View style={[styles.boardClip, { width: boardWidth, height: boardHeight }]}>
                                <Canvas style={{ width: boardWidth, height: boardHeight }}>
                                    <Rect x={0} y={0} width={boardWidth} height={boardHeight} color={theme.background} />
                                    {bricks.filter((b) => !b.isDestroyed).map((brick) => (
                                        <Rect
                                            key={brick.id}
                                            x={brick.xCoord}
                                            y={brick.yCoord}
                                            width={brick.width}
                                            height={brick.height}
                                            color={getBrickDisplayColor(brick.color, brick.hp, brick.maxHp)}
                                        />
                                    ))}
                                    <RoundedRect x={paddleX} y={initialPaddle.yCoord} width={initialPaddle.width} height={initialPaddle.height} r={4 * scale} color={initialPaddle.color} />
                                    <Circle cx={ballX} cy={ballY} r={initialBall.radius} color={initialBall.color} />
                                </Canvas>
                            </View>
                        </View>

                        {isTransitioning && (
                            <Animated.View style={[styles.announceOverlay, { opacity: announceOpacity }]}>
                                <Text style={styles.announceText}>{announceText}</Text>
                            </Animated.View>
                        )}

                        {isGameOver && (
                            <View style={styles.overlay}>
                                <Text style={styles.overlayTitle}>Game Over</Text>
                                <Text style={styles.overlayScore}>Reached Level {currentLevel} · Score: {score}</Text>
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
    scoreText: { fontSize: 16, fontWeight: "600" },
    headerSpacer: { width: 22 },
    playArea: { flex: 1, alignItems: "center", justifyContent: "center" },
    boardShadowWrapper: {
        borderRadius: 16,
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 8,
    },
    boardClip: { borderRadius: 16, overflow: "hidden" },
    announceOverlay: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(11,10,18,0.6)", borderRadius: 16 },
    announceText: { color: "#EDEAF6", fontSize: 32, fontWeight: "800" },
    overlay: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(11,10,18,0.85)", alignItems: "center", justifyContent: "center", borderRadius: 16 },
    overlayTitle: { color: "#EDEAF6", fontSize: 28, fontWeight: "700", marginBottom: 8 },
    overlayScore: { color: "#EDEAF6", fontSize: 18, marginBottom: 20 },
    button: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
    buttonText: { fontWeight: "700", fontSize: 16 },
    buttonOutline: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, borderWidth: 1, marginTop: 10 },
    buttonOutlineText: { fontWeight: "600", fontSize: 16 },
});
import { Canvas, Circle, Rect, RoundedRect } from "@shopify/react-native-skia";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { useSharedValue, useFrameCallback, runOnJS } from "react-native-reanimated";
import { useState } from "react";
import { createInitialBall, createInitialPaddle, createBrickGrid, type BrickState } from "@/game/entities";
import { handleAllCollisions, checkGameOver, type Board } from "@/game/collisions";
import { BOARD_CONFIG, getBoardSize, PADDLE_CONFIG, THEMES_CONFIG } from "@/game/config";
import { Gesture, GestureDetector } from "react-native-gesture-handler";


const currTheme = BOARD_CONFIG.default_theme as keyof typeof THEMES_CONFIG
const theme = THEMES_CONFIG[currTheme];

export function GameCanvas() {
    const { width: windowWidth } = useWindowDimensions();
    const { width: boardWidth, height: boardHeight, scale } = getBoardSize(windowWidth);
    const board: Board = { width: boardWidth, height: boardHeight };

    const initialBall = createInitialBall(boardWidth / 2, boardHeight - 30 * scale, theme.ball, 8 * scale);
    const initialPaddle = createInitialPaddle(
        boardWidth / 2 - (PADDLE_CONFIG.width * scale) / 2,
        boardHeight - PADDLE_CONFIG.height * scale - 10 * scale,
        PADDLE_CONFIG.width * scale,
        PADDLE_CONFIG.height * scale,
        theme.paddle,
        6
    );
    const paddleWidth = initialPaddle.width;

    const ballX = useSharedValue(initialBall.xCoord);
    const ballY = useSharedValue(initialBall.yCoord);
    const ballXDir = useSharedValue(initialBall.xDirection);
    const ballYDir = useSharedValue(initialBall.yDirection);
    const paddleX = useSharedValue(initialPaddle.xCoord);
    const prevPaddleX = useSharedValue(initialPaddle.xCoord);

    const panGesture = Gesture.Pan().onChange((event) => {
        "worklet";
        const next = paddleX.value + event.changeX;
        paddleX.value = Math.max(0, Math.min(next, board.width - paddleWidth));
    });
    const [bricks, setBricks] = useState<BrickState[]>(() => createBrickGrid(4, 6, scale, theme.bricks));
    const [score, setScore] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);

    function handleBrickBreak(brickId: string, points: number) {
        setBricks((prev) => prev.map((b) => (b.id === brickId ? { ...b, isDestroyed: true } : b)));
        setScore((prev) => prev + points);
    }
useFrameCallback((frameInfo) => {
    "worklet";
    if (isGameOver) return;

    const dt = (frameInfo.timeSincePreviousFrame ?? 16.67) / 16.67;

    // Real paddle inertia: how far it actually moved this frame, normalized
    // to the same per-frame units the ball's velocity already uses.
    const paddleVelocityX = (paddleX.value - prevPaddleX.value) / dt;
    prevPaddleX.value = paddleX.value;

    const ball = { xCoord: ballX.value, yCoord: ballY.value, xDirection: ballXDir.value, yDirection: ballYDir.value, color: initialBall.color, radius: initialBall.radius, angle: initialBall.angle, speed: initialBall.speed };
    const paddle = { xCoord: paddleX.value, yCoord: initialPaddle.yCoord, width: initialPaddle.width, height: initialPaddle.height, color: initialPaddle.color, speed: paddleVelocityX, moveLeft: false, moveRight: false };

    handleAllCollisions(ball, board, paddle, bricks, (brick) => {
        runOnJS(handleBrickBreak)(brick.id, brick.points);
    });

    ballX.value = ball.xCoord + ball.xDirection * dt;
    ballY.value = ball.yCoord + ball.yDirection * dt;
    ballXDir.value = ball.xDirection;
    ballYDir.value = ball.yDirection;

    if (checkGameOver(ball, board)) runOnJS(setIsGameOver)(true);
});

    return (
        <View style={styles.container}>
            <GestureDetector gesture={panGesture}>
                <Canvas style={{ width: boardWidth, height: boardHeight, borderRadius: 12 }}>
                    <Rect x={0} y={0} width={boardWidth} height={boardHeight} color={theme.background} />
                    {bricks.filter((b) => !b.isDestroyed).map((brick) => (
                        <Rect key={brick.id} x={brick.xCoord} y={brick.yCoord} width={brick.width} height={brick.height} color={brick.color} />
                    ))}
                    <RoundedRect x={paddleX} y={initialPaddle.yCoord} width={initialPaddle.width} height={initialPaddle.height} r={4 * scale} color={initialPaddle.color} />
                    <Circle cx={ballX} cy={ballY} r={initialBall.radius} color={initialBall.color} />
                </Canvas>
            </GestureDetector>
        </View >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0B0A12" },
});
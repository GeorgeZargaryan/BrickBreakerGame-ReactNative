import { useSharedValue, runOnJS, type SharedValue } from "react-native-reanimated";
import { Gesture } from "react-native-gesture-handler";
import type { PaddleState } from "@/game/entities";

type AimRefs = {
    isAiming: SharedValue<number>;
    aimAngleDeg: SharedValue<number>;
    aimDistance: SharedValue<number>;
};
type AimControls = {
    boardOffset: SharedValue<{ x: number; y: number }>;
    originY: number;
    enabled: boolean;
};
type BallVelocityRefs = { ballXDir: SharedValue<number>; ballYDir: SharedValue<number> };

export function usePaddlePhysics(
    initialPaddle: PaddleState,
    boardWidth: number,
    aim: AimRefs,
    ballVelocity: BallVelocityRefs,
    ballSpeed: number,
    maxBounceAngleDeg: number,
    onLaunch: () => void,
    { boardOffset, originY, enabled }: AimControls,
) {
    const paddleX = useSharedValue(initialPaddle.xCoord);
    const prevPaddleX = useSharedValue(initialPaddle.xCoord);
    const paddleWidthSV = useSharedValue(initialPaddle.width);

    function aimAt(x: number, y: number) {
        "worklet";
        const offset = boardOffset.value;
        const dx = x - offset.x - (paddleX.value + paddleWidthSV.value / 2);
        const rise = Math.max(0, originY - (y - offset.y));
        if (dx === 0 && rise === 0) return;

        const angle = Math.atan2(dx, rise) * (180 / Math.PI);
        aim.aimAngleDeg.value = Math.max(-maxBounceAngleDeg, Math.min(maxBounceAngleDeg, angle));
        aim.aimDistance.value = Math.hypot(dx, rise);
    }

    const panGesture = Gesture.Pan()
        .enabled(enabled)
        .minDistance(0)
        .onStart(({ x, y }) => {
            "worklet";
            if (aim.isAiming.value === 1) aimAt(x, y);
        })
        .onChange((event) => {
            "worklet";
            if (aim.isAiming.value === 1) {
                aimAt(event.x, event.y);
            } else {
                const next = paddleX.value + event.changeX;
                paddleX.value = Math.max(0, Math.min(next, boardWidth - paddleWidthSV.value));
            }
        })
        .onEnd((_event, success) => {
            "worklet";
            if (success && aim.isAiming.value === 1) {
                const rad = aim.aimAngleDeg.value * (Math.PI / 180);
                ballVelocity.ballXDir.value = ballSpeed * Math.sin(rad);
                ballVelocity.ballYDir.value = -ballSpeed * Math.cos(rad);
                aim.isAiming.value = 0;
                runOnJS(onLaunch)();
            }
        });

    const computeVelocity = (dt: number) => {
        "worklet";
        const velocity = (paddleX.value - prevPaddleX.value) / dt;
        prevPaddleX.value = paddleX.value;
        return velocity;
    };

    function reset(paddle: PaddleState) {
        paddleX.value = paddle.xCoord;
        prevPaddleX.value = paddle.xCoord;
        paddleWidthSV.value = paddle.width;
    }

    return { paddleX, paddleWidthSV, panGesture, computeVelocity, reset };
}
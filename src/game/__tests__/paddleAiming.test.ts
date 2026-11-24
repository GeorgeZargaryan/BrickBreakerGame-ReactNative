import { describe, expect, it, jest } from "@jest/globals";
import { useSharedValue } from "react-native-reanimated";
import { State } from "react-native-gesture-handler";
import { usePaddlePhysics } from "../../hooks/usePaddlePhysics";
import { createInitialPaddle } from "../entities";

jest.mock("react-native-reanimated", () => ({
    useSharedValue: (value: unknown) => ({ value }),
    runOnJS: (callback: unknown) => callback,
}));

function setup(enabled = true) {
    const aim = {
        isAiming: useSharedValue(1),
        aimAngleDeg: useSharedValue(0),
        aimDistance: useSharedValue(0),
    };
    const velocity = { ballXDir: useSharedValue(0), ballYDir: useSharedValue(0) };
    const paddle = createInitialPaddle(50, 278, 100, 10, "white", 5);
    const onLaunch = jest.fn();
    const physics = usePaddlePhysics(paddle, 300, aim, velocity, 5, 70, onLaunch, {
        boardOffset: useSharedValue({ x: 30, y: 70 }),
        originY: 270,
        enabled,
    });
    const { handlers } = physics.panGesture;
    type Touch = Parameters<NonNullable<typeof handlers.onChange>>[0];

    function touch(x: number, y: number, translationX: number, translationY: number): Touch {
        return {
            x, y, translationX, translationY,
            absoluteX: x + 10, absoluteY: y + 20,
            changeX: translationX, changeY: translationY,
            velocityX: 0, velocityY: 0,
            state: State.ACTIVE, handlerTag: 1, numberOfPointers: 1, pointerType: 0,
        };
    }

    return { aim, velocity, physics, touch, onLaunch };
}

describe("paddle aiming", () => {
    it("aims from the ball to the finger in a centered board, regardless of where the drag started", () => {
        const { aim, physics, touch } = setup();
        const angle = Math.atan2(60, 160) * 180 / Math.PI;

        physics.panGesture.handlers.onChange?.(touch(190, 180, 2, -50));
        expect(aim.aimAngleDeg.value).toBeCloseTo(angle);
        expect(aim.aimDistance.value).toBeCloseTo(Math.hypot(60, 160));

        physics.panGesture.handlers.onChange?.(touch(190, 180, -70, -20));
        expect(aim.aimAngleDeg.value).toBeCloseTo(angle);
    });

    it("sets aim on activation and launches along the preview when released", () => {
        const { aim, velocity, physics, touch, onLaunch } = setup();
        const { handlers } = physics.panGesture;
        const finger = { ...touch(90, 300, 0, 0), oldState: State.BEGAN };
        handlers.onStart?.(finger);
        expect(aim.aimAngleDeg.value).toBe(-45);

        handlers.onEnd?.({ ...finger, state: State.END, oldState: State.ACTIVE }, true);
        expect(velocity.ballXDir.value).toBeCloseTo(-5 / Math.SQRT2);
        expect(velocity.ballYDir.value).toBeCloseTo(-5 / Math.SQRT2);
        expect(onLaunch).toHaveBeenCalledTimes(1);
    });

    it("keeps the previous angle directly below the ball and clamps shallow launches", () => {
        const { aim, physics, touch } = setup();
        const change = physics.panGesture.handlers.onChange;
        change?.(touch(230, 338, 4, -2));
        expect(aim.aimAngleDeg.value).toBe(70);
        change?.(touch(130, 360, -100, 22));
        expect(aim.aimAngleDeg.value).toBe(70);
    });

    it("does not launch when the drag is cancelled", () => {
        const { aim, physics, touch, onLaunch } = setup();
        physics.panGesture.handlers.onEnd?.({ ...touch(130, 220, 0, -20), state: State.CANCELLED, oldState: State.ACTIVE }, false);
        expect(aim.isAiming.value).toBe(1);
        expect(onLaunch).not.toHaveBeenCalled();
    });

    it("ignores gameplay input while the board is covered by a game overlay", () => {
        const { physics } = setup(false);
        expect(physics.panGesture.config.enabled).toBe(false);
    });

    it("still moves the paddle by the drag delta after launch", () => {
        const { aim, physics, touch } = setup();
        aim.isAiming.value = 0;
        physics.panGesture.handlers.onChange?.(touch(280, 200, 12, 0));
        expect(physics.paddleX.value).toBe(62);
    });
});

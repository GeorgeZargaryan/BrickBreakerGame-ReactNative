import { useSharedValue, useDerivedValue, runOnJS } from "react-native-reanimated";
import type { Board } from "@/game/collisions";
import type { PaddleState } from "@/game/entities";
import { triggerPowerUpHaptic } from "@/game/haptics";

const WIDEN_DURATION_MS = 8000;
const SLOW_DURATION_MS = 6000;
const WIDEN_MULTIPLIER = 1.5;
const SLOW_MULTIPLIER = 0.55;
const POWERUP_DROP_CHANCE = 0.15;
const DROP_COOLDOWN_MS = 2000;
const POWERUP_FALL_SPEED = 2;
const POWERUP_RADIUS_FACTOR = 7;

export const WIDEN_COLOR = "#4FD1C5";
export const SLOW_COLOR = "#FF8F3C";

export function usePowerUps(scale: number) {
    const pickupActive = useSharedValue(0);
    const pickupX = useSharedValue(0);
    const pickupY = useSharedValue(0);
    const pickupKind = useSharedValue(0);
    const nextDropTime = useSharedValue(0);
    const widenUntilTime = useSharedValue(0);
    const slowUntilTime = useSharedValue(0);
    const nowTime = useSharedValue(0);

    const pickupColor = useDerivedValue(() => pickupKind.value === 1 ? WIDEN_COLOR : SLOW_COLOR);
    const widenRemainingFraction = useDerivedValue(() => Math.max(0, widenUntilTime.value - nowTime.value) / WIDEN_DURATION_MS);
    const slowRemainingFraction = useDerivedValue(() => Math.max(0, slowUntilTime.value - nowTime.value) / SLOW_DURATION_MS);

    function reset() {
        pickupActive.value = 0;
        nextDropTime.value = 0;
        widenUntilTime.value = 0;
        slowUntilTime.value = 0;
    }

    function trySpawn(brickX: number, brickY: number, brickWidth: number, timestamp: number) {
        "worklet";
        if (pickupActive.value === 1 || timestamp < nextDropTime.value || Math.random() >= POWERUP_DROP_CHANCE) return;
        pickupX.value = brickX + brickWidth / 2;
        pickupY.value = brickY;
        pickupKind.value = Math.random() < 0.5 ? 1 : 2;
        pickupActive.value = 1;
    }

    function step(dt: number, timestamp: number, board: Board, paddle: PaddleState, hapticsEnabled: boolean) {
        "worklet";
        nowTime.value = timestamp;
        if (pickupActive.value === 0) return;

        const radius = POWERUP_RADIUS_FACTOR * scale;
        pickupY.value += POWERUP_FALL_SPEED * dt;
        const hitsPaddle =
            pickupY.value + radius >= paddle.yCoord && pickupY.value - radius <= paddle.yCoord + paddle.height &&
            pickupX.value + radius >= paddle.xCoord && pickupX.value - radius <= paddle.xCoord + paddle.width;

        if (hitsPaddle) {
            const widens = pickupKind.value === 1;
            const expiresAt = timestamp + (widens ? WIDEN_DURATION_MS : SLOW_DURATION_MS);
            if (widens) widenUntilTime.value = expiresAt;
            else slowUntilTime.value = expiresAt;
            pickupActive.value = 0;
            nextDropTime.value = expiresAt + DROP_COOLDOWN_MS;
            runOnJS(triggerPowerUpHaptic)(hapticsEnabled);
        } else if (pickupY.value > board.height) {
            pickupActive.value = 0;
            nextDropTime.value = timestamp + DROP_COOLDOWN_MS;
        }
    }

    function getActiveMultipliers(timestamp: number) {
        "worklet";
        return {
            paddleWidthMultiplier: timestamp < widenUntilTime.value ? WIDEN_MULTIPLIER : 1,
            ballSpeedMultiplier: timestamp < slowUntilTime.value ? SLOW_MULTIPLIER : 1,
        };
    }

    return {
        pickupX, pickupY, pickupActive, pickupColor, POWERUP_RADIUS_FACTOR,
        widenRemainingFraction, slowRemainingFraction, reset, trySpawn, step, getActiveMultipliers,
    };
}

import { useSharedValue } from "react-native-reanimated";

export function useAiming() {
    const isAiming = useSharedValue(1); // 1 = ball stuck to paddle, awaiting launch
    const aimAngleDeg = useSharedValue(0); // 0 = straight up, clamped ±MAX_BOUNCE_ANGLE

    const aimDistance = useSharedValue(0);

    function reset() {
        isAiming.value = 1;
        aimAngleDeg.value = 0;
        aimDistance.value = 0;
    }

    return { isAiming, aimAngleDeg, aimDistance, reset };
}
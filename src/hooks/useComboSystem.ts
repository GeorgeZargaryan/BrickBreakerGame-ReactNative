import { useSharedValue } from "react-native-reanimated";

const STREAK_PER_STEP = 3;
const STEP_BONUS = 0.5;
const MAX_MULTIPLIER = 3;

export function useComboSystem() {
    const streak = useSharedValue(0);

    const getMultiplier = (streakValue: number) => {
        "worklet";
        const steps = Math.floor(streakValue / STREAK_PER_STEP);
        return Math.min(1 + steps * STEP_BONUS, MAX_MULTIPLIER);
    };

    const onBrickDestroyed = () => {
        "worklet";
        streak.value += 1;
        return streak.value;
    };

    const onPaddleHit = () => {
        "worklet";
        streak.value = 0;
    };

    function reset() {
        streak.value = 0;
    }

    return { streak, getMultiplier, onBrickDestroyed, onPaddleHit, reset };
}
import * as Haptics from "expo-haptics";

export function triggerPaddleHaptic(enabled: boolean) {
    if (!enabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}
export function triggerBrickHaptic(enabled: boolean, wasDestroyed: boolean) {
    if (!enabled) return;
    Haptics.impactAsync(wasDestroyed ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
}
export function triggerGameOverHaptic(enabled: boolean) {
    if (!enabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}
export function triggerLevelUpHaptic(enabled: boolean) {
    if (!enabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}
export function triggerPowerUpHaptic(enabled: boolean) {
    if (!enabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}
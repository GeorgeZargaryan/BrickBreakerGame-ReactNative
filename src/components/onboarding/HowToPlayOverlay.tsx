import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";

const STEPS = [
    { emoji: "👆", text: "Point to aim, then release to launch" },
    { emoji: "↔️", text: "Drag to move the paddle during play" },
    { emoji: "🧱", text: "Break bricks to score points" },
    { emoji: "🔥", text: "Chain brick hits without touching the paddle for a combo multiplier" },
    { emoji: "⚡", text: "Catch falling power-ups for a temporary boost" },
    { emoji: "💀", text: "Don't let the ball fall past the paddle" },
];

export function HowToPlayOverlay({ onDismiss }: { onDismiss: () => void }) {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top + 24 }]}>
            <Text style={[styles.title, { color: theme.text }]}>How to Play</Text>
            {STEPS.map((step, i) => (
                <View key={i} style={styles.row}>
                    <Text style={styles.emoji}>{step.emoji}</Text>
                    <Text style={[styles.stepText, { color: theme.text }]}>{step.text}</Text>
                </View>
            ))}
            <Pressable style={[styles.button, { backgroundColor: theme.paddle }]} onPress={onDismiss}>
                <Text style={[styles.buttonText, { color: theme.buttonText }]}>Got it</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 28, justifyContent: "center" },
    title: { fontSize: 28, fontWeight: "700", marginBottom: 28, textAlign: "center" },
    row: { flexDirection: "row", alignItems: "center", marginBottom: 20, gap: 14 },
    emoji: { fontSize: 24 },
    stepText: { fontSize: 16, flex: 1 },
    button: { marginTop: 20, paddingVertical: 14, borderRadius: 10, alignItems: "center" },
    buttonText: { fontWeight: "700", fontSize: 16 },
});
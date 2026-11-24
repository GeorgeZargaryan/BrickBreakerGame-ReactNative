import { StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";

type Props = {
    fraction: SharedValue<number>;
    color: string;
    label: string;
};

export function PowerUpBadge({ fraction, color, label }: Props) {
    const visibility = useAnimatedStyle(() => ({
        display: fraction.value > 0 ? "flex" : "none",
    }));
    const progress = useAnimatedStyle(() => ({
        width: `${Math.max(0, Math.min(1, fraction.value)) * 100}%`,
    }));

    return (
        <Animated.View style={[styles.badge, { borderColor: color }, visibility]}>
            <Text style={[styles.label, { color }]}>{label}</Text>
            <View style={styles.track}>
                <Animated.View style={[styles.progress, { backgroundColor: color }, progress]} />
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    badge: {
        backgroundColor: "#171423",
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 7,
        paddingVertical: 4,
        gap: 3,
        alignSelf: "flex-end",
    },
    label: { fontSize: 11, fontWeight: "700" },
    track: { height: 3, borderRadius: 2, backgroundColor: "#393444", overflow: "hidden" },
    progress: { height: "100%", borderRadius: 2 },
});

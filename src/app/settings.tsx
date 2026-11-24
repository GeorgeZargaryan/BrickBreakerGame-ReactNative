import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { THEMES_CONFIG } from "@/game/config";
import { AccordionSection } from "@/components/ui/accordion-section";
import { Switch } from "react-native";
import { useSettings } from "@/context/SettingsContext";

export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { themeKey, setThemeKey, availableThemes, theme } = useTheme();
    const { hapticsEnabled, setHapticsEnabled } = useSettings();

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top + 12 }]}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
                <Text style={[styles.backText, { color: theme.paddle }]}>{"←"} Back</Text>
            </Pressable>

            <Text style={[styles.title, { color: theme.text ?? "#EDEAF6" }]}>Settings</Text>
            <AccordionSection title="Feedback" defaultOpen>
                <View style={styles.settingRow}>
                    <Text style={[styles.settingLabel, { color: theme.text }]}>Vibration</Text>
                    <Switch value={hapticsEnabled} onValueChange={setHapticsEnabled} />
                </View>
            </AccordionSection>
            <AccordionSection title="Appearance" defaultOpen>
                {availableThemes.map((key) => {
                    const t = THEMES_CONFIG[key];
                    const isSelected = key === themeKey;
                    return (
                        <Pressable
                            key={key}
                            style={[styles.themeRow, { borderColor: isSelected ? t.paddle : "#2A2640" }]}
                            onPress={() => setThemeKey(key)}
                        >
                            <View style={styles.swatches}>
                                <View style={[styles.swatch, { backgroundColor: t.background }]} />
                                <View style={[styles.swatch, { backgroundColor: t.paddle }]} />
                                <View style={[styles.swatch, { backgroundColor: t.ball }]} />
                            </View>
                            <Text style={[styles.themeName, { color: theme.text ?? "#EDEAF6" }]}>{key}</Text>
                            {isSelected && <Text style={{ color: t.paddle }}>✓</Text>}
                        </Pressable>
                    );
                })}
            </AccordionSection>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 24 },
    backButton: { marginBottom: 16 },
    backText: { fontSize: 16, fontWeight: "600" },
    title: { fontSize: 28, fontWeight: "700", marginBottom: 24 },
    themeRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 10, borderWidth: 2, marginBottom: 10 },
    swatches: { flexDirection: "row", gap: 4 },
    swatch: { width: 18, height: 18, borderRadius: 4 },
    themeName: { flex: 1, fontSize: 16, textTransform: "capitalize" },
    settingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4 },
    settingLabel: { fontSize: 16 },
});
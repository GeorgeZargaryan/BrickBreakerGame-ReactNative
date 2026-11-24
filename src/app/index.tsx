import { Image, View, Text, Pressable, TextInput, StyleSheet } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { useMemo } from "react";
import { LiveMenuBackground } from "@/components/menu/LiveMenuBackground";
import type { BackgroundShape } from "@/hooks/useLiveBackground";

import { usePlayerName } from "@/context/PlayerNameContext";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated';

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});
export default function MainMenu() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const backgroundShapes = useMemo<BackgroundShape[]>(() => {
    const colors = [...theme.bricks, theme.ball, theme.paddle];
    return Array.from({ length: 6 }, (_, i) => ({
        radius: 14 + Math.random() * 10,
        color: colors[i % colors.length],
        isSquare: i % 2 === 0,
    }));
}, [theme]);
    const { playerName, setPlayerName } = usePlayerName();
    const [nameDraft, setNameDraft] = useState<string | null>(null);
    const localName = nameDraft ?? playerName;
    const [showError, setShowError] = useState(false);

    function handlePlay() {
        const trimmed = localName.trim();
        if (!trimmed) {
            setShowError(true);
            return;
        }
        setPlayerName(trimmed);
        setShowError(false);
        router.push("/game");
    }

    function handleProfile() {
        const nickname = localName.trim();
        if (nickname) setPlayerName(nickname);
        router.push("/personal-best");
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <LiveMenuBackground shapes={backgroundShapes} />
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Settings"
                onPress={() => router.push("/settings")}
                style={({ pressed }) => [
                    styles.settingsButton,
                    { top: insets.top + 12, backgroundColor: theme.background, borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
                ]}
            >
                <Image source={require("../../assets/images/settings-gear.png")} resizeMode="contain"
                    style={[styles.settingsIcon, { tintColor: theme.text }]} accessible={false} />
            </Pressable>
            <Text style={[styles.title, { color: theme.text }]}>Breakout</Text>

            <TextInput
                style={[styles.input, { borderColor: showError ? "#FF6B5B" : theme.border, color: theme.text }]}
                placeholder="Enter your name"
                placeholderTextColor={theme.text + "80"}
                value={localName}
                onChangeText={(text) => {
                    setNameDraft(text);
                    if (showError) setShowError(false);
                }}
                onBlur={() => {
                    if (nameDraft !== null) setPlayerName(nameDraft.trim());
                }}
                maxLength={20}
            />
            {showError && <Text style={styles.errorText}>Name is required to play</Text>}

            <Pressable style={[styles.button, { backgroundColor: theme.paddle }]} onPress={handlePlay}>
                <Text style={styles.buttonText} numberOfLines={1}>Play</Text>
            </Pressable>

            <Pressable style={[styles.buttonOutline, { borderColor: theme.text }]} onPress={handleProfile}>
                <Text style={[styles.buttonOutlineText, { color: theme.text }]} numberOfLines={1}>My Profile</Text>
            </Pressable>

            <Pressable style={[styles.buttonOutline, { borderColor: theme.text }]} onPress={() => router.push("/leaderboard")}>
                <Text style={[styles.buttonOutlineText, { color: theme.text }]} numberOfLines={1}>Leaderboard</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 24 },
    settingsButton: {
        position: "absolute",
        right: 24,
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1,
    },
    settingsIcon: { width: 22, height: 22 },
    title: { fontSize: 36, fontWeight: "800", marginBottom: 20 },
    input: { width: 240, borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, marginBottom: 4 },
    errorText: { color: "#FF6B5B", fontSize: 13, marginTop: -8, marginBottom: 8 },
    button: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 10, width: 240, alignItems: "center" },
    buttonText: { color: "#14121F", fontWeight: "700", fontSize: 17 },
    buttonOutline: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 10, width: 240, alignItems: "center", borderWidth: 1 },
    buttonOutlineText: { fontWeight: "600", fontSize: 17 },
});
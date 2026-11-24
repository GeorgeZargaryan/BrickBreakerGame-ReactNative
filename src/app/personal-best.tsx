import { useState, useCallback, useRef } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { usePlayerName } from "@/context/PlayerNameContext";
import { getPersonalBest, type PersonalBest } from "@/services/localStats";
import { getOnlineProfile, type OnlineProfile } from "@/services/playerProfile";
import { API_BASE } from "@/services/leaderboardApi";
import { FriendsPanel } from "@/components/profile/FriendsPanel";

export default function PlayerProfileScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { theme } = useTheme();
    const { playerName, isLoading: nicknameLoading } = usePlayerName();
    const [best, setBest] = useState<PersonalBest | null>(null);
    const [online, setOnline] = useState<OnlineProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [failed, setFailed] = useState(false);
    const requestVersion = useRef(0);
    const nickname = playerName.trim();

    const refresh = useCallback(async () => {
        const version = ++requestVersion.current;
        setFailed(false);
        try {
            setLoading(true);
            const result = await getOnlineProfile(nickname);
            if (requestVersion.current === version) setOnline(result);
        } catch {
            if (requestVersion.current === version) setFailed(true);
        } finally {
            if (requestVersion.current === version) setLoading(false);
        }
    }, [nickname]);

    useFocusEffect(useCallback(() => {
        let active = true;
        void getPersonalBest().then((result) => {
            if (active) setBest(result);
        }).catch(() => {});
        setOnline(null);
        setFailed(false);
        setLoading(false);
        if (API_BASE && nickname && !nicknameLoading) void refresh();
        return () => {
            active = false;
            requestVersion.current += 1;
        };
    }, [nickname, nicknameLoading, refresh]));

    return (
        <ScrollView
            keyboardShouldPersistTaps="handled"
            style={{ flex: 1, backgroundColor: theme.background }}
            contentContainerStyle={[styles.container, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}
        >
            <Pressable accessibilityRole="button" style={styles.backButton} onPress={() => router.back()}>
                <Text style={[styles.backText, { color: theme.paddle }]}>← Back</Text>
            </Pressable>
            <Text style={[styles.title, { color: theme.text }]}>My Profile</Text>
            {!!nickname && <Text style={[styles.nickname, { color: theme.paddle }]}>{online?.nickname ?? nickname}</Text>}

            <FriendsPanel nickname={nickname} profileId={online?.id} onlineAvailable={Boolean(API_BASE && nickname && !nicknameLoading)} />

            <View style={[styles.card, { borderColor: theme.border }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>On-device personal best</Text>
                <Text style={[styles.detail, { color: theme.text }]}>
                    {best ? `${best.score} points · Level ${best.level} · ${new Date(best.date).toLocaleDateString()}` : "No personal best yet."}
                </Text>
            </View>

            <View style={[styles.card, { borderColor: theme.border }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Online stats</Text>
                {online && (
                    <View style={styles.stats}>
                        <Stat label="Runs" value={online.runsPlayed} color={theme.text} />
                        <Stat label="Best score" value={online.bestScore} color={theme.text} />
                        <Stat label="Highest level" value={online.highestLevel} color={theme.text} />
                    </View>
                )}
                {!nicknameLoading && !nickname && <Text style={[styles.detail, { color: theme.text }]}>Enter a nickname on the main menu.</Text>}
                {!!nickname && !API_BASE && <Text style={[styles.detail, { color: theme.text }]}>Online profiles are unavailable on this build.</Text>}
                {loading && <Text style={[styles.detail, { color: theme.text }]}>Loading profile…</Text>}
                {failed && (
                    <>
                        <Text style={[styles.detail, { color: theme.text }]}>Couldn’t load your online profile.</Text>
                        <Pressable accessibilityRole="button" onPress={() => void refresh()}>
                            <Text style={[styles.retry, { color: theme.paddle }]}>Try again</Text>
                        </Pressable>
                    </>
                )}
            </View>


            {online && (
                <View style={[styles.card, { borderColor: theme.border }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent runs</Text>
                    {online.recentRuns.length === 0 && (
                        <Text style={[styles.detail, { color: theme.text }]}>Finish an online run to start your history.</Text>
                    )}
                    {online.recentRuns.map((run) => (
                        <View key={run.id} style={[styles.run, { borderColor: theme.border }]}>
                            <Text style={[styles.detail, { color: theme.text }]}>{run.points} points · Level {run.level}</Text>
                            <Text style={[styles.date, { color: theme.text }]}>{new Date(run.createdAt).toLocaleDateString()}</Text>
                        </View>
                    ))}
                </View>
            )}
        </ScrollView>
    );
}

function Stat({ label, value, color }: { label: string; value: number | null; color: string }) {
    return (
        <View style={styles.stat}>
            <Text style={[styles.value, { color }]}>{value ?? "—"}</Text>
            <Text style={[styles.date, { color }]}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { paddingHorizontal: 24, gap: 14 },
    backButton: { alignSelf: "flex-start", paddingVertical: 4 },
    backText: { fontSize: 16, fontWeight: "600" },
    title: { fontSize: 28, fontWeight: "700" },
    nickname: { fontSize: 18, fontWeight: "600" },
    card: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 8 },
    sectionTitle: { fontWeight: "700", fontSize: 17 },
    detail: { fontSize: 15 },
    stats: { flexDirection: "row", gap: 6, marginTop: 4 },
    stat: { flex: 1, gap: 2 },
    value: { fontSize: 21, fontWeight: "700" },
    date: { fontSize: 13, opacity: 0.7 },
    run: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 4, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth },
    retry: { paddingVertical: 4, fontWeight: "700" },
});

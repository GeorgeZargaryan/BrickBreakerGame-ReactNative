import { useState, useCallback, useRef } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import * as signalR from "@microsoft/signalr";
import { useTheme } from "@/context/ThemeContext";
import { fetchScoresPage, API_BASE, type ScoreEntry } from "@/services/leaderboardApi";

const PAGE_SIZE = 50;

export default function LeaderboardScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { theme } = useTheme();

    const [scores, setScores] = useState<ScoreEntry[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    const [hasNewScores, setHasNewScores] = useState(false);
    const hasRequestedOnce = useRef(false);

    const loadFirstPage = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const page = await fetchScoresPage(0, PAGE_SIZE);
            setScores(page.items);
            setTotalCount(page.totalCount);
            setIsOffline(false);
            setHasNewScores(false);
        } catch {
            setIsOffline(true);
        } finally {
            setIsRefreshing(false);
            hasRequestedOnce.current = true;
        }
    }, []);

    const loadNextPage = useCallback(async () => {
        if (isLoadingMore || scores.length >= totalCount) return;
        setIsLoadingMore(true);
        try {
            const page = await fetchScoresPage(scores.length, PAGE_SIZE);
            setScores((prev) => [...prev, ...page.items]);
            setTotalCount(page.totalCount);
        } catch {
            // Silent — the user still has what's already loaded; they can pull-to-refresh to retry.
        } finally {
            setIsLoadingMore(false);
        }
    }, [scores.length, totalCount, isLoadingMore]);

    useFocusEffect(
        useCallback(() => {
            void loadFirstPage();
            if (!API_BASE) return;

            const connection = new signalR.HubConnectionBuilder()
                .withUrl(`${API_BASE}/hubs/leaderboard`)
                .withAutomaticReconnect()
                .build();

            connection.on("ScoreAdded", () => setHasNewScores(true));
            connection.onreconnected(() => setHasNewScores(true));
            connection.start().catch(() => {});

            return () => {
                connection.stop();
            };
        }, [loadFirstPage])
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top + 12 }]}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
                <Text style={[styles.backText, { color: theme.paddle }]}>{"←"} Back</Text>
            </Pressable>
            <Text style={[styles.title, { color: theme.text }]}>Leaderboard</Text>

            {hasNewScores && (
                <Pressable style={[styles.newScoresBanner, { backgroundColor: theme.paddle }]} onPress={loadFirstPage}>
                    <Text style={[styles.newScoresText, { color: theme.buttonText }]}>New scores — tap to refresh</Text>
                </Pressable>
            )}

            {isOffline && (
                <Text style={[styles.offlineText, { color: theme.text }]}>
                    {API_BASE ? "Couldn't reach the leaderboard. Pull to refresh." : "The leaderboard URL hasn't been configured."}
                </Text>
            )}

            {!isOffline && hasRequestedOnce.current && scores.length === 0 && (
                <Text style={[styles.offlineText, { color: theme.text }]}>No scores yet — be the first!</Text>
            )}

            <FlatList
                data={scores}
                keyExtractor={(item) => String(item.id)}
                refreshing={isRefreshing}
                onRefresh={loadFirstPage}
                onEndReached={loadNextPage}
                onEndReachedThreshold={0.4}
                renderItem={({ item, index }) => (
                    <View style={[styles.row, { borderBottomColor: theme.border }]}>
                        <Text style={[styles.rank, { color: index === 0 ? "#FFD700" : theme.text }]}>{index + 1}</Text>
                        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{item.playerName}</Text>
                        <Text style={[styles.level, { color: theme.text }]}>Lv {item.level}</Text>
                        <Text style={[styles.points, { color: theme.paddle }]}>{item.points}</Text>
                    </View>
                )}
                ListFooterComponent={
                    isLoadingMore ? (
                        <ActivityIndicator style={styles.footerSpinner} color={theme.paddle} />
                    ) : scores.length > 0 && scores.length >= totalCount ? (
                        <Text style={[styles.endText, { color: theme.text }]}>— end of list —</Text>
                    ) : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 24 },
    backButton: { marginBottom: 16 },
    backText: { fontSize: 16, fontWeight: "600" },
    title: { fontSize: 28, fontWeight: "700", marginBottom: 12 },
    newScoresBanner: { paddingVertical: 10, borderRadius: 8, alignItems: "center", marginBottom: 12 },
    newScoresText: { fontWeight: "700", fontSize: 14 },
    offlineText: { fontSize: 14, opacity: 0.7, marginBottom: 16 },
    row: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, gap: 12 },
    rank: { width: 28, fontWeight: "700" },
    name: { flex: 1, fontSize: 16 },
    level: { fontSize: 14, opacity: 0.7, marginRight: 8 },
    points: { fontWeight: "700", fontSize: 16 },
    footerSpinner: { marginVertical: 16 },
    endText: { textAlign: "center", opacity: 0.5, fontSize: 13, marginVertical: 16 },
});
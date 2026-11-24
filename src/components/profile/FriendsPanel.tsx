import { useCallback, useEffect, useRef, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { changeFriendship, findPlayers, getFriends, type Relationship, type SocialPlayer } from "@/services/friendsApi";

type Method = Parameters<typeof changeFriendship>[2];
type SearchResult = { term: string; players: SocialPlayer[] | null };

const SEARCH_DELAY_MS = 250;
const actions: Record<Relationship, [string, Method][]> = {
    none: [["Add friend", "POST"]],
    incoming: [["Accept", "PUT"], ["Decline", "DELETE"]],
    outgoing: [["Cancel request", "DELETE"]],
    friend: [["Remove", "DELETE"]],
};

type FriendsPanelProps = {
    nickname: string;
    profileId?: string;
    onlineAvailable: boolean;
};

export function FriendsPanel({ nickname, profileId, onlineAvailable }: FriendsPanelProps) {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const [searchOpen, setSearchOpen] = useState(false);
    const searchInput = useRef<TextInput>(null);
    const [query, setQuery] = useState("");
    const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
    const [searchRevision, setSearchRevision] = useState(0);
    const [connections, setConnections] = useState<SocialPlayer[]>([]);
    const [pending, setPending] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const busy = useRef(false);

    const run = useCallback(async (operation: () => Promise<void>) => {
        if (busy.current) return;
        busy.current = true;
        setPending(true);
        setError(false);
        try {
            await operation();
        } catch {
            setError(true);
        } finally {
            busy.current = false;
            setPending(false);
        }
    }, []);

    const reloadFriends = useCallback(async () => {
        setConnections(await getFriends(nickname));
        setLoaded(true);
    }, [nickname]);

    useEffect(() => {
        if (onlineAvailable) void run(reloadFriends);
    }, [onlineAvailable, reloadFriends, run]);

    const term = query.trim();
    const activeSearch = searchResult?.term === term ? searchResult : null;

    useEffect(() => {
        if (!onlineAvailable || !searchOpen || term.length < 2) return;

        const controller = new AbortController();
        const timer = setTimeout(async () => {
            try {
                const players = await findPlayers(nickname, term, controller.signal);
                if (!controller.signal.aborted) setSearchResult({ term, players });
            } catch {
                if (!controller.signal.aborted) setSearchResult({ term, players: null });
            }
        }, SEARCH_DELAY_MS);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [nickname, onlineAvailable, searchOpen, searchRevision, term]);

    function refreshSearch() {
        setSearchResult(null);
        setSearchRevision(revision => revision + 1);
    }

    function closeSearch() {
        Keyboard.dismiss();
        setSearchOpen(false);
        setSearchResult(null);
    }

    function change(player: SocialPlayer, method: Method) {
        void run(async () => {
            await changeFriendship(nickname, player.id, method);
            if (searchOpen) refreshSearch();
            await reloadFriends();
        });
    }

    function row(player: SocialPlayer) {
        return (
            <View key={player.id} style={[styles.row, { borderColor: theme.border }]}>
                <View style={styles.identity}>
                    <Text style={[styles.name, { color: theme.text }]}>{player.nickname}</Text>
                    <Text style={[styles.muted, { color: theme.text }]}>#{player.id.slice(-8)}</Text>
                </View>
                <View style={styles.actions}>
                    {actions[player.relationship].map(([label, method]) => (
                        <Action key={method} label={label} disabled={pending} onPress={() => change(player, method)} />
                    ))}
                </View>
            </View>
        );
    }

    function group(title: string, relationship: Relationship) {
        const players = connections.filter(player => player.relationship === relationship);
        if (!players.length) return null;
        return (
            <View style={styles.group}>
                <Text style={[styles.heading, { color: theme.text }]}>{title}</Text>
                {players.map(row)}
            </View>
        );
    }

    const status = (
        <>
            {pending && <Text style={[styles.muted, { color: theme.text }]}>Updating…</Text>}
            {error && <Text style={[styles.muted, { color: theme.text }]} accessibilityLiveRegion="polite">Couldn’t update friends. Try refreshing or searching again.</Text>}
        </>
    );

    return (
        <View style={[styles.card, { borderColor: theme.border }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>Friends</Text>
                <View style={styles.actions}>
                    <Action label="Find people" disabled={!onlineAvailable} onPress={() => setSearchOpen(true)} />
                    <Action label="Refresh" disabled={!onlineAvailable || pending} onPress={() => void run(reloadFriends)} />
                </View>
            </View>
            {profileId && <Text style={[styles.muted, { color: theme.text }]}>Your profile #{profileId.slice(-8)}</Text>}
            {!onlineAvailable && <Text style={[styles.muted, { color: theme.text }]}>Connect to your online profile to find friends.</Text>}
            {status}
            {group("Incoming requests", "incoming")}
            {group("Sent requests", "outgoing")}
            {group("Your friends", "friend")}
            {loaded && connections.length === 0 && <Text style={[styles.muted, { color: theme.text }]}>Search for a nickname to add a friend.</Text>}

            {searchOpen && onlineAvailable && (
                <Modal visible animationType="fade" onRequestClose={closeSearch} onShow={() => searchInput.current?.focus()}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : undefined}
                        style={[styles.searchScreen, { backgroundColor: theme.background }]}
                    >
                        <View style={[styles.searchHeader, {
                            paddingTop: Math.max(16, insets.top),
                            borderColor: theme.border,
                        }]}>
                            <View style={styles.header}>
                                <Text style={[styles.title, { color: theme.text }]}>Find people</Text>
                                <Action label="Done" disabled={false} onPress={closeSearch} />
                            </View>
                            <View style={styles.search}>
                                <TextInput
                                    ref={searchInput}
                                    accessibilityLabel="Search by nickname"
                                    style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                                    placeholder="Search by nickname"
                                    placeholderTextColor={theme.text + "80"}
                                    value={query}
                                    onChangeText={(value) => {
                                        if (value.trim() !== term) setSearchResult(null);
                                        setQuery(value);
                                    }}
                                    onSubmitEditing={Keyboard.dismiss}
                                    returnKeyType="search"
                                    maxLength={20}
                                />
                            </View>
                        </View>
                        <ScrollView
                            keyboardShouldPersistTaps="handled"
                            style={styles.results}
                            contentContainerStyle={[styles.resultsContent, { paddingBottom: insets.bottom + 16 }]}
                        >
                            {status}
                            {term.length < 2 && <Text style={[styles.muted, { color: theme.text }]}>Type at least two characters.</Text>}
                            {term.length >= 2 && !activeSearch && (
                                <Text style={[styles.muted, { color: theme.text }]}>Searching…</Text>
                            )}
                            {activeSearch && (
                                <View style={styles.group}>
                                    <Text style={[styles.heading, { color: theme.text }]}>Search results for “{activeSearch.term}”</Text>
                                    {activeSearch.players === null ? (
                                        <View style={styles.actions}>
                                            <Text style={[styles.muted, { color: theme.text }]}>Couldn’t search for players.</Text>
                                            <Action label="Try again" disabled={false} onPress={refreshSearch} />
                                        </View>
                                    ) : activeSearch.players.length ? activeSearch.players.map(row) : (
                                        <Text style={[styles.muted, { color: theme.text }]}>No matching players.</Text>
                                    )}
                                </View>
                            )}
                        </ScrollView>
                    </KeyboardAvoidingView>
                </Modal>
            )}
        </View>
    );
}

function Action({ label, disabled, onPress }: { label: string; disabled: boolean; onPress: () => void }) {
    const { theme } = useTheme();
    return (
        <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress}
            style={[styles.action, { borderColor: theme.border, opacity: disabled ? 0.45 : 1 }]}>
            <Text style={{ color: theme.paddle, fontWeight: "600" }}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 9 },
    title: { fontWeight: "700", fontSize: 17 },
    heading: { fontWeight: "700", fontSize: 14 },
    name: { fontWeight: "600" },
    muted: { fontSize: 13, opacity: 0.75 },
    group: { gap: 5 },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    searchScreen: { flex: 1 },
    searchHeader: { paddingHorizontal: 20, paddingBottom: 12, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
    search: { flexDirection: "row", alignItems: "center", gap: 8 },
    results: { flex: 1 },
    resultsContent: { paddingHorizontal: 20, paddingTop: 12, gap: 8 },
    input: { flex: 1, minWidth: 0, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
    row: { borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 6, flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 },
    identity: { flex: 1, minWidth: 85 },
    actions: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
    action: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 7, minHeight: 36, justifyContent: "center" },
});

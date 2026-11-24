import { Platform } from "react-native";
import { API_BASE, apiRequest, type ScoreEntry } from "@/services/leaderboardApi";

export type OnlineProfile = {
    id: string;
    nickname: string;
    runsPlayed: number;
    bestScore: number | null;
    highestLevel: number | null;
    recentRuns: ScoreEntry[];
};

let pendingToken: Promise<string> | null = null;

export function getOrCreateProfileToken(nickname: string): Promise<string> {
    if (pendingToken) return pendingToken;
    pendingToken = loadOrCreateToken(nickname).finally(() => { pendingToken = null; });
    return pendingToken;
}

async function loadOrCreateToken(nickname: string): Promise<string> {
    if (!API_BASE) throw new Error("Profile API URL has not been configured.");

    // SecureStore keys only support letters, digits, periods, hyphens, and underscores.
    const serverKey = API_BASE.replace(/[^a-z0-9]/gi, (char) => "_" + char.charCodeAt(0).toString(16) + "_");
    const key = `breakout.profile.${serverKey}`;
    const nativeStore = Platform.OS === "web" ? null : await import("expo-secure-store");
    const saved = nativeStore ? await nativeStore.getItemAsync(key) : globalThis.localStorage.getItem(key);
    if (saved) return saved;

    const response = await apiRequest("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname }),
    });
    const { token }: { token: string } = await response.json();
    if (!/^[A-Fa-f0-9]{64}$/.test(token)) throw new Error("The API did not return a profile credential.");

    if (nativeStore) await nativeStore.setItemAsync(key, token);
    else globalThis.localStorage.setItem(key, token);
    return token;
}

export async function getOnlineProfile(nickname: string): Promise<OnlineProfile> {
    const token = await getOrCreateProfileToken(nickname);
    const headers = { Authorization: `Bearer ${token}` };
    const response = await apiRequest("/api/profiles/me", { headers });
    const profile: OnlineProfile = await response.json();
    if (profile.nickname === nickname) return profile;

    await apiRequest("/api/profiles/me", {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ nickname }),
    });
    return { ...profile, nickname };
}

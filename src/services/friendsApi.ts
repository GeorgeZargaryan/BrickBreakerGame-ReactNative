import { apiRequest } from "./leaderboardApi";
import { getOrCreateProfileToken } from "./playerProfile";

export type Relationship = "none" | "incoming" | "outgoing" | "friend";
export type SocialPlayer = { id: string; nickname: string; relationship: Relationship };

async function request(nickname: string, path: string, method = "GET", signal?: AbortSignal) {
    const token = await getOrCreateProfileToken(nickname);
    return apiRequest(path, { method, signal, headers: { Authorization: "Bearer " + token } });
}

export async function getFriends(nickname: string): Promise<SocialPlayer[]> {
    return (await request(nickname, "/api/friends")).json();
}

export async function findPlayers(nickname: string, query: string, signal?: AbortSignal): Promise<SocialPlayer[]> {
    return (await request(nickname, "/api/profiles/search?q=" + encodeURIComponent(query), "GET", signal)).json();
}

export async function changeFriendship(nickname: string, id: string, method: "POST" | "PUT" | "DELETE") {
    await request(nickname, "/api/friends/" + encodeURIComponent(id), method);
}

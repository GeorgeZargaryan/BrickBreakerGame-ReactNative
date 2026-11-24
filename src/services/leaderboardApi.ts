const API_BASE = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "");

export type ScoreEntry = {
    id: number;
    playerName: string;
    points: number;
    level: number;
    createdAt: string;
};

export type ScoresPage = {
    items: ScoreEntry[];
    totalCount: number;
    skip: number;
    take: number;
};
export async function apiRequest(path: string, options?: RequestInit): Promise<Response> {
    if (!API_BASE) throw new Error("Leaderboard URL has not been configured.");

    const controller = new AbortController();
    const callerSignal = options?.signal;
    const abort = () => controller.abort();
    if (callerSignal?.aborted) abort();
    else callerSignal?.addEventListener("abort", abort, { once: true });

    const timeout = setTimeout(abort, 8000);
    try {
        const response = await fetch(`${API_BASE}${path}`, { ...options, signal: controller.signal });
        if (!response.ok) throw new Error(`Leaderboard request failed (HTTP ${response.status}).`);
        return response;
    } finally {
        clearTimeout(timeout);
        callerSignal?.removeEventListener("abort", abort);
    }
}

export async function submitScore(playerName: string, points: number, level: number, profileToken: string): Promise<void> {
    await apiRequest("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${profileToken}` },
        body: JSON.stringify({ playerName, points, level }),
    });
}

export async function fetchTopScores(count = 10): Promise<ScoreEntry[]> {
    const res = await apiRequest(`/api/scores/top?count=${count}`);
    return res.json();
}

export async function fetchScoresPage(skip: number, take = 50): Promise<ScoresPage> {
    const res = await apiRequest(`/api/scores?skip=${skip}&take=${take}`);
    return res.json();
}
export { API_BASE };
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "breakout.personalBest";

export type PersonalBest = {
    score: number;
    level: number;
    date: string;
};

export async function getPersonalBest(): Promise<PersonalBest | null> {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
}

export async function updatePersonalBestIfHigher(
    score: number,
    level: number
): Promise<{ best: PersonalBest; isNewBest: boolean }> {
    const existing = await getPersonalBest();
    if (existing && existing.score >= score) {
        return { best: existing, isNewBest: false };
    }
    const best: PersonalBest = { score, level, date: new Date().toISOString() };
    await AsyncStorage.setItem(KEY, JSON.stringify(best));
    return { best, isNewBest: true };
}
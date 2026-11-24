import { useState } from "react";
import { updatePersonalBestIfHigher } from "@/services/localStats";

export function usePersonalBest() {
    const [isNewBest, setIsNewBest] = useState(false);

    async function checkAndUpdate(score: number, level: number) {
        const { isNewBest: newBest } = await updatePersonalBestIfHigher(score, level);
        setIsNewBest(newBest);
    }

    function reset() {
        setIsNewBest(false);
    }

    return { isNewBest, checkAndUpdate, reset };
}
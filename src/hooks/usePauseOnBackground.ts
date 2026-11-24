import { useEffect, useState } from "react";
import { AppState } from "react-native";

export function usePauseOnBackground() {
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        const sub = AppState.addEventListener("change", (state) => {
            if (state !== "active") setIsPaused(true);
        });
        return () => sub.remove();
    }, []);

    return { isPaused, setIsPaused };
}
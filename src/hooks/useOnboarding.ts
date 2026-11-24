import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "breakout.hasSeenOnboarding";

export function useOnboarding() {
    const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        AsyncStorage.getItem(KEY).then((value) => {
            setHasSeenOnboarding(value === "true");
            setIsLoading(false);
        });
    }, []);

    function markSeen() {
        setHasSeenOnboarding(true);
        AsyncStorage.setItem(KEY, "true");
    }

    return { hasSeenOnboarding, isLoading, markSeen };
}
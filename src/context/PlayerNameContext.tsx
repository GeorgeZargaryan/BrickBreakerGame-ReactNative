import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type PlayerNameContextValue = {
    playerName: string;
    setPlayerName: (name: string) => void;
    isLoading: boolean;
};

const STORAGE_KEY = "breakout.playerName";
const PlayerNameContext = createContext<PlayerNameContextValue | null>(null);

export function PlayerNameProvider({ children }: { children: ReactNode }) {
    const [playerName, setPlayerNameState] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
            if (saved) setPlayerNameState(saved);
            setIsLoading(false);
        });
    }, []);

    function setPlayerName(name: string) {
        setPlayerNameState(name);
        AsyncStorage.setItem(STORAGE_KEY, name);
    }

    return (
        <PlayerNameContext.Provider value={{ playerName, setPlayerName, isLoading }}>
            {children}
        </PlayerNameContext.Provider>
    );
}

export function usePlayerName() {
    const ctx = useContext(PlayerNameContext);
    if (!ctx) throw new Error("usePlayerName must be used within a PlayerNameProvider");
    return ctx;
}
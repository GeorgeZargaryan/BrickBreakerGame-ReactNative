import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type SettingsContextValue = {
    hapticsEnabled: boolean;
    setHapticsEnabled: (enabled: boolean) => void;
};

const STORAGE_KEY = "breakout.hapticsEnabled";
const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [hapticsEnabled, setHapticsEnabledState] = useState(true); // default on

    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
            if (saved !== null) setHapticsEnabledState(saved === "true");
        });
    }, []);

    function setHapticsEnabled(enabled: boolean) {
        setHapticsEnabledState(enabled);
        AsyncStorage.setItem(STORAGE_KEY, String(enabled));
    }

    return (
        <SettingsContext.Provider value={{ hapticsEnabled, setHapticsEnabled }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const ctx = useContext(SettingsContext);
    if (!ctx) throw new Error("useSettings must be used within a SettingsProvider");
    return ctx;
}
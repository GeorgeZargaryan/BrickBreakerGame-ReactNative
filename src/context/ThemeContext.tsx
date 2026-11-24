import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { THEMES_CONFIG, BOARD_CONFIG } from "@/game/config";

type ThemeKey = keyof typeof THEMES_CONFIG;

type ThemeContextValue = {
    themeKey: ThemeKey;
    theme: (typeof THEMES_CONFIG)[ThemeKey];
    setThemeKey: (key: ThemeKey) => void;
    availableThemes: ThemeKey[];
};

const STORAGE_KEY = "breakout.themeKey";
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [themeKey, setThemeKeyState] = useState<ThemeKey>(
        BOARD_CONFIG.default_theme as ThemeKey
    );

    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
            if (saved && saved in THEMES_CONFIG) {
                setThemeKeyState(saved as ThemeKey);
            }
        });
    }, []);

    function setThemeKey(key: ThemeKey) {
        setThemeKeyState(key);
        AsyncStorage.setItem(STORAGE_KEY, key);
    }

    const value: ThemeContextValue = {
        themeKey,
        theme: THEMES_CONFIG[themeKey],
        setThemeKey,
        availableThemes: Object.keys(THEMES_CONFIG) as ThemeKey[],
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
    return ctx;
}
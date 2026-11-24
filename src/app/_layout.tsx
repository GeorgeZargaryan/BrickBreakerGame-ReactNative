import { useEffect, useMemo } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavigationThemeProvider } from "expo-router";
import * as SystemUI from "expo-system-ui";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { PlayerNameProvider } from "@/context/PlayerNameContext";

function RootStack() {
    const { theme, themeKey } = useTheme();
    const navigationTheme = useMemo(() => {
        const base = themeKey === "light" ? DefaultTheme : DarkTheme;
        return {
            ...base,
            colors: {
                ...base.colors,
                background: theme.background,
                card: theme.background,
                text: theme.text,
                border: theme.border,
                primary: theme.paddle,
            },
        };
    }, [theme, themeKey]);

    useEffect(() => {
        void SystemUI.setBackgroundColorAsync(theme.background).catch(() => {});
    }, [theme.background]);

    const rootStyle = { flex: 1, backgroundColor: theme.background };
    return (
        <SafeAreaProvider style={rootStyle}>
            <GestureHandlerRootView style={rootStyle}>
                <NavigationThemeProvider value={navigationTheme}>
                    <Stack screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: theme.background },
                        animation: "fade",
                        gestureEnabled: true,
                    }} />
                </NavigationThemeProvider>
            </GestureHandlerRootView>
        </SafeAreaProvider>
    );
}

export default function RootLayout() {
    return (
        <ThemeProvider>
            <SettingsProvider>
                <PlayerNameProvider>
                    <RootStack />
                </PlayerNameProvider>
            </SettingsProvider>
        </ThemeProvider>
    );
}

import { View, StyleSheet } from "react-native";
import { GameCanvas } from "@/components/game/GameCanvas";
import { useTheme } from "@/context/ThemeContext";
import { useOnboarding } from "@/hooks/useOnboarding";
import { HowToPlayOverlay } from "@/components/onboarding/HowToPlayOverlay";

export default function GameScreen() {
    const { theme } = useTheme();
    const { hasSeenOnboarding, isLoading, markSeen } = useOnboarding();
    
    return (
        <View style={[styles.screen, { backgroundColor: theme.background }]}>
            {!isLoading && (hasSeenOnboarding ? <GameCanvas /> : <HowToPlayOverlay onDismiss={markSeen} />)}
        </View>
    );
}

const styles = StyleSheet.create({ screen: { flex: 1 } });
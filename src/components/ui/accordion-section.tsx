import { useState } from "react";
import { View, Text, Pressable, StyleSheet, LayoutAnimation, Platform, UIManager } from "react-native";
import { useTheme } from "@/context/ThemeContext";

type Props = {
    title: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
};

export function AccordionSection({ title, defaultOpen = false, children }: Props) {
    const { theme } = useTheme();
    const [isOpen, setIsOpen] = useState(defaultOpen);

    function toggle() {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsOpen((prev) => !prev);
    }

    return (
        <View style={[styles.container, { borderColor: "#2A2640" }]}>
            <Pressable style={styles.header} onPress={toggle}>
                <Text style={[styles.title, { color: theme.text ?? "#EDEAF6" }]}>{title}</Text>
                <Text style={{ color: theme.text ?? "#EDEAF6", fontSize: 18 }}>{isOpen ? "–" : "+"}</Text>
            </Pressable>
            {isOpen && <View style={styles.content}>{children}</View>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { borderWidth: 1, borderRadius: 10, marginBottom: 12, overflow: "hidden" },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14 },
    title: { fontSize: 16, fontWeight: "600" },
    content: { paddingHorizontal: 14, paddingBottom: 14 },
});
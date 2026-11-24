import { Canvas, Circle, Rect } from "@shopify/react-native-skia";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";
import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { useLiveBackground, type BackgroundShape } from "@/hooks/useLiveBackground";

type Props = {
    shapes: BackgroundShape[];
    opacity?: number;
};

export function LiveMenuBackground({ shapes, opacity = 0.18 }: Props) {
    const { width, height } = useWindowDimensions();
    const [isActive, setIsActive] = useState(true);

    useFocusEffect(
        useCallback(() => {
            setIsActive(true);
            return () => setIsActive(false);
        }, [])
    );

    const { positions } = useLiveBackground(width, height, shapes, isActive);

    return (
        <View style={[StyleSheet.absoluteFill, { opacity }]} pointerEvents="none">
            <Canvas style={StyleSheet.absoluteFill}>
                {shapes.map((shape, i) => (
                    <AnimatedShape key={i} index={i} positions={positions} shape={shape} />
                ))}
            </Canvas>
        </View>
    );
}

function AnimatedShape({ index, positions, shape }: { index: number; positions: SharedValue<number[]>; shape: BackgroundShape }) {
    const cx = useDerivedValue(() => positions.value[index * 2]);
    const cy = useDerivedValue(() => positions.value[index * 2 + 1]);
    const x = useDerivedValue(() => positions.value[index * 2] - shape.radius);
    const y = useDerivedValue(() => positions.value[index * 2 + 1] - shape.radius);

    return shape.isSquare
        ? <Rect x={x} y={y} width={shape.radius * 2} height={shape.radius * 2} color={shape.color} />
        : <Circle cx={cx} cy={cy} r={shape.radius} color={shape.color} />;
}
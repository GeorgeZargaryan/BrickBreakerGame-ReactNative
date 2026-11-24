import { useSharedValue, useFrameCallback } from "react-native-reanimated";

export type BackgroundShape = {
    radius: number;
    color: string;
    isSquare: boolean;
};

export function useLiveBackground(
    width: number,
    height: number,
    shapes: BackgroundShape[],
    isActive: boolean
) {
    const count = shapes.length;

    const initial = (() => {
        const pos: number[] = [];
        const vel: number[] = [];
        for (let i = 0; i < count; i++) {
            pos.push(Math.random() * width, Math.random() * height);
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.3 + Math.random() * 0.4;
            vel.push(Math.cos(angle) * speed, Math.sin(angle) * speed);
        }
        return { pos, vel };
    })();

    const positions = useSharedValue<number[]>(initial.pos);
    const velocities = useSharedValue<number[]>(initial.vel);

    useFrameCallback((frameInfo) => {
        "worklet";
        if (!isActive) return;
        const dt = (frameInfo.timeSincePreviousFrame ?? 16.67) / 16.67;
        const pos = positions.value.slice();
        const vel = velocities.value.slice();

        for (let i = 0; i < count; i++) {
            const r = shapes[i].radius;
            let x = pos[i * 2] + vel[i * 2] * dt;
            let y = pos[i * 2 + 1] + vel[i * 2 + 1] * dt;

            if (x < r || x > width - r) vel[i * 2] = -vel[i * 2];
            if (y < r || y > height - r) vel[i * 2 + 1] = -vel[i * 2 + 1];

            pos[i * 2] = Math.max(r, Math.min(width - r, x));
            pos[i * 2 + 1] = Math.max(r, Math.min(height - r, y));
        }

        positions.value = pos;
        velocities.value = vel;
    });

    return { positions, count };
}
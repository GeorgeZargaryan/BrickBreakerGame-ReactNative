import { useEffect, useRef, useState } from "react";
import { useSharedValue, withTiming, withSequence, withDelay, runOnJS } from "react-native-reanimated";
import { generateLevel } from "@/game/levelGenerator";
import type { BrickState } from "@/game/entities";
import type { Theme } from "@/game/config";
import { triggerLevelUpHaptic } from "@/game/haptics";

export function useLevelProgression(scale: number, theme: Theme) {

    const [bricks, setBricks] = useState<(BrickState | null)[]>([]);
    const [score, setScore] = useState(0);
    const [currentLevel, setCurrentLevel] = useState(1);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [announceText, setAnnounceText] = useState("");
    const announceOpacity = useSharedValue(0);
    const collisionField = useSharedValue<ReturnType<typeof generateLevel> | null>(null);
    const hasHandledClearRef = useRef(false);
    const pendingClearInfoRef = useRef<{ hapticsEnabled: boolean; onBeforeNextLevel: () => void } | null>(null);

    function announce(text: string, onDone: () => void) {
        setAnnounceText(text);
        setIsTransitioning(true);
        announceOpacity.value = withSequence(
            withTiming(1, { duration: 300 }),
            withDelay(900, withTiming(0, { duration: 300 }, (finished) => {
                if (finished) runOnJS(onDone)();
            }))
        );
    }

    function startLevel(level: number, keepScore: boolean, onBeforeStart: () => void) {
        onBeforeStart();
        const generatedLevel = generateLevel(level, scale, theme.bricks);
        hasHandledClearRef.current = false;
        setBricks(generatedLevel.bricks);
        // Physics keeps its own brick HP between frames while React catches up.
        collisionField.value = {
            layout: generatedLevel.layout,
            bricks: generatedLevel.bricks.map((brick) => brick ? { ...brick } : null),
        };
        setCurrentLevel(level);
        if (!keepScore) setScore(0);
    }

    function startInitialLevel(level: number, onBeforeStart: () => void) {
        startLevel(level, false, onBeforeStart);
        announce(`Level ${level}`, () => setIsTransitioning(false));
    }

    function restart(onBeforeStart: () => void) {
        startLevel(1, false, onBeforeStart);
    }

    // Functional updater — each call builds on the latest pending bricks
    // state instead of the snapshot captured when the call started. With
    // sub-stepping, two bricks can be hit within the same frame (two
    // separate calls); without the functional form, the second call's
    // setBricks silently overwrote the first call's destroyed brick.
    function handleBrickHit(
        brickId: string,
        hp: number,
        points: number,
        wasDestroyed: boolean,
        hapticsEnabled: boolean,
        onBeforeNextLevel: () => void,
        multiplier: number = 1
    ) {
        pendingClearInfoRef.current = { hapticsEnabled, onBeforeNextLevel };

        setBricks((prev) =>
            prev.map((b): BrickState | null =>
                b && b.id === brickId ? { ...b, hp, isDestroyed: wasDestroyed } : b
            )
        );

        if (wasDestroyed) {
            setScore((prev) => prev + Math.round(points * multiplier));
        }
    }

    // Level-clear detection moved out of the updater above and into an
    // effect reacting to the settled `bricks` state. Checking it inside
    // the setState updater (as before) meant calling announce() — which
    // writes to a shared value — during React's render phase, which
    // Reanimated flags as unsafe; this runs after render instead.
    useEffect(() => {
        if (bricks.length === 0 || hasHandledClearRef.current) return;
        const allCleared = bricks.every((b) => !b || b.isDestroyed);
        if (!allCleared || !pendingClearInfoRef.current) return;

        hasHandledClearRef.current = true;
        const { hapticsEnabled, onBeforeNextLevel } = pendingClearInfoRef.current;
        triggerLevelUpHaptic(hapticsEnabled);

        const next = currentLevel + 1;
        announce(`Level ${next}`, () => {
            startLevel(next, true, onBeforeNextLevel);
            setIsTransitioning(false);
        });
    }, [bricks]);

    return { bricks, score, currentLevel, isTransitioning, announceText, announceOpacity, collisionField, startInitialLevel, restart, handleBrickHit };
}
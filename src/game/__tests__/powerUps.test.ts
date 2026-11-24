import { afterEach, expect, it, jest } from "@jest/globals";
import { usePowerUps } from "../../hooks/usePowerUps";
import { createInitialPaddle } from "../entities";

jest.mock("react-native-reanimated", () => ({
    useSharedValue: (value: unknown) => ({ value }),
    useDerivedValue: (calculate: () => unknown) => ({ get value() { return calculate(); } }),
    runOnJS: (callback: unknown) => callback,
}));
jest.mock("../../game/haptics", () => ({ triggerPowerUpHaptic: jest.fn() }));

const board = { width: 300, height: 400 };
const paddle = createInitialPaddle(100, 370, 100, 10, "white", 0);

afterEach(() => { jest.restoreAllMocks(); });

it("drops at 15 percent while eligible", () => {
    const power = usePowerUps(1);
    const random = jest.spyOn(Math, "random").mockReturnValue(0.2);
    power.trySpawn(100, 100, 40, 100);
    expect(power.pickupActive.value).toBe(0);
    random.mockReturnValue(0.14);
    power.trySpawn(100, 100, 40, 100);
    expect(power.pickupActive.value).toBe(1);
});

it("does not roll again while a pickup is still falling", () => {
    const random = jest.spyOn(Math, "random").mockReturnValue(0);
    const power = usePowerUps(1);
    power.trySpawn(100, 100, 40, 100);
    power.trySpawn(130, 80, 40, 101);
    expect(random).toHaveBeenCalledTimes(2);
});

it("waits until the effect ends and the cooldown elapses", () => {
    jest.spyOn(Math, "random").mockReturnValue(0);
    const power = usePowerUps(1);
    power.trySpawn(100, 370, 40, 100);
    power.step(0, 100, board, paddle, false);
    expect(power.getActiveMultipliers(100).paddleWidthMultiplier).toBe(1.5);
    power.trySpawn(100, 100, 40, 200);
    power.trySpawn(100, 100, 40, 10099);
    expect(power.pickupActive.value).toBe(0);
    power.trySpawn(100, 100, 40, 10100);
    expect(power.pickupActive.value).toBe(1);
});

it("starts a short cooldown when a pickup is missed and clears it on reset", () => {
    jest.spyOn(Math, "random").mockReturnValue(0);
    const power = usePowerUps(1);
    power.trySpawn(100, 401, 40, 100);
    power.step(0, 100, board, paddle, false);
    power.trySpawn(100, 100, 40, 101);
    expect(power.pickupActive.value).toBe(0);
    power.reset();
    power.trySpawn(100, 100, 40, 101);
    expect(power.pickupActive.value).toBe(1);
});

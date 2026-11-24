import { describe, expect, it } from "@jest/globals";
import { createInitialBall, createInitialPaddle, createBrickGrid } from "../entities";

describe("createInitialBall", () => {
    it("places the ball at the given coordinates with the given appearance", () => {
        const ball = createInitialBall(100, 200, "red", 8);
        expect(ball.xCoord).toBe(100);
        expect(ball.yCoord).toBe(200);
        expect(ball.color).toBe("red");
        expect(ball.radius).toBe(8);
    });

    it("always launches upward", () => {
        for (let i = 0; i < 20; i++) {
            expect(createInitialBall(100, 200, "red", 8).yDirection).toBeLessThan(0);
        }
    });

    it("keeps the launch angle within MAX_BOUNCE_ANGLE", () => {
        for (let i = 0; i < 50; i++) {
            expect(Math.abs(createInitialBall(100, 200, "red", 8).angle)).toBeLessThanOrEqual(70);
        }
    });
});

describe("createInitialPaddle", () => {
    it("builds a paddle with no movement flags set", () => {
        const paddle = createInitialPaddle(50, 380, 100, 10, "white", 6);
        expect(paddle.moveLeft).toBe(false);
        expect(paddle.moveRight).toBe(false);
    });
});

describe("createBrickGrid", () => {
    it("creates rows * cols bricks", () => {
        expect(createBrickGrid(4, 6, 1, ["red"])).toHaveLength(24);
    });

    it("assigns every brick a unique id", () => {
        const bricks = createBrickGrid(4, 6, 1, ["red"]);
        expect(new Set(bricks.map((b) => b.id)).size).toBe(bricks.length);
    });

    it("gives top rows more points than bottom rows", () => {
        const bricks = createBrickGrid(4, 6, 1, ["red"]);
        const top = bricks.find((b) => b.id === "brick-0-0")!.points;
        const bottom = bricks.find((b) => b.id === "brick-3-0")!.points;
        expect(top).toBeGreaterThan(bottom);
    });

    it("scales brick dimensions by the given scale factor", () => {
        const full = createBrickGrid(1, 1, 1, ["red"]);
        const half = createBrickGrid(1, 1, 0.5, ["red"]);
        expect(half[0].width).toBe(full[0].width / 2);
    });
    it("assigns hp from hpByRow and sets matching maxHp", () => {
        const bricks = createBrickGrid(2, 1, 1, ["red"], [3, 1]);
        expect(bricks.find((b) => b.id === "brick-0-0")!.hp).toBe(3);
        expect(bricks.find((b) => b.id === "brick-1-0")!.maxHp).toBe(1);
    });
    it("starts every brick undestroyed", () => {
        expect(createBrickGrid(4, 6, 1, ["red"]).every((b) => !b.isDestroyed)).toBe(true);
    });
});
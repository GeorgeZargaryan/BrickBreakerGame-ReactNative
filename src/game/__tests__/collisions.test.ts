import { describe, expect, it, jest } from "@jest/globals";
import type { BrickLayout } from "../brickLayout";
import {
    checkBallWallCollision,
    checkBallPaddleCollision,
    checkBallBrickCollision,
    checkGameOver,
} from "../collisions";
import type { BallState, PaddleState, BrickState } from "../entities";
import type { Board } from "../collisions";

const board: Board = { width: 500, height: 400 };
const layout: BrickLayout = {
    rows: 1,
    cols: 2,
    brickWidth: 60,
    brickHeight: 20,
    offsetLeft: 100,
    offsetTop: 100,
    padding: 0,
};

function makeBall(overrides: Partial<BallState> = {}): BallState {
    return { xCoord: 250, yCoord: 200, xDirection: 2, yDirection: 2, color: "red", radius: 8, angle: 0, speed: 4, ...overrides };
}
function makePaddle(overrides: Partial<PaddleState> = {}): PaddleState {
    return { xCoord: 200, yCoord: 380, width: 100, height: 10, color: "white", speed: 0, moveLeft: false, moveRight: false, ...overrides };
}
function makeBrick(overrides: Partial<BrickState> = {}): BrickState {
    return { id: "brick-0-0", xCoord: 100, yCoord: 100, color: "red", width: 60, height: 20, isDestroyed: false, points: 10, hp: 1, maxHp: 1, ...overrides };
}

describe("checkBallWallCollision", () => {
    it("waits until the ball reaches the wall before bouncing", () => {
        const ball = makeBall({ xCoord: 491, xDirection: 8 });
        checkBallWallCollision(ball, board);
        expect(ball.xDirection).toBe(8);
        expect(ball.xCoord).toBe(491);
    });

    it("puts the ball back inside the court after crossing a wall", () => {
        const ball = makeBall({ xCoord: 497, xDirection: 8, yCoord: 4, yDirection: -5 });
        checkBallWallCollision(ball, board);
        expect(ball.xCoord).toBe(492);
        expect(ball.yCoord).toBe(8);
        expect(ball.xDirection).toBe(-8);
        expect(ball.yDirection).toBe(5);
    });

    it("bounces off the right wall", () => {
        const ball = makeBall({ xCoord: 495, xDirection: 5, radius: 8 });
        checkBallWallCollision(ball, board);
        expect(ball.xDirection).toBe(-5);
    });

    it("bounces off the left wall", () => {
        const ball = makeBall({ xCoord: 5, xDirection: -5, radius: 8 });
        checkBallWallCollision(ball, board);
        expect(ball.xDirection).toBe(5);
    });

    it("bounces off the top wall", () => {
        const ball = makeBall({ yCoord: 5, yDirection: -5, radius: 8 });
        checkBallWallCollision(ball, board);
        expect(ball.yDirection).toBe(5);
    });

    it("leaves direction unchanged mid-board", () => {
        const ball = makeBall({ xDirection: 3, yDirection: 3 });
        checkBallWallCollision(ball, board);
        expect(ball.xDirection).toBe(3);
        expect(ball.yDirection).toBe(3);
    });
});

describe("checkBallPaddleCollision", () => {
    it("sends a centered hit straight up regardless of the incoming horizontal speed", () => {
        const ball = makeBall({ xCoord: 250, yCoord: 378, xDirection: 3, yDirection: 4 });
        checkBallPaddleCollision(ball, makePaddle(), board);
        expect(ball.xDirection).toBeCloseTo(0);
        expect(ball.yDirection).toBeCloseTo(-5.05);
    });

    it.each([[-1, 200], [1, 300]])("uses the contact position to aim edge hits (%s)", (side, xCoord) => {
        const ball = makeBall({ xCoord, yCoord: 378, xDirection: 0, yDirection: 4 });
        checkBallPaddleCollision(ball, makePaddle(), board);
        const angle = Math.atan2(ball.xDirection, -ball.yDirection) * 180 / Math.PI;
        expect(angle).toBeCloseTo(side * 50);
    });

    it("adds a bounded motion bonus to the bounce angle", () => {
        const center = makeBall({ xCoord: 250, yCoord: 378, xDirection: 0, yDirection: 4 });
        const edge = { ...center, xCoord: 300 };
        const paddle = makePaddle({ speed: 1000 });
        checkBallPaddleCollision(center, paddle, board);
        checkBallPaddleCollision(edge, paddle, board);
        const angle = (ball: BallState) => Math.atan2(ball.xDirection, -ball.yDirection) * 180 / Math.PI;
        expect(angle(center)).toBeCloseTo(12);
        expect(angle(edge)).toBeCloseTo(60);
        expect(Math.hypot(edge.xDirection, edge.yDirection)).toBeCloseTo(4.04);
    });

    it("caps bounce speed and places the ball above the paddle", () => {
        const ball = makeBall({ xCoord: 290, yCoord: 378, xDirection: -9, yDirection: 8 });
        checkBallPaddleCollision(ball, makePaddle(), board);
        expect(Math.hypot(ball.xDirection, ball.yDirection)).toBeCloseTo(8);
        expect(ball.yCoord).toBe(372);
    });

    it("does not bounce a ball that is below the paddle's top edge", () => {
        const ball = makeBall({ xCoord: 250, yCoord: 383, xDirection: 0, yDirection: 4 });
        checkBallPaddleCollision(ball, makePaddle(), board);
        expect(ball.yDirection).toBe(4);
    });

    it("does not bounce when the ball just misses the paddle corner", () => {
        const ball = makeBall({ xCoord: 306, yCoord: 374, xDirection: 0, yDirection: 4 });
        checkBallPaddleCollision(ball, makePaddle(), board);
        expect(ball.yDirection).toBe(4);
    });

    it("bounces upward off the paddle when overlapping", () => {
        const paddle = makePaddle();
        const ball = makeBall({ xCoord: 250, yCoord: 378, yDirection: 4, radius: 8 });
        checkBallPaddleCollision(ball, paddle, board);
        expect(ball.yDirection).toBeLessThan(0);
    });

    it("ignores the ball when it's moving upward", () => {
        const ball = makeBall({ xCoord: 250, yCoord: 378, yDirection: -4, radius: 8 });
        checkBallPaddleCollision(ball, makePaddle(), board);
        expect(ball.yDirection).toBe(-4);
    });

    it("ignores the ball when it's outside the paddle's x-range", () => {
        const ball = makeBall({ xCoord: 400, yCoord: 378, yDirection: 4, radius: 8 });
        checkBallPaddleCollision(ball, makePaddle({ xCoord: 200, width: 100 }), board);
        expect(ball.yDirection).toBe(4);
    });

    it("ignores the ball once it's already passed below the paddle", () => {
        const ball = makeBall({ xCoord: 250, yCoord: 400, yDirection: 4, radius: 8 });
        checkBallPaddleCollision(ball, makePaddle({ yCoord: 380, height: 10 }), board);
        expect(ball.yDirection).toBe(4);
    });

    it("imparts paddle velocity into the ball's x direction", () => {
        const movingBall = makeBall({ xCoord: 250, yCoord: 378, yDirection: 4, xDirection: 0, radius: 8 });
        const stillBall = makeBall({ xCoord: 250, yCoord: 378, yDirection: 4, xDirection: 0, radius: 8 });
        checkBallPaddleCollision(movingBall, makePaddle({ speed: 14 }), board);
        checkBallPaddleCollision(stillBall, makePaddle({ speed: 0 }), board);
        expect(movingBall.xDirection).toBeGreaterThan(stillBall.xDirection);
    });
});

describe("checkBallBrickCollision", () => {
    it("misses the brick when only the ball's bounding box overlaps a corner", () => {
        const ball = makeBall({ xCoord: 94, yCoord: 94, xDirection: 3, yDirection: 3 });
        const brick = makeBrick();
        checkBallBrickCollision(ball, [brick], layout);
        expect(brick.hp).toBe(1);
        expect([ball.xDirection, ball.yDirection]).toEqual([3, 3]);
    });

    it("reflects diagonally off a true corner hit", () => {
        const ball = makeBall({ xCoord: 95, yCoord: 95, xDirection: 4, yDirection: 4 });
        const brick = makeBrick();
        checkBallBrickCollision(ball, [brick], layout);
        expect(brick.isDestroyed).toBe(true);
        expect(ball.xDirection).toBeCloseTo(-4);
        expect(ball.yDirection).toBeCloseTo(-4);
    });

    it("separates a multi-hit brick from the ball before the next collision step", () => {
        const ball = makeBall({ xCoord: 130, yCoord: 95, xDirection: 0, yDirection: 3 });
        const brick = makeBrick({ hp: 3, maxHp: 3 });
        const onHit = jest.fn();
        checkBallBrickCollision(ball, [brick], layout, onHit);
        expect(ball.yCoord).toBeLessThanOrEqual(92);
        expect(ball.yDirection).toBe(-3);

        checkBallBrickCollision(ball, [brick], layout, onHit);
        expect(brick.hp).toBe(2);
        expect(onHit).toHaveBeenCalledTimes(1);
    });

    it("ignores a brick the ball is already moving away from", () => {
        const ball = makeBall({ xCoord: 130, yCoord: 95, xDirection: 0, yDirection: -3 });
        const brick = makeBrick();
        checkBallBrickCollision(ball, [brick], layout);
        expect(brick.hp).toBe(1);
        expect(ball.yDirection).toBe(-3);
    });

    it("hits the brick the ball is entering when two adjacent bricks overlap it", () => {
        const leaving = makeBrick();
        const incoming = makeBrick({ id: "next", xCoord: 160 });
        const ball = makeBall({ xCoord: 157, yCoord: 110, xDirection: 3, yDirection: 0 });
        checkBallBrickCollision(ball, [leaving, incoming], layout);
        expect(leaving.isDestroyed).toBe(false);
        expect(incoming.isDestroyed).toBe(true);
        expect(ball.xDirection).toBe(-3);
    });

    it("destroys the brick and flips Y on a top/bottom hit", () => {
        const brick = makeBrick();
        const ball = makeBall({ xCoord: 130, yCoord: 95, radius: 8, yDirection: 3, xDirection: 0 });
        const onBreak = jest.fn();
        checkBallBrickCollision(ball, [brick], layout, onBreak);
        expect(brick.isDestroyed).toBe(true);
        expect(ball.yDirection).toBe(-3);
        expect(onBreak).toHaveBeenCalledWith(brick, true);
    });

    it("flips X instead of Y on a side hit", () => {
        const brick = makeBrick();
        const ball = makeBall({ xCoord: 95, yCoord: 110, radius: 8, xDirection: 3, yDirection: 1 });
        checkBallBrickCollision(ball, [brick], layout);
        expect(ball.xDirection).toBe(-3);
        expect(ball.yDirection).toBe(1);
    });

    it("ignores already-destroyed bricks", () => {
        const brick = makeBrick({ isDestroyed: true });
        const ball = makeBall({ xCoord: 130, yCoord: 95, radius: 8, yDirection: 3 });
        checkBallBrickCollision(ball, [brick], layout);
        expect(ball.yDirection).toBe(3);
    });

    it("destroys only one brick per call even when several overlap", () => {
        const brickA = makeBrick({ id: "a", xCoord: 100 });
        const brickB = makeBrick({ id: "b", xCoord: 160 });
        const ball = makeBall({ xCoord: 160, yCoord: 95, radius: 20, yDirection: 3 });
        checkBallBrickCollision(ball, [brickA, brickB], layout);
        expect([brickA, brickB].filter((b) => b.isDestroyed)).toHaveLength(1);
    });
});

describe("checkGameOver", () => {
    it("is true once the ball passes the bottom edge", () => {
        expect(checkGameOver(makeBall({ yCoord: 395, radius: 8 }), board)).toBe(true);
    });

    it("is false while the ball is still in play", () => {
        expect(checkGameOver(makeBall({ yCoord: 200, radius: 8 }), board)).toBe(false);
    });
});
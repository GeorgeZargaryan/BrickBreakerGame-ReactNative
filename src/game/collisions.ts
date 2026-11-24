import type { BallState, PaddleState, BrickState } from "./entities";
import type { BrickLayout } from "./brickLayout";

const PADDLE_EDGE_ANGLE = 50;
const PADDLE_MAX_BOUNCE_ANGLE = 60;
const PADDLE_MAX_NUDGE = 12;
const PADDLE_SPEED_FOR_MAX_NUDGE = 20;
const PADDLE_BOUNCE_SPEED_GAIN = 1.01;
const PADDLE_MAX_SPEED_MULTIPLIER = 2;

export type Board = {
    width: number;
    height: number;
};

export function checkBallWallCollision(ball: BallState, board: Board): void {
    "worklet";
    const rightEdge = board.width - ball.radius;
    if (ball.xCoord <= ball.radius) {
        ball.xCoord = ball.radius;
        ball.xDirection = Math.abs(ball.xDirection);
    } else if (ball.xCoord >= rightEdge) {
        ball.xCoord = rightEdge;
        ball.xDirection = -Math.abs(ball.xDirection);
    }

    if (ball.yCoord <= ball.radius) {
        ball.yCoord = ball.radius;
        ball.yDirection = Math.abs(ball.yDirection);
    }
}

type BrickContact = { normalX: number; normalY: number; penetration: number };

function getBrickContact(ball: BallState, brick: BrickState): BrickContact | null {
    "worklet";
    const right = brick.xCoord + brick.width;
    const bottom = brick.yCoord + brick.height;
    const closestX = Math.max(brick.xCoord, Math.min(ball.xCoord, right));
    const closestY = Math.max(brick.yCoord, Math.min(ball.yCoord, bottom));
    const dx = ball.xCoord - closestX;
    const dy = ball.yCoord - closestY;
    const distanceSquared = dx * dx + dy * dy;

    if (distanceSquared > ball.radius * ball.radius) return null;
    if (distanceSquared > 0) {
        const distance = Math.sqrt(distanceSquared);
        return { normalX: dx / distance, normalY: dy / distance, penetration: ball.radius - distance };
    }

    // If the center has entered the brick, separate through its nearest face.
    const leftDepth = ball.xCoord - brick.xCoord;
    const rightDepth = right - ball.xCoord;
    const topDepth = ball.yCoord - brick.yCoord;
    const bottomDepth = bottom - ball.yCoord;
    const xDepth = Math.min(leftDepth, rightDepth);
    const yDepth = Math.min(topDepth, bottomDepth);
    if (xDepth < yDepth) {
        return { normalX: leftDepth <= rightDepth ? -1 : 1, normalY: 0, penetration: ball.radius + xDepth };
    }
    return { normalX: 0, normalY: topDepth <= bottomDepth ? -1 : 1, penetration: ball.radius + yDepth };
}

export function checkBallBrickCollision(
    ball: BallState,
    bricks: (BrickState | null)[],
    layout: BrickLayout,
    onBrickHit?: (brick: BrickState, wasDestroyed: boolean) => void
): void {
    "worklet";
    const approxCol = Math.floor((ball.xCoord - layout.offsetLeft) / (layout.brickWidth + layout.padding));
    const approxRow = Math.floor((ball.yCoord - layout.offsetTop) / (layout.brickHeight + layout.padding));

    let hit: (BrickContact & { brick: BrickState; approach: number }) | null = null;
    for (let r = approxRow - 1; r <= approxRow + 1; r++) {
        if (r < 0 || r >= layout.rows) continue;
        for (let c = approxCol - 1; c <= approxCol + 1; c++) {
            if (c < 0 || c >= layout.cols) continue;
            const brick = bricks[r * layout.cols + c];
            if (!brick || brick.isDestroyed) continue;

            const contact = getBrickContact(ball, brick);
            if (!contact) continue;
            const approach = ball.xDirection * contact.normalX + ball.yDirection * contact.normalY;
            if (approach >= 0 || (hit && contact.penetration <= hit.penetration)) continue;

            hit = { brick, ...contact, approach };
        }
    }
    if (!hit) return;

    const { brick, normalX, normalY, penetration, approach } = hit;
    const clearance = penetration + 1e-6;
    ball.xCoord += normalX * clearance;
    ball.yCoord += normalY * clearance;
    ball.xDirection -= 2 * approach * normalX;
    ball.yDirection -= 2 * approach * normalY;

    brick.hp -= 1;
    const wasDestroyed = brick.hp === 0;
    if (wasDestroyed) brick.isDestroyed = true;
    onBrickHit?.(brick, wasDestroyed);
}

export function checkGameOver(ball: BallState, board: Board): boolean {
    "worklet";
    return ball.yCoord + ball.radius >= board.height;
}

export function checkBallPaddleCollision(
    ball: BallState,
    paddle: PaddleState,
    board: Board,
    onPaddleHit?: () => void
): void {
    "worklet";
    const rise = paddle.yCoord - ball.yCoord;
    if (ball.yDirection <= 0 || rise < 0 || rise > ball.radius || paddle.width <= 0) return;

    const paddleRight = paddle.xCoord + paddle.width;
    const nearestX = Math.max(paddle.xCoord, Math.min(ball.xCoord, paddleRight));
    const overhang = ball.xCoord - nearestX;
    if (overhang * overhang + rise * rise > ball.radius * ball.radius) return;

    const halfWidth = paddle.width / 2;
    const offset = (nearestX - (paddle.xCoord + halfWidth)) / halfWidth;
    const motion = Math.max(-1, Math.min(1, paddle.speed / PADDLE_SPEED_FOR_MAX_NUDGE));
    const angle = offset * PADDLE_EDGE_ANGLE + motion * PADDLE_MAX_NUDGE;
    const radians = Math.max(-PADDLE_MAX_BOUNCE_ANGLE, Math.min(PADDLE_MAX_BOUNCE_ANGLE, angle)) * Math.PI / 180;
    const incomingSpeed = Math.hypot(ball.xDirection, ball.yDirection);
    const speed = Math.min(incomingSpeed * PADDLE_BOUNCE_SPEED_GAIN, ball.speed * PADDLE_MAX_SPEED_MULTIPLIER);

    ball.yCoord = paddle.yCoord - ball.radius;
    ball.xDirection = speed * Math.sin(radians);
    ball.yDirection = -speed * Math.cos(radians);
    onPaddleHit?.();
}

export function handleAllCollisions(
    ball: BallState,
    board: Board,
    paddle: PaddleState,
    bricks: (BrickState | null)[],
    layout: BrickLayout,
    onBrickHit?: (brick: BrickState, wasDestroyed: boolean) => void,
    onPaddleHit?: () => void
): void {
    "worklet";
    checkBallWallCollision(ball, board);
    checkBallBrickCollision(ball, bricks, layout, onBrickHit);
    checkBallPaddleCollision(ball, paddle, board, onPaddleHit);
}


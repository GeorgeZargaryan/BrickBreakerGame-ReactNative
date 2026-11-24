import { MAX_BOUNCE_ANGLE, getBoardSize } from "./config";
export type BallState = {
    xCoord: number;
    yCoord: number;
    xDirection: number;
    yDirection: number;
    color: string;
    radius: number;
    angle: number;
    speed: number;
};

export type PaddleState = {
    xCoord: number;
    yCoord: number;
    moveRight: boolean;
    moveLeft: boolean;
    width: number;
    height: number;
    color: string;
    speed: number;
};

export type BrickState = {
    id: string;
    xCoord: number;
    yCoord: number;
    color: string;
    width: number;
    height: number;
    isDestroyed: boolean;
    points: number;
    hp: number;
    maxHp: number;
};

export function createInitialBall(
    x: number,
    y: number,
    color: string,
    radius: number): BallState {

    let speed = 4;
    let angle = Math.floor(Math.random() * (MAX_BOUNCE_ANGLE * 2 + 1)) - MAX_BOUNCE_ANGLE;
    let xdir = speed * Math.sin(angle * (Math.PI / 180));
    let ydir = -speed * Math.cos(angle * (Math.PI / 180));

    return {
        xCoord: x,
        yCoord: y,
        color: color,
        radius: radius,
        angle: angle,
        speed: speed,
        xDirection: xdir,
        yDirection: ydir
    }
}

export function createInitialPaddle(
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
    speed: number): PaddleState {

    return {
        xCoord: x,
        yCoord: y,
        width: width,
        height: height,
        color: color,
        speed: speed,
        moveLeft: false,
        moveRight: false
    }

}

export function createBrickGrid(
    rows: number,
    cols: number,
    scale: number,
    brickColors: string[],
    hpByRow: number[] = Array(rows).fill(1) // defaults to old single-hit behavior
): BrickState[] {
    const bricks: BrickState[] = [];
    const brickWidth = 60 * scale;
    const brickHeight = 20 * scale;
    const padding = 10 * scale;
    const offsetTop = 50 * scale;
    const offsetLeft = 30 * scale;

    for (let r = 0; r < rows; r++) {
        const hp = hpByRow[r] ?? 1;
        for (let c = 0; c < cols; c++) {
            bricks.push({
                id: `brick-${r}-${c}`,
                xCoord: c * (brickWidth + padding) + offsetLeft,
                yCoord: r * (brickHeight + padding) + offsetTop,
                color: brickColors[r % brickColors.length],
                width: brickWidth,
                height: brickHeight,
                isDestroyed: false,
                points: (rows - r) * 10,
                hp,
                maxHp: hp,
            });
        }
    }
    return bricks;
}
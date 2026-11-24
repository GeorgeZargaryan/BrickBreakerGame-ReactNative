export type BrickLayout = {
    cols: number;
    rows: number;
    brickWidth: number;
    brickHeight: number;
    padding: number;
    offsetTop: number;
    offsetLeft: number;
};

export function computeBrickLayout(rows: number, cols: number, scale: number): BrickLayout {
    return {
        cols,
        rows,
        brickWidth: 60 * scale,
        brickHeight: 20 * scale,
        padding: 10 * scale,
        offsetTop: 50 * scale,
        offsetLeft: 30 * scale,
    };
}
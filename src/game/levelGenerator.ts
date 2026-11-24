import { computeBrickLayout, type BrickLayout } from "./brickLayout";
import { BrickState } from "./entities";

export function generateLevel(level: number, scale: number, brickColors: string[]): {  bricks: (BrickState | null)[]; layout: BrickLayout } {
    const cols = 6;
    const rows = Math.min(4 + Math.floor(level / 2), 7);
    const layout = computeBrickLayout(rows, cols, scale);

    const maxHp = Math.min(1 + Math.floor(level / 3), 4);
    const gapChance = Math.max(0.25 - level * 0.01, 0.05);

    const bricks:(BrickState | null)[] = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (Math.random() < gapChance) {
                bricks.push(null); // placeholder keeps row-major indexing intact for O(1) lookup
                continue;
            }
            const hpBias = 1 - r / rows;
            const hp = 1 + Math.round(Math.random() * hpBias * (maxHp - 1));
            bricks.push({
                id: `brick-${level}-${r}-${c}`,
                xCoord: c * (layout.brickWidth + layout.padding) + layout.offsetLeft,
                yCoord: r * (layout.brickHeight + layout.padding) + layout.offsetTop,
                color: brickColors[r % brickColors.length],
                width: layout.brickWidth,
                height: layout.brickHeight,
                isDestroyed: false,
                points: (rows - r) * 10,
                hp,
                maxHp: hp,
            });
        }
    }

    return { bricks, layout };
}
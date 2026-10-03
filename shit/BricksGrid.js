import { Brick } from "./Brick.js";

export class BricksGrid {
    grid = [];
    gridRows;
    gridCols;
    brickGaps;
    gridPadding;
    brickColors;

    constructor(rows = 3, cols = 4, padding = 15, gaps = 10, colors) {
        this.gridRows = rows;
        this.gridCols = cols;
        this.gridPadding = padding;
        this.brickGaps = gaps;
        this.brickColors = colors;
    }
    changeBricksColors() {
        for (let row = 0; row < this.gridRows; row++) {
            for (let col = 0; col < this.gridCols; col++) {
                this.grid[row][col].color = this.brickColors[Math.floor(Math.random() * this.brickColors.length)];
            }
        }
    }
    initializeGrid(maxWidth) {
        this.grid.length = 0;
        for (let row = 0; row < this.gridRows; row++) {
            let gridRow = [];
            for (let col = 0; col < this.gridCols; col++) {
                let brickHeight = 10, brickWidth = (maxWidth - (this.brickGaps * (this.gridCols - 1)) - (2 * this.gridPadding)) / this.gridCols;
                let brickX = this.gridPadding + col * (brickWidth + this.brickGaps);
                let brickY = row * (brickHeight + this.brickGaps) + 25;
                let brickColor = this.brickColors[Math.floor(Math.random() * this.brickColors.length)]

                gridRow.push(new Brick(brickX, brickY, brickColor, brickWidth, brickHeight, 10));
            }
            this.grid.push(gridRow);
        }
    }

    draw(context) {
        for (let row = 0; row < this.gridRows; row++) {
            for (let col = 0; col < this.gridCols; col++) {
                if (this.grid[row][col].state !== 1) {
                    continue;
                }
                
                this.grid[row][col].draw(context);
            }
        }
    }
}

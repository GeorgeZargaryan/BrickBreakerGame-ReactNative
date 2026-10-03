export class Brick {
    xCoord;
    yCoord;
    color;
    width;
    height;
    state = 1;

    constructor(x, y, color, width, height) {
        this.xCoord = x;
        this.yCoord = y;
        this.color = color;
        this.width = width;
        this.height = height;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.rect(this.xCoord, this.yCoord, this.width, this.height);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    break() {
        this.state = 0;
    }
}
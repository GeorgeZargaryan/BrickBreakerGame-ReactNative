export class Paddle {
    xCoord;
    yCoord;
    moveRight = false;
    moveLeft = false;
    width;
    height;
    color;
    speed;

    constructor(x, y, width, height, color, speed) {
        this.xCoord = x;
        this.yCoord = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.speed = speed;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.rect(this.xCoord, this.yCoord, this.width, this.height);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    move(boardWidth) {
        if (this.moveRight) {
            this.xCoord = Math.min(this.xCoord + this.speed, boardWidth - this.width);
        }
        if (this.moveLeft) {
            this.xCoord = Math.max(this.xCoord + this.speed, 0);
        }
    }
    setMovement(speed) {
        this.speed = speed;
    }
    
    resetPosition(x) {
        this.xCoord = x;
    }
}
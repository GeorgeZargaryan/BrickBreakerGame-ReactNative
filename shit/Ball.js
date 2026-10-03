export class Ball {
    xCoord;
    yCoord;
    xDirection;
    yDirection;
    color;
    radius;
    angle;
    speed = 4; //TODO: Change this
    MAX_BOUNCE_ANGLE = 70;

    constructor(x, y, color, radius) {
        this.xCoord = x;
        this.yCoord = y;
        this.color = color;
        this.radius = radius;
        this.angle = Math.floor(Math.random() * (this.MAX_BOUNCE_ANGLE * 2 + 1)) - this.MAX_BOUNCE_ANGLE;
        this.xDirection = this.speed * Math.sin(this.angle * (Math.PI / 180));
        this.yDirection = -this.speed * Math.cos(this.angle * (Math.PI / 180));
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.xCoord, this.yCoord, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    move() {
        this.xCoord += this.xDirection;
        this.yCoord += this.yDirection;
    }
    resetPosition(x, y) {
        this.xCoord = x;
        this.yCoord = y;
    }
}

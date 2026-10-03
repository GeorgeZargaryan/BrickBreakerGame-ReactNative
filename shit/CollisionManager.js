export class CollisionManager {
    static checkBallWallCollision(ball, board) {
        if (ball.xCoord + ball.xDirection > board.width - ball.radius || ball.xCoord + ball.xDirection < ball.radius) {
            ball.xDirection = -ball.xDirection;
        }
        if (ball.yCoord + ball.yDirection < ball.radius) {
            ball.yDirection = -ball.yDirection;
        }
    }

    static checkBallPaddleCollision(ball, paddle, board) {
        if (
            ball.yDirection > 0 &&
            ball.yCoord + ball.radius >= board.height - paddle.height &&
            ball.xCoord + ball.radius >= paddle.xCoord && ball.xCoord - ball.radius <= paddle.xCoord + paddle.width
        ) {
            // ball.yDirection = -ball.yDirection;
            ball.yDirection *= -1.01;
            ball.xDirection *= 1.01;

            ball.xDirection += paddle.speed / 14;
        }
    }

    static checkBallBrickCollision(ball, bricksGrid, onBrickBreak) {
        bricksGrid.grid.forEach(row => {
            row.forEach(brick => {
                if (brick.state === 1 &&
                    ball.xCoord + ball.radius >= brick.xCoord &&  ball.xCoord - ball.radius <= brick.xCoord + brick.width &&
                    ball.yCoord >= brick.yCoord && ball.yCoord <= brick.yCoord + brick.height) {
                    brick.break();
                    ball.yDirection = -ball.yDirection;
                    
                    if (typeof(onBrickBreak) === "function") {
                        onBrickBreak();
                    }
                }
            });
        });
    }

    static checkGameOver(ball, board) {
        return ball.yCoord + ball.radius >= board.height;
    }

    static handleAllCollisions(ball, board, paddle, bricks, onBrickBreak) {
        this.checkBallWallCollision(ball, board);
        this.checkBallBrickCollision(ball, bricks, onBrickBreak);
        this.checkBallPaddleCollision(ball, paddle, board);
    }
}
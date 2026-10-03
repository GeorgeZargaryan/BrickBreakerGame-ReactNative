import { THEMES_CONFIG, BOARD_CONFIG } from "./utility/CONFIGS.js";
import { CollisionManager } from "./CollisionManager.js";
export class Game {
    isOver;
    ball;
    bricksGrid;
    paddle;
    collisionManager;
    context;
    score;
    anim;
    theme;

    //TODO: if localstorage is empty, theme is bugged
    constructor(ball, bricksGrid, paddle, collisionManager, context, theme = BOARD_CONFIG.default_theme) {
        this.ball = ball;
        this.bricksGrid = bricksGrid;
        this.paddle = paddle;
        this.collisionManager = collisionManager;
        this.context = context;
        this.theme = theme;
        this.score = 0;
        this.isOver = false;
        this.anim = null;
        this._setupEventListeners();
    }

    initialize(width) {
        this.bricksGrid.initializeGrid(width);
        this.changeTheme();
    }

    _setupEventListeners() {
        document.addEventListener('keydown', (e) => this._handleKeyDown(e));
        document.addEventListener('keyup', (e) => this._handleKeyUp(e));
    }

    _handleKeyDown(e) {
        if (!this.paddle) return;
        const { key } = e;
        if (key === "ArrowRight") {
            this.paddle.moveRight = true;
            this.paddle.setMovement(7);
        }
        if (key === "ArrowLeft") 
        {
            this.paddle.moveLeft = true;
            this.paddle.setMovement(-7);
        }
    }

    _handleKeyUp(e) {
        if (!this.paddle) return;
        const { key } = e;
        if (key === "ArrowRight" || key === "ArrowLeft") {
            this.paddle.moveLeft = false;
            this.paddle.moveRight = false;
            this.paddle.setMovement(0);
        }
    }

    _applyNeonEffects() {
        if (this.theme === "neon") {
            this.context.shadowColor = THEMES_CONFIG.neon.paddle;
            this.context.shadowBlur = 20;
        }
    }

    _updateGame() {
        CollisionManager.handleAllCollisions(
            this.ball, board, this.paddle,
            this.bricksGrid, this.handleBrickBreak.bind(this)
        );
        this.ball.move();
        this.paddle.move(board.width);
    }

    _handleGameOver() {
        console.log("Game Over!");
        this.isOver = true;
    }


    draw() {
        this._applyNeonEffects();
        this.context.clearRect(0, 0, board.width, board.height);
        this.ball.draw(this.context);
        this.bricksGrid.draw(this.context);
        this.paddle.draw(this.context);
        this.context.shadowBlur = 0;
    }

    start() {
        if (this.isOver) return;
        this.draw()

        if (CollisionManager.checkGameOver(this.ball, board)) {
            this._handleGameOver();
            return;
        }

        this._updateGame();
        this.anim = requestAnimationFrame(this.start.bind(this));
    }
    reset() {
        cancelAnimationFrame(this.anim)
        this.isOver = false;
        this.score = 0;

        this._resetBall();
        this._resetPaddle();
        this.bricksGrid.initializeGrid(board.width);
    }
    _resetBall() {
        this.ball.angle = Math.floor(Math.random() * (this.ball.MAX_BOUNCE_ANGLE * 2 + 1)) - this.ball.MAX_BOUNCE_ANGLE;
        this.ball.xDirection = this.ball.speed * Math.sin(this.ball.angle * (Math.PI / 180));
        this.ball.yDirection = -this.ball.speed * Math.cos(this.ball.angle * (Math.PI / 180));
        this.ball.resetPosition(board.width / 2, board.height - 30);
    }

    _resetPaddle() {
        this.paddle.resetPosition((board.width - this.paddle.width) / 2);
    }

    handleBrickBreak() {
        this.score += 10;
        console.log(this.score);
    }

    applyTheme(themeName) {
        localStorage.setItem("brickBreakerTheme", themeName);
        this.theme = themeName;
        this.changeTheme();
    }

    changeTheme() {
        const theme = THEMES_CONFIG[this.theme];
        board.style.backgroundColor = theme.background;
        this.ball.color = theme.ball;
        this.paddle.color = theme.paddle;
        this.bricksGrid.colors = theme.bricks;
        this.bricksGrid.changeBricksColors();
        this.draw();
    }
}
import type { CSSProperties } from 'react';
import { Double } from "react-native/Libraries/Types/CodegenTypes";
import { MAX_BOUNCE_ANGLE } from "../config";
type BallState = {
    xCoord: Double;
    yCoord: Double;
    xDirection: Double;
    yDirection: Double;
    color: CSSProperties['color'];
    radius: Double;
    angle: Double;
    speed: number;
};

type PaddleState = {
    xCoord: Double;
    yCoord: Double;
    moveRight: boolean;
    moveLeft: boolean;
    width: number;
    height: number;
    color: CSSProperties['color'];
    speed: number;
};

type BrickState = {
    id: string;
    xCoord: Double;
    yCoord: Double;
    color: CSSProperties['color'];
    width: number;
    height: number;
    isDestroyed: boolean;
    points: number;
};

function createInitialBall(
    x: Double, 
    y: Double, 
    color: CSSProperties['color'], 
    radius: Double) : BallState {

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

function createInitialPaddle(
    x: Double,
    y: Double,
    width: number,
    height: number,
    color: CSSProperties['color'],
    speed: number) : PaddleState {
    
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



export function createBrickGrid(rows: number, cols: number): BrickState[] {
  const bricks: BrickState[] = [];
  const brickWidth = 60;
  const brickHeight = 20;
  const padding = 10;
  const offsetTop = 50;
  const offsetLeft = 30;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * (brickWidth + padding) + offsetLeft;
      const y = r * (brickHeight + padding) + offsetTop;

      bricks.push({
        id: `brick-${r}-${c}`, // Уникальный id для React
        xCoord: x,
        yCoord: y,
        color: 'red',
        width: brickWidth,
        height: brickHeight,
        isDestroyed: false,
        points: (rows - r) * 10, // Нижние ряды дают меньше очков, верхние — больше
      });
    }
  }

  return bricks;
}
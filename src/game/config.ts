export type Theme = {
    background: string;
    paddle: string;
    ball: string;
    bricks: string[];
    text: string;
    border: string;
    buttonText: string;
};

export const THEMES_CONFIG = {
    light: {
        background: "#F5F5F5",
        paddle: "#3A3F4B",
        ball: "#2F6FED",
        bricks: ["#FF6B5B", "#FF9F7D", "#4FD1C5", "#86E0D6"],
        text: "#1F2430",
        border: "#D8DAE3",
        buttonText: "#FFFFFF",
    },
    classic: {
        background: "#0D0D12",
        paddle: "#F4F4F4",
        ball: "#FF3B3B",
        bricks: ["#39FF88", "#FFE156", "#FFA63D", "#FF4FD8"],
        text: "#F4F4F4",
        border: "#2A2A33",
        buttonText: "#0D0D12",
    },
    neon: {
        background: "#0F0F1A",
        paddle: "#00E5FF",
        ball: "#FF2FD1",
        bricks: ["#FFE600", "#FF8A00", "#B026FF", "#39FF14"],
        text: "#F5F0FF",
        border: "#3D1A78",
        buttonText: "#0F0F1A",
    },
    dark: {
        background: "#17171B",
        paddle: "#7FDBFF",
        ball: "#FF8F3C",
        bricks: ["#2ECC40", "#FFDC00", "#FF4136", "#B10DC9"],
        text: "#FFFFFF",
        border: "#3A3A3F",
        buttonText: "#17171B",
    },
    arcade: {
        background: "#14121F",
        paddle: "#F2B263",
        ball: "#5EEAD4",
        bricks: ["#FF6AC1", "#E154A5", "#C13E8A", "#8F2A68"],
        text: "#EDEAF6",
        border: "#2A2640",
        buttonText: "#14121F",
    },
} satisfies Record<string, Theme>;

export const BOARD_CONFIG = {
    width: 500,
    height: 400,
    default_theme: "arcade"
}

export const PADDLE_CONFIG ={
    width: 110,
    height: 10,
}

export const MAX_BOUNCE_ANGLE = 70;

export const DESIGN_WIDTH = 500;
export const DESIGN_HEIGHT = 700; 

export function getBoardSize(windowWidth: number, availableHeight: number) {
    const horizontalMargin = 16;
    const maxBoardWidth = 420;
    const maxWidth = Math.min(windowWidth - horizontalMargin * 2, maxBoardWidth);

    const scaleByWidth = maxWidth / DESIGN_WIDTH;
    const scaleByHeight = availableHeight / DESIGN_HEIGHT;
    const scale = Math.min(scaleByWidth, scaleByHeight); // whichever is tighter wins

    return { width: DESIGN_WIDTH * scale, height: DESIGN_HEIGHT * scale, scale };
}
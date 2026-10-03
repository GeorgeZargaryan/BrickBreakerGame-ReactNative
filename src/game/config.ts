export const THEMES_CONFIG = {
    light: {
        background: "#F5F5F5", // Off-white
        paddle: "#555555",     // Dark gray
        ball: "#4285F4",      // Google blue
        bricks: [
            "#34A853", // Green
            "#EA4335", // Red
            "#FBBC05", // Yellow
            "#4285F4", // Blue (reused for balance)
        ],
        text: "#333333",      // Dark gray
        border: "#CCCCCC",    // Light gray
    },
    classic: {
        background: "#121212", // Near-black
        paddle: "#FFFFFF",     // White
        ball: "#FF0000",      // Red
        bricks: [
            "#00FF00", // Green
            "#FFFF00", // Yellow
            "#FFA500", // Orange
            "#FF00FF", // Pink
        ],
        text: "#FFFFFF",      // White
        border: "#333333",    // Dark gray (for grid/walls)
    },
    neon: {
        background: "#0F0F1A", // Deep purple-black
        paddle: "#00FFFF",     // Cyan
        ball: "#FF00FF",      // Magenta
        bricks: [
            "#FF00FF", // Magenta
            "#00FFFF", // Cyan
            "#FFFF00", // Yellow
            "#FF6600", // Orange
        ],
        text: "#FFFFFF",      // White
        border: "#330066",   // Dark purple
    },
    dark: {
        background: "#1A1A1A", // Dark gray
        paddle: "#7FDBFF",     // Light blue
        ball: "#FF851B",      // Bright orange
        bricks: [
            "#2ECC40", // Green
            "#FFDC00", // Yellow
            "#FF4136", // Red
            "#B10DC9", // Purple
        ],
        text: "#FFFFFF",      // White
        border: "#444444",   // Medium gray
    }
};

export const BOARD_CONFIG = {
    width: 500,
    height: 400,
    default_theme: "classic"
}

export const PADDLE_CONFIG ={
    width: 110,
    height: 10,
}

export const MAX_BOUNCE_ANGLE = 70;

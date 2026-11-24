function shadeHex(hex: string, factor: number): string {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = Math.round(((num >> 16) & 0xff) * factor);
    const g = Math.round(((num >> 8) & 0xff) * factor);
    const b = Math.round((num & 0xff) * factor);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function getBrickDisplayColor(baseColor: string, hp: number, maxHp: number): string {
    if (maxHp <= 1) return baseColor; // single-hit bricks never shift
    const minBrightness = 0.45; // darkest shade, at 1 hp remaining
    const factor = minBrightness + (1 - minBrightness) * ((hp - 1) / (maxHp - 1));
    return shadeHex(baseColor, factor);
}
const HEX_COLOR = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
const INVERT_AMOUNT = 0.93;

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function toHex(channel: number): string {
  return Math.round(clamp(channel) * 255)
    .toString(16)
    .padStart(2, '0');
}

export function getVisibleBackground(color: string, isDark: boolean): string {
  const match = HEX_COLOR.exec(color);
  if (!match || !isDark) return color;

  const [r, g, b] = [match[1], match[2], match[3]].map(part => {
    const channel = parseInt(part, 16) / 255;
    return channel + INVERT_AMOUNT * (1 - 2 * channel);
  });

  const red = -0.574 * r + 1.43 * g + 0.144 * b;
  const green = 0.426 * r + 0.43 * g + 0.144 * b;
  const blue = 0.426 * r + 1.43 * g - 0.856 * b;

  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

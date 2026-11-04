/**
 * Categorical palette (validated for color-vision deficiency in both themes).
 * Categories store the light-mode hex; in dark mode it is swapped for the
 * same hue stepped for the dark surface.
 */
export const PALETTE = [
  { light: '#2a78d6', dark: '#3987e5', name: 'Blue' },
  { light: '#eb6834', dark: '#d95926', name: 'Orange' },
  { light: '#1baf7a', dark: '#199e70', name: 'Aqua' },
  { light: '#eda100', dark: '#c98500', name: 'Yellow' },
  { light: '#e87ba4', dark: '#d55181', name: 'Magenta' },
  { light: '#008300', dark: '#008300', name: 'Green' },
  { light: '#6250d6', dark: '#9085e9', name: 'Violet' },
  { light: '#e34948', dark: '#e66767', name: 'Red' },
  { light: '#7a7974', dark: '#8f8e88', name: 'Gray' },
];

const darkByLight = new Map(PALETTE.map((p) => [p.light.toLowerCase(), p.dark]));

export function seriesColor(hex, isDark) {
  if (!hex) return isDark ? '#8f8e88' : '#7a7974';
  return isDark ? (darkByLight.get(hex.toLowerCase()) ?? hex) : hex;
}

export const STATUS = {
  ok: { label: 'On track', color: 'var(--status-good)' },
  warning: { label: 'Nearing limit', color: 'var(--status-warning)' },
  exceeded: { label: 'Over budget', color: 'var(--status-critical)' },
};

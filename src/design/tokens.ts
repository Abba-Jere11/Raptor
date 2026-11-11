/**
 * Single source for the palette values used by tests and the design-system page.
 * Must match @theme in src/app/globals.css.
 */
export const palette = {
  white: { name: "Crisp Pure White", hex: "#FFFFFF", use: "Page and card surfaces" },
  platinum: { name: "Platinum Light Gray", hex: "#E9EAEC", use: "Secondary backgrounds and dividers" },
  crimson: { name: "Crimson Red", hex: "#C62838", use: "Brand emphasis and selected actions; used sparingly" },
  slate: { name: "Metallic Slate", hex: "#68717B", use: "Secondary text and labels" },
  charcoal: { name: "Dark Charcoal", hex: "#24272B", use: "Headings, primary text, strong contrast" },
  silver: { name: "Metallic Silver Gray", hex: "#B7BCC2", use: "Borders and fine details (never text)" },
} as const;

export const statusColours = {
  amberBg: "#FFF4DB",
  amberText: "#7A4D00",
  successBg: "#E3F2E8",
  success: "#1D6B3F",
} as const;

/** Text/background pairs the interface actually uses, with the minimum ratio each must meet. */
export const contrastPairs: Array<{ fg: string; bg: string; label: string; min: number; usage: string }> = [
  { fg: palette.charcoal.hex, bg: palette.white.hex, label: "Charcoal on White", min: 4.5, usage: "Body and headings" },
  { fg: palette.white.hex, bg: palette.crimson.hex, label: "White on Crimson", min: 4.5, usage: "Key action buttons, brand chips" },
  { fg: palette.crimson.hex, bg: palette.white.hex, label: "Crimson on White", min: 4.5, usage: "Links, step numbers" },
  { fg: palette.slate.hex, bg: palette.white.hex, label: "Slate on White", min: 4.5, usage: "Secondary text and labels" },
  { fg: palette.charcoal.hex, bg: palette.platinum.hex, label: "Charcoal on Platinum", min: 4.5, usage: "Text on secondary backgrounds" },
  { fg: palette.slate.hex, bg: palette.platinum.hex, label: "Slate on Platinum", min: 3, usage: "Large or non-essential text only" },
  { fg: palette.white.hex, bg: palette.charcoal.hex, label: "White on Charcoal", min: 4.5, usage: "Dark band, dark buttons" },
  { fg: statusColours.amberText, bg: statusColours.amberBg, label: "Amber text on Amber", min: 4.5, usage: "Delay notices" },
  { fg: statusColours.success, bg: statusColours.successBg, label: "Green on Green tint", min: 4.5, usage: "Cleared / export-ready chips" },
];

/** WCAG 2.x relative luminance and contrast ratio. */
export function luminance(hex: string): number {
  const v = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(v.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

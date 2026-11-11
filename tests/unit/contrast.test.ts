import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrastPairs, contrastRatio, palette, statusColours } from "@/design/tokens";

describe("colour contrast (WCAG 2.2 AA)", () => {
  it.each(contrastPairs)("$label meets its minimum ($min:1)", ({ fg, bg, min }) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(min);
  });

  it("only allows a ratio below 4.5:1 for large or non-essential text", () => {
    const relaxed = contrastPairs.filter((p) => p.min < 4.5);
    for (const p of relaxed) expect(p.usage.toLowerCase()).toMatch(/large|non-essential/);
  });

  it("computes known reference ratios", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(contrastRatio("#FFFFFF", "#FFFFFF")).toBeCloseTo(1, 5);
  });

  it("matches the colours declared in globals.css", () => {
    const css = readFileSync(new URL("../../src/app/globals.css", import.meta.url), "utf8").toLowerCase();
    const expected = [
      ["white", palette.white.hex],
      ["platinum", palette.platinum.hex],
      ["crimson", palette.crimson.hex],
      ["slate", palette.slate.hex],
      ["charcoal", palette.charcoal.hex],
      ["silver", palette.silver.hex],
      ["amber-bg", statusColours.amberBg],
      ["amber-text", statusColours.amberText],
      ["success", statusColours.success],
      ["success-bg", statusColours.successBg],
    ];
    for (const [name, hex] of expected) expect(css).toContain(`--color-${name}: ${hex.toLowerCase()};`);
  });
});

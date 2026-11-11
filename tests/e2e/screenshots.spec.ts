import { test } from "@playwright/test";
import { ALL_SCREENS } from "../../src/prototype/screens";

const OUT = "docs/milestone-1/screenshots";
const widths = [
  { label: "desktop", width: 1440, height: 900 },
  { label: "phone", width: 390, height: 844 },
];

test.describe.configure({ mode: "parallel" });

for (const s of [{ name: "Prototype index", href: "/prototype", slug: "index" }, ...ALL_SCREENS]) {
  for (const w of widths) {
    test(`${s.slug} @ ${w.label}`, async ({ page }) => {
      await page.setViewportSize({ width: w.width, height: w.height });
      await page.goto(s.href, { waitUntil: "networkidle" });
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${OUT}/${w.label}/${s.slug}.png`, fullPage: true });
    });
  }
}

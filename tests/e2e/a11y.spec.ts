import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { ALL_SCREENS } from "../../src/prototype/screens";

const screens = [{ name: "Prototype index", href: "/prototype", slug: "index" }, ...ALL_SCREENS];

for (const s of screens) {
  test(`${s.name} has no WCAG A/AA violations`, async ({ page }) => {
    const res = await page.goto(s.href, { waitUntil: "networkidle" });
    expect(res?.status()).toBeLessThan(400);
    await expect(page.getByText("PROTOTYPE · MOCK DATA", { exact: false }).first()).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} × ${v.nodes[0]?.target.join(" ")}`);
    expect(summary, summary.join("\n")).toEqual([]);
  });
}

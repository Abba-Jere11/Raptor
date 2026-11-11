import { expect, type Page, test } from "@playwright/test";

/** Keyboard pass on the key flows: menu, filters, request steps, payment form. */

async function tabTo(page: Page, matcher: () => Promise<boolean>, max = 60) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press("Tab");
    if (await matcher()) return;
  }
  throw new Error("Element not reached by Tab");
}

async function expectFocusRing(page: Page) {
  const outline = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return "none";
    const s = getComputedStyle(el);
    const label = el.closest("label");
    const ls = label ? getComputedStyle(label) : null;
    return s.outlineStyle !== "none" && s.outlineWidth !== "0px" ? s.outlineStyle : ls && ls.outlineStyle !== "none" ? ls.outlineStyle : "none";
  });
  expect(outline, "visible focus ring").not.toBe("none");
}

const focusedText = (page: Page) => page.evaluate(() => (document.activeElement as HTMLElement | null)?.innerText?.trim() ?? "");
const focusedLabel = (page: Page) =>
  page.evaluate(() => (document.activeElement as HTMLElement | null)?.getAttribute("aria-label") ?? "");

test("phone menu opens, traps nothing unexpectedly, and closes with Escape", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/prototype/site");
  await tabTo(page, async () => (await focusedLabel(page)) === "Open menu");
  await expectFocusRing(page);
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  expect(await focusedLabel(page)).toBe("Open menu");
});

test("inventory filter pill opens with Enter and closes with Escape", async ({ page }) => {
  await page.goto("/prototype/site/inventory");
  const first = page.getByRole("group", { name: "Filters" }).locator("button[aria-expanded]").first();
  await tabTo(page, async () => first.evaluate((el) => el === document.activeElement));
  await expectFocusRing(page);
  await page.keyboard.press("Enter");
  await expect(first).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(first).toHaveAttribute("aria-expanded", "false");
  await expect(first).toBeFocused();
});

test("request steps can be completed with the keyboard", async ({ page }) => {
  await page.goto("/prototype/site/request-a-vehicle");
  const firstMake = page.locator('input[name="make"]').first();
  await tabTo(page, async () => firstMake.evaluate((el) => el === document.activeElement));
  await expectFocusRing(page);
  await page.keyboard.press("Space");
  await expect(firstMake).toBeChecked();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Step 2 of 4")).toBeVisible();
  await page.getByLabel("Model").focus();
  await page.keyboard.type("Ghost");
  await page.keyboard.press("Enter");
  await expect(page.getByText("Step 3 of 4")).toBeVisible();
  await page.getByLabel("Destination country").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Step 3 of 4")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).focus();
  await expectFocusRing(page);
  await page.keyboard.press("Enter");
  await expect(page.getByText("Step 4 of 4")).toBeVisible();
  await page.getByLabel("Full name").focus();
  await page.keyboard.type("Test Buyer");
  await page.keyboard.press("Tab");
  await page.keyboard.type("buyer@example.com");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/prototype\/site\/request\/RQ-V-0112/);
});

test("payment cannot be recorded until the bank confirmation is ticked", async ({ page }) => {
  await page.goto("/prototype/ceo/payments/RA-O-2031");
  const confirm = page.getByRole("button", { name: "Confirm and record payment" });
  await expect(confirm).toBeDisabled();
  const tick = page.getByRole("checkbox", { name: /seen this money arrive/ });
  await tabTo(page, async () => tick.evaluate((el) => el === document.activeElement));
  await expectFocusRing(page);
  await page.keyboard.press("Space");
  await expect(tick).toBeChecked();
  await expect(confirm).toBeEnabled();
  await page.keyboard.press("Tab");
  expect(await focusedText(page)).toContain("Confirm and record payment");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status").filter({ hasText: "Recorded (prototype)" })).toBeVisible();
});

test("quotation builder: saving never sends; send only after preview", async ({ page }) => {
  await page.goto("/prototype/ceo/quotes/new");
  const send = page.getByRole("button", { name: "Send to customer" });
  await expect(send).toBeDisabled();
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByText("Nothing has been sent")).toBeVisible();
  await expect(send).toBeDisabled();
  await page.getByRole("button", { name: "Preview" }).click();
  await expect(send).toBeEnabled();
});

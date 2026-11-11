import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { TEST } from "../helpers/fixtures";
import { totpFresh } from "../helpers/supabase";

async function axePage(page: import("@playwright/test").Page, name: string, href: string) {
  const res = await page.goto(href, { waitUntil: "networkidle" });
  expect(res?.status(), name).toBeLessThan(400);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} × ${v.nodes[0]?.target.join(" ")}`);
  expect(summary, `${name}\n${summary.join("\n")}`).toEqual([]);
}

async function signIn(page: import("@playwright/test").Page, email: string, password: string, totp: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(/two-step/);
  await page.getByLabel("6-digit code").fill(await totpFresh(totp));
  await page.getByRole("button", { name: "Verify" }).click();
  await page.waitForURL((url) => !url.pathname.includes("two-step"));
}

const publicPages = [
  { name: "Homepage", href: "/" },
  { name: "Inventory", href: "/inventory" },
  { name: "Sign in", href: "/sign-in" },
  { name: "Reset password", href: "/sign-in/reset" },
  { name: "Forbidden", href: "/forbidden" },
];

for (const s of publicPages) {
  test(`${s.name} has no WCAG A/AA violations`, async ({ page }) => {
    await axePage(page, s.name, s.href);
  });
}

test("Administrator pages have no WCAG A/AA violations", async ({ page }) => {
  await signIn(page, TEST.admin.email, TEST.admin.password, TEST.admin.totp);
  await axePage(page, "Admin today", "/admin");
  await axePage(page, "Admin vehicles", "/admin/vehicles");
  await axePage(page, "Admin new vehicle", "/admin/vehicles/new");
  await axePage(page, "Admin staff", "/admin/staff");
  await axePage(page, "Admin media", "/admin/media");
  await axePage(page, "Admin website", "/admin/website");
  await axePage(page, "Admin vehicle", `/admin/vehicles/${TEST.vehicles.draft}`);
});

test("CEO pages have no WCAG A/AA violations", async ({ page }) => {
  await signIn(page, TEST.ceo.email, TEST.ceo.password, TEST.ceo.totp);
  await axePage(page, "CEO home", "/ceo");
  await axePage(page, "CEO approvals", "/ceo/approvals");
  await axePage(page, "CEO vehicles", "/ceo/vehicles");
  await axePage(page, "CEO staff", "/ceo/staff");
  await axePage(page, "CEO audit", "/ceo/audit");
  await axePage(page, "CEO website", "/ceo/website");
  await axePage(page, "CEO vehicle", `/ceo/vehicles/${TEST.vehicles.draft}`);
});

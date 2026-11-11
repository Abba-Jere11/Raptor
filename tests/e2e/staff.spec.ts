import { expect, test } from "@playwright/test";
import { TEST } from "../helpers/fixtures";
import { totpFresh } from "../helpers/supabase";

function uniqueVin() {
  return `ZFF67NFA2D0${String(Math.floor(100000 + Math.random() * 899999))}`;
}

async function signIn(page: import("@playwright/test").Page, email: string, password: string, totp?: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(/two-step/);
  if (totp) {
    await page.getByLabel("6-digit code").fill(await totpFresh(totp));
    await page.getByRole("button", { name: "Verify" }).click();
    await page.waitForURL((url) => !url.pathname.includes("two-step"));
  }
}

test("Administrator vehicle flow and CEO approval", async ({ page }) => {
  await signIn(page, TEST.admin.email, TEST.admin.password, TEST.admin.totp);
  await expect(page).toHaveURL(/\/admin/);
  await page.goto("/admin/vehicles/new");
  await page.getByLabel("VIN").fill(uniqueVin());
  await page.getByLabel("Year").fill("2014");
  await page.getByLabel("Make").fill("Ferrari");
  await page.getByLabel("Model").fill("458 Spider");
  await page.getByLabel("Price (USD)").fill("180000");
  await page.getByRole("button", { name: "Create draft" }).click();
  const stock = await page.locator("h1, [class*='font-display']").filter({ hasText: /RA-\d+/ }).first().textContent();
  await expect(page.getByText(/RA-\d+/).first()).toBeVisible();
  const vehicleUrl = page.url();
  const stockNumber = (stock ?? "").match(/RA-\d+/)?.[0];

  await page.getByRole("button", { name: "Submit for CEO approval" }).click();
  await expect(page.getByText("Submitted")).toBeVisible();
  await page.getByRole("button", { name: "Withdraw submission" }).click();
  await expect(page.getByText("Draft")).toBeVisible();
  await page.getByRole("button", { name: "Submit for CEO approval" }).click();
  await expect(page.getByText("Submitted")).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await signIn(page, TEST.ceo.email, TEST.ceo.password, TEST.ceo.totp);
  await page.goto("/ceo/approvals");
  const target = stockNumber
    ? page.locator("li").filter({ hasText: stockNumber })
    : page.locator("li").filter({ hasText: "458 Spider" }).first();
  await target.getByRole("button", { name: "Approve" }).click();
  if (stockNumber) {
    await expect(page.locator("li").filter({ hasText: stockNumber })).toHaveCount(0, { timeout: 15000 });
  } else {
    await expect(page.getByText(/Approved|Nothing waiting/)).toBeVisible({ timeout: 15000 });
  }

  await page.getByRole("button", { name: "Sign out" }).click();
  await signIn(page, TEST.admin.email, TEST.admin.password, TEST.admin.totp);
  await page.goto(vehicleUrl);
  await page.getByRole("button", { name: "Mark available" }).click();
  await expect(page.getByRole("button", { name: "Mark available" })).toHaveCount(0);
  await expect(page.getByText("Available", { exact: true })).toBeVisible();
});

test("CEO authorises staff and the Administrator sends the invite", async ({ page }) => {
  const email = `invite.${Date.now()}@raptors.test`;
  await signIn(page, TEST.ceo.email, TEST.ceo.password, TEST.ceo.totp);
  await page.goto("/ceo/staff");
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Role").selectOption("sales");
  await page.getByRole("button", { name: "Authorise" }).click();
  await expect(page.getByText(`Authorised ${email}`)).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await signIn(page, TEST.admin.email, TEST.admin.password, TEST.admin.totp);
  await page.goto("/admin/staff");
  await page.getByLabel("CEO authorisation").selectOption({ label: `${email} · Sales` });
  await page.getByLabel("Name").fill("Invited Sales");
  await page.getByRole("button", { name: "Create account and send invite" }).click();
  await expect(page.getByText(`Invite sent to ${email}`)).toBeVisible();
});

test("Administrator is blocked from the CEO portal; Sales is blocked from /admin", async ({ page }) => {
  await signIn(page, TEST.admin.email, TEST.admin.password, TEST.admin.totp);
  await page.goto("/ceo");
  await expect(page.getByText("You cannot open this page")).toBeVisible();

  await page.getByRole("button", { name: "Back to sign in" }).click();
  await signIn(page, TEST.sales.email, TEST.sales.password, TEST.sales.totp);
  await page.goto("/admin");
  await expect(page.getByText("You cannot open this page")).toBeVisible();
});

import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { TEST } from "../helpers/fixtures";
import { localSql, markSold } from "../helpers/local-sql";
import { anonClient, totpFresh } from "../helpers/supabase";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const uniqueVin = () => `ZFF67NFA2D0${String(Math.floor(100000 + Math.random() * 899999))}`;

async function apiSignIn(email: string, password: string, secret: string) {
  const supabase = anonClient();
  const signed = await supabase.auth.signInWithPassword({ email, password });
  if (signed.error || !signed.data.session) throw new Error(signed.error?.message ?? "sign-in failed");
  const factors = await supabase.auth.mfa.listFactors();
  const factorId = factors.data?.totp[0]?.id;
  if (!factorId) throw new Error("no two-step factor");
  const challenge = await supabase.auth.mfa.challenge({ factorId });
  if (challenge.error || !challenge.data) throw new Error(challenge.error?.message ?? "challenge failed");
  const code = await totpFresh(secret);
  const verified = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.data.id, code });
  if (verified.error) throw new Error(verified.error.message);
  return supabase;
}

async function publish(make: string, model: string) {
  const admin = await apiSignIn(TEST.admin.email, TEST.admin.password, TEST.admin.totp);
  const ceo = await apiSignIn(TEST.ceo.email, TEST.ceo.password, TEST.ceo.totp);
  const created = await admin
    .from("vehicles")
    .insert({
      vin: uniqueVin(),
      year: 2016,
      make,
      model,
      price_cents: 1500000,
      mileage: 1800,
      exterior: "Silver",
      title_status: "clean",
      location: "Miami, FL",
    })
    .select("id, slug")
    .single();
  if (created.error || !created.data) throw new Error(created.error?.message ?? "create failed");
  const submitted = await admin.from("vehicles").update({ status: "submitted" }).eq("id", created.data.id);
  if (submitted.error) throw new Error(submitted.error.message);
  const approved = await ceo.rpc("approve_vehicle", { p_id: created.data.id });
  if (approved.error) throw new Error(approved.error.message);
  const available = await admin.from("vehicles").update({ status: "available" }).eq("id", created.data.id);
  if (available.error) throw new Error(available.error.message);
  return created.data;
}

function seedPublicRows() {
  const soldId = randomUUID();
  const soldVin = `1SLD${String(Date.now()).padStart(13, "0").slice(-13)}`;
  localSql(`DELETE FROM vehicles WHERE make = 'Loadmore' AND model = 'Tester';
DELETE FROM vehicles WHERE make = 'Soldmarker' AND model = 'Record';
BEGIN;
INSERT INTO vehicles (id, vin, year, make, model, price_cents, mileage, exterior, location, title_status)
VALUES ('${soldId}', '${soldVin}', 2018, 'Soldmarker', 'Record', 8800000, 2200, 'Black', 'Dallas, TX', 'clean');
INSERT INTO vehicles (vin, year, make, model, price_cents, mileage, exterior, body, fuel, transmission, drivetrain, title_status, location, export_ready)
SELECT
  '1LDM' || lpad(g::text, 13, '0'),
  2019,
  'Loadmore',
  'Tester',
  2500000,
  1000 + g,
  'Silver',
  'Coupe',
  'Gasoline',
  'Automatic',
  'RWD',
  'clean',
  'Miami, FL',
  true
FROM generate_series(1, 25) g;
SELECT set_config('raptors.allow_consequential_edit', 'on', true);
UPDATE vehicles SET status = 'available' WHERE make IN ('Loadmore', 'Soldmarker') AND status = 'draft';
COMMIT;`);
  markSold(soldId);
  return soldId;
}

async function signIn(page: Page, email: string, password: string, totp: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(/two-step/);
  await page.getByLabel("6-digit code").fill(await totpFresh(totp));
  await page.getByRole("button", { name: "Verify" }).click();
  await page.waitForURL((url) => !url.pathname.includes("two-step"));
}

test("shared filters, load more, an empty list, a saved vehicle and a sold vehicle", async ({ page }) => {
  test.setTimeout(180_000);
  const make = `Bare${Date.now()}`;
  const bare = await publish(make, "NoPhoto");
  const soldId = seedPublicRows();
  const anon = anonClient();
  const sold = await anon.from("public_vehicles").select("slug").eq("id", soldId).single();
  expect(sold.data?.slug).toBeTruthy();

  await page.goto("/");
  await page.getByRole("link", { name: "Explore Collection" }).first().click();
  await expect(page).toHaveURL(/\/inventory$/);

  const search = page.getByRole("searchbox", { name: "Search the collection" });
  await search.fill(make);
  await search.press("Enter");
  await expect(page).toHaveURL(new RegExp(`q=${make}`));
  await expect(page.getByRole("heading", { name: `2016 ${make} NoPhoto` })).toBeVisible();
  await expect(page.getByText("Showing 1 of 1 vehicle", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: `Remove “${make}”` }).click();
  await expect(page).toHaveURL(/\/inventory$/);

  await page.goto("/inventory?make=Soldmarker");
  const soldCard = page.getByRole("article").filter({ hasText: "2018 Soldmarker Record" });
  await expect(soldCard.getByText("Sold", { exact: true }).first()).toBeVisible();
  await expect(soldCard).not.toContainText("$");

  const shared = `/inventory?make=${encodeURIComponent(make)}`;
  await page.goto(shared);
  await expect(page.getByRole("heading", { name: `2016 ${make} NoPhoto` })).toBeVisible();
  await page.getByRole("link", { name: `2016 ${make} NoPhoto` }).click();
  await expect(page.getByRole("heading", { level: 1, name: `2016 ${make} NoPhoto` })).toBeVisible();
  await expect(page.getByText("No photos yet.").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "360° view" })).toHaveCount(0);
  await expect(page.getByText("Where will you ship it?")).toBeVisible();
  await expect(page.getByText("We will confirm")).toBeVisible();
  await expect(page.getByRole("button", { name: "Get a quote" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Not ready? Send me the details" })).toBeVisible();
  const started = Date.now();
  await page.reload();
  console.log(`vehicle page reload ${Date.now() - started}ms`);
  await page.getByRole("button", { name: `Save 2016 ${make} NoPhoto` }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: `Remove 2016 ${make} NoPhoto from saved` })).toHaveAttribute("aria-pressed", "true");

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });

  await page.goto(`/inventory?make=${encodeURIComponent(make)}&colour=NoSuchColour`);
  await expect(page.getByText("Nothing matches these filters.")).toBeVisible();
  await page.getByRole("link", { name: "Clear all filters" }).click();
  await expect(page).toHaveURL(/\/inventory$/);

  await page.goto("/inventory?make=Loadmore");
  await expect(page.getByText("Showing 24 of")).toBeVisible();
  await page.getByRole("link", { name: "Load more" }).click();
  await expect(page).toHaveURL(/make=Loadmore/);
  await expect(page).toHaveURL(/limit=48/);
  const shown = Number((await page.getByText(/Showing \d+ of \d+/).innerText()).match(/Showing (\d+)/)?.[1]);
  expect(shown).toBeGreaterThan(24);
  const listAxe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const listSummary = listAxe.violations.map((item) => `${item.id}: ${item.nodes.map((node) => `${node.target.join(" ")} ${node.html}`).join(" | ")}`);
  expect(listSummary, listSummary.join("\n")).toEqual([]);

  const soldStarted = Date.now();
  await page.goto(`/inventory/${sold.data!.slug}`);
  console.log(`sold vehicle page ${Date.now() - soldStarted}ms`);
  await expect(page.getByRole("heading", { level: 1, name: "2018 Soldmarker Record" })).toBeVisible();
  await expect(page.getByText("This vehicle has been sold.")).toBeVisible();
  await expect(page.getByText("We will confirm")).toHaveCount(0);
  expect(await page.locator('script[type="application/ld+json"]').textContent()).toContain("SoldOut");

  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const summary = results.violations.map((item) => `${item.id}: ${item.nodes.map((node) => `${node.target.join(" ")} ${node.html}`).join(" | ")}`);
  expect(summary, summary.join("\n")).toEqual([]);
});

test("a published photo is public and a title file is not", async ({ page, request }) => {
  test.setTimeout(180_000);
  const stamp = Date.now();
  const make = `Photo${stamp}`;
  const dir = mkdtempSync(path.join(tmpdir(), "raptors-public-"));
  const photoName = `front-${stamp}.png`;
  const titleName = `title-${stamp}.png`;
  const photoPath = path.join(dir, photoName);
  const titlePath = path.join(dir, titleName);
  writeFileSync(photoPath, PNG);
  writeFileSync(titlePath, PNG);

  await signIn(page, TEST.admin.email, TEST.admin.password, TEST.admin.totp);
  await page.goto("/admin/vehicles/new");
  await page.getByLabel("VIN").fill(uniqueVin());
  await page.getByLabel("Year").fill("2015");
  await page.getByLabel("Make").fill(make);
  await page.getByLabel("Model").fill("Listed");
  await page.getByLabel("Price (USD)").fill("99000");
  await page.getByRole("button", { name: "Create draft" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("RA-");
  const vehicleUrl = page.url();

  await page.getByLabel("Add photos").setInputFiles(photoPath);
  await expect(page.getByText("1 photos ready")).toBeVisible({ timeout: 60_000 });
  const photoSrc = await page.getByRole("img", { name: photoName, exact: true }).getAttribute("src");
  expect(photoSrc).toBeTruthy();

  await page.getByLabel("Document type").selectOption("title");
  await page.getByLabel("Add document").setInputFiles(titlePath);
  const titleLink = page.getByRole("link", { name: `Open ${titleName}` });
  await expect(titleLink).toBeVisible({ timeout: 30_000 });
  const titleHref = await titleLink.getAttribute("href");
  expect(titleHref).toBeTruthy();

  expect((await request.get(photoSrc!)).status()).toBe(404);
  expect((await request.get(titleHref!)).status()).toBe(404);

  await page.getByRole("button", { name: "Submit for CEO approval" }).click();
  await expect(page.getByText("Submitted", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL(/sign-in/);

  await signIn(page, TEST.ceo.email, TEST.ceo.password, TEST.ceo.totp);
  await page.goto("/ceo/approvals");
  const card = page.getByRole("listitem").filter({ hasText: make });
  await card.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: make })).toHaveCount(0);
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL(/sign-in/);

  await signIn(page, TEST.admin.email, TEST.admin.password, TEST.admin.totp);
  await page.goto(vehicleUrl);
  await page.getByRole("button", { name: "Mark available" }).click();
  await expect(page.getByText("Available", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL(/sign-in/);

  const publishedPhoto = await request.get(photoSrc!);
  expect(publishedPhoto.status()).toBe(200);
  expect(publishedPhoto.headers()["content-type"]).toContain("image/webp");
  expect((await request.get(titleHref!)).status()).toBe(404);

  await page.goto(`/inventory?make=${encodeURIComponent(make)}`);
  const listingPhoto = page.getByRole("article").filter({ hasText: `2015 ${make} Listed` }).locator("img").first();
  await expect(listingPhoto).toBeVisible();
  const listingStyle = await listingPhoto.evaluate((node) => ({
    fit: getComputedStyle(node).objectFit,
    padding: getComputedStyle(node).padding,
    frame: getComputedStyle(node.parentElement!).backgroundColor,
  }));
  expect(listingStyle).toEqual({ fit: "cover", padding: "0px", frame: "rgba(0, 0, 0, 0)" });
  await page.getByRole("link", { name: `2015 ${make} Listed` }).click();
  const image = page.getByRole("img", { name: new RegExp(photoName) });
  await expect(image).toBeVisible();
  await expect.poll(async () => image.evaluate((node) => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  expect(await image.evaluate((node) => getComputedStyle(node).objectFit)).toBe("cover");
  await expect(page.getByRole("button", { name: "360° view" })).toHaveCount(0);
  await expect(page.getByText("Flaw:")).toHaveCount(0);
});

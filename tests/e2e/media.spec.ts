import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { TEST } from "../helpers/fixtures";
import { totpFresh } from "../helpers/supabase";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

function uniqueVin() {
  return `ZFF67NFA2D0${String(Math.floor(100000 + Math.random() * 899999))}`;
}

async function signIn(page: Page) {
  await page.goto("/sign-in");
  await page.getByLabel("Work email").fill(TEST.admin.email);
  await page.getByLabel("Password").fill(TEST.admin.password);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(/two-step/);
  await page.getByLabel("6-digit code").fill(await totpFresh(TEST.admin.totp));
  await page.getByRole("button", { name: "Verify" }).click();
  await page.waitForURL((url) => !url.pathname.includes("two-step"));
}

async function loadedWidths(page: Page) {
  const images = page.getByRole("list", { name: "Photo order" }).getByRole("img");
  await expect.poll(async () => images.evaluateAll((nodes) => nodes.every((node) => (node as HTMLImageElement).complete && (node as HTMLImageElement).naturalWidth > 0))).toBe(true);
  return images.evaluateAll((nodes) => nodes.map((node) => (node as HTMLImageElement).naturalWidth));
}

test("forty photos, a private document, and a failed upload that can be retried", async ({ page, request }) => {
  test.setTimeout(180_000);
  const stamp = Date.now();
  const dir = mkdtempSync(path.join(tmpdir(), "raptors-media-"));
  const photoPaths: string[] = [];
  for (let index = 1; index <= 40; index += 1) {
    const file = path.join(dir, `photo-${String(index).padStart(2, "0")}-${stamp}.png`);
    writeFileSync(file, PNG);
    photoPaths.push(file);
  }
  const badName = `bad-${stamp}.jpg`;
  const badPath = path.join(dir, badName);
  writeFileSync(badPath, Buffer.from("this is not a jpeg"));
  const titleName = `title-${stamp}.png`;
  const titlePath = path.join(dir, titleName);
  writeFileSync(titlePath, PNG);
  const replacement = path.join(dir, `fixed-${stamp}.png`);
  writeFileSync(replacement, PNG);

  await signIn(page);
  await page.goto("/admin/vehicles/new");
  await page.getByLabel("VIN").fill(uniqueVin());
  await page.getByLabel("Year").fill("2014");
  await page.getByLabel("Make").fill("Ferrari");
  await page.getByLabel("Model").fill("458 Spider");
  await page.getByLabel("Price (USD)").fill("120000");
  await page.getByRole("button", { name: "Create draft" }).click();
  await expect(page.getByText(/RA-\d+/).first()).toBeVisible();
  const vehicleUrl = page.url();

  await page.getByLabel("Add photos").setInputFiles(photoPaths);
  await expect(page.getByText("40 photos ready")).toBeVisible({ timeout: 150_000 });
  const list = page.getByRole("list", { name: "Photo order" });
  await expect(list.getByRole("img")).toHaveCount(40);
  const firstName = `photo-01-${stamp}.png`;
  const first = list.getByRole("listitem").filter({ has: page.getByRole("img", { name: firstName }) });
  await expect(first.getByText("Cover", { exact: true })).toBeVisible();

  const desktop = await loadedWidths(page);
  expect(desktop).toHaveLength(40);
  expect(desktop.every((width) => width > 0)).toBe(true);

  await page.setViewportSize({ width: 390, height: 844 });
  const phone = await loadedWidths(page);
  expect(phone).toHaveLength(40);
  const box = await list.getByRole("img", { name: firstName }).boundingBox();
  expect(box).toBeTruthy();
  expect(box!.width).toBeGreaterThan(40);
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);

  const flaw = page.getByLabel(`Flaw for ${firstName}`);
  await flaw.fill("Minor scuff, rear bumper");
  await flaw.blur();
  await expect(page.getByText("Flaw: Minor scuff, rear bumper")).toBeVisible();

  await page.getByLabel("Add photos").setInputFiles(badPath);
  await expect(page.getByRole("alert").filter({ hasText: "could not be read as an image" })).toBeVisible();
  await page.goto("/admin/media");
  await expect(page.getByRole("button", { name: `Retry ${badName}` })).toBeVisible();
  await page.getByLabel(`Replace ${badName}`).setInputFiles(replacement);
  await page.getByRole("button", { name: `Retry ${badName}` }).click();
  await expect(page.getByText("Image ready.")).toBeVisible({ timeout: 30_000 });

  await page.goto(vehicleUrl);
  await expect(page.getByRole("img", { name: `fixed-${stamp}.png` })).toBeVisible();
  await page.getByLabel("Document type").selectOption("title");
  await expect(page.getByLabel("Marking")).toBeDisabled();
  await page.getByLabel("Add document").setInputFiles(titlePath);
  const openTitle = page.getByRole("link", { name: `Open ${titleName}` });
  await expect(openTitle).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("listitem").filter({ hasText: titleName }).getByText("Internal", { exact: true })).toBeVisible();
  const href = await openTitle.getAttribute("href");
  expect(href).toBeTruthy();
  const anon = await request.get(href!);
  expect(anon.status()).toBe(404);
  const authed = await page.request.get(href!);
  expect(authed.status()).toBe(200);
  expect(authed.headers()["content-type"]).toContain("image/png");
});

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { TEST } from "../helpers/fixtures";
import { markSold } from "../helpers/local-sql";
import { anonClient, totpFresh } from "../helpers/supabase";

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
  const verified = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.data.id, code: await totpFresh(secret) });
  if (verified.error) throw new Error(verified.error.message);
  return supabase;
}

async function axe(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const summary = results.violations.map((item) => `${item.id}: ${item.nodes.map((node) => node.target.join(" ")).join(" | ")}`);
  expect(summary, summary.join("\n")).toEqual([]);
}

test("homepage, a published guide, featured approval, sold privacy and the phone header", async ({ page }) => {
  test.setTimeout(180_000);
  const admin = await apiSignIn(TEST.admin.email, TEST.admin.password, TEST.admin.totp);
  const ceo = await apiSignIn(TEST.ceo.email, TEST.ceo.password, TEST.ceo.totp);
  const stamp = Date.now();
  const make = `Home${stamp}`;
  const guideSlug = `buyer-notes-${stamp}`;
  const deliveryTitle = `Delivery marker ${stamp}`;

  await page.goto("/guides");
  await expect(page.getByText("How to import a vehicle to Ghana")).toHaveCount(0);
  await expect(page.getByText("No guides are published.")).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Request a vehicle" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Track your vehicle" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Chat on WhatsApp" })).toHaveCount(0);
  const standIns = await page.getByRole("img", { name: "Stand-in image. This is not a vehicle in stock." }).count();
  expect(standIns).toBeGreaterThan(0);
  await expect(page.getByText("STAND-IN", { exact: true })).toHaveCount(standIns);
  await expect(page.getByText("Manheim", { exact: true })).toBeVisible();
  await expect(page.getByText("OpenLane", { exact: true })).toBeVisible();
  await expect(page.getByText("[Licence no.]")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Explore Collection" }).first()).toBeVisible();

  const created = await admin
    .from("vehicles")
    .insert({ vin: uniqueVin(), year: 2017, make, model: "Featured", price_cents: 4100000, mileage: 8000, location: "Austin, TX" })
    .select("id")
    .single();
  expect(created.error).toBeNull();
  const vehicleId = created.data!.id;
  expect((await admin.from("vehicles").update({ status: "submitted" }).eq("id", vehicleId)).error).toBeNull();
  expect((await ceo.rpc("approve_vehicle", { p_id: vehicleId })).error).toBeNull();
  expect((await admin.from("vehicles").update({ status: "available" }).eq("id", vehicleId)).error).toBeNull();
  expect((await admin.rpc("propose_featured", { p_vehicle_id: vehicleId })).error).toBeNull();
  await page.goto("/");
  await expect(page.getByRole("link", { name: `Featured vehicle, 2017 ${make} Featured` })).toHaveCount(0);

  const featuredRequest = await ceo.from("approval_requests").select("id").eq("type", "featured_selection").eq("vehicle_id", vehicleId).eq("status", "pending").single();
  expect((await ceo.rpc("approve_featured", { p_id: featuredRequest.data!.id })).error).toBeNull();
  await page.goto("/");
  await expect(page.getByRole("link", { name: `Featured vehicle, 2017 ${make} Featured` })).toBeVisible();
  await expect(page.getByRole("link", { name: `Get a quote, 2017 ${make} Featured` })).toBeVisible();
  await expect(page.getByRole("link", { name: `View vehicle, 2017 ${make} Featured` })).toBeVisible();

  const hidden = await admin
    .from("vehicles")
    .insert({ vin: uniqueVin(), year: 2013, make, model: "Declined", price_cents: 1800000, mileage: 30000, location: "Dallas, TX" })
    .select("id")
    .single();
  expect((await admin.from("vehicles").update({ status: "submitted" }).eq("id", hidden.data!.id)).error).toBeNull();
  expect((await ceo.rpc("approve_vehicle", { p_id: hidden.data!.id })).error).toBeNull();
  expect((await admin.from("vehicles").update({ status: "available" }).eq("id", hidden.data!.id)).error).toBeNull();
  expect((await admin.rpc("propose_featured", { p_vehicle_id: hidden.data!.id })).error).toBeNull();
  const hiddenRequest = await ceo.from("approval_requests").select("id").eq("type", "featured_selection").eq("vehicle_id", hidden.data!.id).eq("status", "pending").single();
  expect((await ceo.rpc("decline_approval", { p_id: hiddenRequest.data!.id, p_reason: "Not this one." })).error).toBeNull();
  await page.goto("/");
  await expect(page.getByRole("link", { name: `Featured vehicle, 2013 ${make} Declined` })).toHaveCount(0);

  const sold = await admin
    .from("vehicles")
    .insert({ vin: uniqueVin(), year: 2027, make, model: "Soldcard", price_cents: 2200000, mileage: 20000, location: "Houston, TX" })
    .select("id")
    .single();
  expect((await admin.from("vehicles").update({ status: "submitted" }).eq("id", sold.data!.id)).error).toBeNull();
  expect((await ceo.rpc("approve_vehicle", { p_id: sold.data!.id })).error).toBeNull();
  expect((await admin.from("vehicles").update({ status: "available" }).eq("id", sold.data!.id)).error).toBeNull();
  markSold(sold.data!.id);
  await page.goto("/");
  const soldColumn = page.locator("section").filter({ has: page.getByRole("heading", { name: "Recently sold" }) });
  await expect(soldColumn.getByText(`2027 ${make} Soldcard`)).toBeVisible();
  await expect(soldColumn.getByText("Sold", { exact: true }).first()).toBeVisible();
  await expect(soldColumn).not.toContainText("$");
  await expect(soldColumn).not.toContainText("VIN");

  expect((await admin.rpc("propose_delivery", { p_title: deliveryTitle, p_place: "Tema" })).error).toBeNull();
  await page.goto("/");
  await expect(page.getByText(deliveryTitle)).toHaveCount(0);
  const deliveryRequest = await ceo.from("approval_requests").select("id").eq("type", "delivery_entry").eq("status", "pending").order("requested_at", { ascending: false }).limit(1).single();
  expect((await ceo.rpc("approve_delivery", { p_id: deliveryRequest.data!.id })).error).toBeNull();
  await page.goto("/");
  const deliveries = page.locator("section").filter({ has: page.getByRole("heading", { name: "Deliveries" }) });
  await expect(deliveries.getByText(deliveryTitle)).toBeVisible();
  await expect(deliveries.getByText("Tema")).toBeVisible();
  await expect(deliveries).not.toContainText("$");

  expect(
    (
      await admin.from("guides").insert({
        slug: guideSlug,
        title: `Buyer notes ${stamp}`,
        excerpt: "A short note.",
        body: "General notes for buyers.",
        confirmed_on: "2026-11-01",
        status: "draft",
      })
    ).error,
  ).toBeNull();
  await page.goto("/guides");
  await expect(page.getByText(`Buyer notes ${stamp}`)).toHaveCount(0);
  const guide = await admin.from("guides").select("id").eq("slug", guideSlug).single();
  expect((await ceo.from("guides").update({ status: "published" }).eq("id", guide.data!.id)).error).toBeNull();
  await page.goto(`/guides/${guideSlug}`);
  await expect(page.getByRole("heading", { name: `Buyer notes ${stamp}` })).toBeVisible();
  await expect(page.getByText(/Last confirmed/)).toBeVisible();
  await expect(page.getByText("does not state a country")).toBeVisible();
  expect(await page.locator('script[type="application/ld+json"]').textContent()).toContain("Article");
  await axe(page);
  await page.goto("/");
  await expect(page.getByRole("link", { name: `Buyer notes ${stamp}` })).toBeVisible();

  await page.goto("/inventory");
  await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Collection", exact: true })).toHaveAttribute("aria-current", "page");
  await page.goto("/");
  await axe(page);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("navigation", { name: "Mobile" }).getByRole("link", { name: "Collection", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await expect(page.getByRole("link", { name: "Request a vehicle" })).toHaveCount(0);
  await axe(page);

  const delivery = await admin.from("delivery_entries").select("id").eq("title", deliveryTitle).single();
  expect((await ceo.rpc("withdraw_delivery", { p_id: delivery.data!.id })).error).toBeNull();
  expect((await ceo.rpc("withdraw_featured", { p_id: (await admin.from("featured_selections").select("id").eq("vehicle_id", vehicleId).single()).data!.id })).error).toBeNull();
  expect((await ceo.from("guides").update({ status: "draft" }).eq("id", guide.data!.id)).error).toBeNull();
  expect((await admin.from("guides").delete().eq("id", guide.data!.id)).error).toBeNull();
});

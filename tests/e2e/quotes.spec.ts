import { expect, test, type Page } from "@playwright/test";
import { TEST } from "../helpers/fixtures";
import { anonClient, totpFresh } from "../helpers/supabase";

const MAILPIT = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";
const uniqueVin = () => `ZFF67NFA2E${String(Math.floor(1000000 + Math.random() * 8999999))}`;

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

async function mailpitMessages() {
  const res = await fetch(`${MAILPIT}/api/v1/messages`);
  if (!res.ok) throw new Error(`Mailpit answered ${res.status}`);
  return (await res.json()) as { messages: Array<{ ID: string; Subject: string; To: Array<{ Address: string }>; Snippet: string }> };
}

async function waitForMail(predicate: (m: { Subject: string; To: Array<{ Address: string }>; Snippet: string }) => boolean, timeoutMs = 20_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { messages } = await mailpitMessages();
    const hit = messages.find(predicate);
    if (hit) return hit;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("Mailpit never received the expected message");
}

test("quote request becomes an enquiry, then a sent quotation with a Mailpit email", async ({ page }) => {
  test.setTimeout(240_000);
  const stamp = Date.now();
  const buyerEmail = `buyer.${stamp}@example.com`;
  const port = `TemaE2E${stamp}`;

  const admin = await apiSignIn(TEST.admin.email, TEST.admin.password, TEST.admin.totp);
  const ceo = await apiSignIn(TEST.ceo.email, TEST.ceo.password, TEST.ceo.totp);

  for (const key of ["enquiry_received", "quotation_sent", "staff_new_enquiry"] as const) {
    const latest = await ceo.from("email_templates").select("*").eq("key", key).order("version", { ascending: false }).limit(1).maybeSingle();
    expect(latest.error).toBeNull();
    if (latest.data?.status !== "approved") {
      expect((await ceo.from("email_templates").update({ status: "approved" }).eq("id", latest.data!.id)).error).toBeNull();
    }
  }

  const destination = await ceo
    .from("destinations")
    .insert({ country: "Ghana", port, status: "open", notes: "MOCK DATA e2e" })
    .select("id")
    .single();
  expect(destination.error).toBeNull();

  const created = await admin
    .from("vehicles")
    .insert({
      vin: uniqueVin(),
      year: 2018,
      make: `QuoteE2E${stamp}`,
      model: "Spider",
      price_cents: 88_000_00,
      mileage: 9400,
      location: "Miami, FL",
      title_status: "clean",
      description: "MOCK DATA vehicle for the quotation browser check.\n\nSecond paragraph.",
      features: ["Carbon seats", "Front lift"],
    })
    .select("id, slug")
    .single();
  expect(created.error).toBeNull();
  expect((await admin.from("vehicles").update({ status: "submitted" }).eq("id", created.data!.id)).error).toBeNull();
  expect((await ceo.rpc("approve_vehicle", { p_id: created.data!.id })).error).toBeNull();
  expect((await admin.from("vehicles").update({ status: "available" }).eq("id", created.data!.id)).error).toBeNull();

  await page.goto(`/inventory/${created.data!.slug}`);
  await expect(page.getByRole("heading", { name: "Overview." })).toBeVisible();
  await expect(page.getByText("Carbon seats")).toBeVisible();
  await page.getByRole("button", { name: "Get a quote" }).first().click();
  const drawer = page.getByRole("dialog", { name: "Get a quote" });
  await expect(drawer).toBeVisible();
  // Form start timestamp is set on mount; wait past the bot minimum fill time.
  await page.waitForTimeout(2_600);
  await drawer.getByRole("textbox", { name: "Your name" }).fill("Sample Buyer");
  await drawer.getByRole("textbox", { name: "Email" }).fill(buyerEmail);
  await drawer.getByLabel("Where is it going?").selectOption(destination.data!.id);
  await drawer.getByRole("button", { name: "Request a quotation" }).click();
  await expect(drawer.getByText("Your request is with us.")).toBeVisible({ timeout: 20_000 });
  const reference = await drawer.locator(".font-mono").first().textContent();
  expect(reference).toMatch(/^ENQ-\d{4}-\d{4}$/);

  await waitForMail((m) => m.To.some((t) => t.Address === buyerEmail) && /request|enquiry|quotation/i.test(m.Subject));

  await signIn(page, TEST.ceo.email, TEST.ceo.password, TEST.ceo.totp);
  await page.goto("/ceo/enquiries");
  await expect(page.getByText(reference!)).toBeVisible();
  await page.getByRole("link", { name: /Sample Buyer/ }).first().click();
  await expect(page.getByText(reference!)).toBeVisible();
  await page.getByLabel("Ship to").selectOption(destination.data!.id);
  await page.getByRole("button", { name: "Prepare quotation" }).click();
  await page.waitForURL(/\/ceo\/quotes\/[0-9a-f-]+/);

  const details = page.locator("form").filter({ hasText: "Saving never sends anything." });
  await details.getByLabel("Shipping method").selectOption("container");
  await details.getByRole("button", { name: "Save" }).click();
  // revalidatePath refreshes the page, so the action toast may disappear; the method staying selected is enough.
  await expect(details.getByLabel("Shipping method")).toHaveValue("container", { timeout: 20_000 });
  await expect(page.getByText("Ready to preview.")).toBeVisible();

  const beforeSend = await mailpitMessages();
  const countBefore = beforeSend.messages.filter((m) => m.To.some((t) => t.Address === buyerEmail)).length;

  await page.getByRole("button", { name: "Preview" }).click();
  await expect(page.getByRole("heading", { name: "PDF preview" })).toBeVisible({ timeout: 45_000 });
  await page.getByRole("button", { name: "Send to customer" }).click();
  await page.getByRole("button", { name: "Confirm and send" }).click();
  await expect(page.getByText(/Quotation Q-\d{4}-\d{4} sent to|is issued, but the email/i)).toBeVisible({ timeout: 90_000 });

  await waitForMail(
    (m) => m.To.some((t) => t.Address === buyerEmail) && /quotation|Q-\d{4}-\d{4}/i.test(`${m.Subject} ${m.Snippet}`),
  );
  const afterSend = await mailpitMessages();
  expect(afterSend.messages.filter((m) => m.To.some((t) => t.Address === buyerEmail)).length).toBeGreaterThan(countBefore);

  await expect(page.getByText(/Q-\d{4}-\d{4}/).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Issued", exact: true })).toBeVisible();
});

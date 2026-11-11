import { describe, expect, it } from "vitest";
import { TEST } from "../helpers/fixtures";
import { localSql } from "../helpers/local-sql";
import { anonClient, serviceClient, signInAal2 } from "../helpers/supabase";

const stamp = () => Date.now().toString(36);
const uniqueVin = () => `ZFF67NFA2D${String(Math.floor(1000000 + Math.random() * 8999999))}`;

async function publishAvailableVehicle() {
  const admin = await signInAal2(TEST.admin.email, TEST.admin.password, TEST.admin.totp);
  const ceo = await signInAal2(TEST.ceo.email, TEST.ceo.password, TEST.ceo.totp);
  const created = await admin
    .from("vehicles")
    .insert({
      vin: uniqueVin(),
      year: 2019,
      make: "QuoteMake",
      model: "QuoteModel",
      price_cents: 42_500_00,
      mileage: 12000,
      location: "Miami, FL",
      title_status: "clean",
      is_mock: false,
    })
    .select("id")
    .single();
  expect(created.error).toBeNull();
  expect((await admin.from("vehicles").update({ status: "submitted" }).eq("id", created.data!.id)).error).toBeNull();
  expect((await ceo.rpc("approve_vehicle", { p_id: created.data!.id })).error).toBeNull();
  expect((await admin.from("vehicles").update({ status: "available" }).eq("id", created.data!.id)).error).toBeNull();
  return created.data!.id as string;
}

async function ensureDestination(ceo: Awaited<ReturnType<typeof signInAal2>>, country: string, port: string, status: "open" | "confirm_each_time" | "not_served" = "open") {
  const existing = await ceo.from("destinations").select("*").eq("country", country).eq("port", port).maybeSingle();
  if (existing.data) {
    if (existing.data.status !== status) {
      const updated = await ceo.from("destinations").update({ status }).eq("id", existing.data.id);
      expect(updated.error).toBeNull();
    }
    return existing.data.id as string;
  }
  const created = await ceo
    .from("destinations")
    .insert({ country, port, status, notes: "MOCK DATA test port" })
    .select("id")
    .single();
  expect(created.error).toBeNull();
  return created.data!.id;
}

async function openEnquiry(vehicleId: string, destinationId: string | null, email: string) {
  const admin = serviceClient();
  const { data, error } = await admin.rpc("submit_enquiry", {
    p_kind: "quote_request",
    p_name: "Sample Buyer",
    p_email: email,
    p_whatsapp: null,
    p_preferred: "email",
    p_vehicle_id: vehicleId,
    p_destination_id: destinationId,
    p_destination_other: destinationId ? null : "Tema",
    p_message: "MOCK DATA quotation test",
    p_source_path: "/inventory/test",
    p_rate_key: `test:${stamp()}`,
  });
  expect(error).toBeNull();
  const row = Array.isArray(data) ? data[0] : data;
  expect(row?.enquiry_id).toBeTruthy();
  return row as { enquiry_id: string; reference: string };
}

describe("enquiries and quotations", () => {
  it("anonymous visitors cannot read customer tables or call submit_enquiry", async () => {
    const db = anonClient();
    for (const table of ["customers", "enquiries", "quotes", "quote_lines", "email_templates", "notification_log", "destinations"] as const) {
      const { data, error } = await db.from(table).select("id");
      expect(data ?? [], table).toEqual([]);
      expect(error, table).toBeTruthy();
    }
    const { error } = await db.rpc("submit_enquiry", {
      p_kind: "enquiry",
      p_name: "Anon",
      p_email: "anon@example.com",
      p_whatsapp: null,
      p_preferred: "email",
      p_vehicle_id: null,
      p_destination_id: null,
      p_destination_other: null,
      p_message: "hello",
      p_source_path: "/contact",
      p_rate_key: "anon-test",
    });
    expect(error).toBeTruthy();
  });

  it("the Administrator cannot read customers, enquiries, quotes or quotation discounts", async () => {
    const db = await signInAal2(TEST.admin.email, TEST.admin.password, TEST.admin.totp);
    for (const table of ["customers", "enquiries", "quotes", "quote_lines", "notification_log"] as const) {
      const { data } = await db.from(table).select("id");
      expect(data ?? [], table).toEqual([]);
    }
    const { data: discounts } = await db.from("approval_requests").select("id, type").eq("type", "quote_discount");
    expect(discounts ?? []).toEqual([]);
    const { error } = await db.rpc("create_quote", { p_enquiry_id: "00000000-0000-0000-0000-000000000001", p_destination_id: null });
    expect(error).toBeTruthy();
  });

  it("saving a draft never writes a notification, and send needs a matching preview", async () => {
    const ceo = await signInAal2(TEST.ceo.email, TEST.ceo.password, TEST.ceo.totp);
    const vehicleId = await publishAvailableVehicle();
    const destinationId = await ensureDestination(ceo, "Ghana", `Tema-${stamp()}`, "open");
    const enquiry = await openEnquiry(vehicleId, destinationId, `buyer.${stamp()}@example.com`);

    const created = await ceo.rpc("create_quote", { p_enquiry_id: enquiry.enquiry_id, p_destination_id: destinationId });
    expect(created.error).toBeNull();
    const quoteId = created.data!.id as string;

    const before = await ceo.from("notification_log").select("id").eq("quote_id", quoteId);
    expect(before.data ?? []).toEqual([]);

    const saved = await ceo
      .from("quotes")
      .update({ customer_note: "MOCK DATA note", shipping_method: "container" })
      .eq("id", quoteId)
      .select("status, revision")
      .single();
    expect(saved.error).toBeNull();
    expect(saved.data?.status).toBe("draft");

    const afterSave = await ceo.from("notification_log").select("id").eq("quote_id", quoteId);
    expect(afterSave.data ?? []).toEqual([]);

    const sendTooSoon = await ceo.rpc("send_quote", { p_id: quoteId });
    expect(sendTooSoon.error?.message).toMatch(/preview/i);

    const preview = await ceo.rpc("preview_quote", { p_id: quoteId });
    expect(preview.error).toBeNull();
    expect(preview.data?.status).toBe("previewed");

    const editAfterPreview = await ceo.from("quotes").update({ customer_note: "Changed after preview" }).eq("id", quoteId).select("status").single();
    expect(editAfterPreview.error).toBeNull();
    expect(editAfterPreview.data?.status).toBe("draft");

    const sendStale = await ceo.rpc("send_quote", { p_id: quoteId });
    expect(sendStale.error?.message).toMatch(/preview/i);

    expect((await ceo.rpc("preview_quote", { p_id: quoteId })).error).toBeNull();
    const sent = await ceo.rpc("send_quote", { p_id: quoteId });
    expect(sent.error).toBeNull();
    expect(sent.data?.status).toBe("sent");
    expect(sent.data?.number).toMatch(/^Q-\d{4}-\d{4}$/);

    const immutable = await ceo.from("quotes").update({ customer_note: "tamper" }).eq("id", quoteId).select("id");
    expect(immutable.error).toBeTruthy();
    const lineWrite = await ceo.from("quote_lines").insert({
      quote_id: quoteId,
      kind: "other",
      label: "Tamper",
      amount_cents: 1,
      position: 99,
    });
    expect(lineWrite.error).toBeTruthy();
  });

  it("confirm-each-time destinations need the tick, and discounts need CEO approval for Sales", async () => {
    const ceo = await signInAal2(TEST.ceo.email, TEST.ceo.password, TEST.ceo.totp);
    const sales = await signInAal2(TEST.sales.email, TEST.sales.password, TEST.sales.totp);
    const vehicleId = await publishAvailableVehicle();
    const destinationId = await ensureDestination(ceo, "Nigeria", `Lagos-${stamp()}`, "confirm_each_time");
    const enquiry = await openEnquiry(vehicleId, destinationId, `sales.${stamp()}@example.com`);

    const created = await sales.rpc("create_quote", { p_enquiry_id: enquiry.enquiry_id, p_destination_id: destinationId });
    expect(created.error).toBeNull();
    const quoteId = created.data!.id as string;

    const problems = await sales.rpc("quote_problems", { p_id: quoteId });
    expect(problems.error).toBeNull();
    expect((problems.data ?? []).map((r: { reason: string }) => r.reason)).toEqual(
      expect.arrayContaining([expect.stringMatching(/Confirm this destination/i)]),
    );

    expect(
      (
        await sales
          .from("quotes")
          .update({ destination_confirmed_at: new Date().toISOString() })
          .eq("id", quoteId)
      ).error,
    ).toBeNull();

    expect(
      (
        await sales.from("quote_lines").insert({
          quote_id: quoteId,
          kind: "discount",
          label: "Courtesy",
          amount_cents: 250_000,
          position: 5,
        })
      ).error,
    ).toBeNull();

    localSql(`UPDATE site_settings SET quote_discount_limit_cents = 10000 WHERE singleton;`);

    const needsApproval = await sales.rpc("quote_problems", { p_id: quoteId });
    expect((needsApproval.data ?? []).map((r: { reason: string }) => r.reason)).toEqual(
      expect.arrayContaining([expect.stringMatching(/CEO approval/i)]),
    );

    const request = await sales.rpc("request_quote_discount", { p_quote_id: quoteId });
    expect(request.error).toBeNull();
    expect(request.data?.type).toBe("quote_discount");

    const admin = await signInAal2(TEST.admin.email, TEST.admin.password, TEST.admin.totp);
    const { data: adminSees } = await admin.from("approval_requests").select("id").eq("id", request.data!.id);
    expect(adminSees ?? []).toEqual([]);

    const approved = await ceo.rpc("approve_quote_discount", { p_id: request.data!.id });
    expect(approved.error).toBeNull();
    expect(approved.data?.status).toBe("approved");

    const clear = await sales.rpc("quote_problems", { p_id: quoteId });
    expect((clear.data ?? []).map((r: { reason: string }) => r.reason).join(" ")).not.toMatch(/CEO approval/i);
    localSql(`UPDATE site_settings SET quote_discount_limit_cents = NULL WHERE singleton;`);
  });

  it("only the CEO can approve an email template, and approved wording cannot be edited", async () => {
    const ceo = await signInAal2(TEST.ceo.email, TEST.ceo.password, TEST.ceo.totp);
    const sales = await signInAal2(TEST.sales.email, TEST.sales.password, TEST.sales.totp);
    const key = "enquiry_received";
    const { data: latest } = await ceo.from("email_templates").select("*").eq("key", key).order("version", { ascending: false }).limit(1).maybeSingle();
    expect(latest).toBeTruthy();

    if (latest!.status === "approved") {
      const draft = await ceo.from("email_templates").insert({
        key,
        audience: latest!.audience,
        name: latest!.name,
        subject: `${latest!.subject} (test draft)`,
        eyebrow: latest!.eyebrow,
        heading: latest!.heading,
        body: latest!.body,
        button_label: latest!.button_label,
      }).select("*").single();
      expect(draft.error).toBeNull();
      const salesEdit = await sales.from("email_templates").update({ subject: "Hacked" }).eq("id", draft.data!.id).select("id");
      expect(salesEdit.data ?? []).toEqual([]);
      const approved = await ceo.from("email_templates").update({ status: "approved" }).eq("id", draft.data!.id).select("status, approved_by").single();
      expect(approved.error).toBeNull();
      expect(approved.data?.status).toBe("approved");
      expect(approved.data?.approved_by).toBe(TEST.ceo.id);
      const rewrite = await ceo.from("email_templates").update({ subject: "No" }).eq("id", draft.data!.id);
      expect(rewrite.error).toBeTruthy();
    } else {
      const salesEdit = await sales.from("email_templates").update({ subject: "Hacked" }).eq("id", latest!.id).select("id");
      expect(salesEdit.data ?? []).toEqual([]);
      const approved = await ceo.from("email_templates").update({ status: "approved" }).eq("id", latest!.id).select("status").single();
      expect(approved.error).toBeNull();
      expect(approved.data?.status).toBe("approved");
      const rewrite = await ceo.from("email_templates").update({ subject: "No" }).eq("id", latest!.id);
      expect(rewrite.error).toBeTruthy();
    }
  });

  it("Administrator destination inserts stay Confirm each time; only the CEO can open a port", async () => {
    const admin = await signInAal2(TEST.admin.email, TEST.admin.password, TEST.admin.totp);
    const ceo = await signInAal2(TEST.ceo.email, TEST.ceo.password, TEST.ceo.totp);
    const port = `Port-${stamp()}`;
    const created = await admin
      .from("destinations")
      .insert({ country: "Ghana", port, status: "open", notes: "MOCK DATA" })
      .select("id, status")
      .single();
    // Guard forces Confirm each time for Administrator inserts that try Open.
    if (created.error) {
      const forced = await admin
        .from("destinations")
        .insert({ country: "Ghana", port, status: "confirm_each_time", notes: "MOCK DATA" })
        .select("id, status")
        .single();
      expect(forced.error).toBeNull();
      expect(forced.data?.status).toBe("confirm_each_time");
      const open = await admin.from("destinations").update({ status: "open" }).eq("id", forced.data!.id);
      expect(open.error).toBeTruthy();
      const byCeo = await ceo.from("destinations").update({ status: "open" }).eq("id", forced.data!.id).select("status").single();
      expect(byCeo.error).toBeNull();
      expect(byCeo.data?.status).toBe("open");
    } else {
      expect(created.data?.status).toBe("confirm_each_time");
    }
  });
});

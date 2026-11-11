import { describe, expect, it } from "vitest";
import { HONEYPOT_FIELD, STARTED_FIELD, botReason, parseEnquiry } from "@/lib/enquiries";
import { escapeHtml, mergeText, renderEmail } from "@/lib/email/render";
import { formatMoney } from "@/lib/format";
import { renderQuotationPdf } from "@/lib/pdf/QuotationPdf";
import type { QuoteDocument } from "@/lib/quotes";
import { parseDollars, quoteTotals, responseTimer } from "@/lib/quotes";

describe("quoteTotals", () => {
  it("adds payable lines, subtracts discounts, and leaves local charges out of the total", () => {
    const totals = quoteTotals(
      [
        { kind: "vehicle", amount_cents: 100_000_00 },
        { kind: "ocean_freight", amount_cents: 2_500_00 },
        { kind: "discount", amount_cents: 500_00 },
      ],
      [{ estimate_cents: 3_000_00 }, { estimate_cents: null }],
    );
    expect(totals).toEqual({
      subtotalCents: 102_500_00,
      discountCents: 500_00,
      totalCents: 102_000_00,
      localEstimateCents: 3_000_00,
    });
  });
});

describe("money and document helpers", () => {
  it("parses typed dollars into integer cents", () => {
    expect(parseDollars("4,200")).toBe(420_000);
    expect(parseDollars("4200.50")).toBe(420_050);
    expect(parseDollars("$1,250.5")).toBe(125_050);
    expect(parseDollars("12.345")).toBeNull();
    expect(parseDollars("-10")).toBeNull();
    expect(parseDollars("")).toBeNull();
  });

  it("formats money without inventing cents unless asked", () => {
    expect(formatMoney({ cents: 199_900_00, currency: "USD" })).toBe("$199,900");
    expect(formatMoney({ cents: 199_900_50, currency: "USD" }, { cents: true })).toBe("$199,900.50");
  });

  it("describes the response timer honestly", () => {
    const created = "2026-11-10T10:00:00.000Z";
    expect(responseTimer(created, null, Date.parse("2026-11-10T13:00:00.000Z"))).toEqual({ label: "Waiting 3 h", late: false });
    expect(responseTimer(created, null, Date.parse("2026-11-11T12:00:00.000Z")).late).toBe(true);
    expect(responseTimer(created, "2026-11-10T10:40:00.000Z", Date.now())).toEqual({ label: "Answered in 40 min", late: false });
  });
});

describe("email merge", () => {
  it("escapes HTML and reports missing merge fields", () => {
    expect(escapeHtml(`A <b> & "c"`)).toBe("A &lt;b&gt; &amp; &quot;c&quot;");
    const missing = new Set<string>();
    expect(mergeText("Hello {{customer_name}} {{unknown}}", { customer_name: "<Sam>" }, missing)).toBe("Hello <Sam> ");
    expect([...missing]).toEqual(["unknown"]);
  });

  it("renders a branded email without executing the sample values as markup", () => {
    const rendered = renderEmail(
      {
        subject: "Quote {{quote_number}} for {{customer_name}}",
        eyebrow: "Quotation",
        heading: "Your quotation",
        body: "Total {{quote_total}}.\n\n<script>alert(1)</script>",
        button_label: null,
      },
      { quote_number: "Q-2026-0001", customer_name: "<Sam>", quote_total: "$1" },
      { siteUrl: "http://localhost:3000", footer: "Raptors Auto Group" },
    );
    expect(rendered.subject).toBe("Quote Q-2026-0001 for <Sam>");
    expect(rendered.html).toContain("&lt;Sam&gt;");
    expect(rendered.html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(rendered.html).not.toContain("<script>alert(1)</script>");
    expect(rendered.text).toContain("Total $1.");
  });
});

describe("enquiry form guards", () => {
  it("rejects honeypot, missing start and too-fast fills", () => {
    const now = 1_000_000;
    expect(botReason(new FormData(), now)).toBe("no-start");
    const filled = new FormData();
    filled.set(HONEYPOT_FIELD, "http://spam");
    filled.set(STARTED_FIELD, String(now - 5_000));
    expect(botReason(filled, now)).toBe("honeypot");
    const fast = new FormData();
    fast.set(STARTED_FIELD, String(now - 500));
    expect(botReason(fast, now)).toBe("too-fast");
    const ok = new FormData();
    ok.set(STARTED_FIELD, String(now - 5_000));
    expect(botReason(ok, now)).toBeNull();
  });

  it("requires a destination for a quote request and a message for a general enquiry", () => {
    const base = new FormData();
    base.set("kind", "quote_request");
    base.set("name", "Sam Buyer");
    base.set("email", "sam@example.com");
    base.set("preferred", "email");
    base.set("vehicle_id", "b0000000-0000-0000-0000-000000000004");
    expect(parseEnquiry(base)).toMatchObject({ error: expect.stringMatching(/country and port/i), field: "destination" });
    base.set("destination_other", "Tema, Ghana");
    expect(parseEnquiry(base)).toMatchObject({ data: { kind: "quote_request", destinationOther: "Tema, Ghana" } });

    const enquiry = new FormData();
    enquiry.set("kind", "enquiry");
    enquiry.set("name", "Sam");
    enquiry.set("email", "sam@example.com");
    expect(parseEnquiry(enquiry)).toMatchObject({ error: expect.stringMatching(/how we can help/i), field: "message" });
  });
});

describe("quotation PDF", () => {
  it("renders a draft PDF buffer", async () => {
    const doc: QuoteDocument = {
      quote: {
        id: "q0000000-0000-0000-0000-000000000001",
        number: null,
        enquiry_id: null,
        customer_id: "c",
        vehicle_id: "v",
        destination_id: "d",
        shipping_method: "container",
        destination_confirmed_by: null,
        destination_confirmed_at: null,
        valid_until: "2026-11-24",
        not_included: "Import duty.",
        customer_note: null,
        status: "draft",
        revision: 1,
        previewed_revision: null,
        supersedes_id: null,
        prepared_by: null,
        sent_at: null,
        sent_by: null,
        sent_to: null,
        pdf_path: null,
        accepted_on: null,
        accepted_by: null,
        acceptance_method: null,
        acceptance_note: null,
        declined_at: null,
        declined_reason: null,
        invoice_status: null,
        created_at: "2026-11-10T00:00:00.000Z",
        updated_at: "2026-11-10T00:00:00.000Z",
      },
      lines: [
        { id: "l1", quote_id: "q", kind: "vehicle", label: "2020 Sample Make Model", amount_cents: 50_000_00, currency: "USD", position: 0 },
        { id: "l2", quote_id: "q", kind: "ocean_freight", label: "Ocean freight", amount_cents: 2_000_00, currency: "USD", position: 1 },
      ],
      local: [{ id: "c1", quote_id: "q", label: "Import duty", estimate_cents: null, currency: "USD", note: null, position: 0 }],
      customer: {
        id: "c",
        name: "Sample Customer",
        email: "sample@example.com",
        whatsapp: null,
        country: null,
        preferred_contact: "email",
        created_at: "",
        updated_at: "",
      },
      vehicle: {
        id: "v",
        vin: "SAMPLEVIN00000001",
        stock_number: "RA-0001",
        slug: "sample",
        year: 2020,
        make: "Sample",
        model: "Model",
        trim: null,
        body: null,
        fuel: null,
        transmission: null,
        drivetrain: null,
        engine: null,
        power: null,
        exterior: null,
        interior: null,
        mileage: 1000,
        title_status: "clean",
        location: "Miami, FL",
        price_cents: 50_000_00,
        currency: "USD",
        status: "available",
        export_ready: true,
        is_mock: false,
        description: null,
        features: [],
        notes: null,
        version: 1,
        created_by: null,
        approved_by: null,
        approved_at: null,
        withdrawn_reason: null,
        created_at: "",
        updated_at: "",
      },
      destination: {
        id: "d",
        country: "Ghana",
        port: "Tema",
        status: "open",
        notes: null,
        status_set_by: null,
        status_set_at: null,
        created_by: null,
        created_at: "",
        updated_at: "",
      },
      settings: { legal_name: "Raptors Auto Group", licence: null, city: "Miami" },
      totals: { subtotalCents: 52_000_00, discountCents: 0, totalCents: 52_000_00, localEstimateCents: 0 },
    };
    const pdf = await renderQuotationPdf(doc, { draft: true });
    expect(Buffer.isBuffer(pdf)).toBe(true);
    expect(pdf.subarray(0, 5).toString("utf8")).toBe("%PDF-");
    expect(pdf.byteLength).toBeGreaterThan(1_000);
  }, 60_000);
});

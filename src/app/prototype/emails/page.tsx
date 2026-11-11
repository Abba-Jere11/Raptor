import type { Metadata } from "next";
import { EmailLayout } from "@/components/ui/EmailLayout";
import { KeyValueList } from "@/components/ui/Table";
import { formatMoney } from "@/lib/format";
import { MOCK_ORDER, MOCK_QUOTE_LINES, quoteTotal } from "@/mock/MOCK_DATA_orders";
import { REQUEST_STAGES } from "@/mock/MOCK_DATA_requests";

export const metadata: Metadata = { title: "Branded emails (Figure 14)" };

/**
 * Six of the email library as designs. Wording is placeholder until the CEO
 * approves it (Decision 14). The vehicle-request emails never show source or price.
 */
export default function EmailsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 md:px-6">
      <p className="eyebrow">Figure 14 · Branded emails · Wording to be approved by the CEO</p>
      <h1 className="mt-2 text-4xl font-semibold">Six of the email library</h1>
      <p className="mt-2 max-w-2xl text-slate">
        One layout: white header with the logo and a red rule, a clear headline, short text and one button. Sent
        automatically when a status changes, using CEO-approved templates. Every email also has a plain-text version.
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <EmailLayout subject="Payment confirmed: open your Journey Tracker" kicker="Payment confirmed" headline="Thank you. Your vehicle is on its way." cta="Open your Journey Tracker">
          <p>You can follow your vehicle at any time with its VIN and the Buyer ID below. Your receipt is attached.</p>
          <div className="rounded-panel bg-platinum p-4">
            <p className="eyebrow !text-charcoal">Your Buyer ID</p>
            <p className="mt-1 font-mono text-lg font-semibold tracking-wider">RAG-7K4Q-92XM-H6TD</p>
          </div>
        </EmailLayout>

        <EmailLayout subject="Your quotation is ready" kicker="Quotation" headline="Your quotation for the Rolls-Royce Ghost" cta="View your quotation">
          <p>We found your vehicle. Your full quotation, with shipping to your port, is attached and below.</p>
          <KeyValueList
            rows={[
              ...MOCK_QUOTE_LINES.map((l) => ({ label: l.label, value: formatMoney(l.amount) })),
              { label: "Total", value: formatMoney(quoteTotal(MOCK_QUOTE_LINES)), strong: true },
            ]}
          />
        </EmailLayout>

        <EmailLayout subject="We are looking for your Rolls-Royce Ghost" kicker="We are searching" headline="We have started your search" cta="Follow your request">
          <p>We are checking our dealer network and platforms. We will contact you the moment we have your vehicle.</p>
          <p className="text-sm text-slate">{REQUEST_STAGES.filter((s) => s !== "Accepted" && s !== "Shipping").join(" · ")}</p>
        </EmailLayout>

        <EmailLayout subject="We found your Rolls-Royce Ghost" kicker="Vehicle found" headline="We found your vehicle" cta="See your vehicle">
          <p>2022 Ghost, Arctic White, 14,000 miles. Photos and full specifications are below. Your quotation follows.</p>
        </EmailLayout>

        <EmailLayout subject="Receipt: deposit received" kicker="Deposit receipt" headline="We have received your deposit" cta="View your receipt">
          <p>Thank you. Your deposit is confirmed in our bank. We will start the next step when the balance is received.</p>
          <KeyValueList
            rows={[
              { label: "Deposit received", value: formatMoney(MOCK_ORDER.deposit) },
              { label: "Balance outstanding", value: formatMoney(MOCK_ORDER.balance), strong: true },
            ]}
          />
        </EmailLayout>

        <EmailLayout subject="Update on your vehicle: arrival date changed" kicker="Delay notice" headline="A short delay at the port" cta="Open your tracker">
          <p>The vessel is waiting to berth. We will update your tracker as soon as it is confirmed.</p>
          <div className="rounded-panel border border-amber-border bg-amber-bg p-3 text-sm text-amber-text">
            <p className="font-semibold">Port congestion at Tema</p>
            <p>New arrival: 17 – 24 Nov</p>
          </div>
        </EmailLayout>
      </div>
    </main>
  );
}

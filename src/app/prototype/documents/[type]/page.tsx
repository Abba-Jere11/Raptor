import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentLayout } from "@/components/ui/DocumentLayout";
import { formatMoney } from "@/lib/format";
import { MOCK_ORDER, MOCK_QUOTE_LINES, quoteTotal } from "@/mock/MOCK_DATA_orders";
import { routes } from "@/prototype/routes";

const TYPES = ["quotation", "invoice", "receipt"] as const;
type DocType = (typeof TYPES)[number];

type Props = { params: Promise<{ type: string }> };

export function generateStaticParams() {
  return TYPES.map((type) => ({ type }));
}

export const metadata: Metadata = { title: "Quotation, invoice and receipt (Figure 11)" };

function LinesTable({ totalLabel }: { totalLabel: string }) {
  return (
    <table className="w-full text-sm">
      <caption className="sr-only">Itemised lines in USD</caption>
      <thead>
        <tr className="border-b-2 border-charcoal">
          <th scope="col" className="eyebrow py-2 text-left">Description</th>
          <th scope="col" className="eyebrow py-2 text-right">USD</th>
        </tr>
      </thead>
      <tbody>
        {MOCK_QUOTE_LINES.map((l) => (
          <tr key={l.label} className="border-b border-platinum">
            <td className="py-2.5">{l.label}</td>
            <td className="py-2.5 text-right tabular">{formatMoney(l.amount)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <th scope="row" className="py-3 text-left font-display text-base font-semibold">
            {totalLabel}
          </th>
          <td className="py-3 text-right font-display text-base font-semibold tabular">{formatMoney(quoteTotal(MOCK_QUOTE_LINES))}</td>
        </tr>
      </tfoot>
    </table>
  );
}

/** Figure 11. Numbered, linked and never edited; a correction is a new linked document. */
export default async function DocumentPage({ params }: Props) {
  const { type } = await params;
  if (!TYPES.includes(type as DocType)) notFound();
  const o = MOCK_ORDER;
  const vehicle = [o.vehicle, o.shipping];

  return (
    <main className="min-h-screen bg-platinum/60 px-2 py-8 md:px-6">
      <nav aria-label="Documents" className="no-print mx-auto mb-6 flex max-w-[794px] flex-wrap gap-2">
        {TYPES.map((t) => (
          <Link
            key={t}
            href={routes.documents(t)}
            aria-current={t === type ? "page" : undefined}
            className={
              t === type
                ? "inline-flex h-9 items-center rounded-full bg-charcoal px-4 text-sm font-semibold capitalize text-white"
                : "inline-flex h-9 items-center rounded-full border border-silver bg-white px-4 text-sm font-semibold capitalize"
            }
          >
            {t}
          </Link>
        ))}
        <span className="ml-auto self-center text-xs text-charcoal">Placeholders in [brackets] are supplied by Raptors</span>
      </nav>

      {type === "quotation" && (
        <DocumentLayout
          kind="Quotation"
          number={o.quoteNo}
          billedTo={[o.customer, o.customerAddress]}
          meta={[
            { label: "Date", value: o.date },
            { label: "Valid until", value: o.validUntil },
          ]}
          vehicle={vehicle}
        >
          <LinesTable totalLabel="Total payable to Raptors" />
          <div className="mt-6 rounded-panel bg-platinum p-4 text-sm">
            <p className="font-semibold">Charges in your country (estimated separately, paid locally, never added to the total)</p>
            <p className="mt-1">Import duty, taxes, port fees and clearing agent are set by your country&apos;s authorities.</p>
          </div>
          <p className="mt-4 text-sm">
            <strong>Not included:</strong> import duty, taxes, port fees and clearing agent in the destination country.
            Prices in USD. Payment by international bank transfer. An expired quotation cannot become an invoice. Terms
            apply.
          </p>
        </DocumentLayout>
      )}

      {type === "invoice" && (
        <DocumentLayout
          kind="Invoice"
          number={o.invoiceNo}
          billedTo={[o.customer, o.customerAddress]}
          meta={[
            { label: "Date", value: o.date },
            { label: "Ref.", value: o.quoteNo },
          ]}
          vehicle={vehicle}
        >
          <LinesTable totalLabel="Total" />
          <table className="mt-6 w-full text-sm">
            <caption className="eyebrow mb-2 text-left">Payment schedule</caption>
            <thead>
              <tr className="border-b border-charcoal">
                <th scope="col" className="eyebrow py-2 text-left">Item</th>
                <th scope="col" className="eyebrow py-2 text-left">Due</th>
                <th scope="col" className="eyebrow py-2 text-right">USD</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-platinum">
                <td className="py-2.5">Deposit</td>
                <td className="py-2.5">{o.depositDue}</td>
                <td className="py-2.5 text-right tabular">{formatMoney(o.deposit)}</td>
              </tr>
              <tr className="border-b border-platinum">
                <td className="py-2.5">Balance</td>
                <td className="py-2.5">Before shipping</td>
                <td className="py-2.5 text-right tabular">{formatMoney(o.balance)}</td>
              </tr>
            </tbody>
          </table>
          <div className="mt-6 rounded-panel border border-charcoal p-4 text-sm">
            <p className="font-display font-semibold">Pay by international bank transfer (USD)</p>
            <p className="mt-1">Bank: [bank] · Account: [number] · SWIFT: [code]</p>
            <p className="mt-1">
              Payment reference: <span className="font-mono font-semibold">{o.paymentRef}</span> (please quote it on every
              transfer)
            </p>
            <p className="mt-2 text-xs text-slate">
              Raptors never changes its bank details by email or message. If you receive different details, call us before
              paying.
            </p>
          </div>
        </DocumentLayout>
      )}

      {type === "receipt" && (
        <DocumentLayout
          kind="Receipt"
          number={o.receiptNo}
          billedTo={[o.customer, o.customerAddress]}
          meta={[
            { label: "Date", value: o.date },
            { label: "Ref.", value: o.invoiceNo },
          ]}
          vehicle={vehicle}
          stamp="Deposit received"
        >
          <table className="w-full text-sm">
            <caption className="sr-only">Payment received</caption>
            <thead>
              <tr className="border-b-2 border-charcoal">
                <th scope="col" className="eyebrow py-2 text-left">Payment received</th>
                <th scope="col" className="eyebrow py-2 text-right">USD</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-platinum">
                <td className="py-2.5">Deposit (international bank transfer) · received {o.depositReceived}</td>
                <td className="py-2.5 text-right tabular">{formatMoney(o.deposit)}</td>
              </tr>
              <tr className="border-b border-platinum">
                <td className="py-2.5">Bank reference</td>
                <td className="py-2.5 text-right font-mono">[reference]</td>
              </tr>
              <tr className="border-b border-platinum">
                <td className="py-2.5">Order total</td>
                <td className="py-2.5 text-right tabular">{formatMoney(o.total)}</td>
              </tr>
              <tr className="border-b border-platinum">
                <td className="py-2.5">Paid to date</td>
                <td className="py-2.5 text-right tabular">{formatMoney(o.deposit)}</td>
              </tr>
              <tr>
                <th scope="row" className="py-3 text-left font-display text-base font-semibold">
                  Balance outstanding
                </th>
                <td className="py-3 text-right font-display text-base font-semibold tabular">{formatMoney(o.balance)}</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-6 text-sm">
            Thank you. We will confirm each further payment with a new receipt. When the balance is received, you will receive
            a final receipt marked paid in full.
          </p>
        </DocumentLayout>
      )}
    </main>
  );
}

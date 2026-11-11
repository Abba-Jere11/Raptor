"use client";

import Image from "next/image";
import { useState } from "react";
import { PillButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Field, TextInput } from "@/components/ui/Field";
import { LockIcon } from "@/components/ui/icons";
import { KeyValueList } from "@/components/ui/Table";
import { cn } from "@/lib/cn";
import { formatMoney, usd } from "@/lib/format";
import { MOCK_QUOTE_LINES, quoteTotal } from "@/mock/MOCK_DATA_orders";
import { BOARD_COLUMNS, MOCK_PRIVATE_SOURCING, MOCK_REQUEST_PAGE, MOCK_REQUESTS } from "@/mock/MOCK_DATA_requests";

/**
 * Figure 16. Board of requests plus the find-and-quote builder. The private
 * panel holds source platform, listing, purchase price, fees and margin; it is
 * CEO only and never reaches a customer-facing page, email, document or API.
 */
export function RequestsBoard() {
  const [selected, setSelected] = useState("RQ-V-0112");
  const [lines, setLines] = useState(MOCK_QUOTE_LINES);
  const [saved, setSaved] = useState(false);
  const p = MOCK_PRIVATE_SOURCING;

  const total = quoteTotal(lines);
  const passThrough = lines.filter((l) => !["Vehicle", "Raptors fee", "Inland transport"].includes(l.label));
  const cost = p.purchasePrice.cents + p.platformFees.cents + p.transportToPort.cents + passThrough.reduce((s, l) => s + l.amount.cents, 0);
  const margin = { cents: total.cents - cost, currency: "USD" as const };
  const marginPct = ((margin.cents / total.cents) * 100).toFixed(1);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-3 overflow-x-auto pb-2">
        {BOARD_COLUMNS.map((col) => {
          const items = MOCK_REQUESTS.filter((r) => r.column === col);
          return (
            <section key={col} aria-label={col} className="w-52 shrink-0">
              <h2 className="eyebrow mb-2 flex justify-between !text-charcoal">
                {col} <span className="tabular">{items.length}</span>
              </h2>
              <ul className="flex flex-col gap-2">
                {items.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(r.id)}
                      aria-pressed={selected === r.id}
                      className={cn(
                        "w-full rounded-panel border bg-white p-3 text-left text-sm transition-colors",
                        selected === r.id ? "border-charcoal shadow-soft" : "border-platinum hover:border-silver",
                      )}
                    >
                      <span className="block font-mono text-xs font-semibold">{r.id}</span>
                      <span className="block font-medium">{r.vehicle}</span>
                      <span className="text-xs text-slate">
                        {r.country} · {r.budget}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card as="section" aria-label="Find and quote" className="p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="eyebrow">{selected} · Find and quote</p>
              <h2 className="font-display text-xl font-semibold">{MOCK_REQUEST_PAGE.found.title}</h2>
              <p className="text-sm text-slate">{MOCK_REQUEST_PAGE.found.facts}</p>
            </div>
            <Chip tone="outline">Customer sees this part</Chip>
          </div>
          <ul className="mt-4 grid grid-cols-3 gap-2">
            {MOCK_REQUEST_PAGE.found.images.map((src, i) => (
              <li key={src + i} className="relative aspect-[4/3] overflow-hidden rounded-panel bg-platinum">
                <Image src={src} alt={`Found vehicle photo ${i + 1}`} fill sizes="200px" className="object-contain p-2" />
              </li>
            ))}
          </ul>

          <h3 className="mt-6 font-display font-semibold">Quotation lines (USD)</h3>
          <div className="mt-2 flex flex-col gap-2">
            {lines.map((l, i) => (
              <Field key={l.label} label={l.label} className="sm:flex-row sm:items-center sm:justify-between">
                {(id) => (
                  <TextInput
                    id={id}
                    inputMode="numeric"
                    className="h-10 tabular sm:w-44 sm:text-right"
                    value={l.amount.cents / 100}
                    onChange={(e) => {
                      const v = Number(e.target.value.replace(/[^0-9]/g, "")) || 0;
                      setLines((ls) => ls.map((x, j) => (j === i ? { ...x, amount: usd(v) } : x)));
                      setSaved(false);
                    }}
                  />
                )}
              </Field>
            ))}
          </div>
          <p className="mt-4 flex justify-between border-t-2 border-charcoal pt-3 font-display text-lg font-semibold">
            <span>Total to customer</span>
            <span className="tabular">{formatMoney(total)}</span>
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <PillButton variant="outline" arrow={false} onClick={() => setSaved(true)}>
              Save draft
            </PillButton>
            <PillButton variant="primary" href="/prototype/ceo/quotes/new">
              Preview and send
            </PillButton>
          </div>
          {saved && (
            <p role="status" className="mt-3 text-sm text-success">
              Draft saved. Saving never sends anything to the customer.
            </p>
          )}
        </Card>

        <Card as="section" tone="dark" aria-label="CEO only: private sourcing" className="p-5 md:p-6">
          <p className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.14em]">
            <LockIcon className="h-4 w-4" /> CEO only · never shown to the customer
          </p>
          <dl className="mt-5 grid gap-3 text-sm">
            {[
              ["Found on", p.foundOn],
              ["Listing / lot", "[Lot no.]"],
              ["Purchase price", formatMoney(p.purchasePrice)],
              ["Platform fees", formatMoney(p.platformFees)],
              ["Transport to port", formatMoney(p.transportToPort)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 border-b border-white/15 pb-2">
                <dt className="text-silver">{k}</dt>
                <dd className="font-semibold tabular">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 rounded-panel bg-white/10 p-4">
            <p className="text-sm text-silver">Margin on this quotation</p>
            <p className="mt-1 font-display text-3xl font-semibold tabular">{formatMoney(margin)}</p>
            <p className="text-sm text-silver tabular">{marginPct}% of the customer total</p>
          </div>
          <p className="mt-4 text-xs text-silver">
            No auction passwords are stored. Bidding happens on the platform itself, by the CEO.
          </p>
        </Card>
      </div>

      <section aria-label="What the customer sees" className="max-w-xl">
        <h2 className="eyebrow">What the customer sees</h2>
        <Card className="mt-2 p-5">
          <KeyValueList
            rows={[
              ...lines.map((l) => ({ label: l.label, value: formatMoney(l.amount) })),
              { label: "Total", value: formatMoney(total), strong: true },
            ]}
          />
        </Card>
      </section>
    </div>
  );
}

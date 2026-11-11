"use client";

import { useState } from "react";
import { PillButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip, StatusChip } from "@/components/ui/Chip";
import { Field, Select, TextArea } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import { MOCK_ENQUIRIES } from "@/mock/MOCK_DATA_orders";
import { routes } from "@/prototype/routes";

const FILTERS = ["All", "New", "Contacted", "Quoted", "Negotiating", "Spam"];

/**
 * Newly designed. One inbox for website, WhatsApp and email enquiries, with
 * owner, status and time waiting. Replies use CEO-approved templates.
 */
export function EnquiryInbox() {
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(MOCK_ENQUIRIES[0].id);
  const rows = MOCK_ENQUIRIES.filter((e) => filter === "All" || e.status === filter);
  const e = MOCK_ENQUIRIES.find((x) => x.id === selected)!;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
      <section aria-label="Enquiry list">
        <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                "h-9 rounded-full border px-4 text-sm font-semibold",
                filter === f ? "border-charcoal bg-charcoal text-white" : "border-silver bg-white hover:border-charcoal",
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <ul className="mt-4 flex flex-col gap-2">
          {rows.map((x) => (
            <li key={x.id}>
              <button
                type="button"
                onClick={() => setSelected(x.id)}
                aria-pressed={selected === x.id}
                className={cn(
                  "grid w-full grid-cols-[1fr_auto] gap-x-3 gap-y-1 rounded-panel border bg-white p-4 text-left text-sm",
                  selected === x.id ? "border-charcoal shadow-soft" : "border-platinum hover:border-silver",
                )}
              >
                <span className="font-semibold">
                  {x.name} · {x.country}
                </span>
                <StatusChip status={x.status} />
                <span>{x.subject}</span>
                <span className="text-right text-xs text-slate">{x.received}</span>
                <span className="text-xs text-slate">
                  {x.channel} · Owner: {x.owner}
                </span>
                <span className={cn("text-right text-xs", x.status === "New" ? "font-semibold text-crimson" : "text-slate")}>{x.waiting}</span>
              </button>
            </li>
          ))}
          {rows.length === 0 && <li className="rounded-panel border border-dashed border-silver p-6 text-center text-sm text-slate">No enquiries with this status.</li>}
        </ul>
      </section>

      <Card as="section" aria-label={`Enquiry ${e.id}`} className="p-5 md:p-6">
        <p className="eyebrow">
          {e.id} · {e.channel}
        </p>
        <h2 className="mt-1 font-display text-xl font-semibold">{e.subject}</h2>
        <p className="text-sm text-slate">
          {e.name} · {e.country} · received {e.received}
        </p>
        {e.status === "Spam" && (
          <p className="mt-3 rounded-panel bg-amber-bg p-3 text-sm text-amber-text">
            Marked as spam: overpayment and cashier&apos;s-cheque offers are a known fraud pattern.
          </p>
        )}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Owner">
            {(id) => (
              <Select id={id} defaultValue={e.owner} key={e.id + "o"}>
                <option>Unassigned</option>
                <option>CEO</option>
                <option>Sales 01</option>
                <option>—</option>
              </Select>
            )}
          </Field>
          <Field label="Status">
            {(id) => (
              <Select id={id} defaultValue={e.status} key={e.id + "s"}>
                {FILTERS.slice(1).concat(["Won", "Lost"]).map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            )}
          </Field>
        </div>
        <Field label="Reply (from an approved template)" className="mt-4">
          {(id) => (
            <TextArea
              id={id}
              key={e.id + "r"}
              defaultValue={`Hello ${e.name.split(" ")[0]}, thank you for your enquiry. [Approved template text]`}
            />
          )}
        </Field>
        <div className="mt-4 flex flex-wrap gap-2">
          <PillButton variant="dark" size="sm">
            Send reply
          </PillButton>
          <PillButton variant="outline" size="sm" href={routes.ceo.quoteBuilder}>
            Start a quotation
          </PillButton>
        </div>
        <p className="mt-4 flex flex-wrap gap-2 text-xs">
          <Chip tone="outline">Reminder: follow up in 24 h</Chip>
          <Chip tone="outline">Every message is logged</Chip>
        </p>
      </Card>
    </div>
  );
}

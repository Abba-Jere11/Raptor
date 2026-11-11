"use client";

import { useState } from "react";
import { PillButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/Chip";
import { Field, Select, TextInput } from "@/components/ui/Field";
import { StageTracker } from "@/components/ui/StageTracker";
import { KeyValueList } from "@/components/ui/Table";
import { formatMoney, usd } from "@/lib/format";
import { MOCK_ORDER, MOCK_QUOTE_LINES, quoteTotal } from "@/mock/MOCK_DATA_orders";

type Step = "draft" | "saved" | "preview" | "sent";
const STEPS: Step[] = ["draft", "saved", "preview", "sent"];

/**
 * Newly designed. Save draft → Preview → Send are separate, explicit actions;
 * saving never sends. Once sent, a quotation is immutable (a change is a new
 * version that supersedes it).
 */
export function QuoteBuilder() {
  const [lines, setLines] = useState(MOCK_QUOTE_LINES);
  const [step, setStep] = useState<Step>("draft");
  const total = quoteTotal(lines);
  const locked = step === "sent";

  return (
    <div className="flex flex-col gap-6">
      <div className="max-w-2xl">
        <StageTracker
          orientation="horizontal"
          label="Quotation steps"
          stages={[{ label: "Draft" }, { label: "Saved" }, { label: "Previewed" }, { label: "Sent" }]}
          current={step === "sent" ? 4 : STEPS.indexOf(step)}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card as="section" aria-label="Quotation details" className="p-5 md:p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold">{MOCK_ORDER.quoteNo}</h2>
            <StatusChip status={locked ? "Sent" : "Draft"} />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Customer">{(id) => <TextInput id={id} defaultValue={MOCK_ORDER.customer} readOnly={locked} />}</Field>
            <Field label="Destination">
              {(id) => (
                <Select id={id} defaultValue="Tema, Ghana" disabled={locked}>
                  <option>Tema, Ghana</option>
                  <option>Lagos, Nigeria</option>
                  <option>Jebel Ali, UAE</option>
                </Select>
              )}
            </Field>
            <Field label="Vehicle">{(id) => <TextInput id={id} defaultValue={MOCK_ORDER.vehicle} readOnly={locked} />}</Field>
            <Field label="Valid until">{(id) => <TextInput id={id} defaultValue={MOCK_ORDER.validUntil} readOnly={locked} />}</Field>
          </div>
          <h3 className="mt-6 font-display font-semibold">Lines (USD)</h3>
          <div className="mt-2 flex flex-col gap-2">
            {lines.map((l, i) => (
              <Field key={l.label} label={l.label} className="sm:flex-row sm:items-center sm:justify-between">
                {(id) => (
                  <TextInput
                    id={id}
                    inputMode="numeric"
                    readOnly={locked}
                    className="h-10 tabular sm:w-44 sm:text-right"
                    value={l.amount.cents / 100}
                    onChange={(e) => {
                      const v = Number(e.target.value.replace(/[^0-9]/g, "")) || 0;
                      setLines((ls) => ls.map((x, j) => (j === i ? { ...x, amount: usd(v) } : x)));
                      setStep("draft");
                    }}
                  />
                )}
              </Field>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate">
            Fee lines: TO CONFIGURE WITH RAPTORS. Duty and local charges are never added or calculated.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <PillButton variant="outline" arrow={false} disabled={locked} onClick={() => setStep("saved")}>
              Save draft
            </PillButton>
            <PillButton variant="dark" disabled={step === "draft" || locked} onClick={() => setStep("preview")}>
              Preview
            </PillButton>
            <PillButton variant="primary" disabled={step !== "preview"} onClick={() => setStep("sent")}>
              Send to customer
            </PillButton>
          </div>
          <p role="status" className="mt-3 text-sm text-slate">
            {step === "draft" && "Unsaved changes. Save the draft before previewing."}
            {step === "saved" && "Draft saved. Nothing has been sent. Preview it next."}
            {step === "preview" && "Check the preview, then send. Sending is the only step that reaches the customer."}
            {step === "sent" && "Sent (prototype). This quotation is now locked; a change creates a new version."}
          </p>
        </Card>

        <Card as="section" aria-label="Preview: what the customer receives" className="p-5 md:p-6">
          <p className="eyebrow">Preview · what the customer receives</p>
          {step === "preview" || step === "sent" ? (
            <div className="mt-3">
              <p className="font-display text-lg font-semibold">{MOCK_ORDER.vehicle}</p>
              <p className="text-sm text-slate">{MOCK_ORDER.shipping}</p>
              <KeyValueList
                className="mt-4"
                rows={[
                  ...lines.map((l) => ({ label: l.label, value: formatMoney(l.amount) })),
                  { label: "Total payable to Raptors", value: formatMoney(total), strong: true },
                ]}
              />
              <p className="mt-4 text-sm">
                <strong>Not included:</strong> import duty, taxes, port fees and clearing agent in the destination country.
              </p>
            </div>
          ) : (
            <p className="mt-3 rounded-panel border border-dashed border-silver p-6 text-center text-sm text-slate">
              Save the draft, then choose Preview.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

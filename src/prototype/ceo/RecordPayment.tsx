"use client";

import { useState } from "react";
import { PillButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/Chip";
import { Checkbox, Field, Select, TextInput } from "@/components/ui/Field";
import { StageTracker } from "@/components/ui/StageTracker";
import { KeyValueList } from "@/components/ui/Table";
import { formatMoney } from "@/lib/format";
import { MOCK_ORDER } from "@/mock/MOCK_DATA_orders";

const ORDER_STEPS = ["Invoice sent", "Deposit", "Balance", "Purchase", "Ship"];

/**
 * Figure 17. A payment is only recorded once the money is seen in the bank:
 * the confirmation box must be ticked before the button enables. Screenshots
 * and customer claims never mark an invoice paid. Recorded payments are immutable.
 */
export function RecordPayment() {
  const o = MOCK_ORDER;
  const [confirmed, setConfirmed] = useState(false);
  const [recorded, setRecorded] = useState(false);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <Card as="section" aria-label="Record a payment" className="p-5 md:p-6">
        <p className="eyebrow">
          {o.invoiceNo} · reference {o.paymentRef}
        </p>
        <h2 className="mt-1 font-display text-xl font-semibold">Record a payment</h2>
        <form
          className="mt-5 grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (confirmed) setRecorded(true);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount received (USD)">{(id) => <TextInput id={id} defaultValue="45,000" className="tabular" readOnly={recorded} />}</Field>
            <Field label="Date received">{(id) => <TextInput id={id} defaultValue={o.depositReceived + " 2026"} readOnly={recorded} />}</Field>
            <Field label="Applies to">
              {(id) => (
                <Select id={id} defaultValue="Deposit" disabled={recorded}>
                  <option>Deposit</option>
                  <option>Balance</option>
                </Select>
              )}
            </Field>
            <Field label="Bank reference">{(id) => <TextInput id={id} defaultValue="[reference]" className="font-mono" readOnly={recorded} />}</Field>
          </div>
          <div className="rounded-panel border-2 border-charcoal p-4">
            <Checkbox
              label="I have seen this money arrive in the Raptors bank account."
              description="Not a screenshot, not a customer's message: the bank statement or banking app."
              checked={confirmed}
              onChange={setConfirmed}
            />
          </div>
          <PillButton type="submit" variant="primary" disabled={!confirmed || recorded}>
            {recorded ? "Payment recorded" : "Confirm and record payment"}
          </PillButton>
          {!confirmed && !recorded && <p className="text-sm text-slate">Tick the bank confirmation to enable this button.</p>}
          {recorded && (
            <p role="status" className="rounded-panel bg-success-bg p-3 text-sm text-success">
              Recorded (prototype). Receipt {o.receiptNo} is issued and emailed. This payment can no longer be edited; a
              correction is a new, linked entry.
            </p>
          )}
        </form>
      </Card>

      <div className="flex flex-col gap-6">
        <Card as="section" aria-label="Order summary" className="p-5 md:p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold">{o.vehicle}</h2>
            <StatusChip status={recorded ? "Part paid" : "Awaiting payment"} />
          </div>
          <KeyValueList
            className="mt-4"
            rows={[
              { label: "Order total", value: formatMoney(o.total) },
              { label: "Deposit due " + o.depositDue, value: formatMoney(o.deposit) },
              { label: "Received to date", value: recorded ? formatMoney(o.deposit) : "$0" },
              { label: "Balance outstanding", value: formatMoney(recorded ? o.balance : o.total), strong: true },
            ]}
          />
        </Card>
        <Card as="section" aria-label="Order steps" className="p-5 md:p-6">
          <h2 className="font-display text-lg font-semibold">Gated steps</h2>
          <p className="text-sm text-slate">Purchase waits for the deposit; shipping waits for the balance, unless the CEO records an override.</p>
          <div className="mt-4">
            <StageTracker label="Order steps" stages={ORDER_STEPS.map((label) => ({ label }))} current={recorded ? 2 : 1} />
          </div>
        </Card>
      </div>
    </div>
  );
}

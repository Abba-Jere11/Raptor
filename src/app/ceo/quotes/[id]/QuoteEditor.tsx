"use client";

import { useActionState, useState, useTransition } from "react";
import { PillButton } from "@/components/ui/Button";
import { Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import type { ActionState } from "@/app/ceo/actions";
import {
  addLine,
  addLocalCharge,
  newQuoteVersion,
  previewQuote,
  recordAcceptance,
  recordDeclined,
  removeLine,
  removeLocalCharge,
  requestDiscount,
  retryQuoteEmail,
  saveQuote,
  sendQuote,
  updateLine,
  updateLocalCharge,
} from "@/app/ceo/quotes/actions";
import type { Destination, Quote, QuoteLine, QuoteLocalCharge } from "@/lib/db/types";
import { ACCEPTANCE_METHOD_LABEL, DESTINATION_STATUS_LABEL, EDITABLE_LINE_KINDS, LINE_KIND_LABEL } from "@/lib/quotes";

function Message({ state }: { state: ActionState }) {
  if (state.error) return <p className="text-sm text-crimson" role="alert">{state.error}</p>;
  if (state.ok) return <p className="text-sm text-success" role="status">{state.ok}</p>;
  return null;
}

function dollars(cents: number | null) {
  return cents === null ? "" : (cents / 100).toFixed(2).replace(/\.00$/, "");
}

export function HeaderForm({ quote, destinations }: { quote: Quote; destinations: Destination[] }) {
  const [state, action, pending] = useActionState(saveQuote.bind(null, quote.id), {});
  const [destination, setDestination] = useState(quote.destination_id ?? "");
  const chosen = destinations.find((d) => d.id === destination);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <Field label="Ship to">
        {(id) => (
          <Select id={id} name="destination_id" value={destination} onChange={(e) => setDestination(e.target.value)}>
            <option value="">Choose a destination</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.id} disabled={d.status === "not_served"}>
                {d.port}, {d.country} ({DESTINATION_STATUS_LABEL[d.status]})
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="Shipping method">
        {(id) => (
          <Select id={id} name="shipping_method" defaultValue={quote.shipping_method ?? ""}>
            <option value="">To confirm</option>
            <option value="container">Container</option>
            <option value="roro">RoRo</option>
          </Select>
        )}
      </Field>
      {chosen?.status === "confirm_each_time" && (
        <label className="flex items-start gap-3 rounded-panel border border-amber-text/30 bg-amber-bg p-4 text-sm sm:col-span-2">
          <input
            type="checkbox"
            name="destination_confirmed"
            defaultChecked={Boolean(quote.destination_confirmed_at) && destination === quote.destination_id}
            className="mt-0.5 h-4 w-4 accent-crimson"
          />
          <span>
            <span className="font-semibold">I have confirmed shipping to {chosen.port} for this quotation.</span>
            <span className="block text-slate">This port is set to Confirm each time. Your name and the time are recorded.</span>
          </span>
        </label>
      )}
      <Field label="Valid until">
        {(id) => <TextInput id={id} name="valid_until" type="date" defaultValue={quote.valid_until} required />}
      </Field>
      <div />
      <Field label="Not included" className="sm:col-span-2">
        {(id) => <TextArea id={id} name="not_included" defaultValue={quote.not_included} maxLength={1000} required />}
      </Field>
      <Field label="Note to the customer (optional)" className="sm:col-span-2">
        {(id) => <TextArea id={id} name="customer_note" defaultValue={quote.customer_note ?? ""} maxLength={1000} />}
      </Field>
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <PillButton type="submit" variant="dark" disabled={pending}>
          Save
        </PillButton>
        <span className="text-sm text-slate">Saving never sends anything.</span>
        <Message state={state} />
      </div>
    </form>
  );
}

function KindSelect({ defaultValue }: { defaultValue?: string }) {
  return (
    <Select name="kind" aria-label="Line type" defaultValue={defaultValue ?? "raptors_fee"}>
      {EDITABLE_LINE_KINDS.map((k) => (
        <option key={k} value={k}>
          {LINE_KIND_LABEL[k]}
        </option>
      ))}
    </Select>
  );
}

export function LineRow({ quoteId, line, editable }: { quoteId: string; line: QuoteLine; editable: boolean }) {
  const [state, action, pending] = useActionState(updateLine.bind(null, quoteId, line.id), {});
  const [removing, startRemove] = useTransition();
  const [removeState, setRemoveState] = useState<ActionState>({});
  if (!editable || line.kind === "vehicle") {
    return (
      <div className="flex items-baseline justify-between gap-4 border-b border-platinum py-3">
        <span>
          <span className="block text-xs text-slate">{LINE_KIND_LABEL[line.kind]}</span>
          {line.label}
        </span>
        <span className="font-semibold tabular">
          {line.kind === "discount" ? "−" : ""}${(line.amount_cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
        </span>
      </div>
    );
  }
  return (
    <form action={action} className="grid gap-2 border-b border-platinum py-3 md:grid-cols-[180px_1fr_130px_auto]">
      <KindSelect defaultValue={line.kind} />
      <TextInput name="label" aria-label="Description" defaultValue={line.label} maxLength={120} />
      <TextInput name="amount" aria-label="Amount in dollars" inputMode="decimal" defaultValue={dollars(line.amount_cents)} className="text-right tabular" />
      <div className="flex items-center gap-2">
        <PillButton type="submit" variant="outline" size="sm" arrow={false} disabled={pending}>
          Save
        </PillButton>
        <PillButton
          variant="ghost"
          size="sm"
          arrow={false}
          disabled={removing}
          onClick={() => startRemove(async () => setRemoveState(await removeLine(quoteId, line.id)))}
        >
          Remove
        </PillButton>
      </div>
      <div className="md:col-span-4">
        <Message state={removeState.error ? removeState : state} />
      </div>
    </form>
  );
}

export function AddLineForm({ quoteId, position }: { quoteId: string; position: number }) {
  const [state, action, pending] = useActionState(addLine.bind(null, quoteId), {});
  return (
    <form action={action} key={state.ok ? position : undefined} className="grid gap-2 pt-4 md:grid-cols-[180px_1fr_130px_auto]">
      <input type="hidden" name="position" value={position} />
      <KindSelect />
      <TextInput name="label" aria-label="New line description" placeholder="Description (optional)" maxLength={120} />
      <TextInput name="amount" aria-label="New line amount in dollars" inputMode="decimal" placeholder="0" className="text-right tabular" required />
      <PillButton type="submit" variant="dark" size="sm" disabled={pending}>
        Add line
      </PillButton>
      <div className="md:col-span-4">
        <Message state={state} />
      </div>
    </form>
  );
}

export function LocalRow({ quoteId, charge, editable }: { quoteId: string; charge: QuoteLocalCharge; editable: boolean }) {
  const [state, action, pending] = useActionState(updateLocalCharge.bind(null, quoteId, charge.id), {});
  const [removing, startRemove] = useTransition();
  const [removeState, setRemoveState] = useState<ActionState>({});
  if (!editable) {
    return (
      <div className="flex items-baseline justify-between gap-4 border-b border-platinum py-3">
        <span>
          {charge.label}
          {charge.note && <span className="block text-xs text-slate">{charge.note}</span>}
        </span>
        <span className="tabular text-slate">{charge.estimate_cents === null ? "To confirm" : `about $${dollars(charge.estimate_cents)}`}</span>
      </div>
    );
  }
  return (
    <form action={action} className="grid gap-2 border-b border-platinum py-3 md:grid-cols-[1fr_130px_1fr_auto]">
      <TextInput name="label" aria-label="Charge" defaultValue={charge.label} maxLength={120} />
      <TextInput name="estimate" aria-label="Estimate in dollars" inputMode="decimal" defaultValue={dollars(charge.estimate_cents)} placeholder="Unknown" className="text-right tabular" />
      <TextInput name="note" aria-label="Note" defaultValue={charge.note ?? ""} maxLength={300} />
      <div className="flex items-center gap-2">
        <PillButton type="submit" variant="outline" size="sm" arrow={false} disabled={pending}>
          Save
        </PillButton>
        <PillButton
          variant="ghost"
          size="sm"
          arrow={false}
          disabled={removing}
          onClick={() => startRemove(async () => setRemoveState(await removeLocalCharge(quoteId, charge.id)))}
        >
          Remove
        </PillButton>
      </div>
      <div className="md:col-span-4">
        <Message state={removeState.error ? removeState : state} />
      </div>
    </form>
  );
}

export function AddLocalForm({ quoteId, position }: { quoteId: string; position: number }) {
  const [state, action, pending] = useActionState(addLocalCharge.bind(null, quoteId), {});
  return (
    <form action={action} key={state.ok ? position : undefined} className="grid gap-2 pt-4 md:grid-cols-[1fr_130px_1fr_auto]">
      <input type="hidden" name="position" value={position} />
      <TextInput name="label" aria-label="New local charge" placeholder="Import duty, port fees, clearing agent…" maxLength={120} required />
      <TextInput name="estimate" aria-label="New local estimate in dollars" inputMode="decimal" placeholder="Unknown" className="text-right tabular" />
      <TextInput name="note" aria-label="New local charge note" placeholder="Note (optional)" maxLength={300} />
      <PillButton type="submit" variant="dark" size="sm" disabled={pending}>
        Add
      </PillButton>
      <div className="md:col-span-4">
        <Message state={state} />
      </div>
    </form>
  );
}

function useButtonAction(fn: () => Promise<ActionState>) {
  const [pending, start] = useTransition();
  const [state, setState] = useState<ActionState>({});
  return { pending, state, run: () => start(async () => setState(await fn())) };
}

export function DraftActions({
  quoteId,
  canPreview,
  canSend,
  sendTo,
  needsDiscountApproval,
  sendBlocked,
}: {
  quoteId: string;
  canPreview: boolean;
  canSend: boolean;
  sendTo: string;
  needsDiscountApproval: boolean;
  sendBlocked: string | null;
}) {
  const preview = useButtonAction(() => previewQuote(quoteId));
  const send = useButtonAction(() => sendQuote(quoteId));
  const discount = useButtonAction(() => requestDiscount(quoteId));
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <PillButton variant="dark" onClick={preview.run} disabled={!canPreview || preview.pending}>
          {preview.pending ? "Preparing preview…" : "Preview"}
        </PillButton>
        {needsDiscountApproval && (
          <PillButton variant="outline" onClick={discount.run} disabled={discount.pending}>
            Ask the CEO to approve the discount
          </PillButton>
        )}
        {!confirming ? (
          <PillButton variant="primary" onClick={() => setConfirming(true)} disabled={!canSend || Boolean(sendBlocked)}>
            Send to customer
          </PillButton>
        ) : null}
      </div>
      {sendBlocked && <p className="text-sm text-slate">{sendBlocked}</p>}
      {!canSend && !sendBlocked && <p className="text-sm text-slate">Preview the current version to enable Send.</p>}
      {confirming && (
        <div role="alertdialog" aria-label="Confirm sending" className="rounded-panel border border-charcoal p-4">
          <p className="font-semibold">Send this quotation to {sendTo}?</p>
          <p className="mt-1 text-sm text-slate">It gets its number, the PDF is stored and cannot change, and the email goes now.</p>
          <div className="mt-3 flex gap-3">
            <PillButton
              variant="primary"
              disabled={send.pending}
              onClick={() => {
                send.run();
                setConfirming(false);
              }}
            >
              Confirm and send
            </PillButton>
            <PillButton variant="ghost" arrow={false} onClick={() => setConfirming(false)}>
              Cancel
            </PillButton>
          </div>
        </div>
      )}
      {send.pending && <p className="text-sm text-slate">Sending…</p>}
      <Message state={send.state.error || send.state.ok ? send.state : discount.state.error || discount.state.ok ? discount.state : preview.state} />
    </div>
  );
}

export function RetryEmail({ quoteId }: { quoteId: string }) {
  const retry = useButtonAction(() => retryQuoteEmail(quoteId));
  return (
    <div className="grid gap-2">
      <PillButton variant="outline" onClick={retry.run} disabled={retry.pending}>
        Retry email
      </PillButton>
      <Message state={retry.state} />
    </div>
  );
}

export function NewVersion({ quoteId }: { quoteId: string }) {
  const next = useButtonAction(() => newQuoteVersion(quoteId));
  return (
    <div className="grid gap-2">
      <PillButton variant="outline" onClick={next.run} disabled={next.pending}>
        New version
      </PillButton>
      <Message state={next.state} />
    </div>
  );
}

export function AcceptanceForm({ quoteId, today }: { quoteId: string; today: string }) {
  const [state, action, pending] = useActionState(recordAcceptance.bind(null, quoteId), {});
  return (
    <form action={action} className="grid gap-3">
      <Field label="How did the customer accept?">
        {(id) => (
          <Select id={id} name="method" defaultValue="email">
            {Object.entries(ACCEPTANCE_METHOD_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="Date accepted">{(id) => <TextInput id={id} name="accepted_on" type="date" max={today} defaultValue={today} required />}</Field>
      <Field label="Note (optional)">{(id) => <TextArea id={id} name="note" maxLength={1000} />}</Field>
      <PillButton type="submit" variant="primary" disabled={pending}>
        Record acceptance
      </PillButton>
      <Message state={state} />
    </form>
  );
}

export function DeclineForm({ quoteId }: { quoteId: string }) {
  const [state, action, pending] = useActionState(recordDeclined.bind(null, quoteId), {});
  return (
    <form action={action} className="grid gap-3">
      <Field label="Reason the customer gave">{(id) => <TextArea id={id} name="reason" maxLength={1000} required />}</Field>
      <PillButton type="submit" variant="outline" disabled={pending}>
        Record declined
      </PillButton>
      <Message state={state} />
    </form>
  );
}

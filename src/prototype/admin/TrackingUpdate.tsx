"use client";

import { useState } from "react";
import { PillButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox, Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import { DelayNotice } from "@/components/ui/DelayNotice";
import { CheckIcon } from "@/components/ui/icons";
import { DELAY_REASONS, EXPORT_CHECKLIST, JOURNEY_STAGES, MOCK_SHIPMENTS, MOCK_TRACKING_HISTORY } from "@/mock/MOCK_DATA_shipments";

type Shipment = (typeof MOCK_SHIPMENTS)[number];

/**
 * Figure 20. Quick update, delay feature, live preview of what the buyer sees.
 * The Administrator never writes to the customer: notifications use the CEO's templates.
 */
export function TrackingUpdate({ shipment }: { shipment: Shipment }) {
  const [stage, setStage] = useState("At sea");
  const [place, setPlace] = useState("Atlantic crossing");
  const [when, setWhen] = useState("16 Oct 2026 · 09:10");
  const [note, setNote] = useState("The vessel is expected to wait about 3 days to berth at Tema.");
  const [delay, setDelay] = useState(true);
  const [reason, setReason] = useState(DELAY_REASONS[0]);
  const [affected, setAffected] = useState("Arrived");
  const [newRange, setNewRange] = useState("17 – 24 Nov");
  const [published, setPublished] = useState(false);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <Card as="section" aria-label="Add tracking update" className="p-5 md:p-6">
        <p className="eyebrow">
          {shipment.id} · {shipment.destination}
        </p>
        <h2 className="mt-1 font-display text-xl font-semibold">Add tracking update</h2>
        <form
          className="mt-5 grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setPublished(true);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Stage">
              {(id) => (
                <Select id={id} value={stage} onChange={(e) => setStage(e.target.value)}>
                  {JOURNEY_STAGES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Place">{(id) => <TextInput id={id} value={place} onChange={(e) => setPlace(e.target.value)} />}</Field>
            <Field label="Date and time">{(id) => <TextInput id={id} value={when} onChange={(e) => setWhen(e.target.value)} />}</Field>
            <Field label="Visible to buyer">
              {(id) => (
                <Select id={id} defaultValue="Yes">
                  <option>Yes</option>
                  <option>No, internal note</option>
                </Select>
              )}
            </Field>
          </div>
          <Field label="Note shown to the buyer (short)">
            {(id) => <TextArea id={id} value={note} maxLength={240} onChange={(e) => setNote(e.target.value)} />}
          </Field>
          <button type="button" className="justify-self-start rounded-full border border-dashed border-silver px-4 py-2 text-sm font-semibold hover:border-charcoal">
            Attach photo or document
          </button>

          <div className="rounded-panel border border-platinum p-4">
            <Checkbox label="Report a delay" description="The buyer sees an amber notice; the CEO is notified." checked={delay} onChange={setDelay} />
            {delay && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Reason (preset list)">
                  {(id) => (
                    <Select id={id} value={reason} onChange={(e) => setReason(e.target.value)}>
                      {DELAY_REASONS.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="Affected stage">
                  {(id) => (
                    <Select id={id} value={affected} onChange={(e) => setAffected(e.target.value)}>
                      {JOURNEY_STAGES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="Original arrival">{(id) => <TextInput id={id} defaultValue="14 – 21 Nov" readOnly />}</Field>
                <Field label="New arrival range">{(id) => <TextInput id={id} value={newRange} onChange={(e) => setNewRange(e.target.value)} />}</Field>
                {reason.startsWith("Other") && (
                  <p className="text-sm text-amber-text sm:col-span-2">&ldquo;Other&rdquo; needs CEO approval before it is published.</p>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <PillButton type="submit" variant="primary" disabled={published}>
              {published ? "Published" : "Publish update"}
            </PillButton>
            <PillButton variant="outline" arrow={false}>
              Save as internal note
            </PillButton>
          </div>
          <p className="text-xs text-slate">
            On publish: the buyer&apos;s page refreshes and the CEO is notified. Emails to the buyer use the CEO&apos;s
            approved templates.
          </p>
          {published && (
            <p role="status" className="rounded-panel bg-success-bg p-3 text-sm text-success">
              Published (prototype). The tracker marker moves only now, on this published update.
            </p>
          )}
        </form>
      </Card>

      <div className="flex flex-col gap-6">
        <Card as="section" aria-label="Preview: what the buyer will see" className="p-5 md:p-6">
          <p className="eyebrow">Preview · what the buyer will see</p>
          {delay && (
            <DelayNotice className="mt-3" date="16 Oct" reason={`${reason} at Tema`} newRange={newRange}>
              {note}
            </DelayNotice>
          )}
          <div className="mt-3 rounded-panel border border-platinum p-4">
            <p className="flex justify-between gap-2 text-sm">
              <span className="font-semibold">
                {stage} · {place}
              </span>
              <span className="text-slate">{when}</span>
            </p>
            <p className="mt-1 text-sm">{note}</p>
          </div>
        </Card>

        <Card as="section" aria-label="History for this shipment" className="p-5 md:p-6">
          <h2 className="font-display text-lg font-semibold">History for this shipment</h2>
          <table className="mt-3 w-full text-sm">
            <caption className="sr-only">Published updates</caption>
            <thead>
              <tr className="border-b border-platinum">
                <th scope="col" className="eyebrow py-2 text-left">When</th>
                <th scope="col" className="eyebrow py-2 text-left">Update</th>
                <th scope="col" className="eyebrow py-2 text-left">By</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_TRACKING_HISTORY.map((h) => (
                <tr key={h.when} className="border-b border-platinum last:border-0">
                  <td className="py-2 tabular">{h.when}</td>
                  <td className="py-2">{h.update}</td>
                  <td className="py-2">{h.by}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-slate">Stale-update reminder: no update for 3 days puts this shipment at the top of Today.</p>
        </Card>

        <Card as="section" aria-label="Export checklist" className="p-5 md:p-6">
          <h2 className="font-display text-lg font-semibold">Export checklist</h2>
          <p className="text-xs text-slate">The platform records status; licensed forwarders do the filing.</p>
          <ul className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
            {EXPORT_CHECKLIST.map((c) => (
              <li key={c.item} className="flex items-center gap-2">
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${c.done ? "bg-charcoal text-white" : "border-2 border-silver"}`} aria-hidden>
                  {c.done && <CheckIcon className="h-3 w-3" />}
                </span>
                {c.item}
                <span className="sr-only">{c.done ? "(done)" : "(open)"}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

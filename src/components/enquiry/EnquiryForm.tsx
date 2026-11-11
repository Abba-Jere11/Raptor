"use client";

import { useActionState, useEffect, useState } from "react";
import { PillButton } from "@/components/ui/Button";
import { Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import type { EnquiryKind, PublicDestination } from "@/lib/db/types";
import { submitEnquiry, type EnquiryState } from "@/lib/enquiry-actions";
import { HONEYPOT_FIELD, STARTED_FIELD } from "@/lib/enquiries";
import { destinationPublicState } from "@/lib/quotes";

const COPY: Record<EnquiryKind, { submit: string; done: string; detail: string }> = {
  quote_request: {
    submit: "Request a quotation",
    done: "Your request is with us.",
    detail: "A member of the team will prepare a quotation with shipping to your port. Nothing is sent automatically, and there is nothing to pay now.",
  },
  information: {
    submit: "Send me the details",
    done: "The details are on their way.",
    detail: "We will email you the details of this vehicle. There is no deadline and nobody will push you to decide.",
  },
  enquiry: {
    submit: "Send message",
    done: "Your message is with us.",
    detail: "A member of the team will reply to you in the way you chose.",
  },
};

export function EnquiryForm({
  kind,
  vehicleId,
  destinations = [],
  sourcePath,
  initialDestination,
}: {
  kind: EnquiryKind;
  vehicleId?: string;
  destinations?: PublicDestination[];
  sourcePath: string;
  initialDestination?: string;
}) {
  const [state, action, pending] = useActionState<EnquiryState, FormData>(submitEnquiry, {});
  const [started, setStarted] = useState(0);
  const [destination, setDestination] = useState(initialDestination ?? "");
  const [preferred, setPreferred] = useState("email");
  useEffect(() => setStarted(Date.now()), []);

  if (state.done) {
    return (
      <div role="status" className="rounded-card bg-platinum p-6">
        <p className="font-display text-xl font-semibold">{COPY[kind].done}</p>
        {state.reference && (
          <p className="mt-3 text-sm text-slate">
            Your reference is <span className="font-mono font-medium text-charcoal">{state.reference}</span>. Keep it for any reply.
          </p>
        )}
        <p className="mt-3 text-sm text-charcoal">{COPY[kind].detail}</p>
      </div>
    );
  }

  const chosen = destinations.find((d) => d.id === destination);
  const countries = [...new Set(destinations.map((d) => d.country))].sort();

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="source_path" value={sourcePath} />
      <input type="hidden" name={STARTED_FIELD} value={started || ""} />
      {vehicleId && <input type="hidden" name="vehicle_id" value={vehicleId} />}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Leave this empty
          <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <Field label="Your name">
        {(id) => <TextInput id={id} name="name" autoComplete="name" required aria-invalid={state.field === "name"} />}
      </Field>
      <Field label="Email">
        {(id) => <TextInput id={id} name="email" type="email" autoComplete="email" required aria-invalid={state.field === "email"} />}
      </Field>
      <Field label="WhatsApp or phone (optional)" hint="With the country code, for example +233 20 000 0000.">
        {(id) => <TextInput id={id} name="whatsapp" type="tel" autoComplete="tel" aria-invalid={state.field === "whatsapp"} />}
      </Field>
      <fieldset className="flex flex-col gap-2">
        <legend className="eyebrow mb-1.5">How should we reach you?</legend>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["email", "Email"],
              ["whatsapp", "WhatsApp"],
              ["phone", "Phone"],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className={`inline-flex h-10 cursor-pointer items-center rounded-full border px-4 text-sm font-medium has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-crimson ${
                preferred === value ? "border-charcoal bg-charcoal text-white" : "border-silver bg-white text-charcoal hover:border-charcoal"
              }`}
            >
              <input type="radio" name="preferred" value={value} checked={preferred === value} onChange={() => setPreferred(value)} className="sr-only" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {kind === "quote_request" && (
        <div className="flex flex-col gap-2">
          <Field label="Where is it going?">
            {(id) => (
              <Select id={id} name="destination_id" value={destination} onChange={(e) => setDestination(e.target.value)} aria-invalid={state.field === "destination"}>
                <option value="">Choose a country and port</option>
                {countries.map((country) => (
                  <optgroup key={country} label={country}>
                    {destinations
                      .filter((d) => d.country === country)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.port}, {d.country}
                        </option>
                      ))}
                  </optgroup>
                ))}
                <option value="other">Another country or port</option>
              </Select>
            )}
          </Field>
          {chosen && (
            <p className="text-sm text-slate" aria-live="polite">
              Shipping to {chosen.port}: <span className="font-semibold text-charcoal">{destinationPublicState(chosen.status)}</span>
              {chosen.status === "not_served" ? ". You can still ask, and we will tell you honestly what is possible." : "."}
            </p>
          )}
          {(destination === "other" || destinations.length === 0) && (
            <Field label="Country and port">
              {(id) => <TextInput id={id} name="destination_other" placeholder="For example: Tema, Ghana" aria-invalid={state.field === "destination"} />}
            </Field>
          )}
        </div>
      )}

      <Field label={kind === "enquiry" ? "How can we help?" : "Anything we should know? (optional)"}>
        {(id) => <TextArea id={id} name="message" maxLength={2000} aria-invalid={state.field === "message"} />}
      </Field>

      {state.error && (
        <p role="alert" className="rounded-panel bg-crimson/10 px-4 py-3 text-sm font-medium text-crimson">
          {state.error}
        </p>
      )}

      <div>
        <PillButton type="submit" variant={kind === "quote_request" ? "primary" : "dark"} disabled={pending || !started}>
          {pending ? "Sending…" : COPY[kind].submit}
        </PillButton>
      </div>
      <p className="text-xs text-slate">
        We use these details only to reply to you. There is no account to create and no payment is taken on this website.
      </p>
    </form>
  );
}

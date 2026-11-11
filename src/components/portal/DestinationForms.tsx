"use client";

import { useActionState } from "react";
import { PillButton } from "@/components/ui/Button";
import { Field, Select, TextInput } from "@/components/ui/Field";
import { addDestination, updateDestination } from "@/lib/destination-actions";
import type { Destination } from "@/lib/db/types";
import { DESTINATION_STATUS_LABEL } from "@/lib/quotes";

function Message({ state }: { state: { ok?: string; error?: string } }) {
  if (state.error) return <p className="text-sm text-crimson" role="alert">{state.error}</p>;
  if (state.ok) return <p className="text-sm text-success" role="status">{state.ok}</p>;
  return null;
}

function StatusSelect({ defaultValue, label, id }: { defaultValue: string; label?: string; id?: string }) {
  return (
    <Select id={id} name="status" aria-label={label} defaultValue={defaultValue}>
      {Object.entries(DESTINATION_STATUS_LABEL).map(([value, text]) => (
        <option key={value} value={value}>
          {text}
        </option>
      ))}
    </Select>
  );
}

export function AddDestinationForm({ canSetStatus }: { canSetStatus: boolean }) {
  const [state, action, pending] = useActionState(addDestination, {});
  return (
    <form action={action} key={state.ok} className="grid gap-4">
      <Field label="Country">{(id) => <TextInput id={id} name="country" maxLength={80} required />}</Field>
      <Field label="Port">{(id) => <TextInput id={id} name="port" maxLength={80} required />}</Field>
      <Field label="Notes (staff only)">{(id) => <TextInput id={id} name="notes" maxLength={500} />}</Field>
      {canSetStatus ? (
        <Field label="Status">{(id) => <StatusSelect id={id} defaultValue="confirm_each_time" />}</Field>
      ) : (
        <p className="text-sm text-slate">New ports start as Confirm each time. Only the CEO opens or closes a destination.</p>
      )}
      <PillButton type="submit" variant="dark" disabled={pending}>
        Add destination
      </PillButton>
      <Message state={state} />
    </form>
  );
}

export function DestinationRow({ destination, canSetStatus }: { destination: Destination; canSetStatus: boolean }) {
  const [state, action, pending] = useActionState(updateDestination.bind(null, destination.id), {});
  return (
    <form action={action} className="grid items-start gap-2 border-b border-platinum py-3 md:grid-cols-[1fr_1fr_1.4fr_190px_auto]">
      <TextInput name="country" aria-label="Country" defaultValue={destination.country} maxLength={80} required />
      <TextInput name="port" aria-label="Port" defaultValue={destination.port} maxLength={80} required />
      <TextInput name="notes" aria-label="Notes" defaultValue={destination.notes ?? ""} maxLength={500} />
      {canSetStatus ? (
        <StatusSelect defaultValue={destination.status} label={`Status for ${destination.port}`} />
      ) : (
        <p className="flex h-12 items-center text-sm font-medium">{DESTINATION_STATUS_LABEL[destination.status]}</p>
      )}
      <PillButton type="submit" variant="outline" size="sm" arrow={false} disabled={pending} className="mt-1.5">
        Save
      </PillButton>
      <div className="md:col-span-5">
        <Message state={state} />
      </div>
    </form>
  );
}

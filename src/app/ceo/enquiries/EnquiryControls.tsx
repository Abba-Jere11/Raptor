"use client";

import { useActionState } from "react";
import { PillButton } from "@/components/ui/Button";
import { Field, Select, TextArea } from "@/components/ui/Field";
import { addEnquiryNote, prepareQuote, updateEnquiry } from "@/app/ceo/enquiries/actions";
import type { Destination, EnquiryStatus } from "@/lib/db/types";
import { DESTINATION_STATUS_LABEL, ENQUIRY_STATUS_LABEL } from "@/lib/quotes";

function Message({ state }: { state: { ok?: string; error?: string } }) {
  if (state.error) return <p className="text-sm text-crimson" role="alert">{state.error}</p>;
  if (state.ok) return <p className="text-sm text-success">{state.ok}</p>;
  return null;
}

export function StatusForm({
  id,
  status,
  owner,
  staff,
}: {
  id: string;
  status: EnquiryStatus;
  owner: string | null;
  staff: { id: string; name: string; role: string }[];
}) {
  const [state, action, pending] = useActionState(updateEnquiry.bind(null, id), {});
  return (
    <form action={action} className="grid gap-4">
      <Field label="Status">
        {(fid) => (
          <Select id={fid} name="status" defaultValue={status}>
            {Object.entries(ENQUIRY_STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="Owner">
        {(fid) => (
          <Select id={fid} name="assigned_to" defaultValue={owner ?? ""}>
            <option value="">Nobody yet</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.role})
              </option>
            ))}
          </Select>
        )}
      </Field>
      <PillButton type="submit" variant="dark" disabled={pending}>
        Save
      </PillButton>
      <Message state={state} />
    </form>
  );
}

export function NoteForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(addEnquiryNote.bind(null, id), {});
  return (
    <form action={action} className="grid gap-3" key={state.ok}>
      <Field label="Add a note" hint="Only staff can see notes.">
        {(fid) => <TextArea id={fid} name="note" maxLength={2000} required />}
      </Field>
      <PillButton type="submit" variant="outline" size="sm" disabled={pending} className="justify-self-start">
        Add note
      </PillButton>
      <Message state={state} />
    </form>
  );
}

export function PrepareQuoteForm({
  id,
  destinations,
  initialDestination,
}: {
  id: string;
  destinations: Destination[];
  initialDestination: string | null;
}) {
  const [state, action, pending] = useActionState(prepareQuote.bind(null, id), {});
  return (
    <form action={action} className="grid gap-4">
      <Field label="Ship to" hint="You can change this in the quotation.">
        {(fid) => (
          <Select id={fid} name="destination_id" defaultValue={initialDestination ?? ""}>
            <option value="">Decide later</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.id} disabled={d.status === "not_served"}>
                {d.port}, {d.country} ({DESTINATION_STATUS_LABEL[d.status]})
              </option>
            ))}
          </Select>
        )}
      </Field>
      <PillButton type="submit" variant="primary" disabled={pending}>
        Prepare quotation
      </PillButton>
      <Message state={state} />
    </form>
  );
}

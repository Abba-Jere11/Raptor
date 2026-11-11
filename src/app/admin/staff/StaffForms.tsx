"use client";

import { useActionState } from "react";
import { PillButton } from "@/components/ui/Button";
import { Field, Select, TextInput } from "@/components/ui/Field";
import { createStaffFromAuthorisation, deactivateStaffForm, resetTwoStepForm } from "@/app/admin/actions";
import type { StaffAuthorisation, StaffRole, StaffStatus } from "@/lib/db/types";
import { ROLE_LABEL } from "@/lib/permissions";

export function CreateStaffForm({ authorisations }: { authorisations: StaffAuthorisation[] }) {
  const [state, action, pending] = useActionState(createStaffFromAuthorisation, {});
  return (
    <form action={action} className="mt-4 grid gap-4">
      <Field label="CEO authorisation">
        {(id) => (
          <Select id={id} name="authorisation_id" required defaultValue="">
            <option value="" disabled>
              {authorisations.length ? "Choose…" : "None open"}
            </option>
            {authorisations.map((a) => (
              <option key={a.id} value={a.id}>
                {a.email} · {ROLE_LABEL[a.role]}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="Name">{(id) => <TextInput id={id} name="name" required />}</Field>
      <p className="rounded-panel bg-platinum p-3 text-sm">Two-step verification is mandatory at first sign-in.</p>
      <PillButton type="submit" variant="dark" disabled={pending || authorisations.length === 0}>
        Create account and send invite
      </PillButton>
      {state.ok && <p className="text-sm text-success">{state.ok}</p>}
      {state.error && <p className="text-sm text-crimson">{state.error}</p>}
    </form>
  );
}

export function StaffRowActions({ id, role, status }: { id: string; role: StaffRole; status: StaffStatus }) {
  if (role === "ceo" || status === "deactivated") return null;
  return (
    <div className="flex flex-wrap gap-1">
      <form action={deactivateStaffForm.bind(null, id)}>
        <button type="submit" className="rounded-full border border-silver px-2 py-1 text-xs font-semibold hover:border-charcoal">
          Deactivate
        </button>
      </form>
      <form action={resetTwoStepForm.bind(null, id)}>
        <button type="submit" className="rounded-full border border-silver px-2 py-1 text-xs font-semibold hover:border-charcoal">
          Reset two-step
        </button>
      </form>
    </div>
  );
}

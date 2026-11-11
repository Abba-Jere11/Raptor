"use client";

import { useActionState } from "react";
import { PillButton } from "@/components/ui/Button";
import { Field, Select, TextInput } from "@/components/ui/Field";
import { authoriseStaff, revokeAuthorisationForm } from "@/app/ceo/actions";

export function AuthoriseForm() {
  const [state, action, pending] = useActionState(authoriseStaff, {});
  return (
    <form action={action} className="mt-4 grid gap-4">
      <Field label="Work email">{(id) => <TextInput id={id} name="email" type="email" required />}</Field>
      <Field label="Role">
        {(id) => (
          <Select id={id} name="role" required>
            <option value="administrator">Administrator</option>
            <option value="sales">Sales</option>
            <option value="finance">Finance</option>
          </Select>
        )}
      </Field>
      <Field label="Notes">{(id) => <TextInput id={id} name="notes" />}</Field>
      <PillButton type="submit" variant="dark" disabled={pending}>
        Authorise
      </PillButton>
      {state.ok && <p className="text-sm text-success">{state.ok}</p>}
      {state.error && <p className="text-sm text-crimson">{state.error}</p>}
    </form>
  );
}

export function RevokeButton({ id }: { id: string }) {
  return (
    <form action={revokeAuthorisationForm.bind(null, id)}>
      <button type="submit" className="rounded-full border border-silver px-3 py-1 text-xs font-semibold">
        Revoke
      </button>
    </form>
  );
}

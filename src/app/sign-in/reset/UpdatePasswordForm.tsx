"use client";

import { useActionState } from "react";
import { PillButton } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/Field";
import { updatePasswordAction } from "@/app/auth/actions";

export function UpdatePasswordForm() {
  const [state, action, pending] = useActionState(updatePasswordAction, {});
  return (
    <form action={action} className="grid gap-4">
      <Field label="New password" hint="At least 10 characters, mixed case, a number and a symbol.">
        {(id) => <TextInput id={id} name="password" type="password" autoComplete="new-password" required minLength={10} />}
      </Field>
      {state.error && (
        <p role="alert" className="text-sm text-crimson">
          {state.error}
        </p>
      )}
      <PillButton type="submit" variant="dark" disabled={pending}>
        Save password
      </PillButton>
    </form>
  );
}

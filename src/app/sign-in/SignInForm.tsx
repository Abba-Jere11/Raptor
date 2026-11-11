"use client";

import { useActionState } from "react";
import Link from "next/link";
import { PillButton } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/Field";
import { requestResetAction, signInAction } from "@/app/auth/actions";
import { routes } from "@/lib/routes";

export function SignInForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signInAction, {});
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="next" value={next} />
      <Field label="Work email">{(id) => <TextInput id={id} name="email" type="email" autoComplete="username" required />}</Field>
      <Field label="Password">{(id) => <TextInput id={id} name="password" type="password" autoComplete="current-password" required />}</Field>
      {state.error && (
        <p role="alert" className="text-sm text-crimson">
          {state.error}
        </p>
      )}
      <PillButton type="submit" variant="dark" disabled={pending}>
        Continue
      </PillButton>
      <p className="text-sm">
        <Link href={routes.reset} className="font-semibold underline">
          Reset password
        </Link>
      </p>
    </form>
  );
}

export function ResetRequestForm() {
  const [state, action, pending] = useActionState(requestResetAction, {});
  if (state.enrolled) {
    return <p role="status">If that address has an account, we sent a reset link. Locally it appears in the mail viewer at http://127.0.0.1:54324.</p>;
  }
  return (
    <form action={action} className="grid gap-4">
      <Field label="Work email">{(id) => <TextInput id={id} name="email" type="email" required />}</Field>
      <PillButton type="submit" variant="dark" disabled={pending}>
        Send reset link
      </PillButton>
    </form>
  );
}

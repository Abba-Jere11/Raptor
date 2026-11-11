"use client";

import { useActionState } from "react";
import { PillButton } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/Field";
import { verifyTwoStep } from "@/app/auth/actions";

export function TwoStepForm({
  factorId,
  qr,
  next,
  error,
}: {
  factorId: string;
  qr?: string;
  next: string;
  error?: string;
}) {
  const [state, action, pending] = useActionState(verifyTwoStep, {});
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="factorId" value={factorId} />
      <input type="hidden" name="next" value={next} />
      {qr && (
        <div className="flex justify-center rounded-panel border border-platinum bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="Authenticator QR code" width={180} height={180} />
        </div>
      )}
      <Field label="6-digit code">
        {(id) => <TextInput id={id} name="code" inputMode="numeric" autoComplete="one-time-code" required maxLength={8} className="tabular tracking-[0.3em]" />}
      </Field>
      {(state.error || error) && (
        <p role="alert" className="text-sm text-crimson">
          {state.error ?? error}
        </p>
      )}
      <PillButton type="submit" variant="dark" disabled={pending || !factorId}>
        Verify
      </PillButton>
    </form>
  );
}

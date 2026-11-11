import type { Metadata } from "next";
import { beginTwoStep } from "@/app/auth/actions";
import { AuthFrame } from "@/components/portal/AuthFrame";
import { TwoStepForm } from "@/app/sign-in/two-step/TwoStepForm";

export const metadata: Metadata = { title: "Two-step verification" };

export default async function TwoStepPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const start = await beginTwoStep();
  const { next } = await searchParams;
  return (
    <AuthFrame
      title="Two-step verification"
      note={
        start.qr
          ? "Scan this code with your authenticator app, then enter the 6-digit code. You must do this before you can see anything."
          : "Enter the 6-digit code from your authenticator app."
      }
    >
      <TwoStepForm factorId={start.factorId ?? ""} qr={start.qr} next={next ?? ""} error={start.error} />
    </AuthFrame>
  );
}

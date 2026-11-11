import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getStaff } from "@/lib/auth";
import { homeForRole } from "@/lib/routes";
import { AuthFrame } from "@/components/portal/AuthFrame";
import { SignInForm } from "@/app/sign-in/SignInForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const staff = await getStaff();
  if (staff) redirect(homeForRole(staff.role));
  const { next } = await searchParams;
  return (
    <AuthFrame title="Sign in" note="Staff only. Two-step verification is required.">
      <SignInForm next={next ?? ""} />
    </AuthFrame>
  );
}

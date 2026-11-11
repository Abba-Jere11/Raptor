import type { Metadata } from "next";
import { AuthFrame } from "@/components/portal/AuthFrame";
import { ResetRequestForm } from "@/app/sign-in/SignInForm";
import { UpdatePasswordForm } from "@/app/sign-in/reset/UpdatePasswordForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return (
    <AuthFrame title="Reset password" note={user ? "Choose a new password." : "We will email a link if the address has an account."}>
      {user ? <UpdatePasswordForm /> : <ResetRequestForm />}
    </AuthFrame>
  );
}

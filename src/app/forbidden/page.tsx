import type { Metadata } from "next";
import { signOutAction } from "@/app/auth/actions";

export const metadata: Metadata = { title: "Not allowed" };

export default function ForbiddenPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4">
      <h1 className="font-display text-3xl font-semibold">You cannot open this page</h1>
      <p className="mt-2 text-slate">Your role does not include this area. If that is wrong, ask the CEO.</p>
      <form action={signOutAction} className="mt-6">
        <button type="submit" className="font-semibold underline">
          Back to sign in
        </button>
      </form>
    </main>
  );
}

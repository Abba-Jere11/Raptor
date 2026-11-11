"use client";

import { signOutAction } from "@/app/auth/actions";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button type="submit" className="rounded-full border border-silver px-3 py-1.5 text-sm font-semibold hover:border-charcoal">
        Sign out
      </button>
    </form>
  );
}

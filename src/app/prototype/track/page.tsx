import type { Metadata } from "next";
import { TrackSignIn } from "@/prototype/track/TrackSignIn";

export const metadata: Metadata = { title: "Journey Tracker sign-in" };

export default function TrackSignInPage() {
  return <TrackSignIn />;
}

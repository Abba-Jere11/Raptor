import type { Metadata } from "next";
import { RequestFlow } from "@/prototype/site/RequestFlow";

export const metadata: Metadata = { title: "Request a Vehicle (Figures 8-9)" };

export default function RequestPage() {
  return <RequestFlow />;
}

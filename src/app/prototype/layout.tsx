import type { Metadata } from "next";
import { MockBanner } from "@/components/ui/MockBanner";

export const metadata: Metadata = {
  title: { default: "Prototype", template: "%s · Prototype · Raptors" },
  robots: { index: false, follow: false },
};

export default function PrototypeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MockBanner />
      {children}
    </>
  );
}

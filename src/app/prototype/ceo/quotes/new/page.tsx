import type { Metadata } from "next";
import { PortalShell } from "@/components/ui/PortalShell";
import { QuoteBuilder } from "@/prototype/ceo/QuoteBuilder";
import { CEO_NAV } from "@/prototype/portals";

export const metadata: Metadata = { title: "CEO · Quotation builder" };

export default function QuoteBuilderPage() {
  return (
    <PortalShell portal="CEO Portal" sectionLabel="Owner" nav={CEO_NAV} active="Quotes" title="New quotation">
      <QuoteBuilder />
    </PortalShell>
  );
}

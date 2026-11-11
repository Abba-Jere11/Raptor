import type { Metadata } from "next";
import { PortalShell } from "@/components/ui/PortalShell";
import { RequestsBoard } from "@/prototype/ceo/RequestsBoard";
import { CEO_NAV } from "@/prototype/portals";

export const metadata: Metadata = { title: "CEO · Vehicle requests (Figure 16)" };

export default function CeoRequestsPage() {
  return (
    <PortalShell portal="CEO Portal" sectionLabel="Owner" nav={CEO_NAV} active="Vehicle requests" title="Vehicle requests">
      <RequestsBoard />
    </PortalShell>
  );
}

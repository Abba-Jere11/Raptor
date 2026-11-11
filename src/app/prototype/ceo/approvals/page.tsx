import type { Metadata } from "next";
import { PortalShell } from "@/components/ui/PortalShell";
import { ApprovalsQueue } from "@/prototype/ceo/ApprovalsQueue";
import { CEO_NAV } from "@/prototype/portals";

export const metadata: Metadata = { title: "CEO · Approvals" };

export default function ApprovalsPage() {
  return (
    <PortalShell portal="CEO Portal" sectionLabel="Owner" nav={CEO_NAV} active="Approvals" title="Approvals">
      <ApprovalsQueue />
    </PortalShell>
  );
}

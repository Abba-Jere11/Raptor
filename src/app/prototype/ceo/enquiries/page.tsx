import type { Metadata } from "next";
import { PortalShell } from "@/components/ui/PortalShell";
import { EnquiryInbox } from "@/prototype/ceo/EnquiryInbox";
import { CEO_NAV } from "@/prototype/portals";

export const metadata: Metadata = { title: "CEO · Enquiry inbox" };

export default function EnquiriesPage() {
  return (
    <PortalShell portal="CEO Portal" sectionLabel="Owner" nav={CEO_NAV} active="Enquiries" title="Enquiries">
      <EnquiryInbox />
    </PortalShell>
  );
}

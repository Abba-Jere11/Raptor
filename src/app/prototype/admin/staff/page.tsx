import type { Metadata } from "next";
import { PortalShell } from "@/components/ui/PortalShell";
import { ADMIN_NAV } from "@/prototype/portals";
import { StaffAccounts } from "@/prototype/admin/StaffAccounts";

export const metadata: Metadata = { title: "Administrator · Staff accounts and permissions" };

export default function StaffPage() {
  return (
    <PortalShell portal="Administrator" sectionLabel="Records and technical" nav={ADMIN_NAV} active="Staff accounts" title="Staff accounts and permissions">
      <StaffAccounts />
    </PortalShell>
  );
}

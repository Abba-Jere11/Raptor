import type { Metadata } from "next";
import { PortalShell } from "@/components/ui/PortalShell";
import { ADMIN_NAV } from "@/prototype/portals";
import { VehicleRecords } from "@/prototype/admin/VehicleRecords";

export const metadata: Metadata = { title: "Administrator · Vehicle records (Figure 19)" };

export default function AdminVehiclesPage() {
  return (
    <PortalShell portal="Administrator" sectionLabel="Records and technical" nav={ADMIN_NAV} active="Vehicle records" title="Vehicle records">
      <VehicleRecords />
    </PortalShell>
  );
}

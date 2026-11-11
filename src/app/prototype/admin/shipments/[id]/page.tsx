import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PortalShell } from "@/components/ui/PortalShell";
import { MOCK_SHIPMENTS } from "@/mock/MOCK_DATA_shipments";
import { TrackingUpdate } from "@/prototype/admin/TrackingUpdate";
import { ADMIN_NAV } from "@/prototype/portals";

export const metadata: Metadata = { title: "Administrator · Tracking update (Figure 20)" };

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return MOCK_SHIPMENTS.map((s) => ({ id: s.id }));
}

export default async function ShipmentPage({ params }: Props) {
  const { id } = await params;
  const s = MOCK_SHIPMENTS.find((x) => x.id === id);
  if (!s) notFound();
  return (
    <PortalShell portal="Administrator" sectionLabel="Records and technical" nav={ADMIN_NAV} active="Shipments" title={`Shipments · ${s.id}`}>
      <TrackingUpdate shipment={s} />
    </PortalShell>
  );
}

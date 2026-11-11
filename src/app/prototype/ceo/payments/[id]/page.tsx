import type { Metadata } from "next";
import { PortalShell } from "@/components/ui/PortalShell";
import { MOCK_ORDER } from "@/mock/MOCK_DATA_orders";
import { RecordPayment } from "@/prototype/ceo/RecordPayment";
import { CEO_NAV } from "@/prototype/portals";

export const metadata: Metadata = { title: "CEO · Record a payment (Figure 17)" };

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return [{ id: MOCK_ORDER.id }];
}

export default async function PaymentPage({ params }: Props) {
  const { id } = await params;
  return (
    <PortalShell portal="CEO Portal" sectionLabel="Owner" nav={CEO_NAV} active="Payments" title={`Order ${id} · Record a payment`}>
      <RecordPayment />
    </PortalShell>
  );
}

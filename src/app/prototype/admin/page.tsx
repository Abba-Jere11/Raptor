import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/Chip";
import { PortalShell } from "@/components/ui/PortalShell";
import { MOCK_SHIPMENTS } from "@/mock/MOCK_DATA_shipments";
import { MOCK_VEHICLES, vehicleTitle } from "@/mock/MOCK_DATA_vehicles";
import { ADMIN_NAV } from "@/prototype/portals";
import { routes } from "@/prototype/routes";

export const metadata: Metadata = { title: "Administrator · Today" };

/** The Administrator's own queue. No customer, money or bidding items appear here. */
export default function AdminTodayPage() {
  const stale = MOCK_SHIPMENTS.filter((s) => s.stale);
  const drafts = MOCK_VEHICLES.filter((v) => v.status === "Draft" || v.photoCount < 10);
  return (
    <PortalShell portal="Administrator" sectionLabel="Records and technical" nav={ADMIN_NAV} active="Today" title="Today">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold">Shipments needing an update</h2>
          <p className="text-sm text-slate">No update for 3 days or more. The buyer&apos;s tracker must never go quiet.</p>
          <ul className="mt-4 divide-y divide-platinum">
            {stale.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                <Link href={routes.admin.shipment(s.id)} className="hover:underline">
                  <span className="block font-mono text-sm font-semibold">{s.id}</span>
                  <span className="text-sm">
                    {s.vehicle} · {s.destination}
                  </span>
                </Link>
                <span className="text-right text-sm text-slate">
                  Last update {s.lastUpdate}
                  {s.deadlineFlag === "missed" && (
                    <span className="mt-1 block">
                      <StatusChip status="Overdue" />
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold">Vehicle drafts waiting for media</h2>
          <ul className="mt-4 divide-y divide-platinum">
            {drafts.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-3 py-3">
                <Link href={routes.admin.vehicles} className="hover:underline">
                  <span className="block font-mono text-sm font-semibold">{v.id}</span>
                  <span className="text-sm">{vehicleTitle(v)}</span>
                </Link>
                <span className="text-sm text-slate tabular">{v.photoCount} photos</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold">Approved corrections to apply</h2>
          <ul className="mt-4 divide-y divide-platinum text-sm">
            <li className="py-3">
              <span className="font-mono font-semibold">AP-302</span> · RA-0393 location Tampa → Orlando · approved by CEO 30 Oct
            </li>
          </ul>
          <p className="mt-2 text-xs text-slate">Each correction is applied with a reason and an audit-trail entry.</p>
        </Card>
        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold">Accounts the CEO has authorised</h2>
          <ul className="mt-4 divide-y divide-platinum text-sm">
            <li className="flex justify-between py-3">
              <span>Finance 01 · Finance role</span>
              <StatusChip status="Pending" />
            </li>
          </ul>
          <Link href={routes.admin.staff} className="mt-3 inline-block text-sm font-semibold underline">
            Open staff accounts
          </Link>
        </Card>
      </div>
    </PortalShell>
  );
}

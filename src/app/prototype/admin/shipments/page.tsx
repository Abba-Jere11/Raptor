import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { PortalShell } from "@/components/ui/PortalShell";
import { MOCK_SHIPMENTS, type ShipmentStage } from "@/mock/MOCK_DATA_shipments";
import { ADMIN_NAV } from "@/prototype/portals";
import { routes } from "@/prototype/routes";

export const metadata: Metadata = { title: "Administrator · Shipment board" };

const COLUMNS: ShipmentStage[] = ["Preparing documents", "At port", "Loaded", "At sea", "Arrived", "Released"];

/**
 * Newly designed: shipment board by stage. Flags the 72-hour export deadline
 * (calculated from the vessel cut-off) and shipments with no update for 3 days.
 */
export default function ShipmentBoardPage() {
  return (
    <PortalShell portal="Administrator" sectionLabel="Records and technical" nav={ADMIN_NAV} active="Shipments" title="Shipment board">
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <Chip tone="brand">72-hour deadline missed</Chip>
        <Chip tone="warning">Deadline within 3 days</Chip>
        <Chip tone="warning">No update for 3 days</Chip>
        <Chip tone="outline">Delay reported</Chip>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const items = MOCK_SHIPMENTS.filter((s) => s.stage === col);
          return (
            <section key={col} aria-label={col} className="w-72 shrink-0">
              <h2 className="eyebrow mb-3 flex justify-between !text-charcoal">
                {col} <span className="tabular">{items.length}</span>
              </h2>
              <ul className="flex flex-col gap-3">
                {items.map((s) => (
                  <li key={s.id}>
                    <Card className="relative p-4">
                      <Link href={routes.admin.shipment(s.id)} className="font-mono text-sm font-semibold after:absolute after:inset-0 hover:underline">
                        {s.id}
                      </Link>
                      <p className="mt-1 text-sm font-medium">{s.vehicle}</p>
                      <p className="text-sm text-slate">{s.destination}</p>
                      <p className="mt-2 text-xs">
                        Cut-off {s.cutoff} · 72 h: <span className="font-semibold">{s.deadline72}</span>
                      </p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-platinum" aria-hidden>
                        <div className="h-full bg-charcoal" style={{ width: `${(s.checklistDone / s.checklistTotal) * 100}%` }} />
                      </div>
                      <p className="mt-1 text-xs text-slate">
                        Checklist {s.checklistDone}/{s.checklistTotal} · updated {s.lastUpdate}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {s.deadlineFlag === "missed" && <Chip tone="brand">Deadline missed</Chip>}
                        {s.deadlineFlag === "soon" && <Chip tone="warning">Deadline soon</Chip>}
                        {s.stale && <Chip tone="warning">No update 3+ days</Chip>}
                        {s.delayed && <Chip tone="outline">Delay</Chip>}
                      </div>
                    </Card>
                  </li>
                ))}
                {items.length === 0 && <li className="rounded-panel border border-dashed border-silver p-4 text-sm text-slate">None</li>}
              </ul>
            </section>
          );
        })}
      </div>
    </PortalShell>
  );
}

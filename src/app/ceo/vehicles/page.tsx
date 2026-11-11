import type { Metadata } from "next";
import Link from "next/link";
import { StatusChip } from "@/components/ui/Chip";
import { DataTable } from "@/components/ui/Table";
import { CeoShell } from "@/components/portal/CeoShell";
import { requireStaff } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/permissions";
import type { Vehicle } from "@/lib/db/types";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "CEO · Vehicles" };

export default async function CeoVehiclesPage() {
  const { staff } = await requireStaff(["ceo", "sales", "finance"]);
  const supabase = await createClient();
  const { data: vehicles } = await supabase.from("vehicles").select("*").order("updated_at", { ascending: false });
  const canSeeCosts = staff.role === "ceo" || staff.role === "finance";
  const { data: costs } = canSeeCosts ? await supabase.from("vehicle_costs").select("*") : { data: [] as never[] };
  const totals = new Map<string, number>();
  for (const c of costs ?? []) totals.set(c.vehicle_id, (totals.get(c.vehicle_id) ?? 0) + c.amount_cents);

  return (
    <CeoShell title="Vehicles" active="Vehicles" role={staff.role}>
      <DataTable
        caption="Vehicles"
        rowKey={(r) => r.id}
        rows={vehicles ?? []}
        columns={[
          {
            key: "v",
            header: "Vehicle",
            render: (r) => (
              <Link href={routes.ceo.vehicle(r.id)} className="hover:underline">
                <span className="block font-medium">
                  {r.year} {r.make} {r.model}
                </span>
                <span className="font-mono text-xs">{r.stock_number}</span>
                {r.is_mock && <span className="ml-2 text-xs text-slate">MOCK DATA</span>}
              </Link>
            ),
          },
          { key: "p", header: "Price", align: "right", render: (r) => formatMoney({ cents: r.price_cents, currency: "USD" }) },
          ...(canSeeCosts
            ? [
                {
                  key: "c",
                  header: "Recorded costs",
                  align: "right" as const,
                  render: (r: Vehicle) =>
                    totals.has(r.id) ? formatMoney({ cents: totals.get(r.id)!, currency: "USD" }) : <span className="text-slate">Incomplete data</span>,
                },
              ]
            : []),
          { key: "s", header: "Status", render: (r) => <StatusChip status={STATUS_LABEL[r.status] ?? r.status} /> },
        ]}
      />
    </CeoShell>
  );
}

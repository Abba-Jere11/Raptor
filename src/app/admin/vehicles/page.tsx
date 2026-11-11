import type { Metadata } from "next";
import Link from "next/link";
import { PillButton } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/Chip";
import { DataTable } from "@/components/ui/Table";
import { AdminShell } from "@/components/portal/AdminShell";
import { formatMoney } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/permissions";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import type { VehicleStatus } from "@/lib/db/types";

export const metadata: Metadata = { title: "Administrator · Vehicle records" };

export default async function AdminVehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("vehicles").select("*").order("updated_at", { ascending: false });
  if (status) query = query.eq("status", status as VehicleStatus);
  if (q) query = query.or(`stock_number.ilike.%${q}%,vin.ilike.%${q}%,make.ilike.%${q}%,model.ilike.%${q}%`);
  const { data: rows } = await query;
  const ids = (rows ?? []).map((row) => row.id);
  const { data: media } = ids.length
    ? await supabase.from("vehicle_media").select("vehicle_id, kind, status").in("vehicle_id", ids)
    : { data: [] };
  const summary = new Map<string, { photos: number; spins: number; failed: number }>();
  for (const item of media ?? []) {
    const current = summary.get(item.vehicle_id) ?? { photos: 0, spins: 0, failed: 0 };
    if (item.status === "failed") current.failed += 1;
    if (item.status === "ready" && item.kind === "photo") current.photos += 1;
    if (item.status === "ready" && item.kind === "spin") current.spins += 1;
    summary.set(item.vehicle_id, current);
  }

  return (
    <AdminShell title="Vehicle records" active="Vehicle records" actions={<PillButton href={routes.admin.vehicleNew} variant="dark" size="sm">New draft</PillButton>}>
      <form className="mb-4 flex flex-wrap gap-2" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search VIN, stock number, make"
          aria-label="Search vehicles"
          className="h-11 flex-1 rounded-full border border-silver px-4"
        />
        <select name="status" defaultValue={status ?? ""} aria-label="Filter by status" className="h-11 rounded-full border border-silver px-4">
          <option value="">All statuses</option>
          {["draft", "submitted", "approved", "available", "withdrawn"].map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <PillButton type="submit" variant="outline" size="sm" arrow={false}>
          Filter
        </PillButton>
      </form>
      <DataTable
        caption="Vehicle records"
        rowKey={(r) => r.id}
        rows={rows ?? []}
        columns={[
          {
            key: "v",
            header: "Vehicle",
            render: (r) => (
              <Link href={routes.admin.vehicle(r.id)} className="hover:underline">
                <span className="block font-medium">
                  {r.year} {r.make} {r.model}
                </span>
                <span className="font-mono text-xs">{r.stock_number}</span>
                {r.is_mock && <span className="ml-2 text-xs text-slate">MOCK DATA</span>}
              </Link>
            ),
          },
          { key: "p", header: "Price", align: "right", render: (r) => formatMoney({ cents: r.price_cents, currency: "USD" }) },
          { key: "l", header: "Location", render: (r) => r.location ?? "—" },
          { key: "s", header: "Status", render: (r) => <StatusChip status={STATUS_LABEL[r.status] ?? r.status} /> },
          {
            key: "m",
            header: "Media",
            render: (r) => {
              const item = summary.get(r.id);
              if (!item || (item.photos === 0 && item.spins === 0 && item.failed === 0)) return "—";
              return (
                <span className="text-xs">
                  <span className="tabular">{item.photos}</span> photos
                  {item.spins >= 24 ? " · 360°" : item.spins > 0 ? ` · ${item.spins} frames` : ""}
                  {item.failed > 0 ? <span className="font-semibold text-crimson"> · {item.failed} failed</span> : null}
                </span>
              );
            },
          },
        ]}
      />
    </AdminShell>
  );
}

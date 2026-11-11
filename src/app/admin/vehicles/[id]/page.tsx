import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/Chip";
import { DataTable } from "@/components/ui/Table";
import { AdminShell } from "@/components/portal/AdminShell";
import { AddCostForm, StatusActions, VehicleForm } from "@/app/admin/vehicles/VehicleForm";
import { VehicleMediaPanel } from "@/components/media/VehicleMediaPanel";
import { muxConfigured } from "@/lib/media/mux";
import { STATUS_LABEL } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Administrator · Vehicle" };

export default async function AdminVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: v } = await supabase.from("vehicles").select("*").eq("id", id).maybeSingle();
  if (!v) notFound();
  const { data: media } = await supabase.from("vehicle_media").select("*").eq("vehicle_id", id).order("sort_order");
  const { data: history } = await supabase
    .from("audit_log")
    .select("*")
    .eq("table_name", "vehicles")
    .eq("row_id", id)
    .order("at", { ascending: false })
    .limit(20);

  return (
    <AdminShell title={`${v.stock_number} · ${v.year} ${v.make} ${v.model}`} active="Vehicle records">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <StatusChip status={STATUS_LABEL[v.status] ?? v.status} />
        {v.is_mock && <span className="text-xs font-semibold text-slate">MOCK DATA</span>}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card className="p-5 md:p-6">
          <h2 className="font-display text-lg font-semibold">Record</h2>
          <p className="mb-4 text-sm text-slate">Draft → Submitted → Approved by CEO → Available. You maintain the status; you do not publish.</p>
          <VehicleForm vehicle={v} />
          <div className="mt-6">
            <StatusActions id={v.id} status={v.status} />
          </div>
        </Card>
        <div className="flex flex-col gap-6">
          <Card className="p-5">
            <h2 className="font-display text-lg font-semibold">Add a cost</h2>
            <AddCostForm id={v.id} />
          </Card>
          <Card className="p-5">
            <h2 className="font-display text-lg font-semibold">History</h2>
            <DataTable
              caption="Audit history for this vehicle"
              rowKey={(r) => String(r.id)}
              rows={history ?? []}
              columns={[
                { key: "at", header: "When", render: (r) => new Date(r.at).toLocaleString() },
                { key: "a", header: "Action", render: (r) => r.action },
                { key: "who", header: "Role", render: (r) => r.actor_role ?? "—" },
              ]}
            />
          </Card>
        </div>
      </div>
      <VehicleMediaPanel
        vehicleId={v.id}
        media={media ?? []}
        muxReady={muxConfigured()}
        locked={v.status === "submitted" || v.status === "withdrawn" || v.status === "sold"}
      />
    </AdminShell>
  );
}

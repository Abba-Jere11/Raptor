import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VehicleMediaPanel } from "@/components/media/VehicleMediaPanel";
import { CeoShell } from "@/components/portal/CeoShell";
import { Card } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/Chip";
import { requireStaff } from "@/lib/auth";
import { muxConfigured } from "@/lib/media/mux";
import { STATUS_LABEL } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "CEO · Vehicle" };

export default async function CeoVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { staff } = await requireStaff(["ceo", "sales", "finance"]);
  const supabase = await createClient();
  const { data: vehicle } = await supabase.from("vehicles").select("*").eq("id", id).maybeSingle();
  if (!vehicle) notFound();
  const media = staff.role === "ceo" ? (await supabase.from("vehicle_media").select("*").eq("vehicle_id", id).order("sort_order")).data : [];

  return (
    <CeoShell title={`${vehicle.stock_number} · ${vehicle.year} ${vehicle.make} ${vehicle.model}`} active="Vehicles" role={staff.role}>
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-3">
          <StatusChip status={STATUS_LABEL[vehicle.status] ?? vehicle.status} />
          {vehicle.is_mock && <span className="text-xs font-semibold text-slate">MOCK DATA</span>}
        </div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="eyebrow">VIN</dt>
            <dd className="font-mono">{vehicle.vin}</dd>
          </div>
          <div>
            <dt className="eyebrow">Location</dt>
            <dd>{vehicle.location ?? "—"}</dd>
          </div>
        </dl>
      </Card>
      {staff.role === "ceo" ? (
        <VehicleMediaPanel vehicleId={vehicle.id} media={media ?? []} muxReady={muxConfigured()} />
      ) : (
        <p className="mt-6 text-sm text-slate">Photos and documents are limited to the CEO and the Administrator.</p>
      )}
    </CeoShell>
  );
}

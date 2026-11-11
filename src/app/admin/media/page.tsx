import type { Metadata } from "next";
import { FailedMediaList } from "@/components/media/FailedMediaList";
import { AdminShell } from "@/components/portal/AdminShell";
import { Card } from "@/components/ui/Card";
import type { MediaKind } from "@/lib/db/types";
import { formatBytes } from "@/lib/format";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Administrator · Photos and documents" };

const KINDS: MediaKind[] = ["photo", "spin", "document", "video"];
const KIND_LABEL: Record<MediaKind, string> = {
  photo: "Photos",
  spin: "360° frames",
  document: "Documents",
  video: "Video records",
};

export default async function MediaHealthPage() {
  const supabase = await createClient();
  const { data: media } = await supabase.from("vehicle_media").select("*").order("created_at", { ascending: false });
  const rows = media ?? [];
  const vehicleIds = [...new Set(rows.map((row) => row.vehicle_id))];
  const { data: vehicles } = vehicleIds.length
    ? await supabase.from("vehicles").select("id, stock_number, year, make, model").in("id", vehicleIds)
    : { data: [] };
  const vehicleById = new Map((vehicles ?? []).map((vehicle) => [vehicle.id, vehicle]));
  const failed = rows.filter((row) => row.status === "failed");
  const totals = Object.fromEntries(KINDS.map((kind) => [kind, 0])) as Record<MediaKind, number>;
  for (const row of rows) totals[row.kind] += (row.byte_size ?? 0) + (row.rendition_bytes ?? 0);

  return (
    <AdminShell title="Photos & documents" active="Photos & documents">
      <p className="mb-4 max-w-3xl text-sm text-slate">
        Storage here is the size recorded for originals and image renditions. Video files uploaded to Mux are not included. Failed files can be retried. Re-process runs the image step again on the stored file.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KINDS.map((kind) => (
          <Card key={kind} className="p-5">
            <p className="eyebrow">{KIND_LABEL[kind]}</p>
            <p className="mt-2 font-display text-2xl font-semibold tabular">{formatBytes(totals[kind])}</p>
          </Card>
        ))}
      </div>
      <Card className="mt-6 p-5">
        <h2 className="font-display text-lg font-semibold">Failed uploads</h2>
        <FailedMediaList
          items={failed.map((row) => {
            const vehicle = vehicleById.get(row.vehicle_id);
            return {
              id: row.id,
              name: row.alt_text ?? "File",
              error: row.error,
              href: vehicle ? routes.admin.vehicle(vehicle.id) : null,
              vehicle: vehicle ? `${vehicle.stock_number} · ${vehicle.year} ${vehicle.make} ${vehicle.model}` : null,
            };
          })}
        />
      </Card>
    </AdminShell>
  );
}

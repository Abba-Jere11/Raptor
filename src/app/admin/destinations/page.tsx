import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { AdminShell } from "@/components/portal/AdminShell";
import { AddDestinationForm, DestinationRow } from "@/components/portal/DestinationForms";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Administrator · Destinations" };

export default async function AdminDestinationsPage() {
  await requireStaff(["administrator"]);
  const supabase = await createClient();
  const { data: destinations } = await supabase.from("destinations").select("*").order("country").order("port");
  const rows = destinations ?? [];

  return (
    <AdminShell title="Destinations" active="Destinations">
      <p className="mb-4 max-w-3xl text-sm text-slate">
        Keep the list of countries and ports tidy. Whether Raptors ships somewhere is the CEO&apos;s decision, so the status is shown here but
        set in the CEO portal.
      </p>
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Card className="p-6">
          <div className="border-t border-charcoal">
            {rows.map((d) => (
              <DestinationRow key={`${d.id}-${d.updated_at}`} destination={d} canSetStatus={false} />
            ))}
            {rows.length === 0 && <p className="py-4 text-sm text-slate">No destinations yet.</p>}
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="mb-4 font-display text-base font-semibold">Add a destination</h2>
          <AddDestinationForm canSetStatus={false} />
        </Card>
      </div>
    </AdminShell>
  );
}

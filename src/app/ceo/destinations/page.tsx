import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { CeoShell } from "@/components/portal/CeoShell";
import { AddDestinationForm, DestinationRow } from "@/components/portal/DestinationForms";
import { requireStaff } from "@/lib/auth";
import { DESTINATION_STATUS_LABEL } from "@/lib/quotes";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "CEO · Destinations" };

export default async function CeoDestinationsPage() {
  const { staff } = await requireStaff(["ceo", "sales", "finance"]);
  const supabase = await createClient();
  const { data: destinations } = await supabase.from("destinations").select("*").order("country").order("port");
  const isCeo = staff.role === "ceo";
  const rows = destinations ?? [];

  return (
    <CeoShell title="Destinations" active="Destinations & rates" role={staff.role}>
      <p className="mb-4 max-w-3xl text-sm text-slate">
        Where Raptors ships. The website shows &ldquo;We will confirm&rdquo; for Open and Confirm each time, and &ldquo;Not currently exported there&rdquo;
        for Not served. Confirm each time means whoever prepares a quotation ticks that shipping was confirmed. Dated freight rates come in
        Milestone 7.
      </p>
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Card className="p-6">
          <div className="hidden gap-2 pb-2 text-xs font-semibold text-slate md:grid md:grid-cols-[1fr_1fr_1.4fr_190px_auto]">
            <span>Country</span>
            <span>Port</span>
            <span>Notes</span>
            <span>Status</span>
            <span className="w-16" />
          </div>
          <div className="border-t border-charcoal">
            {rows.map((d) =>
              isCeo ? (
                <DestinationRow key={`${d.id}-${d.updated_at}`} destination={d} canSetStatus />
              ) : (
                <div key={d.id} className="grid gap-2 border-b border-platinum py-3 text-sm md:grid-cols-[1fr_1fr_1.4fr_190px]">
                  <span>{d.country}</span>
                  <span className="font-medium">{d.port}</span>
                  <span className="text-slate">{d.notes}</span>
                  <span>{DESTINATION_STATUS_LABEL[d.status]}</span>
                </div>
              ),
            )}
            {rows.length === 0 && <p className="py-4 text-sm text-slate">No destinations yet. Add the ports Raptors ships to.</p>}
          </div>
        </Card>
        {isCeo && (
          <Card className="p-6">
            <h2 className="mb-4 font-display text-base font-semibold">Add a destination</h2>
            <AddDestinationForm canSetStatus />
          </Card>
        )}
      </div>
    </CeoShell>
  );
}

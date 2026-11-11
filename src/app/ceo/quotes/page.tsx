import type { Metadata } from "next";
import Link from "next/link";
import { StatusChip } from "@/components/ui/Chip";
import { DataTable } from "@/components/ui/Table";
import { CeoShell } from "@/components/portal/CeoShell";
import { requireStaff } from "@/lib/auth";
import { formatDate, formatMoney } from "@/lib/format";
import { QUOTE_STATUS_LABEL, quoteTotals, vehicleTitle } from "@/lib/quotes";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "CEO · Quotations" };

export default async function QuotesPage() {
  const { staff } = await requireStaff(["ceo", "sales", "finance"]);
  const supabase = await createClient();
  await supabase.rpc("expire_quotes");
  const { data: quotes, error } = await supabase.from("quotes").select("*").order("created_at", { ascending: false }).limit(200);
  if (error) throw new Error(error.message);
  const rows = quotes ?? [];
  const ids = rows.map((q) => q.id);
  const customerIds = [...new Set(rows.map((q) => q.customer_id))];
  const vehicleIds = [...new Set(rows.map((q) => q.vehicle_id))];
  const [{ data: lines }, { data: customers }, { data: vehicles }] = await Promise.all([
    ids.length ? supabase.from("quote_lines").select("quote_id, kind, amount_cents").in("quote_id", ids) : Promise.resolve({ data: [] }),
    customerIds.length ? supabase.from("customers").select("id, name").in("id", customerIds) : Promise.resolve({ data: [] }),
    vehicleIds.length ? supabase.from("vehicles").select("id, year, make, model, trim").in("id", vehicleIds) : Promise.resolve({ data: [] }),
  ]);
  const customerById = new Map((customers ?? []).map((c) => [c.id, c.name]));
  const vehicleById = new Map((vehicles ?? []).map((v) => [v.id, v]));
  const totalById = new Map(ids.map((qid) => [qid, quoteTotals((lines ?? []).filter((l) => l.quote_id === qid)).totalCents]));

  return (
    <CeoShell title="Quotations" active="Quotes" role={staff.role}>
      <p className="mb-4 text-sm text-slate">Quotations start from an enquiry. Saving never sends; each one is sent only with an explicit Send.</p>
      {rows.length === 0 ? (
        <p className="rounded-panel border border-dashed border-silver p-6 text-sm text-slate">No quotations yet.</p>
      ) : (
        <DataTable
          caption="Quotations, newest first"
          rowKey={(r) => r.id}
          rows={rows}
          columns={[
            {
              key: "n",
              header: "Quotation",
              render: (r) => (
                <Link href={routes.ceo.quote(r.id)} className="hover:underline">
                  <span className="block font-mono text-sm font-semibold">{r.number ?? `Draft v${r.revision}`}</span>
                  <span className="text-xs text-slate">{customerById.get(r.customer_id) ?? "Customer"}</span>
                </Link>
              ),
            },
            {
              key: "v",
              header: "Vehicle",
              render: (r) => {
                const v = vehicleById.get(r.vehicle_id);
                return v ? vehicleTitle(v) : "Vehicle";
              },
            },
            { key: "t", header: "Total", align: "right", render: (r) => `${formatMoney({ cents: totalById.get(r.id) ?? 0, currency: "USD" })} USD` },
            { key: "u", header: "Valid until", render: (r) => formatDate(r.valid_until) },
            { key: "s", header: "Status", render: (r) => <StatusChip status={QUOTE_STATUS_LABEL[r.status]} /> },
          ]}
        />
      )}
    </CeoShell>
  );
}

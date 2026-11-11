import type { Metadata } from "next";
import { DataTable } from "@/components/ui/Table";
import { CeoShell } from "@/components/portal/CeoShell";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "CEO · Audit log" };

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ table?: string }> }) {
  await requireStaff(["ceo"]);
  const { table } = await searchParams;
  const supabase = await createClient();
  let q = supabase.from("audit_log").select("*").order("at", { ascending: false }).limit(100);
  if (table) q = q.eq("table_name", table);
  const { data: rows } = await q;

  return (
    <CeoShell title="Audit log" active="Audit log">
      <form method="get" className="mb-4 flex gap-2">
        <select name="table" defaultValue={table ?? ""} aria-label="Filter by table" className="h-11 rounded-full border border-silver px-4">
          <option value="">All tables</option>
          {["vehicles", "vehicle_costs", "approval_requests", "staff_users", "staff_authorisations"].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button type="submit" className="h-11 rounded-full border border-silver px-4 text-sm font-semibold">
          Filter
        </button>
      </form>
      <p className="mb-2 text-xs text-slate">Cost amounts are not stored in this log. Nothing here can be edited or deleted.</p>
      <DataTable
        caption="Audit log"
        rowKey={(r) => String(r.id)}
        rows={rows ?? []}
        columns={[
          { key: "at", header: "When", render: (r) => new Date(r.at).toLocaleString() },
          { key: "who", header: "Role", render: (r) => r.actor_role ?? "—" },
          { key: "a", header: "Action", render: (r) => r.action },
          { key: "t", header: "Table", render: (r) => r.table_name },
          { key: "r", header: "Row", render: (r) => <span className="font-mono text-xs">{r.row_id?.slice(0, 8) ?? "—"}</span> },
        ]}
      />
    </CeoShell>
  );
}

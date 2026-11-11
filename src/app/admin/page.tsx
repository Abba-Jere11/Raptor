import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/Chip";
import { AdminShell } from "@/components/portal/AdminShell";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { STATUS_LABEL } from "@/lib/permissions";

export const metadata: Metadata = { title: "Administrator · Today" };

export default async function AdminTodayPage() {
  const supabase = await createClient();
  const [{ count: drafts }, { count: submitted }, { count: approved }, { data: recent }] = await Promise.all([
    supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("status", "submitted"),
    supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("vehicles").select("id,stock_number,year,make,model,status").order("updated_at", { ascending: false }).limit(8),
  ]);

  return (
    <AdminShell title="Today" active="Today">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="eyebrow">Drafts</p>
          <p className="mt-2 font-display text-3xl font-semibold tabular">{drafts ?? 0}</p>
        </Card>
        <Card className="p-5">
          <p className="eyebrow">Waiting for the CEO</p>
          <p className="mt-2 font-display text-3xl font-semibold tabular">{submitted ?? 0}</p>
        </Card>
        <Card className="p-5">
          <p className="eyebrow">Approved, not yet available</p>
          <p className="mt-2 font-display text-3xl font-semibold tabular">{approved ?? 0}</p>
        </Card>
      </div>
      <Card className="mt-6 p-5">
        <h2 className="font-display text-lg font-semibold">Recent vehicle records</h2>
        <ul className="mt-3 divide-y divide-platinum">
          {(recent ?? []).map((v) => (
            <li key={v.id} className="flex items-center justify-between gap-3 py-3">
              <Link href={routes.admin.vehicle(v.id)} className="hover:underline">
                <span className="font-mono text-sm font-semibold">{v.stock_number}</span>
                <span className="ml-2 text-sm">
                  {v.year} {v.make} {v.model}
                </span>
              </Link>
              <StatusChip status={STATUS_LABEL[v.status] ?? v.status} />
            </li>
          ))}
        </ul>
      </Card>
    </AdminShell>
  );
}

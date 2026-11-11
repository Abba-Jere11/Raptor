import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { CeoShell } from "@/components/portal/CeoShell";
import { requireStaff } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/permissions";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "CEO portal" };

export default async function CeoHomePage() {
  const { staff } = await requireStaff(["ceo", "sales", "finance"]);
  const supabase = await createClient();
  const pending =
    staff.role === "ceo"
      ? (await supabase.from("approval_requests").select("*", { count: "exact", head: true }).eq("status", "pending")).count
      : null;

  return (
    <CeoShell title="Home" active="Home" role={staff.role}>
      <p className="text-slate">
        Signed in as {staff.name} · {ROLE_LABEL[staff.role]}. The dashboard arrives in Milestone 10.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {staff.role === "ceo" && (
          <Card className="p-5">
            <p className="eyebrow">Approvals waiting</p>
            <p className="mt-2 font-display text-3xl font-semibold tabular">{pending ?? 0}</p>
            <Link href={routes.ceo.approvals} className="mt-3 inline-block text-sm font-semibold underline">
              Open the queue
            </Link>
          </Card>
        )}
        <Card className="p-5">
          <p className="eyebrow">Vehicles</p>
          <p className="mt-2 text-sm text-slate">Every record{staff.role === "sales" ? ", without costs" : ", including costs"}.</p>
          <Link href={routes.ceo.vehicles} className="mt-3 inline-block text-sm font-semibold underline">
            Open vehicles
          </Link>
        </Card>
        {staff.role === "ceo" && (
          <Card className="p-5">
            <p className="eyebrow">Staff</p>
            <p className="mt-2 text-sm text-slate">Authorise an account. The Administrator creates it.</p>
            <Link href={routes.ceo.staff} className="mt-3 inline-block text-sm font-semibold underline">
              Authorise staff
            </Link>
          </Card>
        )}
      </div>
    </CeoShell>
  );
}

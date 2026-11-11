import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { StatusChip } from "@/components/ui/Chip";
import { DataTable } from "@/components/ui/Table";
import { CeoShell } from "@/components/portal/CeoShell";
import { AuthoriseForm, RevokeButton } from "@/app/ceo/staff/StaffForms";
import { requireStaff } from "@/lib/auth";
import { ROLE_LABEL, STATUS_LABEL } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "CEO · Staff authorisations" };

export default async function CeoStaffPage() {
  await requireStaff(["ceo"]);
  const supabase = await createClient();
  const { data: rows } = await supabase.from("staff_authorisations").select("*").order("created_at", { ascending: false });

  return (
    <CeoShell title="Staff & roles" active="Staff & roles">
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <DataTable
          caption="Authorisations"
          rowKey={(r) => r.id}
          rows={rows ?? []}
          columns={[
            { key: "e", header: "Email", render: (r) => r.email },
            { key: "r", header: "Role", render: (r) => ROLE_LABEL[r.role] },
            { key: "s", header: "Status", render: (r) => <StatusChip status={STATUS_LABEL[r.status] ?? r.status} /> },
            { key: "a", header: "", render: (r) => (r.status === "pending" ? <RevokeButton id={r.id} /> : null) },
          ]}
        />
        <Card className="p-5">
          <h2 className="font-display text-lg font-semibold">Authorise an account</h2>
          <p className="mt-1 text-sm text-slate">You decide the role. The Administrator creates the login.</p>
          <AuthoriseForm />
        </Card>
      </div>
    </CeoShell>
  );
}

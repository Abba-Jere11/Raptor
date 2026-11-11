import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { Chip, StatusChip } from "@/components/ui/Chip";
import { DataTable } from "@/components/ui/Table";
import { AdminShell } from "@/components/portal/AdminShell";
import { CreateStaffForm, StaffRowActions } from "@/app/admin/staff/StaffForms";
import { PERMISSION_AREAS, ROLE_LABEL, STATUS_LABEL, type Access } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import type { StaffRole } from "@/lib/db/types";

export const metadata: Metadata = { title: "Administrator · Staff accounts" };

const ROLES: StaffRole[] = ["ceo", "administrator", "sales", "finance"];
const accessTone: Record<Access, "success" | "neutral" | "outline" | "warning"> = {
  Full: "success",
  Manage: "success",
  Prepare: "warning",
  Record: "warning",
  View: "outline",
  None: "neutral",
};

export default async function AdminStaffPage() {
  const supabase = await createClient();
  const [{ data: staff }, { data: open }] = await Promise.all([
    supabase.from("staff_users").select("*").order("created_at"),
    supabase.from("staff_authorisations").select("*").eq("status", "pending"),
  ]);

  return (
    <AdminShell title="Staff accounts and permissions" active="Staff accounts">
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <DataTable
          caption="Staff accounts"
          rowKey={(r) => r.id}
          rows={staff ?? []}
          columns={[
            {
              key: "n",
              header: "Name",
              render: (r) => (
                <span>
                  <span className="block font-medium">{r.name}</span>
                  <span className="text-xs text-slate">{r.email}</span>
                </span>
              ),
            },
            { key: "r", header: "Role", render: (r) => ROLE_LABEL[r.role] },
            { key: "s", header: "Status", render: (r) => <StatusChip status={STATUS_LABEL[r.status]} /> },
            { key: "a", header: "Actions", render: (r) => <StaffRowActions id={r.id} role={r.role} status={r.status} /> },
          ]}
        />
        <Card className="p-5">
          <h2 className="font-display text-lg font-semibold">Create an account</h2>
          <p className="mt-1 text-sm text-slate">Only with a CEO authorisation. You never set the password.</p>
          <CreateStaffForm authorisations={open ?? []} />
        </Card>
      </div>
      <section id="permissions" className="mt-8">
        <h2 className="font-display text-lg font-semibold">Roles and permissions</h2>
        <p className="text-sm text-slate">Enforced in the database. Sales and Finance exist only if the CEO authorises them.</p>
        <div className="mt-4 overflow-x-auto rounded-panel border border-platinum bg-white" tabIndex={0} role="region" aria-label="Permission matrix">
          <table className="w-full min-w-[640px] text-sm">
            <caption className="sr-only">Permission matrix</caption>
            <thead>
              <tr className="border-b border-platinum">
                <th scope="col" className="eyebrow px-3 py-3 text-left">
                  Area
                </th>
                {ROLES.map((r) => (
                  <th key={r} scope="col" className="eyebrow px-3 py-3 text-left">
                    {ROLE_LABEL[r]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_AREAS.map((p) => (
                <tr key={p.area} className="border-b border-platinum last:border-0">
                  <th scope="row" className="px-3 py-2.5 text-left font-medium">
                    {p.area}
                  </th>
                  {ROLES.map((r) => (
                    <td key={r} className="px-3 py-2.5">
                      <Chip tone={accessTone[p.access[r]]}>{p.access[r]}</Chip>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}

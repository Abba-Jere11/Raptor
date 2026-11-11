import type { Metadata } from "next";
import Link from "next/link";
import { Chip } from "@/components/ui/Chip";
import { DataTable } from "@/components/ui/Table";
import { CeoShell } from "@/components/portal/CeoShell";
import { requireStaff } from "@/lib/auth";
import type { EmailTemplate } from "@/lib/db/types";
import { formatDate } from "@/lib/format";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "CEO · Email templates" };

type Row = { key: string; name: string; audience: EmailTemplate["audience"]; latest: EmailTemplate; approved: EmailTemplate | null };

export default async function TemplatesPage() {
  const { staff } = await requireStaff(["ceo", "sales"]);
  const supabase = await createClient();
  const { data } = await supabase.from("email_templates").select("*").order("key").order("version", { ascending: false });
  const byKey = new Map<string, Row>();
  for (const t of data ?? []) {
    const row = byKey.get(t.key) ?? { key: t.key, name: t.name, audience: t.audience, latest: t, approved: null };
    if (!row.approved && t.status === "approved") row.approved = t;
    byKey.set(t.key, row);
  }
  const rows = [...byKey.values()];

  return (
    <CeoShell title="Email templates" active="Email templates" role={staff.role}>
      <p className="mb-4 max-w-3xl text-sm text-slate">
        Customer emails only ever use wording the CEO has approved. Until then they are held and recorded, and nothing is sent. Staff alerts use
        the latest wording.
      </p>
      <DataTable
        caption="Email templates"
        rowKey={(r) => r.key}
        rows={rows}
        columns={[
          {
            key: "n",
            header: "Email",
            render: (r) => (
              <Link href={routes.ceo.template(r.key)} className="hover:underline">
                <span className="block font-medium">{r.name}</span>
                <span className="font-mono text-xs text-slate">{r.key}</span>
              </Link>
            ),
          },
          { key: "a", header: "Goes to", render: (r) => (r.audience === "customer" ? "Customer" : "Staff") },
          {
            key: "s",
            header: "In use",
            render: (r) =>
              r.approved ? (
                <Chip tone="success">Version {r.approved.version}, approved {r.approved.approved_at ? formatDate(r.approved.approved_at) : ""}</Chip>
              ) : (
                <Chip tone="warning">{r.audience === "customer" ? "Not approved: emails held" : "Draft wording in use"}</Chip>
              ),
          },
          {
            key: "d",
            header: "Latest",
            render: (r) => (r.latest.status === "draft" ? `Draft version ${r.latest.version}` : <span className="text-slate">Same</span>),
          },
        ]}
      />
    </CeoShell>
  );
}

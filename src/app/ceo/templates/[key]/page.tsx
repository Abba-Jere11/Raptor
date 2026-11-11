import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { CeoShell } from "@/components/portal/CeoShell";
import { TemplateEditor } from "@/app/ceo/templates/[key]/TemplateEditor";
import { requireStaff } from "@/lib/auth";
import { MERGE_FIELDS } from "@/lib/email/render";
import { env } from "@/lib/env";
import { formatDate } from "@/lib/format";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "CEO · Email template" };

export default async function TemplatePage({ params }: { params: Promise<{ key: string }> }) {
  const { staff } = await requireStaff(["ceo", "sales"]);
  const { key } = await params;
  const supabase = await createClient();
  const [{ data: versions }, { data: tests }] = await Promise.all([
    supabase.from("email_templates").select("*").eq("key", key).order("version", { ascending: false }),
    supabase.from("notification_log").select("*").eq("template_key", key).eq("is_test", true).order("at", { ascending: false }).limit(5),
  ]);
  const latest = (versions ?? [])[0];
  if (!latest) notFound();
  const approved = (versions ?? []).find((v) => v.status === "approved");

  return (
    <CeoShell
      title={latest.name}
      active="Email templates"
      role={staff.role}
      actions={
        <Link href={routes.ceo.templates} className="text-sm font-semibold underline underline-offset-4">
          All templates
        </Link>
      }
    >
      <p className="mb-5 flex flex-wrap items-center gap-2 text-sm">
        <Chip tone={latest.status === "approved" ? "success" : "warning"}>
          Version {latest.version}: {latest.status === "approved" ? "approved" : "draft"}
        </Chip>
        {approved && approved.id !== latest.id && <span className="text-slate">Version {approved.version} stays in use until you approve this draft.</span>}
        {!approved && latest.audience === "customer" && <span className="text-slate">Not approved yet. Customer emails of this kind are held.</span>}
        {staff.role !== "ceo" && <span className="text-slate">Only the CEO edits and approves wording.</span>}
      </p>
      <TemplateEditor key={latest.id} template={latest} fields={MERGE_FIELDS[key] ?? []} siteUrl={env.siteUrl} canEdit={staff.role === "ceo"} />
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-display text-base font-semibold">Versions</h2>
          <ul className="mt-3 grid gap-2 text-sm">
            {(versions ?? []).map((v) => (
              <li key={v.id} className="flex justify-between gap-4">
                <span>Version {v.version}</span>
                <span className="text-slate">
                  {v.status === "approved" ? `Approved ${v.approved_at ? formatDate(v.approved_at) : ""}` : `Draft, ${formatDate(v.created_at)}`}
                </span>
              </li>
            ))}
          </ul>
        </Card>
        {(tests ?? []).length > 0 && (
          <Card className="p-6">
            <h2 className="font-display text-base font-semibold">Recent tests</h2>
            <ul className="mt-3 grid gap-2 text-sm">
              {(tests ?? []).map((t) => (
                <li key={t.id} className="flex justify-between gap-4">
                  <span>
                    v{t.template_version} to {t.to_email}
                  </span>
                  <span className={t.status === "sent" ? "text-success" : "text-crimson"}>{t.status === "sent" ? "Sent" : t.error ?? "Failed"}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </CeoShell>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Chip, StatusChip } from "@/components/ui/Chip";
import { DataTable } from "@/components/ui/Table";
import { CeoShell } from "@/components/portal/CeoShell";
import { requireStaff } from "@/lib/auth";
import type { EnquiryStatus } from "@/lib/db/types";
import { formatDate } from "@/lib/format";
import { ENQUIRY_KIND_LABEL, ENQUIRY_STATUS_LABEL, responseTimer, vehicleTitle } from "@/lib/quotes";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "CEO · Enquiries" };

const OPEN: EnquiryStatus[] = ["new", "contacted", "quoted", "negotiating"];

export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { staff } = await requireStaff(["ceo", "sales"]);
  const filter = (await searchParams).status ?? "open";
  const supabase = await createClient();
  let query = supabase.from("enquiries").select("*").order("created_at", { ascending: false }).limit(200);
  if (filter === "open") query = query.in("status", OPEN);
  else if (filter in ENQUIRY_STATUS_LABEL) query = query.eq("status", filter as EnquiryStatus);
  const { data: enquiries, error } = await query;
  if (error) throw new Error(error.message);
  const rows = enquiries ?? [];

  const customerIds = [...new Set(rows.map((r) => r.customer_id))];
  const vehicleIds = [...new Set(rows.map((r) => r.vehicle_id).filter((v): v is string => Boolean(v)))];
  const [{ data: customers }, { data: vehicles }, { data: people }] = await Promise.all([
    customerIds.length ? supabase.from("customers").select("id, name, email, country").in("id", customerIds) : Promise.resolve({ data: [] }),
    vehicleIds.length
      ? supabase.from("vehicles").select("id, year, make, model, trim, stock_number").in("id", vehicleIds)
      : Promise.resolve({ data: [] }),
    supabase.from("staff_users").select("id, name"),
  ]);
  const customerById = new Map((customers ?? []).map((c) => [c.id, c]));
  const vehicleById = new Map((vehicles ?? []).map((v) => [v.id, v]));
  const staffById = new Map((people ?? []).map((p) => [p.id, p.name]));
  const now = Date.now();

  const tabs = [{ value: "open", label: "Open" }, ...Object.entries(ENQUIRY_STATUS_LABEL).map(([value, label]) => ({ value, label }))];

  return (
    <CeoShell title="Enquiries" active="Enquiries" role={staff.role}>
      <nav aria-label="Filter by status" className="mb-5 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t.value}
            href={t.value === "open" ? routes.ceo.enquiries : `${routes.ceo.enquiries}?status=${t.value}`}
            aria-current={filter === t.value ? "page" : undefined}
            className={cn(
              "inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium",
              filter === t.value ? "border-charcoal bg-charcoal text-white" : "border-silver bg-white text-charcoal hover:border-charcoal",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {rows.length === 0 ? (
        <p className="rounded-panel border border-dashed border-silver p-6 text-sm text-slate">No enquiries here.</p>
      ) : (
        <DataTable
          caption="Enquiries, newest first"
          rowKey={(r) => r.id}
          rows={rows}
          columns={[
            {
              key: "who",
              header: "Customer",
              render: (r) => {
                const c = customerById.get(r.customer_id);
                return (
                  <Link href={routes.ceo.enquiry(r.id)} className="hover:underline">
                    <span className="block font-medium">{c?.name ?? "Customer"}</span>
                    <span className="font-mono text-xs text-slate">{r.reference}</span>
                  </Link>
                );
              },
            },
            {
              key: "what",
              header: "About",
              render: (r) => {
                const v = r.vehicle_id ? vehicleById.get(r.vehicle_id) : null;
                return (
                  <span>
                    <span className="block text-sm">{ENQUIRY_KIND_LABEL[r.kind]}</span>
                    <span className="text-xs text-slate">{v ? vehicleTitle(v) : "General"}</span>
                  </span>
                );
              },
            },
            { key: "owner", header: "Owner", render: (r) => (r.assigned_to ? staffById.get(r.assigned_to) ?? "Staff" : <span className="text-slate">Nobody</span>) },
            {
              key: "timer",
              header: "Response",
              render: (r) => {
                const t = responseTimer(r.created_at, r.first_response_at, now);
                return t.late ? <Chip tone="brand">{t.label}</Chip> : <span className="text-sm text-slate">{t.label}</span>;
              },
            },
            { key: "when", header: "Received", render: (r) => formatDate(r.created_at) },
            { key: "status", header: "Status", render: (r) => <StatusChip status={ENQUIRY_STATUS_LABEL[r.status]} /> },
          ]}
        />
      )}
    </CeoShell>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import type { Json } from "@/lib/db/types";
import { formatMoney } from "@/lib/format";
import { routes } from "@/lib/routes";
import { Chip } from "@/components/ui/Chip";
import { CeoShell } from "@/components/portal/CeoShell";
import { ApprovalActions } from "@/app/ceo/approvals/ApprovalActions";
import { requireStaff } from "@/lib/auth";
import { STATUS_LABEL } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "CEO · Approvals" };

function DiscountDetail({ payload }: { payload: Json }) {
  const p = (payload ?? {}) as { quote_id?: string; discount_cents?: number; total_cents?: number };
  const money = (cents?: number) => (typeof cents === "number" ? `${formatMoney({ cents, currency: "USD" })} USD` : "Unknown");
  return (
    <p className="mt-1 text-sm text-slate">
      Discount {money(p.discount_cents)}, leaving {money(p.total_cents)} payable.{" "}
      {p.quote_id && (
        <Link href={routes.ceo.quote(p.quote_id)} className="font-semibold text-charcoal underline underline-offset-4">
          Open the quotation
        </Link>
      )}
    </p>
  );
}

export default async function ApprovalsPage() {
  await requireStaff(["ceo"]);
  const supabase = await createClient();
  const { data: rows } = await supabase.from("approval_requests").select("*").eq("status", "pending").order("requested_at", { ascending: false });

  return (
    <CeoShell title="Approvals" active="Approvals">
      <p className="mb-4 text-sm text-slate">Vehicle publication, vehicle changes, featured vehicles, deliveries and quotation discounts.</p>
      <ul className="flex flex-col gap-3">
        {(rows ?? []).map((a) => (
          <li key={a.id}>
            <Card className="grid gap-4 p-5 lg:grid-cols-[1fr_auto]">
              <div>
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-semibold">{a.id.slice(0, 8)}</span>
                  <Chip tone="outline">{STATUS_LABEL[a.type] ?? a.type}</Chip>
                </p>
                <h2 className="mt-2 font-display text-base font-semibold">{a.summary}</h2>
                {a.type === "quote_discount" ? (
                  <DiscountDetail payload={a.payload} />
                ) : (
                  <p className="text-sm text-slate">{JSON.stringify(a.payload)}</p>
                )}
              </div>
              <ApprovalActions id={a.id} type={a.type} vehicleId={a.vehicle_id} />
            </Card>
          </li>
        ))}
        {(rows ?? []).length === 0 && <li className="rounded-panel border border-dashed border-silver p-6 text-sm text-slate">Nothing waiting.</li>}
      </ul>
    </CeoShell>
  );
}

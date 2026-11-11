import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Chip, StatusChip } from "@/components/ui/Chip";
import { CeoShell } from "@/components/portal/CeoShell";
import { NoteForm, PrepareQuoteForm, StatusForm } from "@/app/ceo/enquiries/EnquiryControls";
import { requireStaff } from "@/lib/auth";
import type { EnquiryEvent, NotificationLogEntry } from "@/lib/db/types";
import { formatDate, formatMoney } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/permissions";
import {
  ENQUIRY_KIND_LABEL,
  ENQUIRY_STATUS_LABEL,
  QUOTE_STATUS_LABEL,
  destinationLabel,
  responseTimer,
  vehicleTitle,
} from "@/lib/quotes";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "CEO · Enquiry" };

const CONTACT_LABEL = { email: "Email", whatsapp: "WhatsApp", phone: "Phone" } as const;

function when(at: string) {
  return new Date(at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

function eventText(e: EnquiryEvent, names: Map<string, string>): string {
  const who = e.actor_id ? names.get(e.actor_id) ?? "Staff" : "Website";
  if (e.kind === "received") return "Received from the website";
  if (e.kind === "status") return `${who} moved it from ${e.from_status ? ENQUIRY_STATUS_LABEL[e.from_status] : "?"} to ${e.to_status ? ENQUIRY_STATUS_LABEL[e.to_status] : "?"}`;
  if (e.kind === "assigned") return `${who} changed the owner${e.note ? `: ${e.note}` : ""}`;
  if (e.kind === "quote") return `${who}: ${e.note ?? "Quotation activity"}`;
  return `${who} added a note`;
}

function emailStatus(n: NotificationLogEntry) {
  if (n.status === "sent") return <Chip tone="success">Sent</Chip>;
  if (n.status === "held") return <Chip tone="warning">Held</Chip>;
  return <Chip tone="brand">Failed</Chip>;
}

export default async function EnquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const { staff } = await requireStaff(["ceo", "sales"]);
  const { id } = await params;
  const supabase = await createClient();
  const { data: enquiry } = await supabase.from("enquiries").select("*").eq("id", id).maybeSingle();
  if (!enquiry) notFound();

  const [{ data: customer }, { data: vehicle }, { data: events }, { data: people }, { data: emails }, { data: quotes }, { data: destinations }] =
    await Promise.all([
      supabase.from("customers").select("*").eq("id", enquiry.customer_id).maybeSingle(),
      enquiry.vehicle_id ? supabase.from("vehicles").select("*").eq("id", enquiry.vehicle_id).maybeSingle() : Promise.resolve({ data: null }),
      supabase.from("enquiry_events").select("*").eq("enquiry_id", id).order("at", { ascending: true }),
      supabase.from("staff_users").select("id, name, role, status"),
      supabase.from("notification_log").select("*").eq("enquiry_id", id).order("at", { ascending: false }),
      supabase.from("quotes").select("*").eq("enquiry_id", id).order("created_at", { ascending: false }),
      supabase.from("destinations").select("*").order("country").order("port"),
    ]);
  const names = new Map((people ?? []).map((p) => [p.id, p.name]));
  const owners = (people ?? []).filter((p) => p.status === "active" && (p.role === "ceo" || p.role === "sales"));
  const destination = (destinations ?? []).find((d) => d.id === enquiry.destination_id) ?? null;
  const timer = responseTimer(enquiry.created_at, enquiry.first_response_at, Date.now());
  const canPrepare = Boolean(vehicle) && vehicle?.status === "available" && !["won", "lost", "spam"].includes(enquiry.status);

  return (
    <CeoShell
      title={customer?.name ?? "Enquiry"}
      active="Enquiries"
      role={staff.role}
      actions={
        <Link href={routes.ceo.enquiries} className="text-sm font-semibold underline underline-offset-4">
          All enquiries
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid content-start gap-6">
          <Card className="p-6">
            <p className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-semibold">{enquiry.reference}</span>
              <StatusChip status={ENQUIRY_STATUS_LABEL[enquiry.status]} />
              <Chip tone="outline">{ENQUIRY_KIND_LABEL[enquiry.kind]}</Chip>
              {timer.late ? <Chip tone="brand">{timer.label}</Chip> : <span className="text-sm text-slate">{timer.label}</span>}
            </p>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-slate">Email</dt>
                <dd className="font-medium break-all">{customer?.email}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate">WhatsApp</dt>
                <dd className="font-medium">{customer?.whatsapp ?? "Not given"}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate">Prefers</dt>
                <dd className="font-medium">{CONTACT_LABEL[enquiry.preferred_contact]}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate">Ship to</dt>
                <dd className="font-medium">{destination ? destinationLabel(destination) : enquiry.destination_other || "Not given"}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate">Received</dt>
                <dd className="font-medium">{when(enquiry.created_at)}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate">From page</dt>
                <dd className="font-mono text-sm">{enquiry.source_path ?? "Unknown"}</dd>
              </div>
            </dl>
            {enquiry.message && (
              <div className="mt-6 border-t border-platinum pt-5">
                <p className="text-sm text-slate">Message</p>
                <p className="mt-1 whitespace-pre-wrap">{enquiry.message}</p>
              </div>
            )}
          </Card>

          {vehicle && (
            <Card className="flex flex-wrap items-center justify-between gap-4 p-6">
              <div>
                <p className="text-sm text-slate">Vehicle</p>
                <Link href={routes.ceo.vehicle(vehicle.id)} className="font-display text-lg font-semibold hover:underline">
                  {vehicleTitle(vehicle)}
                </Link>
                <p className="font-mono text-xs text-slate">{vehicle.stock_number}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold tabular">{formatMoney({ cents: vehicle.price_cents, currency: "USD" })} USD</p>
                <StatusChip status={STATUS_LABEL[vehicle.status] ?? vehicle.status} />
              </div>
            </Card>
          )}

          {(quotes ?? []).length > 0 && (
            <Card className="p-6">
              <h2 className="font-display text-base font-semibold">Quotations</h2>
              <ul className="mt-3 divide-y divide-platinum">
                {(quotes ?? []).map((q) => (
                  <li key={q.id} className="flex items-center justify-between gap-4 py-3">
                    <Link href={routes.ceo.quote(q.id)} className="font-mono text-sm font-semibold hover:underline">
                      {q.number ?? `Draft, version ${q.revision}`}
                    </Link>
                    <StatusChip status={QUOTE_STATUS_LABEL[q.status]} />
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card className="p-6">
            <h2 className="font-display text-base font-semibold">Emails</h2>
            {(emails ?? []).length === 0 ? (
              <p className="mt-2 text-sm text-slate">No emails recorded for this enquiry.</p>
            ) : (
              <ul className="mt-3 divide-y divide-platinum">
                {(emails ?? []).map((n) => (
                  <li key={n.id} className="grid gap-1 py-3">
                    <p className="flex flex-wrap items-center gap-2">
                      {emailStatus(n)}
                      <span className="text-sm font-medium">{n.subject}</span>
                    </p>
                    <p className="text-xs text-slate">
                      To {n.to_email} · {when(n.at)} · {n.template_key}
                      {n.template_version ? ` v${n.template_version}` : ""}
                    </p>
                    {n.error && <p className="text-xs text-crimson">{n.error}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-base font-semibold">History</h2>
            <ol className="mt-3 grid gap-3">
              {(events ?? []).map((e) => (
                <li key={e.id} className="border-l-2 border-platinum pl-4">
                  <p className="text-sm font-medium">{eventText(e, names)}</p>
                  {e.kind === "note" && e.note && <p className="mt-1 whitespace-pre-wrap text-sm">{e.note}</p>}
                  <p className="text-xs text-slate">{when(e.at)}</p>
                </li>
              ))}
            </ol>
            <div className="mt-6 border-t border-platinum pt-5">
              <NoteForm id={enquiry.id} />
            </div>
          </Card>
        </div>

        <div className="grid content-start gap-6">
          <Card className="p-6">
            <h2 className="mb-4 font-display text-base font-semibold">Status and owner</h2>
            <StatusForm id={enquiry.id} status={enquiry.status} owner={enquiry.assigned_to} staff={owners} />
          </Card>
          <Card className="p-6">
            <h2 className="mb-2 font-display text-base font-semibold">Quotation</h2>
            {canPrepare ? (
              <PrepareQuoteForm id={enquiry.id} destinations={destinations ?? []} initialDestination={enquiry.destination_id} />
            ) : (
              <p className="text-sm text-slate">
                {vehicle ? "A quotation needs an available vehicle and an open enquiry." : "This enquiry is not about a particular vehicle."}
              </p>
            )}
          </Card>
          <p className="text-xs text-slate">Received {formatDate(enquiry.created_at)}. Customer messages cannot be edited.</p>
        </div>
      </div>
    </CeoShell>
  );
}

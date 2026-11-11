import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Chip, StatusChip } from "@/components/ui/Chip";
import { CeoShell } from "@/components/portal/CeoShell";
import {
  AcceptanceForm,
  AddLineForm,
  AddLocalForm,
  DeclineForm,
  DraftActions,
  HeaderForm,
  LineRow,
  LocalRow,
  NewVersion,
  RetryEmail,
} from "@/app/ceo/quotes/[id]/QuoteEditor";
import { requireStaff } from "@/lib/auth";
import { renderEmail } from "@/lib/email/render";
import { currentTemplate } from "@/lib/email/send";
import { env } from "@/lib/env";
import { formatDate, formatMoney } from "@/lib/format";
import { loadQuoteDocument } from "@/lib/quote-document";
import { ACCEPTANCE_METHOD_LABEL, QUOTE_STATUS_LABEL, destinationLabel, vehicleTitle } from "@/lib/quotes";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "CEO · Quotation" };

const money = (cents: number) => `${formatMoney({ cents, currency: "USD" })} USD`;

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { staff } = await requireStaff(["ceo", "sales", "finance"]);
  const { id } = await params;
  const supabase = await createClient();
  await supabase.rpc("expire_quotes");
  const doc = await loadQuoteDocument(supabase, id);
  if (!doc) notFound();
  const { quote, lines, local, customer, vehicle, destination, totals } = doc;

  const canWork = staff.role === "ceo" || staff.role === "sales";
  const draft = quote.status === "draft" || quote.status === "previewed";
  const editable = canWork && draft;
  const [{ data: problemRows }, { data: destinations }, { data: emails }, template] = await Promise.all([
    draft ? supabase.rpc("quote_problems", { p_id: id }) : Promise.resolve({ data: [] as { reason: string }[] }),
    supabase.from("destinations").select("*").order("country").order("port"),
    canWork ? supabase.from("notification_log").select("*").eq("quote_id", id).order("at", { ascending: false }) : Promise.resolve({ data: [] }),
    canWork ? currentTemplate("quotation_sent", "customer") : Promise.resolve(null),
  ]);
  const issues = (problemRows ?? []).map((row) => row.reason);
  const previewed = quote.status === "previewed" && quote.previewed_revision === quote.revision;
  const lastEmail = (emails ?? [])[0];
  const needsRetry = canWork && !draft && quote.status !== "superseded" && (!quote.pdf_path || !lastEmail || lastEmail.status !== "sent");

  const email =
    template && previewed
      ? renderEmail(
          template,
          {
            customer_name: customer.name,
            quote_number: quote.number ?? "Q-number assigned on send",
            vehicle_title: vehicleTitle(vehicle),
            destination: destinationLabel(destination),
            quote_total: money(totals.totalCents),
            valid_until: formatDate(quote.valid_until),
          },
          { siteUrl: env.siteUrl, footer: "Footer with the legal name and licence is added when sent." },
        )
      : null;

  const today = new Date().toISOString().slice(0, 10);

  return (
    <CeoShell
      title={quote.number ?? `Draft quotation, version ${quote.revision}`}
      active="Quotes"
      role={staff.role}
      actions={
        <Link href={routes.ceo.quotes} className="text-sm font-semibold underline underline-offset-4">
          All quotations
        </Link>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="grid content-start gap-6">
          <Card className="p-6">
            <p className="flex flex-wrap items-center gap-2">
              <StatusChip status={QUOTE_STATUS_LABEL[quote.status]} />
              {quote.supersedes_id && (
                <Link href={routes.ceo.quote(quote.supersedes_id)} className="text-sm underline underline-offset-4">
                  Replaces an earlier version
                </Link>
              )}
              {quote.enquiry_id && (
                <Link href={routes.ceo.enquiry(quote.enquiry_id)} className="text-sm underline underline-offset-4">
                  Open the enquiry
                </Link>
              )}
            </p>
            <dl className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-sm text-slate">Customer</dt>
                <dd className="font-medium">{customer.name}</dd>
                <dd className="text-sm text-slate break-all">{customer.email}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate">Vehicle</dt>
                <dd className="font-medium">{vehicleTitle(vehicle)}</dd>
                <dd className="font-mono text-xs text-slate">{vehicle.stock_number}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate">Ship to</dt>
                <dd className="font-medium">{destinationLabel(destination)}</dd>
                {quote.destination_confirmed_at && <dd className="text-xs text-slate">Confirmed {formatDate(quote.destination_confirmed_at)}</dd>}
              </div>
            </dl>
          </Card>

          {editable && (
            <Card className="p-6">
              <h2 className="mb-4 font-display text-base font-semibold">Details</h2>
              <HeaderForm key={quote.revision} quote={quote} destinations={destinations ?? []} />
            </Card>
          )}

          <Card className="p-6">
            <h2 className="font-display text-base font-semibold">Payable to Raptors</h2>
            <div className="mt-3 border-t border-charcoal">
              {lines.map((line) => (
                <LineRow key={`${line.id}-${quote.revision}`} quoteId={quote.id} line={line} editable={editable} />
              ))}
            </div>
            {editable && <AddLineForm quoteId={quote.id} position={lines.length} />}
            <dl className="mt-5 grid gap-1 text-right">
              {totals.discountCents > 0 && (
                <div className="flex justify-end gap-6 text-sm text-slate">
                  <dt>Discount</dt>
                  <dd className="tabular">−{money(totals.discountCents)}</dd>
                </div>
              )}
              <div className="flex justify-end gap-6">
                <dt className="font-semibold">Total payable to Raptors</dt>
                <dd className="font-display text-xl font-semibold tabular">{money(totals.totalCents)}</dd>
              </div>
            </dl>
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-base font-semibold">Charges in the customer&apos;s country</h2>
            <p className="mt-1 text-sm text-slate">Estimates paid locally. Never added to the total. Raptors does not calculate import duty.</p>
            <div className="mt-3 border-t border-platinum">
              {local.map((charge) => (
                <LocalRow key={`${charge.id}-${quote.revision}`} quoteId={quote.id} charge={charge} editable={editable} />
              ))}
              {local.length === 0 && !editable && <p className="py-3 text-sm text-slate">None listed.</p>}
            </div>
            {editable && <AddLocalForm quoteId={quote.id} position={local.length} />}
          </Card>

          {(previewed || !draft) && (
            <Card className="overflow-hidden p-0">
              <div className="flex items-center justify-between border-b border-platinum px-6 py-4">
                <h2 className="font-display text-base font-semibold">{draft ? "PDF preview" : "Issued PDF"}</h2>
                <a href={`${routes.ceo.quote(quote.id)}/pdf`} target="_blank" rel="noreferrer" className="text-sm font-semibold underline underline-offset-4">
                  Open in a new tab
                </a>
              </div>
              <iframe title="Quotation PDF" src={`${routes.ceo.quote(quote.id)}/pdf?r=${quote.revision}`} className="h-[780px] w-full bg-platinum" />
            </Card>
          )}

          {email && (
            <Card className="overflow-hidden p-0">
              <div className="border-b border-platinum px-6 py-4">
                <h2 className="font-display text-base font-semibold">Email preview</h2>
                <p className="text-sm text-slate">
                  To {customer.email} · Subject: {email.subject} · The PDF is attached.
                </p>
              </div>
              <iframe title="Email preview" srcDoc={email.html} sandbox="" className="h-[620px] w-full bg-white" />
            </Card>
          )}
        </div>

        <div className="grid content-start gap-6">
          {draft && (
            <Card className="p-6">
              <h2 className="font-display text-base font-semibold">Before sending</h2>
              {issues.length > 0 ? (
                <ul className="mt-3 grid gap-2">
                  {issues.map((p) => (
                    <li key={p} className="flex gap-2 text-sm">
                      <Chip tone="warning">Fix</Chip>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-success">Ready to preview.</p>
              )}
              {canWork && (
                <div className="mt-5">
                  <DraftActions
                    quoteId={quote.id}
                    canPreview={issues.length === 0}
                    canSend={previewed && issues.length === 0}
                    sendTo={customer.email}
                    needsDiscountApproval={issues.includes("This discount needs CEO approval.")}
                    sendBlocked={template ? null : "The quotation email wording is not approved yet. The CEO approves it in Email templates."}
                  />
                </div>
              )}
            </Card>
          )}

          {!draft && (
            <Card className="grid gap-3 p-6">
              <h2 className="font-display text-base font-semibold">Issued</h2>
              <dl className="grid gap-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate">Number</dt>
                  <dd className="font-mono font-semibold">{quote.number}</dd>
                </div>
                {quote.sent_at && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate">Sent</dt>
                    <dd>{formatDate(quote.sent_at)}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <dt className="text-slate">Valid until</dt>
                  <dd>{formatDate(quote.valid_until)}</dd>
                </div>
                {quote.accepted_on && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate">Accepted</dt>
                    <dd>
                      {formatDate(quote.accepted_on)}, {quote.acceptance_method ? ACCEPTANCE_METHOD_LABEL[quote.acceptance_method].toLowerCase() : ""}
                    </dd>
                  </div>
                )}
                {quote.invoice_status === "to_prepare" && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate">Invoice</dt>
                    <dd>
                      <Chip tone="warning">To prepare</Chip>
                    </dd>
                  </div>
                )}
                {quote.declined_reason && (
                  <div>
                    <dt className="text-slate">Declined</dt>
                    <dd>{quote.declined_reason}</dd>
                  </div>
                )}
              </dl>
              {needsRetry && <RetryEmail quoteId={quote.id} />}
              {canWork && ["sent", "declined", "expired"].includes(quote.status) && <NewVersion quoteId={quote.id} />}
            </Card>
          )}

          {quote.status === "sent" && staff.role === "ceo" && (
            <Card className="p-6">
              <h2 className="mb-3 font-display text-base font-semibold">Record acceptance</h2>
              <p className="mb-4 text-sm text-slate">Customers accept by email, WhatsApp, phone or in person. The website never accepts for them.</p>
              <AcceptanceForm quoteId={quote.id} today={today} />
            </Card>
          )}
          {quote.status === "sent" && canWork && (
            <Card className="p-6">
              <h2 className="mb-3 font-display text-base font-semibold">Customer declined</h2>
              <DeclineForm quoteId={quote.id} />
            </Card>
          )}

          {canWork && (emails ?? []).length > 0 && (
            <Card className="p-6">
              <h2 className="font-display text-base font-semibold">Emails</h2>
              <ul className="mt-3 grid gap-3">
                {(emails ?? []).map((n) => (
                  <li key={n.id} className="text-sm">
                    <Chip tone={n.status === "sent" ? "success" : n.status === "held" ? "warning" : "brand"}>
                      {n.status === "sent" ? "Sent" : n.status === "held" ? "Held" : "Failed"}
                    </Chip>{" "}
                    {n.subject}
                    <span className="block text-xs text-slate">
                      To {n.to_email} · {formatDate(n.at)}
                    </span>
                    {n.error && <span className="block text-xs text-crimson">{n.error}</span>}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </CeoShell>
  );
}

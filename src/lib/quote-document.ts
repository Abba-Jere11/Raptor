import type { QuoteDocument } from "@/lib/quotes";
import { quoteTotals } from "@/lib/quotes";
import type { createClient } from "@/lib/supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;

export const ISSUED_BUCKET = "issued-documents";

export function issuedPdfPath(quoteId: string, number: string) {
  return `quotes/${quoteId}/${number}.pdf`;
}

/** Everything the quotation PDF and email need, read with the signed-in user's permissions. */
export async function loadQuoteDocument(supabase: Client, id: string): Promise<QuoteDocument | null> {
  const { data: quote } = await supabase.from("quotes").select("*").eq("id", id).maybeSingle();
  if (!quote) return null;
  const [{ data: lines }, { data: local }, { data: customer }, { data: vehicle }, { data: destination }, { data: settings }] = await Promise.all([
    supabase.from("quote_lines").select("*").eq("quote_id", id).order("position").order("kind"),
    supabase.from("quote_local_charges").select("*").eq("quote_id", id).order("position"),
    supabase.from("customers").select("*").eq("id", quote.customer_id).maybeSingle(),
    supabase.from("vehicles").select("*").eq("id", quote.vehicle_id).maybeSingle(),
    quote.destination_id ? supabase.from("destinations").select("*").eq("id", quote.destination_id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("public_site_settings").select("legal_name, licence, city").maybeSingle(),
  ]);
  if (!customer || !vehicle) return null;
  return {
    quote,
    lines: lines ?? [],
    local: local ?? [],
    customer,
    vehicle,
    destination: destination ?? null,
    settings: { legal_name: settings?.legal_name ?? null, licence: settings?.licence ?? null, city: settings?.city ?? null },
    totals: quoteTotals(lines ?? [], local ?? []),
  };
}

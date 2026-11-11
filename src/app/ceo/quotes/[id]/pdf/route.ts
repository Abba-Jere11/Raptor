import { getStaff } from "@/lib/auth";
import { renderQuotationPdf } from "@/lib/pdf/QuotationPdf";
import { ISSUED_BUCKET, loadQuoteDocument } from "@/lib/quote-document";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaff();
  if (!staff || staff.status !== "active" || !["ceo", "sales", "finance"].includes(staff.role)) {
    return new Response("Not allowed", { status: 403 });
  }
  const { id } = await params;
  const supabase = await createClient();
  const doc = await loadQuoteDocument(supabase, id);
  if (!doc) return new Response("Not found", { status: 404 });

  let pdf: Buffer;
  const draft = doc.quote.status === "draft" || doc.quote.status === "previewed";
  if (!draft && doc.quote.pdf_path) {
    const { data, error } = await createAdminClient().storage.from(ISSUED_BUCKET).download(doc.quote.pdf_path);
    if (error || !data) return new Response("The stored PDF could not be read", { status: 500 });
    pdf = Buffer.from(await data.arrayBuffer());
  } else {
    pdf = await renderQuotationPdf(doc, { draft });
  }
  const name = doc.quote.number ?? `Q-DRAFT-${doc.quote.revision}`;
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${name}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

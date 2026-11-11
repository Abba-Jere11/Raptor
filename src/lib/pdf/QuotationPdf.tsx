import path from "node:path";
import { Document, Font, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { formatDate, formatMoney } from "@/lib/format";
import { LINE_KIND_LABEL, destinationLabel, vehicleTitle, type QuoteDocument } from "@/lib/quotes";

const FONTS = path.join(process.cwd(), "src", "lib", "pdf", "fonts");
const LOGO = path.join(process.cwd(), "public", "brand", "lockup-light.png");

let registered = false;
function registerFonts() {
  if (registered) return;
  Font.register({
    family: "Inter",
    fonts: [
      { src: path.join(FONTS, "inter-400.woff"), fontWeight: 400 },
      { src: path.join(FONTS, "inter-600.woff"), fontWeight: 600 },
    ],
  });
  Font.register({
    family: "Jakarta",
    fonts: [
      { src: path.join(FONTS, "jakarta-600.woff"), fontWeight: 600 },
      { src: path.join(FONTS, "jakarta-700.woff"), fontWeight: 700 },
    ],
  });
  Font.register({ family: "Mono", src: path.join(FONTS, "mono-500.woff") });
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}

const C = { white: "#FFFFFF", platinum: "#E9EAEC", crimson: "#C62838", slate: "#68717B", charcoal: "#24272B", silver: "#B7BCC2" };

const s = StyleSheet.create({
  page: { fontFamily: "Inter", fontSize: 9.5, color: C.charcoal, paddingTop: 40, paddingBottom: 64, paddingHorizontal: 44 },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  logo: { width: 132, height: 44, objectFit: "contain" },
  docTitle: { fontFamily: "Jakarta", fontWeight: 700, fontSize: 20, letterSpacing: 3, textAlign: "right" },
  number: { fontFamily: "Mono", fontSize: 10, textAlign: "right", marginTop: 4 },
  draft: { color: C.crimson, fontFamily: "Jakarta", fontWeight: 700, fontSize: 9, letterSpacing: 2, textAlign: "right", marginTop: 4 },
  rule: { height: 2, backgroundColor: C.crimson, marginTop: 16, marginBottom: 18 },
  meta: { flexDirection: "row", justifyContent: "space-between", marginBottom: 18 },
  label: { fontSize: 7.5, letterSpacing: 1.5, color: C.slate, fontWeight: 600, marginBottom: 3 },
  strong: { fontWeight: 600 },
  vehicle: { fontFamily: "Jakarta", fontWeight: 600, fontSize: 12.5, marginBottom: 2 },
  muted: { color: C.slate },
  tableHead: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.charcoal, paddingBottom: 5, marginTop: 16 },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: C.platinum, paddingVertical: 6 },
  cellLabel: { flex: 1 },
  cellAmount: { width: 110, textAlign: "right" },
  totalRow: { flexDirection: "row", paddingVertical: 9, borderTopWidth: 1.5, borderTopColor: C.charcoal, marginTop: 2 },
  totalLabel: { flex: 1, fontFamily: "Jakarta", fontWeight: 700, fontSize: 11 },
  totalAmount: { width: 140, textAlign: "right", fontFamily: "Jakarta", fontWeight: 700, fontSize: 11 },
  box: { marginTop: 18, padding: 12, borderWidth: 0.75, borderColor: C.silver, borderRadius: 6 },
  boxTitle: { fontFamily: "Jakarta", fontWeight: 600, fontSize: 10, marginBottom: 6 },
  smallRow: { flexDirection: "row", paddingVertical: 3 },
  note: { marginTop: 14, lineHeight: 1.45 },
  footer: { position: "absolute", left: 44, right: 44, bottom: 28, borderTopWidth: 0.5, borderTopColor: C.platinum, paddingTop: 8, fontSize: 7.5, color: C.slate },
});

const usd = (cents: number) => formatMoney({ cents, currency: "USD" }, { cents: cents % 100 !== 0 });

export function QuotationPdf({ doc, draft }: { doc: QuoteDocument; draft?: boolean }) {
  const { quote, lines, local, customer, vehicle, destination, settings, totals } = doc;
  const issued = quote.sent_at ?? new Date().toISOString();
  const legal = settings.legal_name?.trim() || "Raptors Auto Group";
  const ordered = [...lines].sort((a, b) => (a.kind === "vehicle" ? -1 : b.kind === "vehicle" ? 1 : a.position - b.position));
  const method = quote.shipping_method === "roro" ? "RoRo" : quote.shipping_method === "container" ? "container" : null;

  return (
    <Document title={`Quotation ${quote.number ?? "draft"}`} author={legal} creator={legal}>
      <Page size="A4" style={s.page}>
        <View style={s.head}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt */}
          <Image src={LOGO} style={s.logo} />
          <View>
            <Text style={s.docTitle}>QUOTATION</Text>
            <Text style={s.number}>{quote.number ?? "Q-DRAFT"}</Text>
            {draft && <Text style={s.draft}>PREVIEW · NOT SENT</Text>}
          </View>
        </View>
        <View style={s.rule} />

        <View style={s.meta}>
          <View>
            <Text style={s.label}>BILLED TO</Text>
            <Text style={s.strong}>{customer.name}</Text>
            <Text style={s.muted}>{customer.email}</Text>
            {customer.country && <Text style={s.muted}>{customer.country}</Text>}
          </View>
          <View>
            <Text style={s.label}>DATE</Text>
            <Text>{formatDate(issued)}</Text>
            <Text style={[s.label, { marginTop: 8 }]}>VALID UNTIL</Text>
            <Text style={s.strong}>{formatDate(quote.valid_until)}</Text>
          </View>
        </View>

        <Text style={s.vehicle}>
          {vehicleTitle(vehicle)}
          {vehicle.exterior ? ` · ${vehicle.exterior}` : ""}
        </Text>
        <Text style={s.muted}>
          Shipping to {destinationLabel(destination)}
          {method ? ` · ${method}` : ""} · Stock {vehicle.stock_number} · VIN {vehicle.vin}
        </Text>

        <View style={s.tableHead}>
          <Text style={[s.cellLabel, s.label, { marginBottom: 0 }]}>DESCRIPTION</Text>
          <Text style={[s.cellAmount, s.label, { marginBottom: 0 }]}>USD</Text>
        </View>
        {ordered.map((line) => (
          <View key={line.id} style={s.row} wrap={false}>
            <Text style={s.cellLabel}>
              {line.kind === "vehicle" ? "Vehicle" : line.label}
              {line.kind !== "vehicle" && line.kind !== "other" && line.label !== LINE_KIND_LABEL[line.kind] ? (
                <Text style={s.muted}> · {LINE_KIND_LABEL[line.kind]}</Text>
              ) : null}
            </Text>
            <Text style={s.cellAmount}>{line.kind === "discount" ? `−${usd(line.amount_cents)}` : usd(line.amount_cents)}</Text>
          </View>
        ))}
        <View style={s.totalRow} wrap={false}>
          <Text style={s.totalLabel}>Total payable to Raptors</Text>
          <Text style={s.totalAmount}>{usd(totals.totalCents)}</Text>
        </View>

        {local.length > 0 && (
          <View style={s.box} wrap={false}>
            <Text style={s.boxTitle}>Charges in your country (estimated, paid locally, not included above)</Text>
            {local.map((c) => (
              <View key={c.id} style={s.smallRow}>
                <Text style={s.cellLabel}>
                  {c.label}
                  {c.note ? <Text style={s.muted}> · {c.note}</Text> : null}
                </Text>
                <Text style={s.cellAmount}>{c.estimate_cents === null ? "To confirm locally" : `about ${usd(c.estimate_cents)}`}</Text>
              </View>
            ))}
            <Text style={[s.muted, { marginTop: 6 }]}>
              Estimates only. Your country&apos;s customs authority sets the final requirements and amounts. Raptors does not calculate import duty.
            </Text>
          </View>
        )}

        <Text style={s.note}>
          <Text style={s.strong}>Not included: </Text>
          {quote.not_included}
        </Text>
        {quote.customer_note && <Text style={s.note}>{quote.customer_note}</Text>}
        <Text style={s.note}>
          Prices in USD. Payment by international bank transfer only. To accept, reply to the email this quotation came with or contact your Raptors
          representative. An expired quotation cannot become an invoice.
        </Text>

        <Text style={s.footer} fixed>
          {legal}
          {settings.licence ? ` · Dealer licence ${settings.licence}` : ""}
          {settings.city ? ` · ${settings.city}` : ""} · Your representative: reply to the email this quotation came with.
        </Text>
      </Page>
    </Document>
  );
}

export async function renderQuotationPdf(doc: QuoteDocument, opts: { draft?: boolean } = {}): Promise<Buffer> {
  registerFonts();
  return renderToBuffer(<QuotationPdf doc={doc} draft={opts.draft} />);
}

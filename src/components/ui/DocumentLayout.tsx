import { Wordmark } from "./Wordmark";

/**
 * Branded document layout for quotations, invoices and receipts (Figure 11).
 * A4 proportions; prints cleanly. PDF generation arrives in Milestones 6 and 8.
 */
export function DocumentLayout({
  kind,
  number,
  billedTo,
  meta,
  vehicle,
  children,
  stamp,
}: {
  kind: "Quotation" | "Invoice" | "Receipt";
  number: string;
  billedTo: string[];
  meta: Array<{ label: string; value: string }>;
  vehicle: string[];
  children: React.ReactNode;
  stamp?: string;
}) {
  return (
    <article
      aria-label={`${kind} ${number}`}
      className="relative mx-auto w-full max-w-[794px] bg-white p-8 shadow-lift print:shadow-none md:p-14"
    >
      <header className="flex flex-wrap items-start justify-between gap-6">
        <Wordmark />
        <div className="text-right">
          <p className="font-display text-2xl font-semibold uppercase tracking-[0.2em]">{kind}</p>
          <p className="mt-1 font-mono text-sm">{number}</p>
        </div>
      </header>
      <div className="mt-3 h-0.5 bg-crimson" aria-hidden />
      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        <div>
          <p className="eyebrow">Billed to</p>
          {billedTo.map((l) => (
            <p key={l} className="mt-1">
              {l}
            </p>
          ))}
        </div>
        <div>
          {meta.map((m) => (
            <div key={m.label} className="mb-2">
              <p className="eyebrow">{m.label}</p>
              <p className="mt-0.5 tabular">{m.value}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="eyebrow">Vehicle</p>
          {vehicle.map((l) => (
            <p key={l} className="mt-1">
              {l}
            </p>
          ))}
        </div>
      </div>
      <div className="mt-8">{children}</div>
      {stamp && (
        <p className="mt-8 inline-block rotate-[-4deg] rounded-panel border-2 border-success px-4 py-2 font-display text-sm font-bold uppercase tracking-[0.2em] text-success">
          {stamp}
        </p>
      )}
      <footer className="mt-10 border-t border-platinum pt-4 text-xs text-slate">
        Raptors Auto Group · [Licence no.] · [Address] · Your representative: reply to this email · Track your vehicle:
        track.[domain]
      </footer>
    </article>
  );
}

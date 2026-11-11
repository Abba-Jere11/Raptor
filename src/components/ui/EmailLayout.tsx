import { Wordmark } from "./Wordmark";

/**
 * Branded email layout (Figure 14): white header with the logo and a red rule,
 * one headline, short text and one button. In Milestone 6 this becomes the
 * table-based HTML template with a plain-text alternative.
 */
export function EmailLayout({
  subject,
  kicker,
  headline,
  children,
  cta,
}: {
  subject: string;
  kicker: string;
  headline: string;
  children: React.ReactNode;
  cta: string;
}) {
  return (
    <article className="overflow-hidden rounded-panel border border-platinum bg-white shadow-soft" aria-label={`Email: ${subject}`}>
      <p className="border-b border-platinum bg-platinum/60 px-5 py-2 text-xs text-charcoal">
        <span className="font-semibold">Subject:</span> {subject}
      </p>
      <div className="flex items-center justify-between px-6 pb-4 pt-6">
        <Wordmark />
        <span className="eyebrow text-crimson">{kicker}</span>
      </div>
      <div className="mx-6 h-0.5 bg-crimson" aria-hidden />
      <div className="px-6 py-6">
        <h2 className="font-display text-xl font-semibold">{headline}</h2>
        <div className="mt-3 space-y-3 text-[0.95rem] text-charcoal">{children}</div>
        <span className="mt-6 inline-flex h-11 items-center rounded-full bg-charcoal px-5 font-display text-sm font-semibold text-white">
          {cta} →
        </span>
      </div>
      <p className="border-t border-platinum px-6 py-4 text-xs text-slate">
        Your Raptors contact · [Named representative] · reply to this email or WhatsApp us
      </p>
    </article>
  );
}

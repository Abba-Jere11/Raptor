import type { Metadata } from "next";
import { JsonLd } from "@/components/site/JsonLd";
import { env } from "@/lib/env";
import { loadFaqs } from "@/lib/public-content";
import { routes } from "@/lib/routes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FAQs",
  description: "Questions and answers published by Raptors Auto Group.",
  alternates: { canonical: routes.faqs },
  openGraph: { title: "FAQs", description: "Questions and answers published by Raptors Auto Group.", url: routes.faqs },
};

export default async function FaqsPage() {
  const faqs = await loadFaqs();
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      {faqs.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            url: `${env.siteUrl}${routes.faqs}`,
            mainEntity: faqs.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: { "@type": "Answer", text: faq.answer },
            })),
          }}
        />
      )}
      <h1 className="text-4xl font-semibold">FAQs</h1>
      {faqs.length === 0 ? (
        <p className="mt-8 text-charcoal">No questions are published.</p>
      ) : (
        <div className="mt-8 flex flex-col gap-3">
          {faqs.map((faq) => (
            <details key={faq.id} className="rounded-card border border-platinum bg-white p-5">
              <summary className="cursor-pointer font-display font-semibold">{faq.question}</summary>
              <p className="mt-3 whitespace-pre-wrap text-charcoal">{faq.answer}</p>
            </details>
          ))}
        </div>
      )}
    </main>
  );
}

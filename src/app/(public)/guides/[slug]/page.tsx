import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/site/JsonLd";
import { env } from "@/lib/env";
import { formatDate } from "@/lib/format";
import { loadGuide } from "@/lib/public-content";
import { routes } from "@/lib/routes";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = await loadGuide((await params).slug);
  if (!guide) return { title: "Guide" };
  const title = guide.seo_title?.trim() || guide.title;
  const description = guide.seo_description?.trim() || guide.excerpt?.trim() || undefined;
  const path = routes.guide(guide.slug);
  return { title, description, alternates: { canonical: path }, openGraph: { title, description, url: path, type: "article" } };
}

export default async function GuidePage({ params }: Props) {
  const guide = await loadGuide((await params).slug);
  if (!guide) notFound();
  const path = routes.guide(guide.slug);
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: guide.title,
          dateModified: guide.confirmed_on ?? undefined,
          description: guide.excerpt ?? undefined,
          url: `${env.siteUrl}${path}`,
        }}
      />
      {guide.topic && <p className="text-sm font-semibold text-charcoal">{guide.topic}</p>}
      <h1 className="mt-2 text-4xl font-semibold">{guide.title}</h1>
      {guide.confirmed_on && <p className="mt-4 text-charcoal">Last confirmed {formatDate(guide.confirmed_on)}.</p>}
      <p className="mt-2 text-charcoal">This is general information. It does not state a country’s duty or required documents as fact.</p>
      {guide.excerpt && <p className="mt-6 font-display text-lg text-charcoal">{guide.excerpt}</p>}
      <div className="mt-6 whitespace-pre-wrap leading-7 text-charcoal">{guide.body}</div>
    </article>
  );
}

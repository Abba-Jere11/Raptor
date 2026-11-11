import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/site/JsonLd";
import { env } from "@/lib/env";
import { loadPublishedPage } from "@/lib/public-content";
import { routes } from "@/lib/routes";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const page = await loadPublishedPage("about");
  if (!page) return { title: "About" };
  return meta(page.title, page.seo_title, page.seo_description, routes.about);
}

export default async function AboutPage() {
  const page = await loadPublishedPage("about");
  if (!page) notFound();
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "AboutPage", name: page.seo_title?.trim() || page.title, url: `${env.siteUrl}${routes.about}` }} />
      <h1 className="text-4xl font-semibold">{page.title}</h1>
      <p className="mt-6 whitespace-pre-wrap leading-7 text-charcoal">{page.body}</p>
    </article>
  );
}

function meta(title: string, seoTitle: string | null, description: string | null, path: string): Metadata {
  const heading = seoTitle?.trim() || title;
  const text = description?.trim() || undefined;
  return { title: heading, description: text, alternates: { canonical: path }, openGraph: { title: heading, description: text, url: path, type: "website" } };
}

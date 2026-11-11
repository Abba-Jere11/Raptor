import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadPublishedPage } from "@/lib/public-content";
import { routes } from "@/lib/routes";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const page = await loadPublishedPage("legal");
  if (!page) return { title: "Legal" };
  const title = page.seo_title?.trim() || page.title;
  const description = page.seo_description?.trim() || undefined;
  return { title, description, alternates: { canonical: routes.legal }, openGraph: { title, description, url: routes.legal, type: "website" } };
}

export default async function LegalPage() {
  const page = await loadPublishedPage("legal");
  if (!page) notFound();
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <h1 className="text-4xl font-semibold">{page.title}</h1>
      <p className="mt-6 whitespace-pre-wrap leading-7 text-charcoal">{page.body}</p>
    </article>
  );
}

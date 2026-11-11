import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { formatDate } from "@/lib/format";
import { loadGuides } from "@/lib/public-content";
import { routes } from "@/lib/routes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Guides",
  description: "Guides published by Raptors Auto Group.",
  alternates: { canonical: routes.guides },
  openGraph: { title: "Guides", description: "Guides published by Raptors Auto Group.", url: routes.guides },
};

export default async function GuidesPage() {
  const guides = await loadGuides();
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <h1 className="text-4xl font-semibold">Guides</h1>
      <p className="mt-3 max-w-2xl text-charcoal">Each guide shows the date it was last confirmed. A guide does not state a country’s duty or documents as fact.</p>
      {guides.length === 0 ? (
        <p className="mt-10 text-charcoal">No guides are published.</p>
      ) : (
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((guide) => (
            <li key={guide.id}>
              <Card className="flex h-full flex-col p-6">
                {guide.topic && (
                  <Chip tone="outline" className="self-start">
                    {guide.topic}
                  </Chip>
                )}
                <h2 className="mt-4 font-display text-xl font-semibold">
                  <Link href={routes.guide(guide.slug)} className="hover:underline">
                    {guide.title}
                  </Link>
                </h2>
                {guide.excerpt && <p className="mt-3 text-charcoal">{guide.excerpt}</p>}
                {guide.confirmed_on && <p className="mt-auto pt-4 text-sm text-charcoal">Last confirmed {formatDate(guide.confirmed_on)}</p>}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

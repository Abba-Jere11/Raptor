import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PillButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { MOCK_GUIDES } from "@/mock/MOCK_DATA_content";
import { routes } from "@/prototype/routes";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return MOCK_GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const g = MOCK_GUIDES.find((x) => x.slug === slug);
  return { title: g?.title ?? "Guide" };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const g = MOCK_GUIDES.find((x) => x.slug === slug);
  if (!g) notFound();
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <nav aria-label="Breadcrumb" className="text-sm text-slate">
        <Link href={routes.site.guides} className="hover:underline">
          Guides
        </Link>{" "}
        / {g.topic}
      </nav>
      <Chip tone="outline" className="mt-6">
        {g.topic}
      </Chip>
      <h1 className="mt-3 text-4xl font-semibold leading-tight">{g.title}</h1>
      <p className="mt-3 text-slate">
        Last confirmed {g.confirmed} · {g.minutes} min read
      </p>
      <Card tone="platinum" className="mt-8 p-5 text-sm">
        <strong>As last confirmed on {g.confirmed}.</strong> We never state a country&apos;s age limit, duty or document
        list as fact. Check current requirements with your customs authority or clearing agent.
      </Card>
      <div className="mt-8 space-y-4 leading-relaxed">
        <p>{g.excerpt}</p>
        <p className="text-slate">
          [Guide body: written and approved by Raptors in Milestone 5. This prototype shows the layout only.]
        </p>
      </div>
      <div className="mt-10">
        <PillButton href={routes.site.request} variant="primary">
          Request a vehicle
        </PillButton>
      </div>
    </article>
  );
}

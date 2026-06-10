import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/JsonLd";
import {
  GUIDE_ENTRIES,
  generateGuideMetadata,
  getGuide
} from "@/lib/utils/guides";
import {
  generateFAQSchema,
  generateWebPageSchema
} from "@/lib/utils/seo";

type GuidePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return GUIDE_ENTRIES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);

  if (!guide) {
    return {};
  }

  return generateGuideMetadata(guide.slug);
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = getGuide(slug);

  if (!guide) {
    notFound();
  }

  const relatedGuides = GUIDE_ENTRIES.filter((entry) => entry.slug !== guide.slug).slice(0, 3);

  return (
    <article className="space-y-8">
      <nav aria-label="Breadcrumb" className="text-xs font-bold uppercase tracking-widest text-muted">
        <Link href="/" className="hover:text-primary">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/guides" className="hover:text-primary">
          Guides
        </Link>
      </nav>

      <header className="border-2 border-ink bg-surface p-5 shadow-brutal md:p-7">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Leafwork guide</p>
        <h1 className="mt-2 max-w-4xl text-4xl font-black tracking-normal md:text-5xl">{guide.h1}</h1>
        <p className="mt-4 max-w-3xl text-lg text-muted">{guide.intro}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={guide.cta.href}
            className="inline-flex min-h-11 items-center rounded-brutal border-2 border-ink bg-primary px-5 py-2 font-bold text-white shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
          >
            {guide.cta.label}
          </Link>
          <Link
            href="/tools"
            className="inline-flex min-h-11 items-center rounded-brutal border-2 border-ink bg-paper px-5 py-2 font-bold shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
          >
            See all PDF tools
          </Link>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="border-2 border-ink bg-green-50 p-5 shadow-brutal">
          <h2 className="text-2xl font-black">Quick answer</h2>
          <p className="mt-3 text-muted">{guide.quickAnswer}</p>
        </div>
        <div className="border-2 border-ink bg-paper p-5 shadow-brutal">
          <h2 className="text-2xl font-black">Privacy note</h2>
          <p className="mt-3 text-muted">{guide.privacyNote}</p>
        </div>
      </section>

      <section className="border-2 border-ink bg-surface p-5 shadow-brutal md:p-7">
        <h2 className="text-3xl font-black">How to do it</h2>
        <ol className="mt-5 grid gap-4">
          {guide.steps.map((step, index) => (
            <li key={step.title} className="grid gap-3 border-2 border-ink bg-paper p-4 sm:grid-cols-[3rem_1fr]">
              <span className="flex size-10 items-center justify-center rounded-full border-2 border-ink bg-primary font-black text-white">
                {index + 1}
              </span>
              <div>
                <h3 className="text-lg font-black">{step.title}</h3>
                <p className="mt-1 text-sm text-muted">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="border-2 border-ink bg-paper p-5 shadow-brutal">
          <h2 className="text-2xl font-black">Best for</h2>
          <ul className="mt-4 space-y-2">
            {guide.bestFor.map((item) => (
              <li key={item} className="border-2 border-ink bg-surface px-3 py-2 text-sm font-semibold">
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="border-2 border-ink bg-paper p-5 shadow-brutal">
          <h2 className="text-2xl font-black">Common mistakes</h2>
          <ul className="mt-4 space-y-2">
            {guide.mistakes.map((item) => (
              <li key={item} className="border-2 border-ink bg-surface px-3 py-2 text-sm font-semibold">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-2 border-ink bg-surface p-5 shadow-brutal md:p-7">
        <h2 className="text-3xl font-black">FAQ</h2>
        <div className="mt-5 grid gap-4">
          {guide.faqs.map((faq) => (
            <div key={faq.q} className="border-2 border-ink bg-paper p-4">
              <h3 className="font-black">{faq.q}</h3>
              <p className="mt-2 text-sm text-muted">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-2 border-ink bg-paper p-5 shadow-brutal">
        <h2 className="text-2xl font-black">More local PDF guides</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {relatedGuides.map((entry) => (
            <Link
              key={entry.slug}
              href={`/guides/${entry.slug}`}
              className="border-2 border-ink bg-surface p-3 text-sm font-bold hover:bg-green-50"
            >
              {entry.h1}
            </Link>
          ))}
        </div>
      </section>

      <JsonLd
        id={`${guide.slug}-webpage-schema`}
        schema={generateWebPageSchema({
          name: guide.h1,
          description: guide.description,
          path: `/guides/${guide.slug}`,
          aboutTrustFacts: true
        })}
      />
      <JsonLd id={`${guide.slug}-faq-schema`} schema={generateFAQSchema(guide.faqs)} />
    </article>
  );
}

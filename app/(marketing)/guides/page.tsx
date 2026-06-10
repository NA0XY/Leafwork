import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/seo/JsonLd";
import { GUIDE_ENTRIES } from "@/lib/utils/guides";
import { canonicalUrl, generateWebPageSchema } from "@/lib/utils/seo";

export const metadata: Metadata = {
  title: "PDF Guides - Local Browser PDF Workflows | Leafwork",
  description:
    "Practical Leafwork guides for merging, splitting, redacting, converting, and cleaning PDFs locally in your browser.",
  alternates: {
    canonical: canonicalUrl("/guides")
  },
  openGraph: {
    type: "website",
    title: "PDF Guides - Local Browser PDF Workflows | Leafwork",
    description:
      "Learn how to handle everyday PDF tasks with privacy-first browser workflows.",
    url: canonicalUrl("/guides"),
    siteName: "Leafwork"
  }
};

export default function GuidesIndexPage() {
  return (
    <div className="space-y-8">
      <section className="border-2 border-ink bg-surface p-5 shadow-brutal md:p-7">
        <p className="text-xs font-bold uppercase tracking-widest text-muted">Guides</p>
        <h1 className="mt-2 max-w-3xl text-4xl font-black tracking-normal md:text-5xl">
          Practical PDF workflows that keep files local.
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-muted">
          Clear, no-fluff guides for common PDF work: merge files, split pages, remove metadata,
          redact sensitive content, and convert images to PDF in your browser.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {GUIDE_ENTRIES.map((guide) => (
          <Link
            key={guide.slug}
            href={`/guides/${guide.slug}`}
            className="group flex min-h-60 flex-col justify-between border-2 border-ink bg-paper p-5 shadow-brutal transition hover:-translate-y-0.5 hover:bg-green-50"
          >
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Leafwork guide</p>
              <h2 className="text-2xl font-black leading-tight">{guide.h1}</h2>
              <p className="text-sm text-muted">{guide.description}</p>
            </div>
            <span className="mt-5 inline-flex font-bold text-primary group-hover:underline">Read guide</span>
          </Link>
        ))}
      </section>

      <JsonLd
        id="guides-index-schema"
        schema={generateWebPageSchema({
          name: "Leafwork PDF Guides",
          description: "Practical guides for browser-local PDF workflows.",
          path: "/guides",
          aboutTrustFacts: true
        })}
      />
    </div>
  );
}

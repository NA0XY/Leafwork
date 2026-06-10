import type { Metadata } from "next";
import Link from "next/link";

import { AnswerBlocks } from "@/components/landing/AnswerBlocks";
import { WhyLeafworkDifferent } from "@/components/landing/ComparisonTable";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { Hero } from "@/components/landing/Hero";
import { ToolGrid } from "@/components/landing/ToolGrid";
import { JsonLd } from "@/components/seo/JsonLd";
import { GUIDE_NAV_ITEMS } from "@/lib/utils/guides";
import {
  HOMEPAGE_FAQS,
  canonicalUrl,
  generateFAQSchema,
  generateOrganizationSchema,
  generateSoftwareAppSchema,
  generateWebsiteSchema
} from "@/lib/utils/seo";

export const metadata: Metadata = {
  title: "Leafwork - Free PDF Tools. Your Files Never Leave Your Browser.",
  description:
    "Free browser-based PDF tools to merge, split, watermark, sign, redact, rotate, convert images, and clean metadata.",
  keywords: [
    "free pdf tools",
    "merge pdf",
    "split pdf",
    "remove pdf metadata",
    "redact pdf",
    "pdf tools no upload",
    "privacy first pdf"
  ],
  alternates: {
    canonical: canonicalUrl("/")
  }
};

export default function MarketingHomePage() {
  const softwareSchema = generateSoftwareAppSchema();

  return (
    <div className="space-y-10">
      <Hero />
      <AnswerBlocks />
      <FeatureGrid />
      <WhyLeafworkDifferent />
      <ToolGrid />
      <section className="border-2 border-ink bg-surface p-5 shadow-brutal md:p-7">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted">Guides</p>
            <h2 className="mt-2 text-3xl font-black">Learn local PDF workflows</h2>
          </div>
          <Link href="/guides" className="font-bold text-primary underline">
            See all PDF guides
          </Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {GUIDE_NAV_ITEMS.slice(0, 3).map((guide) => (
            <Link
              key={guide.href}
              href={guide.href}
              className="border-2 border-ink bg-paper p-4 font-bold shadow-brutal hover:bg-green-50"
            >
              {guide.anchorText}
            </Link>
          ))}
        </div>
      </section>

      <JsonLd id="homepage-org-schema" schema={generateOrganizationSchema()} />
      <JsonLd id="homepage-website-schema" schema={generateWebsiteSchema()} />
      {softwareSchema ? <JsonLd id="homepage-software-schema" schema={softwareSchema} /> : null}
      <JsonLd id="homepage-faq-schema" schema={generateFAQSchema(HOMEPAGE_FAQS)} />
    </div>
  );
}

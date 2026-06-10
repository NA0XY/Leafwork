import type { Metadata } from "next";

import { AnswerBlocks } from "@/components/landing/AnswerBlocks";
import { WhyLeafworkDifferent } from "@/components/landing/ComparisonTable";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { Hero } from "@/components/landing/Hero";
import { ToolGrid } from "@/components/landing/ToolGrid";
import { JsonLd } from "@/components/seo/JsonLd";
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

      <JsonLd id="homepage-org-schema" schema={generateOrganizationSchema()} />
      <JsonLd id="homepage-website-schema" schema={generateWebsiteSchema()} />
      {softwareSchema ? <JsonLd id="homepage-software-schema" schema={softwareSchema} /> : null}
      <JsonLd id="homepage-faq-schema" schema={generateFAQSchema(HOMEPAGE_FAQS)} />
    </div>
  );
}

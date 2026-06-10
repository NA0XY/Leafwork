import type { Metadata } from "next";
import Script from "next/script";

import { AnswerBlocks } from "@/components/landing/AnswerBlocks";
import { WhyLeafworkDifferent } from "@/components/landing/ComparisonTable";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { Hero } from "@/components/landing/Hero";
import { ToolGrid } from "@/components/landing/ToolGrid";
import {
  HOMEPAGE_FAQS,
  canonicalUrl,
  generateFAQSchema,
  generateOrganizationSchema,
  generateSoftwareAppSchema,
  generateWebsiteSchema,
  serializeJsonLd
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

      <Script
        id="homepage-org-schema"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(generateOrganizationSchema()) }}
      />
      <Script
        id="homepage-website-schema"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(generateWebsiteSchema()) }}
      />
      {softwareSchema ? (
        <Script
          id="homepage-software-schema"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(softwareSchema) }}
        />
      ) : null}
      <Script
        id="homepage-faq-schema"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(generateFAQSchema(HOMEPAGE_FAQS)) }}
      />
    </div>
  );
}

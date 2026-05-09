import type { Metadata } from "next";
import Script from "next/script";

import { WhyLeafworkDifferent } from "@/components/landing/ComparisonTable";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { Hero } from "@/components/landing/Hero";
import { ToolGrid } from "@/components/landing/ToolGrid";
import { canonicalUrl, generateSoftwareAppSchema } from "@/lib/utils/seo";

export const metadata: Metadata = {
  title: "Leafwork - Free PDF Tools. Your Files Never Leave Your Browser.",
  description:
    "Free browser-based PDF tools to merge, split, compress, watermark, sign, redact, and summarize documents.",
  keywords: [
    "free pdf tools",
    "merge pdf",
    "split pdf",
    "compress pdf",
    "pdf tools no upload",
    "privacy first pdf"
  ],
  alternates: {
    canonical: canonicalUrl("/")
  }
};

export default function MarketingHomePage() {
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Leafwork",
    url: canonicalUrl("/"),
    logo: canonicalUrl("/favicon.svg")
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Leafwork",
    url: canonicalUrl("/"),
    potentialAction: {
      "@type": "SearchAction",
      target: `${canonicalUrl("/tools")}?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <div className="space-y-10">
      <Hero />
      <FeatureGrid />
      <WhyLeafworkDifferent />
      <ToolGrid />

      <Script
        id="homepage-org-schema"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <Script
        id="homepage-website-schema"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <Script
        id="homepage-software-schema"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateSoftwareAppSchema()) }}
      />
    </div>
  );
}

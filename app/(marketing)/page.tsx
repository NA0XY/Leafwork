import type { Metadata } from "next";

import { WhyLeafworkDifferent } from "@/components/landing/ComparisonTable";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { Hero } from "@/components/landing/Hero";
import { ToolGrid } from "@/components/landing/ToolGrid";
import { canonicalUrl, generateSoftwareAppSchema } from "@/lib/utils/seo";

export const metadata: Metadata = {
  title: "Leafwork - Free PDF Tools. Your Files Never Leave Your Browser.",
  description:
    "Leafwork gives you free local PDF utilities: free pdf merger, compress pdf no upload, and privacy-first editing.",
  keywords: ["free pdf merger", "compress pdf no upload", "local pdf tools"],
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
    logo: canonicalUrl("/icon.png")
  };

  return (
    <div className="space-y-10">
      <Hero />
      <FeatureGrid />
      <WhyLeafworkDifferent />
      <ToolGrid />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateSoftwareAppSchema()) }}
      />
    </div>
  );
}

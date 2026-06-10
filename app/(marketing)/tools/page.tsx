import type { Metadata } from "next";

import { ToolGrid } from "@/components/landing/ToolGrid";
import { JsonLd } from "@/components/seo/JsonLd";
import { getToolFeatureState } from "@/lib/config/features";
import {
  TOOL_NAV_ITEMS,
  TRUST_AND_PRIVACY_FACTS,
  canonicalUrl,
  generateBreadcrumbSchema,
  generateToolCollectionSchema,
  getAvailableToolNavItems
} from "@/lib/utils/seo";

export const metadata: Metadata = {
  title: "All Local PDF Tools",
  description: "Browse available Leafwork PDF tools that run locally in the browser, with coming-soon features clearly marked.",
  alternates: {
    canonical: canonicalUrl("/tools")
  }
};

export default function ToolsDirectoryPage() {
  const availableTools = getAvailableToolNavItems();
  const comingSoonTools = TOOL_NAV_ITEMS.filter((tool) => !getToolFeatureState(tool.slug).enabled);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Tool Directory</h1>
        <p className="max-w-3xl text-muted">
          Pick an available local PDF workflow and start instantly. Features that are disabled or not ready are marked
          coming soon instead of being promoted as live tools.
        </p>
      </header>

      <ToolGrid />

      <section className="rounded-brutal border-2 border-ink bg-surface p-4 shadow-brutal">
        <h2 className="text-2xl font-bold">Leafwork tool facts</h2>
        <dl className="mt-4 grid gap-3 text-sm md:grid-cols-3">
          <div className="rounded-brutal border-2 border-ink bg-paper p-3">
            <dt className="font-bold">Available tools</dt>
            <dd className="mt-1 text-muted">{availableTools.length} browser-local workflows are available now.</dd>
          </div>
          <div className="rounded-brutal border-2 border-ink bg-paper p-3">
            <dt className="font-bold">Coming soon</dt>
            <dd className="mt-1 text-muted">{comingSoonTools.length} tools are hidden from the sitemap until enabled.</dd>
          </div>
          <div className="rounded-brutal border-2 border-ink bg-paper p-3">
            <dt className="font-bold">Privacy model</dt>
            <dd className="mt-1 text-muted">Core PDF file bytes stay in the browser for available local tools.</dd>
          </div>
        </dl>
        <ul className="mt-4 grid gap-2 text-sm text-muted md:grid-cols-2">
          {TRUST_AND_PRIVACY_FACTS.slice(0, 4).map((fact) => (
            <li key={fact} className="rounded-brutal border-2 border-ink bg-paper px-3 py-2">
              {fact}
            </li>
          ))}
        </ul>
      </section>

      <JsonLd id="tools-breadcrumb-schema" schema={generateBreadcrumbSchema({})} />
      <JsonLd id="tools-collection-schema" schema={generateToolCollectionSchema()} />
    </div>
  );
}

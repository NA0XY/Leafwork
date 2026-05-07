import type { Metadata } from "next";

import { ToolGrid } from "@/components/landing/ToolGrid";
import { canonicalUrl } from "@/lib/utils/seo";

export const metadata: Metadata = {
  title: "All PDF Tools",
  description: "Browse all local-first Leafwork tools.",
  alternates: {
    canonical: canonicalUrl("/tools")
  }
};

export default function ToolsDirectoryPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Tool Directory</h1>
      <p className="text-muted">Pick a workflow and start instantly.</p>
      <ToolGrid />
    </div>
  );
}

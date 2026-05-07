import type { Metadata } from "next";

import { Card } from "@/components/ui/Card";
import { canonicalUrl } from "@/lib/utils/seo";

export const metadata: Metadata = {
  title: "About Leafwork",
  description: "Why Leafwork is built as a local-first PDF workspace.",
  alternates: {
    canonical: canonicalUrl("/about")
  }
};

export default function AboutPage() {
  return (
    <Card className="space-y-4 bg-surface">
      <h1 className="text-3xl font-bold">About Leafwork</h1>
      <p className="text-base text-muted">
        Leafwork is built around one promise: your documents stay in your browser by default. Most editing tools run
        fully client-side with no upload requirement.
      </p>
      <p className="text-base text-muted">
        AI-only features run on extracted text, not file bytes. We use free-tier services to keep the product accessible
        and sustainable.
      </p>
    </Card>
  );
}

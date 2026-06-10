import type { MetadataRoute } from "next";

import { getToolFeatureState } from "@/lib/config/features";
import { GUIDE_ENTRIES } from "@/lib/utils/guides";
import { BASE_URL, type ToolSlug } from "@/lib/utils/seo";

type SitemapEntry = {
  route: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
};

const staticEntries: SitemapEntry[] = [
  { route: "/", priority: 1.0, changeFrequency: "weekly" },
  { route: "/tools", priority: 0.9, changeFrequency: "weekly" },
  { route: "/guides", priority: 0.8, changeFrequency: "weekly" },
  { route: "/about", priority: 0.5, changeFrequency: "monthly" },
  { route: "/privacy", priority: 0.45, changeFrequency: "monthly" },
  { route: "/security", priority: 0.45, changeFrequency: "monthly" },
  { route: "/status", priority: 0.35, changeFrequency: "weekly" },
  { route: "/terms", priority: 0.4, changeFrequency: "monthly" }
];

const toolEntries: Array<SitemapEntry & { slug: ToolSlug }> = [
  { slug: "sandbox", route: "/tools/sandbox", priority: 0.9, changeFrequency: "weekly" },
  { slug: "merge", route: "/tools/merge", priority: 0.85, changeFrequency: "monthly" },
  { slug: "split", route: "/tools/split", priority: 0.85, changeFrequency: "monthly" },
  { slug: "images-to-pdf", route: "/tools/images-to-pdf", priority: 0.85, changeFrequency: "monthly" },
  { slug: "sign", route: "/tools/sign", priority: 0.85, changeFrequency: "monthly" },
  { slug: "redact", route: "/tools/redact", priority: 0.85, changeFrequency: "monthly" },
  { slug: "pdf-to-images", route: "/tools/pdf-to-images", priority: 0.8, changeFrequency: "monthly" },
  { slug: "watermark", route: "/tools/watermark", priority: 0.8, changeFrequency: "monthly" },
  { slug: "rotate", route: "/tools/rotate", priority: 0.8, changeFrequency: "monthly" },
  { slug: "metadata-strip", route: "/tools/metadata-strip", priority: 0.75, changeFrequency: "monthly" },
  { slug: "compress", route: "/tools/compress", priority: 0.65, changeFrequency: "monthly" },
  { slug: "pdf-to-word", route: "/tools/pdf-to-word", priority: 0.65, changeFrequency: "monthly" },
  { slug: "summarize", route: "/tools/summarize", priority: 0.65, changeFrequency: "monthly" }
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries = [
    ...staticEntries,
    ...toolEntries.filter((entry) => getToolFeatureState(entry.slug).enabled),
    ...GUIDE_ENTRIES.map((guide) => ({
      route: `/guides/${guide.slug}`,
      priority: 0.7,
      changeFrequency: "monthly" as const
    }))
  ];

  return entries.map(({ route, priority, changeFrequency }) => ({
    url: `${BASE_URL}${route}`,
    lastModified: now,
    changeFrequency,
    priority
  }));
}

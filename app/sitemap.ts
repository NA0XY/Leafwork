import type { MetadataRoute } from "next";

import { BASE_URL } from "@/lib/utils/seo";

type SitemapEntry = {
  route: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
};

const entries: SitemapEntry[] = [
  { route: "/", priority: 1.0, changeFrequency: "weekly" },
  { route: "/tools", priority: 0.9, changeFrequency: "weekly" },
  { route: "/tools/merge", priority: 0.85, changeFrequency: "monthly" },
  { route: "/tools/compress", priority: 0.85, changeFrequency: "monthly" },
  { route: "/tools/split", priority: 0.85, changeFrequency: "monthly" },
  { route: "/tools/pdf-to-word", priority: 0.85, changeFrequency: "monthly" },
  { route: "/tools/sign", priority: 0.85, changeFrequency: "monthly" },
  { route: "/tools/redact", priority: 0.85, changeFrequency: "monthly" },
  { route: "/tools/pdf-to-images", priority: 0.8, changeFrequency: "monthly" },
  { route: "/tools/watermark", priority: 0.8, changeFrequency: "monthly" },
  { route: "/tools/rotate", priority: 0.8, changeFrequency: "monthly" },
  { route: "/tools/metadata-strip", priority: 0.75, changeFrequency: "monthly" },
  { route: "/tools/summarize", priority: 0.75, changeFrequency: "monthly" },
  { route: "/about", priority: 0.5, changeFrequency: "monthly" }
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return entries.map(({ route, priority, changeFrequency }) => ({
    url: `${BASE_URL}${route}`,
    lastModified: now,
    changeFrequency,
    priority
  }));
}

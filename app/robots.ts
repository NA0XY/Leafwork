import type { MetadataRoute } from "next";

import { getToolFeatureState } from "@/lib/config/features";
import { BASE_URL, type ToolSlug } from "@/lib/utils/seo";

const toolPaths: Array<{ slug: ToolSlug; path: string }> = [
  { slug: "sandbox", path: "/tools/sandbox" },
  { slug: "merge", path: "/tools/merge" },
  { slug: "split", path: "/tools/split" },
  { slug: "compress", path: "/tools/compress" },
  { slug: "pdf-to-word", path: "/tools/pdf-to-word" },
  { slug: "pdf-to-images", path: "/tools/pdf-to-images" },
  { slug: "images-to-pdf", path: "/tools/images-to-pdf" },
  { slug: "watermark", path: "/tools/watermark" },
  { slug: "sign", path: "/tools/sign" },
  { slug: "redact", path: "/tools/redact" },
  { slug: "rotate", path: "/tools/rotate" },
  { slug: "metadata-strip", path: "/tools/metadata-strip" },
  { slug: "summarize", path: "/tools/summarize" }
];

const baseDisallowedPaths = ["/api/", "/dashboard", "/dashboard/", "/login", "/signup"];

export default function robots(): MetadataRoute.Robots {
  const host = new URL(BASE_URL).host;
  const unavailableToolPaths = toolPaths
    .filter((tool) => !getToolFeatureState(tool.slug).enabled)
    .flatMap((tool) => [tool.path, `${tool.path}/`]);
  const disallowPublicCrawlers = [...baseDisallowedPaths, ...unavailableToolPaths];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: disallowPublicCrawlers
      },
      {
        userAgent: "OAI-SearchBot",
        allow: "/",
        disallow: disallowPublicCrawlers
      },
      {
        userAgent: "ChatGPT-User",
        allow: "/",
        disallow: disallowPublicCrawlers
      },
      {
        userAgent: "GPTBot",
        disallow: ["/"]
      },
      {
        userAgent: "Google-Extended",
        disallow: ["/"]
      },
      {
        userAgent: "CCBot",
        disallow: ["/"]
      },
      {
        userAgent: "anthropic-ai",
        disallow: ["/"]
      },
      {
        userAgent: "Claude-Web",
        disallow: ["/"]
      }
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host
  };
}

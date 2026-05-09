import type { MetadataRoute } from "next";

import { BASE_URL } from "@/lib/utils/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard", "/dashboard/", "/login", "/signup", "/_next/"]
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
    host: BASE_URL
  };
}

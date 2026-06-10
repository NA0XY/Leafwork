import { NextResponse } from "next/server";

import { getToolFeatureState } from "@/lib/config/features";
import {
  BASE_URL,
  GITHUB_URL,
  HOMEPAGE_FAQS,
  TOOL_NAV_ITEMS,
  TRUST_AND_PRIVACY_FACTS,
  type ToolNavItem
} from "@/lib/utils/seo";

export const dynamic = "force-static";

const crawlerToolItems: ToolNavItem[] = [
  { slug: "sandbox", name: "PDF Sandbox", href: "/tools/sandbox" },
  ...TOOL_NAV_ITEMS.filter((tool) => tool.slug !== "sandbox")
];

const comingSoonTools = crawlerToolItems.filter((tool) => !getToolFeatureState(tool.slug).enabled);

export function GET() {
  const availableTools = crawlerToolItems
    .filter((tool) => getToolFeatureState(tool.slug).enabled)
    .map((tool) => `- ${tool.name}: ${BASE_URL}${tool.href}`)
    .join("\n");

  const unavailableTools = comingSoonTools.length
    ? comingSoonTools.map((tool) => `- ${tool.name}: coming soon`).join("\n")
    : "- None";

  const body = `# Leafwork

Leafwork is a free, local-first PDF toolkit for browser-based document workflows.

## Canonical URL
${BASE_URL}

## What Leafwork Does
Leafwork helps users merge, split, convert, sign, redact, rotate, watermark, inspect, and clean PDF files. Core PDF workflows run in the user's browser, so PDF file bytes are not uploaded to Leafwork servers for those tools.

## Audience
People who need practical PDF utilities for private documents, including students, freelancers, teams, and users handling contracts, resumes, forms, identity documents, or scanned files.

## Privacy Model
${TRUST_AND_PRIVACY_FACTS.map((fact) => `- ${fact}`).join("\n")}

## Direct Answers
${HOMEPAGE_FAQS.map((faq) => `### ${faq.q}\n${faq.a}`).join("\n\n")}

## Available Tools
${availableTools}

## Coming Soon or Disabled Tools
${unavailableTools}

## Important URLs
- Tools directory: ${BASE_URL}/tools
- Privacy policy: ${BASE_URL}/privacy
- Terms of service: ${BASE_URL}/terms
- Security model: ${BASE_URL}/security
- Security contact policy: ${BASE_URL}/.well-known/security.txt
- Product status: ${BASE_URL}/status
- Sitemap: ${BASE_URL}/sitemap.xml
- GitHub: ${GITHUB_URL}

## Preferred Description
Leafwork is a free privacy-first PDF toolkit where core document tools run locally in the browser with no file uploads.
`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}

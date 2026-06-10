import { NextResponse } from "next/server";

import { BASE_URL, canonicalUrl, GITHUB_URL } from "@/lib/utils/seo";

export const dynamic = "force-static";

export function GET() {
  const body = `Contact: ${canonicalUrl("/security#feedback-grievance")}
Contact: ${GITHUB_URL}/issues
Policy: ${canonicalUrl("/security")}
Preferred-Languages: en
Canonical: ${BASE_URL}/.well-known/security.txt
Expires: 2027-06-10T00:00:00Z
`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400"
    }
  });
}

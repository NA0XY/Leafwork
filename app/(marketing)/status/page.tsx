import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/seo/JsonLd";
import { canonicalUrl, generateWebPageSchema } from "@/lib/utils/seo";

export const metadata: Metadata = {
  title: "Status",
  description: "Current Leafwork feature availability, privacy posture, and known limitations.",
  alternates: {
    canonical: canonicalUrl("/status")
  }
};

const updatedAt = "June 10, 2026";

const pageSchema = generateWebPageSchema({
  name: "Leafwork Status",
  description: "Current Leafwork feature availability, privacy posture, and known limitations.",
  path: "/status",
  dateModified: "2026-06-10",
  aboutTrustFacts: true
});

const featureRows = [
  ["Core PDF tools", "Operational", "Merge, split, images, watermark, sign, redact, rotate, metadata cleanup, and sandbox workflows are available."],
  ["Compression", "Coming soon", "Disabled until output quality is good enough to ship."],
  ["AI tools", "Coming soon", "PDF to Word and Summarize are disabled while privacy and quality flows are finalized."],
  ["Feedback and grievance form", "Operational", "Feedback, privacy requests, consent withdrawal, and grievance categories submit through Supabase."],
  ["Analytics", "User choice", "Vercel Analytics and Speed Insights load only after analytics are allowed from Privacy Choices."]
] as const;

export default function StatusPage() {
  return (
    <>
      <JsonLd id="status-page-schema" schema={pageSchema} />

      <article className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-3">
          <p className="text-sm font-bold uppercase tracking-widest text-muted">Status</p>
          <h1 className="text-4xl font-bold leading-tight">Leafwork Status</h1>
          <p className="text-sm text-muted">Last updated: {updatedAt}</p>
          <p className="max-w-3xl text-base leading-relaxed text-muted">
            This page tracks the current product state until Leafwork has a hosted public status service.
          </p>
        </header>

        <section className="overflow-hidden rounded-brutal border-2 border-ink">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-surface">
              <tr>
                <th className="border-b-2 border-ink p-3">Area</th>
                <th className="border-b-2 border-ink p-3">State</th>
                <th className="border-b-2 border-ink p-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {featureRows.map(([area, state, notes], index) => (
                <tr key={area} className={index % 2 === 0 ? "bg-paper" : "bg-surface"}>
                  <td className="border-b border-ink p-3 font-semibold">{area}</td>
                  <td className="border-b border-ink p-3">{state}</td>
                  <td className="border-b border-ink p-3">{notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="rounded-brutal border-2 border-ink bg-green-50 p-5 shadow-brutal">
          <h2 className="text-2xl font-bold">Report an issue</h2>
          <p className="mt-2 text-sm leading-relaxed text-green-950">
            Use the feedback button for bugs, product issues, privacy requests, consent withdrawal, or grievance
            requests. Please do not submit private PDFs through feedback.
          </p>
          <a
            href="#feedback"
            className="mt-4 inline-flex min-h-10 items-center rounded-brutal border-2 border-ink bg-accent px-4 py-2 text-sm font-bold shadow-brutal-sm"
          >
            Open feedback form
          </a>
        </section>

        <p className="text-sm text-muted">
          See also <Link className="font-semibold underline" href="/privacy">Privacy Policy</Link>, <Link className="font-semibold underline" href="/security">Security</Link>, and <Link className="font-semibold underline" href="/terms">Terms</Link>.
        </p>
      </article>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

import { canonicalUrl, generateWebPageSchema, serializeJsonLd } from "@/lib/utils/seo";

export const metadata: Metadata = {
  title: "Security",
  description: "India-first security posture for Leafwork local PDF workflows and personal data minimisation.",
  alternates: {
    canonical: canonicalUrl("/security")
  }
};

const updatedAt = "June 10, 2026";

const pageSchema = generateWebPageSchema({
  name: "Leafwork Security",
  description: "India-first security posture for Leafwork local PDF workflows and personal data minimisation.",
  path: "/security",
  dateModified: "2026-06-10",
  aboutTrustFacts: true
});

const processingMatrix = [
  ["Merge, split, rotate, watermark, sign, redact, metadata cleanup", "Browser-local", "PDF bytes are not uploaded for these core tools."],
  ["PDF to images and images to PDF", "Browser-local", "Input files and generated exports stay in the local session until you download them."],
  ["Sandbox workspace", "Browser-local session", "Files, previews, marked pages, and operations are discarded when the session is cleared."],
  ["Feedback", "Supabase", "Message, category, optional contact details, page path, user agent, and account id if signed in may be stored for product support."],
  ["Authentication", "Supabase Auth", "Login and session records are handled by Supabase for account-gated workflows."],
  ["Analytics and performance", "Vercel", "Page and performance signals load only after analytics are allowed from Privacy Choices. PDF content is not collected here."],
  ["AI tools", "Coming soon", "When enabled, extracted text may be sent to an AI provider after the user starts that workflow."]
] as const;

export default function SecurityPage() {
  return (
    <>
      <Script
        id="security-page-schema"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(pageSchema) }}
      />

      <article className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-3">
          <p className="text-sm font-bold uppercase tracking-widest text-muted">Trust</p>
          <h1 className="text-4xl font-bold leading-tight">Security and Processing Model</h1>
          <p className="text-sm text-muted">Last updated: {updatedAt}</p>
          <p className="max-w-3xl text-base leading-relaxed text-muted">
            Leafwork is designed around data minimisation, browser-local processing, and reasonable security practices.
            This page documents what stays local, which providers are involved, and what boundaries users should know.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Processing matrix</h2>
          <div className="overflow-hidden rounded-brutal border-2 border-ink">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-surface">
                <tr>
                  <th className="border-b-2 border-ink p-3">Workflow</th>
                  <th className="border-b-2 border-ink p-3">Location</th>
                  <th className="border-b-2 border-ink p-3">Notes</th>
                </tr>
              </thead>
              <tbody>
                {processingMatrix.map(([workflow, location, notes], index) => (
                  <tr key={workflow} className={index % 2 === 0 ? "bg-paper" : "bg-surface"}>
                    <td className="border-b border-ink p-3 font-semibold">{workflow}</td>
                    <td className="border-b border-ink p-3">{location}</td>
                    <td className="border-b border-ink p-3">{notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-brutal border-2 border-ink bg-surface p-5 shadow-brutal">
            <h2 className="text-xl font-bold">What Leafwork does</h2>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
              <li>Runs core PDF operations in the browser.</li>
              <li>Keeps sandbox files session-only in v1.</li>
              <li>Uses HTTPS hosting and keeps service credentials server-side.</li>
              <li>Limits collected support data to the specified product purpose.</li>
              <li>Keeps service-role database access out of public browser code.</li>
            </ul>
          </div>

          <div className="rounded-brutal border-2 border-ink bg-surface p-5 shadow-brutal">
            <h2 className="text-xl font-bold">What you control</h2>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
              <li>Your original files remain on your device for core workflows.</li>
              <li>You decide what to download, where to store it, and what to share.</li>
              <li>You can clear the sandbox workspace when finished.</li>
              <li>You should review redactions, signatures, and converted outputs before sending them onward.</li>
            </ul>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Personal data breach approach</h2>
          <p className="leading-relaxed text-muted">
            If a breach affects personal data processed by Leafwork services, our response should focus on containment,
            investigation, mitigation, user communication where appropriate, and regulatory steps required by applicable
            Indian data protection law. Core PDF files processed only in your browser are not stored by Leafwork servers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Important limitations</h2>
          <p className="leading-relaxed text-muted">
            Browser-local processing reduces upload exposure, but it does not protect against a compromised device,
            malicious browser extension, unsafe downloads, screen sharing, local malware, or documents you choose to
            send elsewhere after export.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Report a vulnerability</h2>
          <p className="leading-relaxed text-muted">
            Please report suspected security issues through the feedback widget or GitHub. Include reproduction steps,
            affected pages, browser details, and the smallest safe sample needed to demonstrate the problem. Do not
            submit private documents through feedback.
          </p>
          <a
            href="#feedback-grievance"
            className="inline-flex min-h-10 items-center rounded-brutal border-2 border-ink bg-accent px-4 py-2 text-sm font-bold shadow-brutal-sm"
          >
            Open grievance form
          </a>
          <p className="text-sm text-muted">
            See also: <Link className="font-semibold underline" href="/privacy">Privacy Policy</Link> and <Link className="font-semibold underline" href="/terms">Terms of Service</Link>.
          </p>
        </section>
      </article>
    </>
  );
}

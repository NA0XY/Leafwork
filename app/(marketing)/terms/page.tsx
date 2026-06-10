import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

import { canonicalUrl, generateWebPageSchema, serializeJsonLd } from "@/lib/utils/seo";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "India-governed terms for using Leafwork PDF tools, feedback, authentication, and coming soon AI features.",
  alternates: {
    canonical: canonicalUrl("/terms")
  }
};

const updatedAt = "June 10, 2026";

const pageSchema = generateWebPageSchema({
  name: "Leafwork Terms of Service",
  description: "India-governed terms for using Leafwork PDF tools, feedback, authentication, and coming soon AI features.",
  path: "/terms",
  dateModified: "2026-06-10",
  aboutTrustFacts: true
});

export default function TermsPage() {
  return (
    <>
      <Script
        id="terms-schema"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(pageSchema) }}
      />

      <article className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-3">
          <p className="text-sm font-bold uppercase tracking-widest text-muted">Legal</p>
          <h1 className="text-4xl font-bold leading-tight">Terms of Service</h1>
          <p className="text-sm text-muted">Last updated: {updatedAt}</p>
          <p className="max-w-3xl text-base leading-relaxed text-muted">
            These terms are intended for an India-first product. By using Leafwork, you agree to use the tools
            responsibly, follow applicable Indian law, and review outputs before relying on them.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">The service</h2>
          <p className="leading-relaxed text-muted">
            Leafwork provides browser-based document tools for PDF workflows such as merging, splitting, converting,
            signing, redacting, rotating, watermarking, metadata cleanup, and sandbox workspace handling. Some features
            may be experimental, disabled, login-gated, or marked coming soon.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Your responsibilities</h2>
          <ul className="space-y-2 text-sm leading-relaxed text-muted">
            <li>You are responsible for the files you process and for confirming the final output is correct.</li>
            <li>You must have the rights and permissions needed to use, modify, convert, sign, redact, or share each document.</li>
            <li>You may not use Leafwork to violate Indian law, infringe intellectual property rights, distribute malware, or process unlawful content.</li>
            <li>You must not attempt to bypass rate limits, abuse authentication, probe the service without permission, or interfere with other users.</li>
            <li>You should not treat AI output, document conversions, or redactions as legal, financial, medical, tax, or professional advice.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Local processing and downloads</h2>
          <p className="leading-relaxed text-muted">
            Core workflows run in your browser. You control downloaded files and where they are stored after export.
            Leafwork does not guarantee that every browser, document structure, font, signature, annotation, or scan
            will preserve perfectly across all operations.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Accounts, feedback, and privacy</h2>
          <p className="leading-relaxed text-muted">
            Some capabilities may use Supabase Auth. Feedback can be submitted anonymously or with contact details.
            Please do not submit private PDFs, confidential third-party material, or sensitive identifiers through
            feedback. Privacy requests, consent withdrawal, and grievance requests should use the feedback form. Our
            data practices are described in the <Link className="font-semibold underline" href="/privacy">Privacy Policy</Link>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">India compliance posture</h2>
          <p className="leading-relaxed text-muted">
            Leafwork is designed around data minimisation and browser-local processing. Where personal data is processed,
            we aim to use it only for a lawful purpose and the specified purpose explained to the user. If a future
            feature requires broader processing, the product should make that clear before use.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">No warranties</h2>
          <p className="leading-relaxed text-muted">
            Leafwork is provided as-is and as available. We aim to make local document work safer and easier, but we do
            not promise uninterrupted availability, perfect output, compatibility with every PDF, or suitability for a
            specific purpose.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Limitation of liability</h2>
          <p className="leading-relaxed text-muted">
            To the maximum extent allowed by applicable law, Leafwork and its maintainers are not liable for indirect,
            incidental, special, consequential, exemplary, or punitive damages, including data loss, business
            interruption, or reliance on generated output.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Governing law</h2>
          <p className="leading-relaxed text-muted">
            These terms are governed by the laws of India. Disputes will be handled by courts or forums with competent
            jurisdiction in India, subject to any mandatory law that applies to you.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Changes</h2>
          <p className="leading-relaxed text-muted">
            We may update these terms as the product changes. Continued use after an update means you accept the updated
            terms.
          </p>
        </section>
      </article>
    </>
  );
}

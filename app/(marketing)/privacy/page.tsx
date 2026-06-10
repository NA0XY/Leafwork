import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/seo/JsonLd";
import { canonicalUrl, generateWebPageSchema } from "@/lib/utils/seo";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "India-first privacy notice for Leafwork local PDF processing, feedback, analytics, authentication, and AI features.",
  alternates: {
    canonical: canonicalUrl("/privacy")
  }
};

const updatedAt = "June 10, 2026";

const pageSchema = generateWebPageSchema({
  name: "Leafwork Privacy Policy",
  description: "India-first privacy notice for Leafwork local PDF processing, feedback, analytics, authentication, and AI features.",
  path: "/privacy",
  dateModified: "2026-06-10",
  aboutTrustFacts: true
});

export default function PrivacyPage() {
  return (
    <>
      <JsonLd id="privacy-policy-schema" schema={pageSchema} />

      <article className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-3">
          <p className="text-sm font-bold uppercase tracking-widest text-muted">Legal</p>
          <h1 className="text-4xl font-bold leading-tight">Privacy Policy</h1>
          <p className="text-sm text-muted">Last updated: {updatedAt}</p>
          <p className="max-w-3xl text-base leading-relaxed text-muted">
            This notice is written for India-first compliance and is guided by the Digital Personal Data Protection Act,
            2023. In that law, you are the Data Principal for your personal data and Leafwork acts as a Data Fiduciary
            for the limited personal data we decide how to process.
          </p>
        </header>

        <section className="rounded-brutal border-2 border-ink bg-green-50 p-5 shadow-brutal">
          <h2 className="text-2xl font-bold">Short version</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-green-950">
            <li>Core PDF tools process file bytes in your browser. We do not upload or store those PDF files.</li>
            <li>The sandbox is session-only. Files stay in browser memory until the workspace is cleared or the tab session ends.</li>
            <li>Feedback, authentication, analytics, and future AI features may process limited non-file personal data for specific purposes.</li>
            <li>We do not sell personal data, serve ads, or use your uploaded PDFs to train models.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Scope under Indian privacy law</h2>
          <p className="leading-relaxed text-muted">
            India&apos;s DPDP Act applies to digital personal data processed in India and can also apply outside India
            when processing relates to offering goods or services to people in India. Most PDF content handled by
            Leafwork&apos;s core tools is not collected by Leafwork at all because it remains in your browser.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Information we process</h2>
          <div className="overflow-hidden rounded-brutal border-2 border-ink">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-surface">
                <tr>
                  <th className="border-b-2 border-ink p-3">Area</th>
                  <th className="border-b-2 border-ink p-3">Personal data or file data</th>
                  <th className="border-b-2 border-ink p-3">Specified purpose</th>
                  <th className="border-b-2 border-ink p-3">Where it goes</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-paper">
                  <td className="border-b border-ink p-3 font-semibold">Core PDF tools</td>
                  <td className="border-b border-ink p-3">PDFs, images, signatures, redaction boxes, page selections, and export settings.</td>
                  <td className="border-b border-ink p-3">Generate the output you request.</td>
                  <td className="border-b border-ink p-3">Processed locally in your browser. File bytes are not uploaded to Leafwork.</td>
                </tr>
                <tr className="bg-surface">
                  <td className="border-b border-ink p-3 font-semibold">Sandbox</td>
                  <td className="border-b border-ink p-3">Workspace files, marked pages, generated previews, and temporary operations.</td>
                  <td className="border-b border-ink p-3">Let you inspect and combine document actions before final export.</td>
                  <td className="border-b border-ink p-3">Kept in the current browser session.</td>
                </tr>
                <tr className="bg-paper">
                  <td className="border-b border-ink p-3 font-semibold">Feedback</td>
                  <td className="border-b border-ink p-3">Message, category, optional email, rating, page path, user agent, and signed-in user id when available.</td>
                  <td className="border-b border-ink p-3">Read, triage, respond to, and improve the product from feedback.</td>
                  <td className="border-b border-ink p-3">Stored in Supabase.</td>
                </tr>
                <tr className="bg-surface">
                  <td className="border-b border-ink p-3 font-semibold">Authentication</td>
                  <td className="border-b border-ink p-3">Account identifiers, session data, and login provider details.</td>
                  <td className="border-b border-ink p-3">Create and secure your account session for account-gated workflows.</td>
                  <td className="border-b border-ink p-3">Handled by Supabase Auth.</td>
                </tr>
                <tr className="bg-paper">
                  <td className="border-b border-ink p-3 font-semibold">Analytics and performance</td>
                  <td className="border-b border-ink p-3">Page usage and performance signals from Vercel Analytics and Speed Insights, only after you allow analytics.</td>
                  <td className="border-b border-ink p-3">Understand reliability, traffic, and product performance.</td>
                  <td className="border-b border-ink p-3">Handled by Vercel when enabled. PDF content is not collected through analytics.</td>
                </tr>
                <tr className="bg-surface">
                  <td className="p-3 font-semibold">AI tools</td>
                  <td className="p-3">AI features are currently marked coming soon. When enabled, they may send extracted text to an AI provider.</td>
                  <td className="p-3">Generate the AI output you explicitly request.</td>
                  <td className="p-3">PDF file bytes are not sent for AI flows unless a future feature says so clearly before use.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Lawful basis and consent</h2>
          <p className="leading-relaxed text-muted">
            We process personal data only for a lawful purpose. Where consent is the basis, it should be specific,
            informed, unambiguous, and limited to the data needed for the stated purpose. You can withdraw consent for
            optional processing by stopping that workflow, signing out, or contacting us for account or feedback data
            requests.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Your rights as a Data Principal</h2>
          <ul className="space-y-2 text-sm leading-relaxed text-muted">
            <li>Request information about personal data processed by Leafwork.</li>
            <li>Request correction, completion, updating, or erasure of account or feedback data.</li>
            <li>Withdraw consent for optional processing where consent is the basis.</li>
            <li>Use grievance redressal by contacting us through the feedback widget or GitHub until a dedicated grievance contact is published.</li>
            <li>Escalate unresolved privacy complaints to the Data Protection Board of India when the applicable provisions and process are available.</li>
          </ul>
        </section>

        <section className="space-y-4 rounded-brutal border-2 border-ink bg-surface p-5 shadow-brutal">
          <div>
            <h2 className="text-2xl font-bold">Submit a privacy or grievance request</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Use the feedback form for privacy requests and grievance redressal. Choose the matching request type and
              include enough detail to identify the account or feedback record. Do not paste private PDF contents.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <a href="#feedback-access" className="flex min-h-10 items-center justify-center rounded-brutal border-2 border-ink bg-paper px-3 py-2 text-sm font-bold">
              Access
            </a>
            <a href="#feedback-correction" className="flex min-h-10 items-center justify-center rounded-brutal border-2 border-ink bg-paper px-3 py-2 text-sm font-bold">
              Correction
            </a>
            <a href="#feedback-erasure" className="flex min-h-10 items-center justify-center rounded-brutal border-2 border-ink bg-paper px-3 py-2 text-sm font-bold">
              Erasure
            </a>
            <a href="#feedback-consent-withdrawal" className="flex min-h-10 items-center justify-center rounded-brutal border-2 border-ink bg-paper px-3 py-2 text-sm font-bold">
              Withdraw
            </a>
            <a href="#feedback-grievance" className="flex min-h-10 items-center justify-center rounded-brutal border-2 border-ink bg-accent px-3 py-2 text-sm font-bold shadow-brutal-sm">
              Grievance
            </a>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Children</h2>
          <p className="leading-relaxed text-muted">
            Leafwork is not directed at children. Under the DPDP Act, a child means an individual under 18 years of age.
            Do not create an account or submit feedback on behalf of a child unless you are a parent or lawful guardian
            and the processing is appropriate for the document workflow.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Retention</h2>
          <p className="leading-relaxed text-muted">
            Local PDF files are not retained by Leafwork because they are not uploaded for core workflows. Feedback and
            account records are retained only as long as needed to operate the service, respond to requests, prevent
            abuse, secure the product, or meet legal obligations.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Security and processors</h2>
          <p className="leading-relaxed text-muted">
            We use service providers such as Supabase and Vercel as processors for specific hosting, authentication,
            database, analytics, and performance functions. Analytics and Speed Insights stay off unless you allow them
            from Privacy Choices. We design Leafwork around data minimisation: core document file bytes stay local,
            server secrets stay server-side, and support data is limited to what is needed for the stated purpose.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Contact and grievance requests</h2>
          <p className="leading-relaxed text-muted">
            Use the feedback widget for privacy and grievance requests, open an issue on GitHub for public product
            issues, or visit the <Link className="font-semibold underline" href="/security">Security</Link> page for
            vulnerability reporting. Please do not send private PDFs through feedback.
          </p>
        </section>
      </article>
    </>
  );
}

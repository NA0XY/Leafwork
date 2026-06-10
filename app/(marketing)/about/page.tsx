import type { Metadata } from "next";

import { JsonLd } from "@/components/seo/JsonLd";
import { canonicalUrl, generateWebPageSchema } from "@/lib/utils/seo";

export const metadata: Metadata = {
  title: "About Leafwork",
  description: "Why Leafwork was built and how local-first processing protects your documents.",
  alternates: {
    canonical: canonicalUrl("/about")
  }
};

const webPageSchema = generateWebPageSchema({
  type: "AboutPage",
  name: "About Leafwork",
  description: "Why Leafwork was built and how it processes files locally without uploads.",
  path: "/about",
  aboutTrustFacts: true
});

const stack = [
  { name: "pdf-lib", desc: "PDF manipulation", href: "https://pdf-lib.js.org" },
  { name: "PDF.js", desc: "PDF rendering", href: "https://mozilla.github.io/pdf.js" },
  { name: "Groq", desc: "Future AI inference", href: "https://groq.com" },
  { name: "Supabase", desc: "Auth and database", href: "https://supabase.com" },
  { name: "Upstash", desc: "Rate limiting", href: "https://upstash.com" },
  { name: "Vercel", desc: "Hosting", href: "https://vercel.com" }
] as const;

const principles = [
  {
    number: "01",
    title: "Your files stay on your machine.",
    desc: "Merging, splitting, converting, signing, and redacting run in your browser. Your file bytes are not uploaded for core tools."
  },
  {
    number: "02",
    title: "AI features use extracted text, not file bytes.",
    desc: "AI conversion and summarization are currently coming soon. When enabled, only extracted text will be sent to the model to generate output."
  },
  {
    number: "03",
    title: "Core tools are free with no account wall.",
    desc: "Available core workflows are usable without forced upload pipelines, subscriptions, or watermark traps."
  }
] as const;

export default function AboutPage() {
  return (
    <>
      <JsonLd id="about-webpage-schema" schema={webPageSchema} />

      <article className="mx-auto max-w-3xl space-y-10">
        <header>
          <h1 className="text-4xl font-bold leading-tight">Why we built Leafwork</h1>
        </header>

        <section>
          <p className="text-lg leading-relaxed text-muted">
            Most online PDF services are upload-first. For tax records, contracts, or identity documents, that is a risk
            many people do not want. Leafwork was built so everyday PDF workflows can run locally by default.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold">How it works</h2>
          <p className="leading-relaxed text-muted">
            Modern browsers can run high-performance document tooling directly in a tab. Leafwork uses that capability
            to process PDFs locally while still giving fast previews, batch tools, and clean final exports.
          </p>
        </section>

        <section>
          <h2 className="mb-6 text-2xl font-bold">Three principles</h2>
          <div className="space-y-4">
            {principles.map((principle) => (
              <div
                key={principle.number}
                className="flex gap-6 rounded-brutal border-2 border-ink bg-surface p-5 shadow-brutal"
              >
                <span className="font-mono text-3xl font-black text-primary">{principle.number}</span>
                <div>
                  <h3 className="font-bold">{principle.title}</h3>
                  <p className="mt-1 text-sm text-muted">{principle.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold">Built with</h2>
          <p className="mb-4 text-sm text-muted">
            Leafwork is built on free-tier and open tooling so anyone can run or contribute without enterprise lock-in.
          </p>
          <div className="flex flex-wrap gap-2">
            {stack.map((item) => (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-brutal border-2 border-ink bg-green-50 px-3 py-2 text-sm font-semibold hover:bg-green-100"
              >
                {item.name} <span className="font-normal text-muted">- {item.desc}</span>
              </a>
            ))}
          </div>
        </section>
      </article>
    </>
  );
}

import Link from "next/link";
import Script from "next/script";
import { Lock } from "lucide-react";
import type { ReactNode } from "react";

import {
  generateFAQSchema,
  generateSoftwareAppSchema,
  getToolFaqs,
  type ToolFAQ,
  type ToolSlug
} from "@/lib/utils/seo";

type ToolPageShellProps = {
  toolTitle: string;
  description: string;
  faqs?: ToolFAQ[];
  toolSlug?: ToolSlug;
  children: ReactNode;
};

export const ToolPageShell = ({ toolTitle, description, faqs, toolSlug, children }: ToolPageShellProps) => {
  const fallbackFaqs = toolSlug ? getToolFaqs(toolSlug) : [];
  const faqItems = faqs && faqs.length > 0 ? faqs : fallbackFaqs;

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          <Link href="/" className="underline underline-offset-2">
            Home
          </Link>{" "}
          &gt;{" "}
          <Link href="/tools" className="underline underline-offset-2">
            Tools
          </Link>{" "}
          &gt; <span>{toolTitle}</span>
        </p>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold md:text-4xl">{toolTitle}</h1>
          <p className="max-w-3xl text-sm text-muted md:text-base">{description}</p>
          <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-green-100 px-2 py-1 text-xs font-semibold">
            <Lock className="h-3.5 w-3.5" /> Runs locally - file never uploaded
          </span>
        </div>
      </header>

      {children}

      {toolSlug && faqItems.length > 0 ? (
        <section className="space-y-3 below-fold">
          <h2 className="text-2xl font-bold">FAQ</h2>
          <div className="space-y-2">
            {faqItems.map((faq) => (
              <details key={faq.q} className="rounded-brutal border-2 border-ink bg-surface p-3">
                <summary className="cursor-pointer rounded-brutal border-2 border-ink bg-paper px-3 py-2 text-sm font-semibold">
                  {faq.q}
                </summary>
                <p className="mt-3 text-sm text-muted">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      {toolSlug ? (
        <>
          <Script
            id={`${toolSlug}-software-schema`}
            type="application/ld+json"
           
            dangerouslySetInnerHTML={{ __html: JSON.stringify(generateSoftwareAppSchema(toolSlug)) }}
          />
          <Script
            id={`${toolSlug}-faq-schema`}
            type="application/ld+json"
           
            dangerouslySetInnerHTML={{ __html: JSON.stringify(generateFAQSchema(faqItems)) }}
          />
        </>
      ) : null}
    </div>
  );
};


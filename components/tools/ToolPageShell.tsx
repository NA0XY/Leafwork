import Link from "next/link";
import { Lock } from "lucide-react";
import type { ReactNode } from "react";

import { JsonLd } from "@/components/seo/JsonLd";
import { Badge } from "@/components/ui/Badge";
import { getToolFeatureState } from "@/lib/config/features";
import {
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateSoftwareAppSchema,
  getToolAnswerBlock,
  getRelatedToolLinks,
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
  const relatedTools = toolSlug ? getRelatedToolLinks(toolSlug, 6) : [];
  const feature = toolSlug ? getToolFeatureState(toolSlug) : null;
  const answerBlock = toolSlug ? getToolAnswerBlock(toolSlug) : null;
  const isAvailable = feature?.enabled ?? true;
  const statusLabel = isAvailable
    ? "Runs locally - file never uploaded"
    : feature?.status === "coming-soon"
      ? "Coming soon - not available yet"
      : "Disabled by feature flag";
  const statusTone = isAvailable ? "bg-green-100" : "bg-yellow-100";
  const directAnswer =
    answerBlock && !isAvailable && answerBlock.comingSoonAnswer
      ? answerBlock.comingSoonAnswer
      : answerBlock?.availableAnswer;
  const shouldEmitToolSchema = Boolean(toolSlug && (!feature || feature.enabled));
  const softwareSchema = shouldEmitToolSchema && toolSlug ? generateSoftwareAppSchema(toolSlug) : null;

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <nav aria-label="Breadcrumb" className="text-xs font-semibold uppercase tracking-wide text-muted">
          <Link href="/" className="underline underline-offset-2">
            Home
          </Link>{" "}
          &gt;{" "}
          <Link href="/tools" className="underline underline-offset-2">
            Tools
          </Link>{" "}
          &gt; <span>{toolTitle}</span>
        </nav>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold md:text-4xl">{toolTitle}</h1>
          <p className="max-w-3xl text-sm text-muted md:text-base">{description}</p>
          <span className={`inline-flex items-center gap-1 rounded-full border-2 border-ink px-2 py-1 text-xs font-semibold ${statusTone}`}>
            <Lock className="h-3.5 w-3.5" /> {statusLabel}
          </span>
        </div>
      </header>

      {feature && !feature.enabled ? (
        <section className="rounded-brutal border-2 border-ink bg-surface p-6 shadow-brutal">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold">{feature.label}</h2>
            <Badge tone="warning">{toolTitle}</Badge>
          </div>
          <p className="mt-3 max-w-2xl text-sm text-muted">
            This tool is not available right now. It can be turned back on from the Leafwork feature flags.
          </p>
        </section>
      ) : (
        children
      )}

      {answerBlock && directAnswer ? (
        <section aria-labelledby={`${toolSlug}-direct-answer`} className="rounded-brutal border-2 border-ink bg-surface p-4 shadow-brutal">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id={`${toolSlug}-direct-answer`} className="text-lg font-bold">
              Direct answer
            </h2>
            <Badge tone={isAvailable ? "success" : "warning"}>{feature?.label ?? "Available"}</Badge>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">{directAnswer}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(14rem,0.8fr)]">
            <ul className="space-y-2 text-sm text-muted">
              {answerBlock.facts.map((fact) => (
                <li key={fact} className="rounded-brutal border-2 border-ink bg-paper px-3 py-2">
                  {fact}
                </li>
              ))}
            </ul>
            <div className="space-y-2 rounded-brutal border-2 border-ink bg-paper p-3 text-sm">
              <p>
                <span className="font-bold">Best for: </span>
                <span className="text-muted">{answerBlock.bestFor}</span>
              </p>
              <p>
                <span className="font-bold">Privacy: </span>
                <span className="text-muted">{answerBlock.privacyNote}</span>
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {toolSlug ? (
        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Explore More Tools</h2>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {relatedTools.map((tool) => {
              const relatedFeature = getToolFeatureState(tool.slug);

              if (!relatedFeature.enabled) {
                return (
                  <div
                    key={tool.slug}
                    className="cursor-not-allowed rounded-brutal border-2 border-ink bg-paper px-3 py-2 text-sm font-semibold opacity-60"
                    aria-disabled="true"
                    title={`${tool.name} - ${relatedFeature.label}`}
                  >
                    {tool.name}
                    <span className="mt-1 block text-xs text-muted">{relatedFeature.label}</span>
                  </div>
                );
              }

              return (
                <Link
                  key={tool.slug}
                  href={tool.href}
                  className="rounded-brutal border-2 border-ink bg-paper px-3 py-2 text-sm font-semibold hover:bg-green-100"
                >
                  {tool.name}
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

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
          <JsonLd id={`${toolSlug}-breadcrumb-schema`} schema={generateBreadcrumbSchema({ toolSlug, toolTitle })} />
          {softwareSchema ? <JsonLd id={`${toolSlug}-software-schema`} schema={softwareSchema} /> : null}
          {shouldEmitToolSchema && faqItems.length > 0 ? (
            <JsonLd id={`${toolSlug}-faq-schema`} schema={generateFAQSchema(faqItems)} />
          ) : null}
        </>
      ) : null}
    </div>
  );
};


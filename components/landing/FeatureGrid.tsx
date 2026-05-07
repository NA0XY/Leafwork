"use client";

import { Lock, ScanSearch, WandSparkles, Workflow } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Card } from "@/components/ui/Card";

const workflowSteps = [
  {
    icon: Lock,
    title: "Drop a file",
    description: "PDF bytes load directly in browser memory. No upload endpoint is involved."
  },
  {
    icon: Workflow,
    title: "Choose a tool",
    description: "Use merge, split, compress, watermark, sign, redact, rotate, or conversion flows in one session."
  },
  {
    icon: ScanSearch,
    title: "Preview and adjust",
    description: "See the result before exporting so edits are intentional, not blind."
  },
  {
    icon: WandSparkles,
    title: "Export instantly",
    description: "Processed files download from this tab. Nothing persists on our servers."
  }
] as const;

const promises = [
  {
    title: "Local-first runtime",
    detail: "Processing uses client-side PDF tooling with no upload queue."
  },
  {
    title: "Privacy by default",
    detail: "Only explicit AI requests send extracted text, never file bytes."
  },
  {
    title: "No lock-in",
    detail: "Free access to core tools without account or watermark traps."
  },
  {
    title: "Practical UX",
    detail: "Drop once and move across tools without repetitive re-upload steps."
  }
] as const;

export const FeatureGrid = () => {
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const target = sectionRef.current;
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="how-it-works" ref={sectionRef} className="space-y-5">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">How Leafwork works</h2>
        <p className="max-w-3xl text-sm text-muted">
          The workflow is built so the document remains local while you still get modern editing speed and AI helpers.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {workflowSteps.map((step, index) => {
          const Icon = step.icon;

          return (
            <Card
              key={step.title}
              className={`bg-surface transition-all duration-300 ${
                visible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
              }`}
              style={{ transitionDelay: `${index * 90}ms` }}
            >
              <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-brutal border-2 border-ink bg-green-100">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-lg font-bold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted">{step.description}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {promises.map((promise) => (
          <article key={promise.title} className="rounded-brutal border-2 border-ink bg-paper p-4 shadow-brutal">
            <h3 className="text-base font-bold">{promise.title}</h3>
            <p className="mt-1 text-sm text-muted">{promise.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

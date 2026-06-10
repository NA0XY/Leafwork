"use client";

import { CloudOff, FileText, Lock, ScanSearch, Sparkles, WandSparkles, Workflow } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Card } from "@/components/ui/Card";

const features = [
  {
    icon: Lock,
    title: "Local processing",
    description: "Core PDF actions run in-browser so file bytes stay on your machine."
  },
  {
    icon: Workflow,
    title: "One workflow",
    description: "Move across tools without repetitive upload and wait cycles."
  },
  {
    icon: ScanSearch,
    title: "Visual preview",
    description: "See pages and placements before exporting final output."
  },
  {
    icon: WandSparkles,
    title: "Fast exports",
    description: "Download processed files instantly from your current session."
  },
  {
    icon: Sparkles,
    title: "AI coming soon",
    description: "Future AI tools will use extracted text, not full PDF file bytes."
  },
  {
    icon: CloudOff,
    title: "Offline-ready feel",
    description: "Most workflows continue without relying on always-on server hops."
  },
  {
    icon: FileText,
    title: "No account for core tools",
    description: "Merge, split, sign, rotate, convert, and clean documents without login walls."
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
          Built for practical document work: local speed, clear previews, and clean final exports.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => {
          const Icon = feature.icon;

          return (
            <Card
              key={feature.title}
              className={`bg-surface transition-all duration-300 ${
                visible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
              }`}
              style={{ transitionDelay: `${index * 70}ms` }}
            >
              <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-brutal border-2 border-ink bg-green-100">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-lg font-bold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted">{feature.description}</p>
            </Card>
          );
        })}
      </div>
    </section>
  );
};

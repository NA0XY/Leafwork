import { ArrowRight, CloudUpload, Infinity as InfinityIcon, RefreshCw, Sparkles } from "lucide-react";
import type { ComponentType } from "react";

import { Card } from "@/components/ui/Card";

type DifferenceCard = {
  title: string;
  oldWayTitle: string;
  oldWayDescription: string;
  leafworkTitle: string;
  leafworkDescription: string;
  icon: ComponentType<{ className?: string }>;
};

const differences: DifferenceCard[] = [
  {
    title: "Data handling",
    oldWayTitle: "Old way",
    oldWayDescription:
      "Files are uploaded to remote servers before any processing can begin. That introduces waiting and privacy risk.",
    leafworkTitle: "Leafwork way",
    leafworkDescription:
      "Core PDF operations run in your browser memory. For those workflows, file bytes stay in the tab instead of being uploaded to Leafwork.",
    icon: CloudUpload
  },
  {
    title: "File limits",
    oldWayTitle: "Old way",
    oldWayDescription:
      "Server-side tools enforce size ceilings and queue times. Large files often hit hard limits or timeout.",
    leafworkTitle: "Leafwork way",
    leafworkDescription:
      "No upload queue means fewer server-side limits. Practical limits depend on your browser, device memory, and the document itself.",
    icon: InfinityIcon
  },
  {
    title: "Workflow",
    oldWayTitle: "Old way",
    oldWayDescription:
      "Every task can require another page load and upload cycle. You repeat setup again and again.",
    leafworkTitle: "Leafwork way",
    leafworkDescription:
      "One session can merge, split, sign, and export continuously without re-uploading each file.",
    icon: RefreshCw
  },
  {
    title: "AI privacy",
    oldWayTitle: "Old way",
    oldWayDescription:
      "Some AI flows send full documents to third-party models. Sensitive content leaves your control.",
    leafworkTitle: "Leafwork way",
    leafworkDescription:
      "AI tools are coming soon. When enabled, they will use extracted text rather than full PDF file bytes.",
    icon: Sparkles
  }
];

export const WhyLeafworkDifferent = () => (
  <section className="space-y-4">
    <div className="space-y-2">
      <h2 className="text-3xl font-bold">What makes Leafwork different</h2>
      <p className="text-sm text-muted">Most document tools were built for a different era of the web.</p>
    </div>

    <div className="space-y-3">
      {differences.map((difference) => {
        const Icon = difference.icon;

        return (
          <Card key={difference.title} className="bg-surface p-0">
            <div className="grid grid-cols-1 items-stretch gap-3 p-3 md:grid-cols-[1fr_auto_1fr] md:p-4">
              <div className="rounded-brutal border-2 border-ink bg-paper p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <p className="font-bold">{difference.oldWayTitle}</p>
                </div>
                <p className="text-sm text-muted">{difference.oldWayDescription}</p>
              </div>

              <div className="hidden items-center justify-center md:flex">
                <ArrowRight className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>

              <div className="rounded-brutal border-2 border-green-800 bg-green-100 p-3">
                <p className="mb-2 font-bold">{difference.leafworkTitle}</p>
                <p className="text-sm text-green-950">{difference.leafworkDescription}</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  </section>
);

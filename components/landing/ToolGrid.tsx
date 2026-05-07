import Link from "next/link";
import {
  EyeOff,
  FileText,
  Image,
  Layers,
  Minimize2,
  PenLine,
  RotateCw,
  Scissors,
  ShieldOff,
  Sparkles,
  Stamp
} from "lucide-react";
import type { ComponentType } from "react";

import { Badge } from "@/components/ui/Badge";

type ToolCard = {
  title: string;
  href: string;
  description: string;
  badge: string;
  icon: ComponentType<{ className?: string }>;
};

const tools: ToolCard[] = [
  { title: "Merge", href: "/tools/merge", description: "Combine PDFs in custom order.", badge: "Core", icon: Layers },
  { title: "Split", href: "/tools/split", description: "Split ranges, chunks, or selected pages.", badge: "Core", icon: Scissors },
  {
    title: "Compress",
    href: "/tools/compress",
    description: "Reduce file size with visibility into output quality.",
    badge: "Core",
    icon: Minimize2
  },
  {
    title: "PDF to Word",
    href: "/tools/pdf-to-word",
    description: "Extract structured text into editable output.",
    badge: "AI",
    icon: FileText
  },
  {
    title: "PDF to Images",
    href: "/tools/pdf-to-images",
    description: "Convert selected pages to PNG or JPG.",
    badge: "Export",
    icon: Image
  },
  {
    title: "Watermark",
    href: "/tools/watermark",
    description: "Apply text or image marks with live preview.",
    badge: "Edit",
    icon: Stamp
  },
  { title: "Sign", href: "/tools/sign", description: "Place handwritten or typed signatures.", badge: "Edit", icon: PenLine },
  { title: "Redact", href: "/tools/redact", description: "Hide sensitive regions permanently.", badge: "Secure", icon: EyeOff },
  { title: "Rotate", href: "/tools/rotate", description: "Rotate selected pages or full files.", badge: "Edit", icon: RotateCw },
  {
    title: "Metadata Strip",
    href: "/tools/metadata-strip",
    description: "Remove hidden metadata before sharing.",
    badge: "Secure",
    icon: ShieldOff
  },
  {
    title: "Summarize",
    href: "/tools/summarize",
    description: "Get concise AI summaries from extracted text.",
    badge: "AI",
    icon: Sparkles
  }
];

export const ToolGrid = () => (
  <section className="space-y-4">
    <div className="flex items-end justify-between gap-3">
      <div>
        <h2 className="text-3xl font-bold">All Tools</h2>
        <p className="text-sm text-muted">Pick a workflow and keep processing local.</p>
      </div>
      <Badge tone="success" className="hidden sm:inline-flex">
        100% local-first
      </Badge>
    </div>

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool) => {
        const Icon = tool.icon;

        return (
          <Link
            key={tool.href}
            href={tool.href}
            className="group rounded-brutal border-2 border-ink bg-surface p-4 shadow-brutal transition-all duration-100 hover:-translate-y-0.5 hover:bg-green-50"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-brutal border-2 border-ink bg-paper">
                <Icon className="h-4 w-4 text-primary" />
              </span>
              <Badge>{tool.badge}</Badge>
            </div>
            <h3 className="text-lg font-bold">{tool.title}</h3>
            <p className="mt-2 text-sm text-muted">{tool.description}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-primary">Open tool</p>
          </Link>
        );
      })}
    </div>
  </section>
);

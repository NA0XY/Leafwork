import Link from "next/link";
import {
  EyeOff,
  FileText,
  Images,
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
import { getToolFeatureState } from "@/lib/config/features";
import { cn } from "@/lib/utils/cn";
import type { ToolSlug } from "@/lib/utils/seo";

type ToolCard = {
  slug: ToolSlug;
  title: string;
  href: string;
  description: string;
  badge: string;
  icon: ComponentType<{ className?: string }>;
};

const tools: ToolCard[] = [
  {
    slug: "merge",
    title: "Merge PDF locally",
    href: "/tools/merge",
    description: "Combine multiple PDFs in custom order with drag-and-drop control.",
    badge: "Core",
    icon: Layers
  },
  {
    slug: "split",
    title: "Split PDF by range",
    href: "/tools/split",
    description: "Split by range, every N pages, or selected pages with ZIP export.",
    badge: "Core",
    icon: Scissors
  },
  {
    slug: "compress",
    title: "Compress PDF",
    href: "/tools/compress",
    description: "Target a smaller file size while monitoring output quality and readability.",
    badge: "Core",
    icon: Minimize2
  },
  {
    slug: "pdf-to-word",
    title: "Convert PDF to Word",
    href: "/tools/pdf-to-word",
    description: "Extract layout-aware text and export editable output with AI assistance.",
    badge: "AI",
    icon: FileText
  },
  {
    slug: "pdf-to-images",
    title: "Convert PDF to images",
    href: "/tools/pdf-to-images",
    description: "Convert selected pages to JPG or PNG with quality controls.",
    badge: "Export",
    icon: Image
  },
  {
    slug: "images-to-pdf",
    title: "Convert images to PDF",
    href: "/tools/images-to-pdf",
    description: "Convert multiple PNG or JPG images into one PDF or separate PDFs.",
    badge: "Export",
    icon: Images
  },
  {
    slug: "watermark",
    title: "Watermark PDF",
    href: "/tools/watermark",
    description: "Add text or image watermarks with live page placement preview.",
    badge: "Edit",
    icon: Stamp
  },
  {
    slug: "sign",
    title: "Sign PDF",
    href: "/tools/sign",
    description: "Draw, type, or upload signatures and place them precisely on any page.",
    badge: "Edit",
    icon: PenLine
  },
  {
    slug: "redact",
    title: "Redact PDF",
    href: "/tools/redact",
    description: "Redact sensitive content with visual page targeting and permanent output.",
    badge: "Secure",
    icon: EyeOff
  },
  {
    slug: "rotate",
    title: "Rotate PDF pages",
    href: "/tools/rotate",
    description: "Rotate all pages or assign different rotation angles to selected pages.",
    badge: "Edit",
    icon: RotateCw
  },
  {
    slug: "metadata-strip",
    title: "Remove PDF metadata",
    href: "/tools/metadata-strip",
    description: "Remove hidden author and producer metadata before sharing files.",
    badge: "Secure",
    icon: ShieldOff
  },
  {
    slug: "summarize",
    title: "Summarize PDF",
    href: "/tools/summarize",
    description: "Generate AI summaries with key points, figures, and action items.",
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
        const feature = getToolFeatureState(tool.slug);
        const content = (
          <>
            <div className="mb-3 flex items-center justify-between">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-brutal border-2 border-ink bg-paper">
                <Icon className="h-4 w-4 text-primary" />
              </span>
              <Badge tone={feature.enabled ? undefined : "warning"}>{feature.enabled ? tool.badge : feature.label}</Badge>
            </div>
            <h3 className="text-lg font-bold">{tool.title}</h3>
            <p className="mt-2 text-sm text-muted">{tool.description}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-primary">
              {feature.enabled ? "Open tool" : feature.label}
            </p>
          </>
        );

        const className = cn(
          "group rounded-brutal border-2 border-ink bg-surface p-4 shadow-brutal transition-all duration-100",
          feature.enabled ? "hover:-translate-y-0.5 hover:bg-green-50" : "cursor-not-allowed opacity-70"
        );

        if (!feature.enabled) {
          return (
            <div key={tool.href} className={className} aria-disabled="true">
              {content}
            </div>
          );
        }

        return (
          <Link
            key={tool.href}
            href={tool.href}
            className={className}
          >
            {content}
          </Link>
        );
      })}
    </div>
  </section>
);

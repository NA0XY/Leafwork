"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  Image,
  Images,
  Layers,
  Lock,
  Minimize2,
  PenLine,
  RotateCw,
  Scissors,
  ShieldOff,
  Sparkles,
  Stamp,
  EyeOff
} from "lucide-react";
import type { ComponentType } from "react";

import type { ToolFeatureState } from "@/lib/config/features";
import { cn } from "@/lib/utils/cn";
import type { ToolSlug } from "@/lib/utils/seo";

type ToolNavItem = {
  slug: ToolSlug;
  href: string;
  name: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};

const coreTools: ToolNavItem[] = [
  {
    slug: "merge",
    href: "/tools/merge",
    name: "Merge",
    description: "Combine many files into one.",
    icon: Layers
  },
  {
    slug: "split",
    href: "/tools/split",
    name: "Split",
    description: "Break files into smaller sets.",
    icon: Scissors
  },
  {
    slug: "compress",
    href: "/tools/compress",
    name: "Compress",
    description: "Reduce size for sharing.",
    icon: Minimize2
  },
  {
    slug: "pdf-to-word",
    href: "/tools/pdf-to-word",
    name: "PDF to Word",
    description: "Extract structured text.",
    icon: FileText
  },
  {
    slug: "pdf-to-images",
    href: "/tools/pdf-to-images",
    name: "PDF to Images",
    description: "Convert pages to image files.",
    icon: Image
  },
  {
    slug: "images-to-pdf",
    href: "/tools/images-to-pdf",
    name: "Images to PDF",
    description: "Combine images into PDFs.",
    icon: Images
  }
];

const advancedTools: ToolNavItem[] = [
  {
    slug: "watermark",
    href: "/tools/watermark",
    name: "Watermark",
    description: "Stamp text or image marks.",
    icon: Stamp
  },
  {
    slug: "sign",
    href: "/tools/sign",
    name: "Sign",
    description: "Create and place signatures.",
    icon: PenLine
  },
  {
    slug: "redact",
    href: "/tools/redact",
    name: "Redact",
    description: "Hide sensitive sections.",
    icon: EyeOff
  },
  {
    slug: "rotate",
    href: "/tools/rotate",
    name: "Rotate",
    description: "Fix orientation quickly.",
    icon: RotateCw
  },
  {
    slug: "metadata-strip",
    href: "/tools/metadata-strip",
    name: "Metadata Strip",
    description: "Remove hidden metadata.",
    icon: ShieldOff
  },
  {
    slug: "summarize",
    href: "/tools/summarize",
    name: "Summarize",
    description: "AI summary from extracted text.",
    icon: Sparkles
  }
];

const ToolLink = ({
  item,
  active,
  feature
}: {
  item: ToolNavItem;
  active: boolean;
  feature: ToolFeatureState;
}) => {
  const Icon = item.icon;
  const content = (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{item.name}</p>
        <p className="text-xs text-muted">{feature.enabled ? item.description : feature.label}</p>
      </div>
    </div>
  );

  const className = cn(
    "group block rounded-brutal border-2 border-ink bg-paper px-3 py-2 text-ink lg:px-2 lg:py-1.5",
    "transition-colors duration-100",
    feature.enabled ? "hover:bg-green-100" : "cursor-not-allowed opacity-60",
    active && feature.enabled && "border-l-4 border-l-primary bg-accent"
  );

  if (!feature.enabled) {
    return (
      <div title={`${item.name} - ${feature.label}`} className={className} aria-disabled="true">
        {content}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      title={item.name}
      className={className}
    >
      {content}
    </Link>
  );
};

export const ToolSidebar = ({ featureStates }: { featureStates: Record<ToolSlug, ToolFeatureState> }) => {
  const pathname = usePathname();

  return (
    <aside className="space-y-2 rounded-brutal border-2 border-ink bg-surface p-3 shadow-brutal lg:sticky lg:top-20 lg:h-fit lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto lg:p-2.5">
      <p className="text-xs font-bold uppercase tracking-widest text-muted">PDF Tools</p>

      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Core Tools</p>
        {coreTools.map((item) => (
          <ToolLink key={item.href} item={item} active={pathname === item.href} feature={featureStates[item.slug]} />
        ))}
      </div>

      <div className="border-t-2 border-ink pt-2">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Advanced Tools</p>
        <div className="space-y-2">
          {advancedTools.map((item) => (
            <ToolLink key={item.href} item={item} active={pathname === item.href} feature={featureStates[item.slug]} />
          ))}
        </div>
      </div>

      <div className="rounded-brutal border-2 border-ink bg-green-100 p-2">
        <p className="flex items-center gap-2 text-xs font-semibold">
          <Lock className="h-3.5 w-3.5" /> Privacy first
        </p>
      </div>
    </aside>
  );
};

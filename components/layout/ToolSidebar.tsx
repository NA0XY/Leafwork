"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  Image,
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

import { cn } from "@/lib/utils/cn";

type ToolNavItem = {
  href: string;
  name: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};

const coreTools: ToolNavItem[] = [
  {
    href: "/tools/merge",
    name: "Merge",
    description: "Combine many files into one.",
    icon: Layers
  },
  {
    href: "/tools/split",
    name: "Split",
    description: "Break files into smaller sets.",
    icon: Scissors
  },
  {
    href: "/tools/compress",
    name: "Compress",
    description: "Reduce size for sharing.",
    icon: Minimize2
  },
  {
    href: "/tools/pdf-to-word",
    name: "PDF to Word",
    description: "Extract structured text.",
    icon: FileText
  },
  {
    href: "/tools/pdf-to-images",
    name: "PDF to Images",
    description: "Convert pages to image files.",
    icon: Image
  }
];

const advancedTools: ToolNavItem[] = [
  {
    href: "/tools/watermark",
    name: "Watermark",
    description: "Stamp text or image marks.",
    icon: Stamp
  },
  {
    href: "/tools/sign",
    name: "Sign",
    description: "Create and place signatures.",
    icon: PenLine
  },
  {
    href: "/tools/redact",
    name: "Redact",
    description: "Hide sensitive sections.",
    icon: EyeOff
  },
  {
    href: "/tools/rotate",
    name: "Rotate",
    description: "Fix orientation quickly.",
    icon: RotateCw
  },
  {
    href: "/tools/metadata-strip",
    name: "Metadata Strip",
    description: "Remove hidden metadata.",
    icon: ShieldOff
  },
  {
    href: "/tools/summarize",
    name: "Summarize",
    description: "AI summary from extracted text.",
    icon: Sparkles
  }
];

const ToolLink = ({ item, active }: { item: ToolNavItem; active: boolean }) => {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      title={item.name}
      className={cn(
        "group block rounded-brutal border-2 border-ink bg-paper p-2 text-ink",
        "transition-colors duration-100 hover:bg-green-100",
        active && "border-l-4 border-l-primary bg-accent"
      )}
    >
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <div className="hidden min-w-0 md:hidden lg:block">
          <p className="text-sm font-semibold">{item.name}</p>
          <p className="text-xs text-muted">{item.description}</p>
        </div>
      </div>
    </Link>
  );
};

export const ToolSidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="sticky top-20 h-fit max-h-[calc(100vh-5rem)] space-y-3 overflow-y-auto rounded-brutal border-2 border-ink bg-surface p-3 shadow-brutal">
      <p className="text-xs font-bold uppercase tracking-widest text-muted">PDF Tools</p>

      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Core Tools</p>
        {coreTools.map((item) => (
          <ToolLink key={item.href} item={item} active={pathname === item.href} />
        ))}
      </div>

      <div className="border-t-2 border-ink pt-2">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Advanced Tools</p>
        <div className="space-y-2">
          {advancedTools.map((item) => (
            <ToolLink key={item.href} item={item} active={pathname === item.href} />
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

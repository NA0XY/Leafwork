"use client";

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
import { useEffect, useState, type ComponentType } from "react";

import { activityUpdatedEvent, readRecentActivity, recentActivityStorageKey, type ActivityItem } from "@/lib/utils/activity";
import { timeAgo, truncateFilename } from "@/lib/utils/format";

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  merge: Layers,
  split: Scissors,
  compress: Minimize2,
  "pdf-to-word": FileText,
  "pdf-to-images": Image,
  watermark: Stamp,
  sign: PenLine,
  redact: EyeOff,
  rotate: RotateCw,
  "metadata-strip": ShieldOff,
  summarize: Sparkles
};

const normaliseTool = (tool: string): string =>
  tool
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace("pdf_to_word", "pdf-to-word")
    .replace("pdf_to_images", "pdf-to-images")
    .replace("metadata_strip", "metadata-strip");

export const RecentActivity = () => {
  const [items, setItems] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const refresh = () => setItems(readRecentActivity().slice(0, 5));
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === recentActivityStorageKey) {
        refresh();
      }
    };

    refresh();
    window.addEventListener(activityUpdatedEvent, refresh);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", refresh);

    return () => {
      window.removeEventListener(activityUpdatedEvent, refresh);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  if (!items.length) {
    return <p className="text-sm text-muted">No recent local activity yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item, index) => {
        const toolKey = normaliseTool(item.tool);
        const Icon = iconMap[toolKey] ?? FileText;

        return (
          <li key={`${item.tool}-${item.timestamp}-${index}`} className="rounded-brutal border-2 border-ink bg-paper px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-green-800 bg-green-100">
                <Icon className="h-3.5 w-3.5 text-primary" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold capitalize">{toolKey.replace(/-/g, " ")}</p>
                <p className="text-xs text-muted">{item.fileName ? truncateFilename(item.fileName, 28) : "Local document"}</p>
              </div>
              <p className="text-xs text-muted">{timeAgo(item.timestamp)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

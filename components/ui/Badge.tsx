import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "default" | "success" | "warning";
};

export const Badge = ({ className, tone = "default", ...props }: BadgeProps) => {
  const toneClass =
    tone === "success" ? "bg-green-200" : tone === "warning" ? "bg-yellow-200" : "bg-paper";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-brutal border-2 border-ink px-2 py-1 text-xs font-semibold",
        toneClass,
        className
      )}
      {...props}
    />
  );
};

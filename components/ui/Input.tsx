import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export const Input = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={cn(
      "w-full rounded-brutal border-2 border-ink bg-surface px-3 py-2 text-sm shadow-brutal",
      "placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary",
      className
    )}
    {...props}
  />
);

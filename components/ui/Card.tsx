import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export const Card = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("brutalist-card p-4", className)} {...props} />
);

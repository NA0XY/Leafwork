import { cn } from "@/lib/utils/cn";

type SkeletonVariant = "block" | "text" | "thumbnail";

type SkeletonProps = {
  className?: string;
  variant?: SkeletonVariant;
};

const variantClasses: Record<SkeletonVariant, string> = {
  block: "rounded-brutal border-2 border-ink",
  text: "h-4 rounded-full",
  thumbnail: "aspect-[3/4] w-full rounded-brutal border-2 border-ink"
};

export const Skeleton = ({ className, variant = "block" }: SkeletonProps) => (
  <div className={cn("animate-pulse bg-green-100", variantClasses[variant], className)} />
);

type SkeletonGroupProps = {
  lines?: number;
  className?: string;
};

const widths = ["w-full", "w-[85%]", "w-[70%]"];

export const SkeletonGroup = ({ lines = 3, className }: SkeletonGroupProps) => {
  const safeLines = Math.max(1, lines);

  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: safeLines }).map((_, index) => (
        <Skeleton key={`skeleton-line-${index}`} variant="text" className={widths[index % widths.length]} />
      ))}
    </div>
  );
};

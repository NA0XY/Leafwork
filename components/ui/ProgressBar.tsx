import { cn } from "@/lib/utils/cn";

type ProgressColor = "primary" | "success" | "warning";
type ProgressSize = "sm" | "md" | "lg";

type ProgressBarProps = {
  value: number;
  className?: string;
  showLabel?: boolean;
  animated?: boolean;
  color?: ProgressColor;
  size?: ProgressSize;
};

const sizeClasses: Record<ProgressSize, string> = {
  sm: "h-2",
  md: "h-4",
  lg: "h-6"
};

const colorClasses: Record<ProgressColor, string> = {
  primary: "bg-primary",
  success: "bg-green-500",
  warning: "bg-yellow-400"
};

export const ProgressBar = ({
  value,
  className,
  showLabel = false,
  animated = false,
  color = "primary",
  size = "md"
}: ProgressBarProps) => {
  const safeValue = Math.max(0, Math.min(100, Math.round(value)));
  const resolvedColor: ProgressColor = safeValue >= 100 ? "success" : color;

  return (
    <div className={cn("w-full space-y-1", className)}>
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-brutal border-2 border-ink bg-paper",
          sizeClasses[size]
        )}
      >
        <div
          className={cn("relative h-full transition-all duration-300 ease-out", colorClasses[resolvedColor])}
          style={{ width: `${safeValue}%` }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={safeValue}
        >
          {animated && safeValue < 100 ? <div className="progress-stripes absolute inset-0" aria-hidden="true" /> : null}
          {showLabel && safeValue >= 10 ? (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-white">{safeValue}%</span>
          ) : null}
        </div>
      </div>

      {showLabel && safeValue < 10 ? <p className="text-right text-xs font-semibold text-muted">{safeValue}%</p> : null}
    </div>
  );
};

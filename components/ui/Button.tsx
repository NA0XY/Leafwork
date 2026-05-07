"use client";

import Link, { type LinkProps } from "next/link";
import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ForwardedRef,
  type ReactNode
} from "react";

import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type CommonButtonProps = {
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

type ButtonOnlyProps = CommonButtonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    href?: undefined;
  };

type LinkOnlyProps = CommonButtonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children" | "href"> &
  Omit<LinkProps, "href"> & {
    href: string;
  };

export type ButtonProps = ButtonOnlyProps | LinkOnlyProps;

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-accent text-ink",
  secondary: "bg-surface text-ink",
  danger: "bg-red-200 text-red-900",
  ghost: "bg-transparent text-ink"
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base"
};

const spinner = <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />;

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(function Button(
  props,
  ref
) {
  const {
    className,
    children,
    variant = "primary",
    size = "md",
    loading = false,
    ...rest
  } = props;

  const baseClassName = cn(
    "inline-flex items-center justify-center gap-2 rounded-brutal border-2 border-ink font-bold",
    "shadow-brutal transition-all duration-75",
    "hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-brutal-sm",
    "active:translate-x-[2px] active:translate-y-[2px] active:shadow-brutal-none",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    "disabled:cursor-not-allowed disabled:opacity-60",
    variantClasses[variant],
    sizeClasses[size],
    className
  );

  if ("href" in props && typeof props.href === "string") {
    const { href, ...linkRest } = rest as Omit<LinkOnlyProps, keyof CommonButtonProps>;

    return (
      <Link
        href={href}
        className={cn(baseClassName, loading && "pointer-events-none")}
        aria-disabled={loading || undefined}
        aria-busy={loading || undefined}
        ref={ref as ForwardedRef<HTMLAnchorElement>}
        {...linkRest}
      >
        {loading ? spinner : children}
      </Link>
    );
  }

  const { disabled, type = "button", ...buttonRest } = rest as Omit<ButtonOnlyProps, keyof CommonButtonProps>;

  return (
    <button
      type={type}
      className={baseClassName}
      disabled={disabled || loading}
      aria-disabled={disabled || loading || undefined}
      aria-busy={loading || undefined}
      ref={ref as ForwardedRef<HTMLButtonElement>}
      {...buttonRest}
    >
      {loading ? spinner : children}
    </button>
  );
});

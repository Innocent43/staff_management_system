import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type ButtonProps = ComponentProps<"button"> & {
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
};

const variants = {
  primary: "bg-navy-800 text-white hover:bg-navy-700 focus-visible:outline-navy-800",
  secondary: "border border-navy-200 bg-white text-navy-800 hover:bg-navy-50 focus-visible:outline-navy-500",
  ghost: "text-navy-700 hover:bg-navy-50 focus-visible:outline-navy-500",
};

export function Button({
  variant = "primary",
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className,
      )}
      {...props}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}
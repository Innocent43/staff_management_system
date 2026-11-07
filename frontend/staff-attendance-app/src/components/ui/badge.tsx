import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export type BadgeVariant = "good" | "attention" | "progress" | "problem" | "neutral";

const variants: Record<BadgeVariant, string> = {
  good: "bg-green-100 text-green-800",
  attention: "bg-amber-100 text-amber-800",
  progress: "bg-navy-100 text-navy-800",
  problem: "bg-red-100 text-red-800",
  neutral: "bg-gray-100 text-gray-700",
};

type BadgeProps = ComponentProps<"span"> & { variant?: BadgeVariant };

export function Badge({ variant = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type AlertProps = {
  variant?: "error" | "success";
  children: ReactNode;
};

export function Alert({ variant = "error", children }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border px-4 py-3 text-sm",
        variant === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-green-200 bg-green-50 text-green-700",
      )}
    >
      {children}
    </div>
  );
}
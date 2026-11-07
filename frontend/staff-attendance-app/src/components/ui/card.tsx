import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-xl border border-navy-100 bg-white p-5 shadow-sm", className)}
      {...props}
    />
  );
}
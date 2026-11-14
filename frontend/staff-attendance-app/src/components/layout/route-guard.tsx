"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/hooks/use-me";
import { NAV_ITEMS } from "@/lib/permissions";

export function RouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname(); // the current URL path, e.g. "/dashboard/employees/7"
  const me = useMe();

  // Find the menu item this URL belongs to. "/dashboard/employees/7" belongs to
  // "/dashboard/employees". The home page "/dashboard" is open to everyone.
  const rule = NAV_ITEMS.find(
    (item) =>
      item.href !== "/dashboard" &&
      (pathname === item.href || pathname.startsWith(`${item.href}/`)),
  );

  // No rule means every logged-in role may see it
  if (!rule) return <>{children}</>;

  // Wait for the role before deciding, so restricted content never flashes
  if (!me.data) return <Skeleton className="h-40 w-full" />;

  if (!rule.roles.includes(me.data.role)) {
    return (
      <EmptyState
        title="Access restricted"
        text="You do not have permission to view this page. Ask the business owner if you need access."
      />
    );
  }

  return <>{children}</>;
}
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";
import { APP_NAME } from "@/lib/constants";
import { NAV_GROUP_TITLES, navItemsFor, type NavGroup } from "@/lib/permissions";
import type { Role } from "@/types/auth";

const GROUP_ORDER: NavGroup[] = ["main", "manage", "setup"];

type SidebarProps = {
  role: Role;
  onNavigate?: () => void;
};

export function Sidebar({ role, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const items = navItemsFor(role);

  function isActive(href: string) {
    return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
  }

  return (
    <nav className="flex flex-col gap-6 px-4 py-6 text-white">
      <p className="px-2 text-xl font-bold tracking-tight">{APP_NAME}</p>

      {GROUP_ORDER.map((group) => {
        const groupItems = items.filter((item) => item.group === group);
        if (groupItems.length === 0) return null;

        return (
          <div key={group}>
            {NAV_GROUP_TITLES[group] && (
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-navy-400">
                {NAV_GROUP_TITLES[group]}
              </p>
            )}
            <ul className="space-y-1">
              {groupItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                      isActive(item.href)
                        ? "bg-navy-800 text-white"
                        : "text-navy-200 hover:bg-navy-900 hover:text-white",
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
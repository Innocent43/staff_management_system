"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";
import { APP_NAME } from "@/lib/constants";
import {
  NAV_GROUP_TITLES,
  navItemsFor,
  type NavGroup,
} from "@/lib/permissions";
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
    return href === "/dashboard"
      ? pathname === href
      : pathname.startsWith(href);
  }

  return (
    <nav
      aria-label="Main navigation"
      className="flex min-h-full flex-col px-4 py-6 text-white"
    >
      {/* Application identity */}
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="mb-9 flex items-center gap-3 rounded-xl px-2 py-2"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-xl font-extrabold text-brand-950">
          S
        </span>

        <span className="min-w-0">
          <span className="block truncate text-xl font-bold tracking-tight text-white">
            {APP_NAME}
          </span>
          <span className="block text-sm text-brand-200">
            Workforce management
          </span>
        </span>
      </Link>

      {/* Navigation groups */}
      <div className="flex flex-1 flex-col gap-7">
        {GROUP_ORDER.map((group) => {
          const groupItems = items.filter(
            (item) => item.group === group,
          );

          if (!groupItems.length) return null;

          return (
            <section
              key={group}
              aria-label={NAV_GROUP_TITLES[group] ?? "Main"}
            >
              {NAV_GROUP_TITLES[group] && (
                <h2 className="mb-3 px-3 text-[13px] font-bold uppercase tracking-[0.12em] text-brand-300">
                  {NAV_GROUP_TITLES[group]}
                </h2>
              )}

              <ul className="space-y-1.5">
                {groupItems.map((item) => {
                  const active = isActive(item.href);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "relative flex min-h-12 items-center gap-3 rounded-xl px-3.5 py-3 text-base font-medium transition-colors duration-150",
                          active
                            ? "bg-brand-800 text-white shadow-sm"
                            : "text-brand-100 hover:bg-brand-900 hover:text-white",
                        )}
                      >
                        {active && (
                          <span
                            className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-brand-400"
                            aria-hidden="true"
                          />
                        )}

                        <item.icon
                          className={cn(
                            "size-5 shrink-0",
                            active
                              ? "text-brand-300"
                              : "text-brand-200",
                          )}
                          aria-hidden="true"
                        />

                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      {/* Sidebar footer */}
      <div className="mt-8 border-t border-white/10 px-3 pt-5">
        <p className="text-sm text-brand-200">
          Workforce operations, simplified.
        </p>
      </div>
    </nav>
  );
}
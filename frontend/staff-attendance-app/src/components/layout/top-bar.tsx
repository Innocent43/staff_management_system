
"use client";

import { LogOut, Menu } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import type { MeResponse } from "@/types/auth";

type TopBarProps = {
  me: MeResponse;
  onOpenMenu: () => void;
};

export function TopBar({ me, onOpenMenu }: TopBarProps) {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const initials = me.user.full_name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <header className="sticky top-0 z-30 flex min-h-[76px] items-center justify-between gap-3 border-b border-line bg-white/95 px-3 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open navigation menu"
          className="flex size-11 shrink-0 items-center justify-center rounded-xl text-brand-900 transition hover:bg-brand-50 focus-visible:outline-brand-500 lg:hidden"
        >
          <Menu className="size-6" aria-hidden="true" />
        </button>

        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-ink sm:text-lg">
            {me.business.name}
          </p>
          <p className="hidden text-sm text-ink-muted sm:block">
            Workforce dashboard
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <div className="hidden items-center gap-3 sm:flex">
          <div className="flex size-10 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">
            {initials}
          </div>

          <div className="max-w-44">
            <p className="truncate text-base font-semibold text-ink">
              {me.user.full_name}
            </p>
            <p className="text-sm capitalize text-ink-secondary">
              {me.role}
            </p>
          </div>
        </div>

        <div className="hidden h-9 w-px bg-line sm:block" />

        <Button
          variant="ghost"
          onClick={handleLogout}
          aria-label="Sign out"
          className="min-h-11 min-w-11"
        >
          <LogOut className="size-5" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </div>
    </header>
  );
}

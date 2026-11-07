"use client";

import { LogOut, Menu } from "lucide-react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
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

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-navy-100 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open menu"
          className="rounded-lg p-2 text-navy-700 hover:bg-navy-50 lg:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>
        <p className="font-semibold text-navy-900">{me.business.name}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-navy-900">{me.user.full_name}</p>
          <Badge variant="progress" className="capitalize">
            {me.role}
          </Badge>
        </div>
        <Button variant="ghost" onClick={handleLogout} aria-label="Sign out">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
"use client";

import { useState, type ReactNode } from "react";
import { X } from "lucide-react";

import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/use-me";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { data: me, isPending, isError, refetch } = useMe();
  const [menuOpen, setMenuOpen] = useState(false);

  if (isError) {
    return (
      <main className="mx-auto max-w-md space-y-4 p-8">
        <Alert>We could not load your account. Check your connection and try again.</Alert>
        <Button onClick={() => refetch()}>Try again</Button>
      </main>
    );
  }

  if (isPending || !me) {
    return <p className="p-8 text-navy-600">Loading...</p>;
  }

  return (
    <div className="min-h-screen bg-navy-50 lg:flex">
      <aside className="hidden w-64 shrink-0 bg-navy-950 lg:block">
        <div className="sticky top-0 h-screen overflow-y-auto">
          <Sidebar role={me.role} />
        </div>
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 w-64 overflow-y-auto bg-navy-950">
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-4 rounded-lg p-2 text-navy-200 hover:bg-navy-900"
            >
              <X className="h-5 w-5" />
            </button>
            <Sidebar role={me.role} onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar me={me} onOpenMenu={() => setMenuOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
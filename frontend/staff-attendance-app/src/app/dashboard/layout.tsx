
"use client";

import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";

import { RouteGuard } from "@/components/layout/route-guard";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/use-me";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { data: me, isPending, isError, refetch } = useMe();
  const [menuOpen, setMenuOpen] = useState(false);

  // Prevent background scrolling and support closing the drawer with Escape.
  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  if (isError) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center gap-5 px-5 py-10">
        <Alert>
          We could not load your account. Check your connection and try again.
        </Alert>
       <Button onClick={() => refetch()} className="min-h-11 w-full">
  Try again
</Button>
      </main>
    );
  }

  if (isPending || !me) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface px-5">
        <p className="text-base font-medium text-ink-secondary">
          Loading your workspace...
        </p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-surface lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-[272px] shrink-0 bg-brand-950 lg:block">
        <div className="sticky top-0 h-screen overflow-y-auto">
          <Sidebar role={me.role} />
        </div>
      </aside>

      {/* Mobile navigation drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 size-full cursor-default bg-slate-950/60 backdrop-blur-[2px]"
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="absolute inset-y-0 left-0 flex w-[min(20rem,calc(100vw-2.5rem))] flex-col overflow-y-auto bg-brand-950 shadow-2xl"
          >
            <div className="flex min-h-16 items-center justify-end border-b border-white/10 px-4">
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="flex size-11 items-center justify-center rounded-xl text-brand-100 transition hover:bg-white/10 hover:text-white"
              >
                <X className="size-6" />
              </button>
            </div>

            <Sidebar
              role={me.role}
              onNavigate={() => setMenuOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Main application area */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <TopBar
          me={me}
          onOpenMenu={() => setMenuOpen(true)}
        />

        <main className="w-full flex-1 px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1600px]">
            <RouteGuard>{children}</RouteGuard>
          </div>
        </main>
      </div>
    </div>
  );
}

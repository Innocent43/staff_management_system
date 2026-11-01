"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useAuthStore } from "@/store/auth-store";

export default function DashboardPage() {
  const { me, error } = useRequireAuth();
  const logout = useAuthStore((state) => state.logout);

  if (error) {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <Alert>{error}</Alert>
      </main>
    );
  }

  if (!me) {
    return <p className="p-8 text-navy-600">Loading...</p>;
  }

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-bold text-navy-900">Welcome, {me.user.full_name}</h1>
      <p className="mt-2 text-navy-600">
        {me.business.name} &middot; {me.role}
      </p>
      <Button variant="secondary" onClick={logout} className="mt-6">
        Log out
      </Button>
    </main>
  );
}
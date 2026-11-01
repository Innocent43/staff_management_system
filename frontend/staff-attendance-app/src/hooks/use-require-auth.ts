import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError } from "@/lib/api";
import { getMe } from "@/services/auth";
import { useAuthStore } from "@/store/auth-store";
import type { MeResponse } from "@/types/auth";

export function useRequireAuth() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const ready = useAuthStore((state) => state.ready);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;

    if (!token) {
      router.replace("/login");
      return;
    }

    getMe()
      .then(setMe)
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status !== 401) {
          setError(err.message);
        }
      });
  }, [ready, token, router]);

  return { me, error };
}
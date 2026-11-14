import { useQuery } from "@tanstack/react-query";

import { getQrToken, listWorkplaces } from "@/services/workplaces";

export function useWorkplaces() {
  return useQuery({
    queryKey: ["workplaces", "list"],
    queryFn: listWorkplaces,
  });
}

export function useWorkplaceQr(id: number) {
  return useQuery({
    queryKey: ["workplaces", "qr", id],
    queryFn: () => getQrToken(id),
    // Refetch at HALF the token's lifetime, so a valid code is always on screen.
    // seconds * 500 = seconds * 1000 (to ms) / 2. Never faster than every 5 s.
    refetchInterval: (query) => {
      const seconds = query.state.data?.expires_in_seconds;
      return seconds ? Math.max(seconds * 500, 5_000) : false;
    },
    // Do not keep old codes in the cache after leaving the page
    gcTime: 0,
  });
}
import { useMe } from "@/hooks/use-me";

// Awka is in Nigeria, so Lagos time is a safe fallback while /auth/me loads
const FALLBACK_TIMEZONE = "Africa/Lagos";

export function useBusinessTimezone(): string {
  const me = useMe();
  return me.data?.business.timezone ?? FALLBACK_TIMEZONE;
}
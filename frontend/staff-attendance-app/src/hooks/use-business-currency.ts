import { useMe } from "@/hooks/use-me";

const FALLBACK_CURRENCY = "NGN";

export function useBusinessCurrency(): string {
  const me = useMe();
  return me.data?.business.currency ?? FALLBACK_CURRENCY;
}
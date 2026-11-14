import type { ReactNode } from "react";

export const INPUT_CLASS =
  "w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm outline-none focus:border-navy-500 disabled:opacity-60";

type Props = { label: string; error?: string; children: ReactNode };

export function Field({ label, error, children }: Props) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-navy-700">{label}</span>
      {children}
      {error && <span className="block text-xs text-red-600">{error}</span>}
    </label>
  );
}
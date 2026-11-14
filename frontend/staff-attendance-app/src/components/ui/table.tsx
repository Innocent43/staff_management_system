import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type Props = {
  columns: string[];
  dimmed?: boolean; // true while new data is loading behind the old rows
  children: ReactNode; // the <tr> rows
};

export function TableShell({ columns, dimmed, children }: Props) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-xl border border-navy-200 bg-white",
        dimmed && "opacity-60",
      )}
    >
      <table className="w-full text-left text-sm">
        <thead className="bg-navy-50 text-navy-600">
          <tr>
            {columns.map((column, index) => (
              <th key={index} className="px-4 py-3 font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
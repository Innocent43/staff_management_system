"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "../ui/button";
import { EmptyState } from "../ui/empty-state";
import { ErrorState } from "../ui/error-state";
import { Skeleton } from "../ui/skeleton";
import { cn } from "@/lib/cn";
import { useEmployees } from "@/hooks/use-employees";
import type { MembershipStatus } from "@/types/employee";

export const PAGE_SIZE = 10;

const STATUS_STYLES: Record<MembershipStatus, string> = {
  active: "bg-emerald-100 text-emerald-800",
  invited: "bg-amber-100 text-amber-800",
  deactivated: "bg-navy-100 text-navy-600",
};

type Props = {
  search: string;
  status: MembershipStatus | "";
  page: number;
  onPageChange: (page: number) => void;
};

export function EmployeeList({ search, status, page, onPageChange }: Props) {
  const { data, error, isPending, isPlaceholderData, refetch } = useEmployees({
    search: search || undefined,
    status: status || undefined,
    limit: PAGE_SIZE + 1,
    offset: page * PAGE_SIZE,
  });

  if (error) {
    return <ErrorState message={error.message} onRetry={() => refetch()} />;
  }

  if (isPending) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  const hasNext = data.length > PAGE_SIZE;
  const rows = data.slice(0, PAGE_SIZE); // drop the extra row

  return (
    <div className="space-y-4">
      {rows.length === 0 ? (
        <EmptyState
          title="No employees found"
          text="Try a different search or filter."

        />
      ) : (
        <div
          className={cn(
            "overflow-x-auto rounded-xl border border-navy-200 bg-white",
            isPlaceholderData && "opacity-60",
          )}
        >
          <table className="w-full text-left text-sm">
            <thead className="bg-navy-50 text-navy-600">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Staff code</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((employee) => (
                <tr key={employee.id} className="border-t border-navy-100">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/employees/${employee.id}`}
                      className="font-medium text-navy-900 hover:underline"
                    >
                      {employee.user.full_name}
                    </Link>
                    <p className="text-navy-500">{employee.user.email}</p>
                  </td>
                  <td className="px-4 py-3 capitalize">{employee.role}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                        STATUS_STYLES[employee.status],
                      )}
                    >
                      {employee.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{employee.staff_code ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button disabled={page === 0} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="size-4" /> Previous
        </Button>
        <span className="text-sm text-navy-500">Page {page + 1}</span>
        <Button disabled={!hasNext} onClick={() => onPageChange(page + 1)}>
          Next <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
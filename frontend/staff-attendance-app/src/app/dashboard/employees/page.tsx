"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import { EmployeeList } from "@/components/employees/EmployeeList";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { MembershipStatus } from "@/types/employee";

const STATUS_FILTERS: { label: string; value: MembershipStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Active", value: "active" },
  { label: "Invited", value: "invited" },
  { label: "Deactivated", value: "deactivated" },
];

export default function EmployeesPage() {
  const [searchText, setSearchText] = useState("");
  const [status, setStatus] = useState<MembershipStatus | "">("");
  const [page, setPage] = useState(0);

  const search = useDebouncedValue(searchText.trim());

  function handleSearchChange(value: string) {
    setSearchText(value);
    setPage(0); // a new search always starts at page 1
  }

  function handleStatusChange(value: MembershipStatus | "") {
    setStatus(value);
    setPage(0);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-navy-900">Employees</h1>
        {/* Invite button goes here in the next chunk */}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-navy-400" />
          <input
            value={searchText}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by name or email"
            maxLength={100}
            className="w-full rounded-lg border border-navy-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-navy-500"
          />
        </div>

        <select
          value={status}
          onChange={(e) =>
            handleStatusChange(e.target.value as MembershipStatus | "")
          }
          className="rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm outline-none focus:border-navy-500"
        >
          {STATUS_FILTERS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <EmployeeList
        search={search}
        status={status}
        page={page}
        onPageChange={setPage}
      />
    </div>
  );
}
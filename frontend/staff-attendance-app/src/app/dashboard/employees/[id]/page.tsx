"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { EmployeeDetail } from "@/components/employees/employee-detail";

export default function EmployeeDetailPage() {
  const params = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      <Link href="/dashboard/employees" className="inline-flex items-center gap-1 text-sm text-navy-600 hover:underline">
        <ArrowLeft className="size-4" /> Employees
      </Link>
      <EmployeeDetail id={Number(params.id)} />
    </div>
  );
}
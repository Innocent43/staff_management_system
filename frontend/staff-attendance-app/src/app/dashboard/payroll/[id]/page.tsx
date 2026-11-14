"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PayrollDetail } from "@/components/payroll/payroll-detail";

export default function PayrollDetailPage() {
  const params = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/payroll"
        className="inline-flex items-center gap-1 text-sm text-navy-600 hover:underline"
      >
        <ArrowLeft className="size-4" /> Payroll
      </Link>
      <PayrollDetail id={Number(params.id)} />
    </div>
  );
}
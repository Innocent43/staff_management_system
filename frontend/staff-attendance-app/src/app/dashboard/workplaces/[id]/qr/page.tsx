"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { WorkplaceQr } from "@/components/workplaces/workplace-qr";

export default function WorkplaceQrPage() {
  const params = useParams<{ id: string }>();

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Link
        href="/dashboard/workplaces"
        className="inline-flex items-center gap-1 text-sm text-navy-600 hover:underline"
      >
        <ArrowLeft className="size-4" /> Workplaces
      </Link>
      <WorkplaceQr id={Number(params.id)} />
    </div>
  );
}
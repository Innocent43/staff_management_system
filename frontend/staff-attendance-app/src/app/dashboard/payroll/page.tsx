"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";
import { GenerateDialog } from "@/components/payroll/generate-dialog";

import { PayrollList } from "@/components/payroll/payroll-list";
import { Button } from "@/components/ui/button";

export default function PayrollPage() {
  const [generating, setGenerating] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-navy-900">Payroll</h1>
        <Button onClick={() => setGenerating(true)}>
          <Calculator className="size-4" /> Generate payroll
        </Button>
      </div>

      <PayrollList />

      {generating && <GenerateDialog onClose={() => setGenerating(false)} />}
    </div>
  );
}
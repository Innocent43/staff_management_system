import { WageRuleEditor } from "@/components/wage-rules/wage-rule-form";

export default function WageRulesPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy-900">Wage rules</h1>
        <p className="text-sm text-navy-600">
          These rules decide how worked time becomes a pay estimate for every employee.
        </p>
      </div>
      <WageRuleEditor />
    </div>
  );
}
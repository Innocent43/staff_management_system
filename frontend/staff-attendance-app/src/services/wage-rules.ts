import { api } from "@/lib/api";
import type { WageRule, WageRuleInput } from "@/types/wage-rule";

export function getWageRule() {
  return api<WageRule>("/wage-rules");
}

export function updateWageRule(input: WageRuleInput) {
  return api<WageRule>("/wage-rules", { method: "PUT", body: input });
}
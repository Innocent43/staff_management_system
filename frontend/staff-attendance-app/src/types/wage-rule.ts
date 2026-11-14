export type WageRule = {
  id: number;
  updated_at: string;
  deduct_scheduled_break: boolean;
  min_minutes_for_daily_pay: number;
  overtime_enabled: boolean;
  overtime_after_minutes: number;
  overtime_multiplier: string; // decimals are strings, see the concepts below
  lateness_deduction_enabled: boolean;
  lateness_deduction_per_minute: string;
};

// Omit<T, keys> = "the same type, but without these fields".
// What we SEND has everything except the two fields the server controls.
export type WageRuleInput = Omit<WageRule, "id" | "updated_at">;
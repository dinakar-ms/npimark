import { PLANS } from "./plans";

/** Navigation preference only. The billing API supplies the actual price and eligibility. */
export function selectedPlan(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const plan = PLANS.find(plan => plan.code === value && plan.code !== "free" && !plan.premiumContacts);
  return plan?.code ?? null;
}

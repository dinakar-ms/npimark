type Plan = {
  plan_code: string; active: boolean; api_access: boolean; max_alerts?: number | null;
  limits?: Record<string, { limit: number | null }>;
};
export function upgradeNotice(path: string, billing: Plan | null): string | null {
  if (!billing || !/^\/app(?:\/|$)/.test(path)) return null;
  if (/^\/app\/(billing|security|settings|team|owner)(\/|$)/.test(path)) return null;
  if (!billing.active) return "Your subscription needs attention. Review your plan and billing status to restore access.";
  if (/^\/app\/keys(\/|$)/.test(path) && !billing.api_access) return "Your plan does not include API access. Choose a plan with API access to connect your systems.";
  const meter = /^\/app\/append(\/|$)/.test(path) ? "append_rows" : /^\/app\/exports(\/|$)/.test(path) ? "export_rows" : null;
  if (meter && billing.limits?.[meter]?.limit === 0) return "Your plan does not include this feature. Review upgrade options while keeping your account and saved work.";
  if (/^\/app\/alerts(\/|$)/.test(path) && billing.max_alerts === 0) return "Your plan does not include alerts. Review plans with an alert allowance.";
  if (billing.plan_code === "free") return "You are using the Free plan. Upgrade when you need more contact access or additional features.";
  return null;
}

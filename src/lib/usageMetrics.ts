/**
 * Which allowances the usage panel lists, and which of them earn a row this month.
 *
 * Separate from `UsagePanel.tsx` so the rules can be tested: the panel is JSX and the suite here is
 * `node --test` over plain modules, and the one rule worth a test - an allowance most plans do not
 * carry is not advertised as a row of zeros - is the kind that regresses silently the next time
 * somebody adds a metric.
 *
 * The panel's own rule still holds above this: **null is unlimited, zero is nothing.**
 */

import type { LimitFigures } from "@/lib/session";

export type UsageMetric = {
  key: string;
  label: string;
  note: string;
  /**
   * For an allowance most plans do not carry. The API reports every metric for everybody -
   * `residence_rows` reads as a limit of zero wherever nobody has set a number - and a row saying
   * "0 used, 0 left" for something that cannot be bought from this screen is an advertisement
   * dressed as a figure. It appears once the plan carries it, or once anything has been spent,
   * which is exactly when somebody needs to see it.
   */
  whenIncluded?: boolean;
};

/** The metrics, in the order somebody asks about them, with how each one is counted. */
export const METRICS: UsageMetric[] = [
  {
    key: "reveals",
    label: "Contact reveals",
    note: "One per provider per month. Opening the same provider again is free.",
  },
  {
    key: "export_rows",
    label: "Export rows",
    note: "Counted from what each file actually held, not from what was asked for.",
  },
  { key: "api_calls", label: "API calls", note: "Every request your keys make to the API." },
  {
    key: "append_rows",
    label: "Append rows",
    note: "Rows we matched in files you uploaded. Rows we could not match cost nothing.",
  },
  {
    key: "residence_rows",
    label: "Home address and cell rows",
    note:
      "Rows in an export or append that carried a home address or mobile. Metered separately " +
      "from the rows themselves, and a row costs one whether it carried both or just the one.",
    whenIncluded: true,
  },
];

export type UsageRow = UsageMetric & { figures: LimitFigures };

/** The rows to render, in `METRICS` order, given whatever the API said about this organisation. */
export function usageRows(
  limits: Record<string, LimitFigures>,
  metrics: UsageMetric[] = METRICS,
): UsageRow[] {
  return metrics.flatMap((metric) => {
    const figures = limits[metric.key];
    // A metric the API did not mention is left out. Rendering it as zero would claim a plan detail
    // we were not told.
    if (!figures) return [];
    // An allowance the plan does not carry, with nothing spent against it, says nothing worth a
    // row. `limit === null` is unlimited, which is very much carried.
    if (metric.whenIncluded && figures.limit === 0 && figures.used === 0) return [];
    return [{ ...metric, figures }];
  });
}

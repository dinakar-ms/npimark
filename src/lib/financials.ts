/**
 * Formatting one figure from a Medicare cost report.
 *
 * Separate from the page because of a single rule that is easy to undo by accident and
 * expensive when it is: **a figure nobody filed is not a zero.**
 *
 * The API sends `null` for a line the hospital left blank, and for any ratio whose inputs are
 * incomplete. That is deliberate - a hospital which did not file its expenses has not reported
 * a 0% operating margin, and a blank Worksheet S-3 is not a hospital with no inpatient days.
 * Rendering either as `0` would turn "we do not know" into a specific, wrong claim about a real
 * business, and nothing downstream could tell the difference.
 */

/** A cost-report figure in the unit it was filed in, or "Not filed" when it was not. */
export function financial(value: number | null | undefined, unit: string): string {
  if (value === null || value === undefined) return "Not filed";
  if (unit === "usd") {
    return value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  }
  // `pct` arrives as a percentage already - 5.2 means 5.2% - rather than as a fraction.
  if (unit === "pct") return `${value.toFixed(1)}%`;
  if (unit === "ratio") return value.toFixed(2);
  return value.toLocaleString("en-US");
}

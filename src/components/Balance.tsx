import type { Billing, Limit } from "@/lib/session";

/**
 * What is left: for the month, for today, and how many seats are in use.
 *
 * Why it exists as a panel rather than a line
 * -------------------------------------------
 * Every refusal in this product says both numbers — "you have 2,148,000 of your 50,000,000 rows
 * left for September" — and that sentence is only useful to somebody who can go and look at the
 * number afterwards. Plans now carry a per-day cap as well as a monthly allowance, so a customer
 * could be refused with rows plainly left for the month; a refusal they cannot reconcile against
 * anything on screen reads as a bug rather than a limit. Seats were invisible entirely: an admin
 * could be refused an invite by a number nothing showed them.
 *
 * The word "credits"
 * ------------------
 * Rows, reveals and API calls are three separate counters and stay separate everywhere — in the
 * API, in the usage table, in every refusal. "Credits" is used here only as the heading over all
 * three, because "your balance" is what a customer calls the thing they came to look at. No number
 * on this panel is a total of two different counters.
 */

const METRICS: { metric: string; label: string; unit: string }[] = [
  { metric: "export_rows", label: "Export rows", unit: "rows" },
  { metric: "reveals", label: "Contact reveals", unit: "reveals" },
  { metric: "api_calls", label: "API calls", unit: "calls" },
];

const n = (value: number) => value.toLocaleString("en-US");

/** "12,000 of 50,000" where there is a cap, "12,000 used" where there is not. */
function spent(used: number, limit: number | null, enforced: boolean): string {
  return enforced && limit !== null ? `${n(used)} of ${n(limit)}` : `${n(used)} used`;
}

/** "none left", "2,148,000 left", or "no cap". */
function left(remaining: number, enforced: boolean): string {
  if (!enforced) return "no cap";
  return remaining === 0 ? "none left" : `${n(remaining)} left`;
}

function when(iso: string | null | undefined): string {
  if (!iso) return "";
  return `${iso.slice(0, 16).replace("T", " ")} UTC`;
}

export function limitOf(billing: Billing | null, metric: string): Limit | undefined {
  return billing?.limits?.[metric];
}

/**
 * How many of `metric` this organisation may still spend, or null when nothing caps it.
 *
 * The smaller of what is left this month and what is left today, because both are enforced
 * together by the API and the tighter one is what will refuse.
 */
export function headroom(limit: Limit | undefined): number | null {
  if (!limit) return null;
  const caps: number[] = [];
  if (limit.enforced) caps.push(limit.remaining);
  if (limit.daily_enforced) caps.push(limit.daily_remaining ?? 0);
  return caps.length ? Math.min(...caps) : null;
}

export default function Balance({ billing }: { billing: Billing | null }) {
  if (!billing) return null;
  const seats = billing.seats;
  const rows = billing.limits?.export_rows;
  return (
    <div className="panel" style={{ marginTop: 18 }}>
      <h2>Your balance</h2>
      <p className="fine">
        On the <b>{billing.plan_name}</b> plan. The month and the day are both enforced, so the
        smaller of the two is what a request is measured against.
      </p>
      <div className="table-wrap">
        <table>
          <caption className="sr-only">Credits left, by counter</caption>
          <thead>
            <tr>
              <th scope="col">Counter</th>
              <th scope="col">This month</th>
              <th scope="col">Today</th>
              <th scope="col">Resets</th>
            </tr>
          </thead>
          <tbody>
            {METRICS.map(({ metric, label, unit }) => {
              const limit = billing.limits?.[metric];
              if (!limit) return null;
              return (
                <tr key={metric}>
                  <th scope="row">{label}</th>
                  <td className="fine num">
                    {spent(limit.used, limit.limit, limit.enforced ?? limit.limit !== null)}{" "}
                    {unit}
                    <span style={{ display: "block" }}>
                      {left(limit.remaining, limit.enforced ?? limit.limit !== null)}
                    </span>
                  </td>
                  <td className="fine num">
                    {spent(limit.daily_used ?? 0, limit.daily_limit ?? null, !!limit.daily_enforced)}{" "}
                    {unit}
                    <span style={{ display: "block" }}>
                      {left(limit.daily_remaining ?? 0, !!limit.daily_enforced)}
                    </span>
                  </td>
                  <td className="fine num">
                    {when(limit.daily_resets_at) && (
                      <>
                        day: {when(limit.daily_resets_at)}
                        <span style={{ display: "block" }}>month: {when(limit.resets_at)}</span>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
            {seats && (
              <tr>
                <th scope="row">Seats</th>
                <td className="fine num" colSpan={2}>
                  {seats.enforced && seats.limit !== null
                    ? `${n(seats.used)} of ${n(seats.limit)} in use`
                    : `${n(seats.used)} in use`}
                  <span style={{ display: "block" }}>
                    {n(seats.users)} {seats.users === 1 ? "person" : "people"}
                    {seats.pending_invites
                      ? `, ${n(seats.pending_invites)} invite${
                          seats.pending_invites === 1 ? "" : "s"
                        } not accepted yet`
                      : ""}
                  </span>
                </td>
                <td className="fine">
                  Never — a seat costs for as long as it is held.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {rows && (rows.enforced || rows.daily_enforced) && headroom(rows) === 0 && (
        <p className="notice warn" style={{ marginTop: 12 }} role="status">
          No export rows left{rows.daily_enforced && rows.daily_remaining === 0 && rows.remaining > 0
            ? " today — the daily cap resets at midnight UTC, and your month is not spent."
            : " this month."}
        </p>
      )}
    </div>
  );
}

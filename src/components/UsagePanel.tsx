import Link from "next/link";
import type { Billing } from "@/lib/session";
import { usageRows } from "@/lib/usageMetrics";
import { salesHref } from "@/lib/site";

/**
 * What this organisation is allowed, what it has spent, and what happens when it runs out.
 *
 * One component, used everywhere a limit is worth knowing about, because the numbers came from
 * three inlined copies before this and three copies of an arithmetic is three chances to say a
 * different thing. It renders only - every figure is passed in by a page that fetched it - so
 * adding the panel somewhere costs one call the page was probably already making.
 *
 * Three rules it keeps, all of them the API's rules rather than this file's:
 *
 * 1. **Null is unlimited, zero is nothing.** A metric with no limit gets no bar and no
 *    "remaining", because a full bar reads as "you are out" and that is the opposite of what a
 *    missing limit means. A metric limited to zero says so plainly: the plan does not include it.
 * 2. **A figure that cannot be read is left out, never shown as zero.** A row of zeros reads as
 *    "we have spent nothing", which is a worse answer than no row.
 * 3. **Nothing promises a button that does not exist.** Changing a plan online is possible only
 *    where the API says payments are on and this person may use them; everywhere else the panel
 *    says to talk to us, which is what actually happens.
 */

function count(value: number): string {
  return value.toLocaleString("en-US");
}

/**
 * When the monthly counters go back to nothing.
 *
 * Usage is filed under the first of the month in UTC, so the reset is the first of the month
 * after the one being shown. Derived from the period the API named rather than from this
 * server's clock, and absent when the API did not name one.
 */
function resetsOn(periodStart: string | undefined): string | null {
  if (!periodStart) return null;
  const start = new Date(`${periodStart}T00:00:00Z`);
  if (Number.isNaN(start.getTime())) return null;
  const next = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
  return next.toLocaleDateString("en-US", { dateStyle: "long", timeZone: "UTC" });
}

/**
 * The one meter in the application, so that one set of figures cannot be drawn two ways.
 *
 * It was drawn twice: here, where 85% turned it amber, and again in `app/app/page.tsx`, where it
 * had no states at all. The same account at 140 reveals against an allowance of 25 was therefore an
 * amber bar on Plan and usage and a full bar in the action colour on the overview - the second of
 * which says "in good order" at the exact moment the next reveal is refused.
 *
 * Three states rather than two. Under 85% is plain; 85% and over is a warning, because it is worth
 * knowing before it bites; at or past the allowance is a stop, because the next one is refused and
 * a warning is the wrong word for something that has already happened.
 *
 * `aria-hidden`, because the bar carries nothing that the figure printed beside it does not already
 * say. A screen reader gets "140 of 25", which is the fact; the bar is the picture of it.
 */
export function Meter({ used, limit }: { used: number; limit: number | null }) {
  if (limit === null || limit <= 0) return null;
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const state = used >= limit ? " stop" : pct >= 85 ? " warn" : "";
  return (
    <div className={`meter${state}`} aria-hidden="true">
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}

export type UsagePanelProps = {
  billing: Billing | null;
  /** People holding a seat now, or null when the list could not be read. */
  seatsUsed?: number | null;
  /** Standing alerts kept now, paused ones included, or null when they could not be read. */
  alertsUsed?: number | null;
  /** The heading for this section. A page with its own h1 above it wants h2, which is the default. */
  heading?: string;
};

/**
 * The trial's end as the customer is shown it elsewhere, or null when this is not a trial.
 *
 * A trial's allowances cover the whole seven days once and do not refill (DevOps QA, 26 Oct 2026:
 * the panel said "go back to nothing on November 1" for a trial ending November 2).
 */
function trialEnds(billing: Billing): string | null {
  if (billing.status !== "trialing" || !billing.trial_ends_at) return null;
  const end = new Date(billing.trial_ends_at);
  if (Number.isNaN(end.getTime())) return null;
  return `${end.toLocaleString("en-US", { dateStyle: "long", timeStyle: "short", timeZone: "UTC" })} UTC`;
}

export function UsagePanel({
  billing,
  seatsUsed = null,
  alertsUsed = null,
  heading,
}: UsagePanelProps) {
  heading ??= billing && trialEnds(billing) ? "What you have left in your trial" : "What you have left this month";
  if (!billing) {
    return (
      <section className="panel">
        <h2>{heading}</h2>
        <p className="fine">
          We could not read your plan just now, so there are no figures to show rather than
          figures that might be wrong. Refresh the page to try again.
        </p>
      </section>
    );
  }

  const limits = billing.limits ?? {};
  const rows = usageRows(limits);
  const period = rows.find((row) => row.figures.period_label)?.figures.period_label ?? null;
  const resets = resetsOn(rows.find((row) => row.figures.period_start)?.figures.period_start);
  const canBuy = Boolean(billing.payments_enabled && billing.can_manage_billing);
  const trialEnd = trialEnds(billing);

  return (
    <section className="panel">
      <h2>{heading}</h2>
      <p className="fine">
        Every allowance belongs to {billing.plan_name ? <b>{billing.plan_name}</b> : "your plan"}{" "}
        and to the organization rather than to a person, so a colleague&rsquo;s export counts
        against the same figures as yours.
        {trialEnd
          ? ` These allowances cover your whole trial once and do not refill during it. The trial ends ${trialEnd}.`
          : <>
              {period ? ` These are the numbers for ${period}.` : ""}
              {resets ? ` They go back to nothing on ${resets} (UTC).` : ""}
              {/* Abhijna, 26 Oct 2026: someone paying on the 26th read a reset on the 1st as their
                  billing date. Allowances follow the calendar month by the owner's ruling. */}
              {" Allowances reset on the 1st of every month, separately from your billing date."}
            </>}
      </p>

      {rows.length > 0 && (
        <div className="table-wrap" style={{ marginTop: 16 }}>
          <table>
            <thead>
              <tr>
                <th scope="col">What</th>
                <th scope="col">Used</th>
                <th scope="col">Left</th>
                <th scope="col">How it is counted</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ key, label, note, figures }) => {
                const allowed = figures.limit;
                const unlimited = allowed === null;
                const none = allowed === 0;
                return (
                  <tr key={key}>
                    <th scope="row" style={{ fontWeight: 600 }}>
                      {label}
                    </th>
                    <td className="num">
                      {count(figures.used)}
                      {unlimited ? "" : ` of ${count(allowed)}`}
                      <Meter used={figures.used} limit={allowed} />
                    </td>
                    <td className="num fine">
                      {unlimited
                        ? "no limit"
                        : none
                          ? "not on this plan"
                          : count(figures.remaining)}
                    </td>
                    <td className="fine">{trialEnd ? note.replace("per month", "during the trial") : note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ul className="ticks" style={{ marginTop: 18 }}>
        <li>
          <span>
            <b>Seats.</b>{" "}
            {seatsUsed !== null && billing.max_users !== null && billing.max_users !== undefined
              ? `${count(seatsUsed)} of ${count(billing.max_users)} in use.`
              : seatsUsed !== null
                ? `${count(seatsUsed)} in use, with no limit on your plan.`
                : billing.max_users !== null && billing.max_users !== undefined
                  ? `${count(billing.max_users)} on your plan.`
                  : "No limit on your plan."}{" "}
            <Link href="/app/team">Who is on the team</Link>
          </span>
        </li>
        <li>
          <span>
            <b>Alerts.</b>{" "}
            {alertsUsed !== null && billing.max_alerts !== null && billing.max_alerts !== undefined
              ? `${count(alertsUsed)} of ${count(billing.max_alerts)} kept, paused ones included.`
              : alertsUsed !== null
                ? `${count(alertsUsed)} kept, with no limit on your plan.`
                : billing.max_alerts !== null && billing.max_alerts !== undefined
                  ? `${count(billing.max_alerts)} on your plan.`
                  : "No limit on your plan."}{" "}
            <Link href="/app/alerts">Your alerts</Link>
          </span>
        </li>
      </ul>

      <h3 style={{ marginTop: 22 }}>When you reach a limit</h3>
      <p className="fine">
        The next reveal, export or API call is refused, and the refusal says which allowance ran
        out and what is left of it. Nothing is charged, nothing is queued, and nothing you have
        already done is taken away &mdash; your lists, files and keys stay exactly as they are.
        An export is checked before the job is created, so a file that would go over is refused
        while you are still looking at the filters rather than after we have written it.
      </p>
      <p className="fine">
        {trialEnd
          ? "Trial allowances do not go back up. To have more before the trial ends, choose End trial and pay now under Plan and usage, which starts your plan's monthly allowances; or the plan has to change: "
          : "Allowances go back up on their own at the start of the next month. To have more before then, the plan has to change: "}
        {canBuy ? (
          <>
            <Link href="/app/billing">Plan and usage</Link> is where to do that, and{" "}
            <Link href="/pricing">the pricing page</Link> lists what each plan includes.
          </>
        ) : (
          <>
            <Link href="/pricing">the pricing page</Link> lists what each plan includes, and{" "}
            <Link href="/app/billing#upgrade">Billing</Link> shows the upgrade options available to your account.
            If online checkout is unavailable, <a href={salesHref("Changing our plan")}>contact sales</a>.
          </>
        )}
      </p>
      <p className="fine">
        Provider home address and cell phone are not part of any allowance here. They are sold
        only under a signed contract that states the permissible use, are metered separately, and
        cannot be switched on from inside the app.
      </p>
    </section>
  );
}

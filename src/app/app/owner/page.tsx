import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SignupBars, Sparkline } from "@/components/OwnerCharts";
import type { Consumption, Figure, OwnerMetrics } from "@/lib/session";
import { getMe, getOwnerMetrics } from "@/lib/session";

/**
 * The owner's business dashboard: how many customers there are, who is using the product, what
 * is being consumed, and what is waiting on a person - on one page, from live queries.
 *
 * Who can reach it
 * ----------------
 * Internal accounts only. `settings.manage` is the test, because `permissions_for_user` on the
 * API intersects a customer's role with `CUSTOMER_CEILING` before it ever reaches this site - so
 * a permission outside that ceiling is *provably* internal, whatever role somebody holds inside
 * their own organisation. A customer gets `notFound()` rather than a refusal: a 403 would tell
 * them the page exists. The API refuses them again on its own account, twice over.
 *
 * The three rules this page keeps
 * -------------------------------
 * 1. **Every figure prints its own window.** The captions come from the API's `what` and
 *    `window` strings rather than being written here, so the screen and the query cannot drift
 *    into describing the same number two different ways.
 * 2. **A figure that cannot be read says so.** Never a zero standing in for unknown - the tile
 *    reads "Not available" and carries the reason underneath.
 * 3. **No person appears.** Customer organisation names are business facts and are shown. No
 *    provider, no consumer, no member of staff and no contact detail is on this page; it is a
 *    business dashboard, not a data browser.
 */

export const metadata: Metadata = {
  title: "Business dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Provably internal: no customer role can hold a permission outside the customer ceiling. */
const INTERNAL_PERMISSION = "settings.manage";

const NOT_AVAILABLE = "Not available";

function count(value: number): string {
  return value.toLocaleString("en-US");
}

/**
 * Where the work behind a queue is done. Those screens live on the internal admin application,
 * which is on the tailnet and is not this site, so the link needs its origin. Unset, the path is
 * shown as text: a link to nowhere is worse than a path somebody can paste.
 */
function adminHref(path: string): string | null {
  const base = (process.env.ADMIN_APP_BASE_URL ?? "").replace(/\/$/, "");
  return base ? `${base}${path}` : null;
}

function stamp(iso: string): string {
  return `${iso.replace("T", " ").replace("Z", "")} UTC`;
}

/**
 * A sentence from the API, with its backticked spans set as code.
 *
 * Every caption on this page is the API's own `what`, `window` and `unavailable` string rather than
 * a sentence written here, so that the screen and the query cannot drift apart. Those strings mark
 * the identifiers in them the way the platform's own docs do - `/v1`, `append_rows`, the `free`
 * plan - and until now the backticks arrived on screen as backticks. This changes how they are set
 * and not a word of what they say: it is the difference between a caption the platform wrote and a
 * caption somebody forgot to finish.
 */
function says(text: string): React.ReactNode {
  const parts = text.split("`");
  // An odd backtick means the string is not marked up the way this assumes, and a caption is not
  // worth guessing at - it goes out exactly as it came in.
  if (parts.length < 3 || parts.length % 2 === 0) return text;
  return parts.map((part, i) =>
    i % 2 === 1 ? <code key={i}>{part}</code> : <span key={i}>{part}</span>,
  );
}

/** A figure's value, ready to print, or null when it could not be read. */
function printed(figure: Figure): string | null {
  if (figure.value === null) return null;
  return `${figure.approximate ? "≈" : ""}${count(figure.value)}`;
}

function Tile({
  title,
  figure,
  trend,
}: {
  title: string;
  figure: Figure;
  trend?: React.ReactNode;
}) {
  const value = printed(figure);
  return (
    <div className="stat">
      {value === null ? (
        <span className="value unknown">{NOT_AVAILABLE}</span>
      ) : (
        <span className="value num">{value}</span>
      )}
      <span className="label">{title}</span>
      {value !== null && trend}
      <span className="tile-note">
        {says(figure.unavailable ?? `${figure.what}. Window: ${figure.window}.`)}
      </span>
    </div>
  );
}

/**
 * This period against the last one.
 *
 * A previous period of zero gets no percentage. "Up 100%" from nothing is arithmetic, not
 * information, and "up ∞%" is worse - so it says there is nothing to compare against, which is
 * the honest reading of a first month.
 */
function Trend({ now, before, period }: { now: number | null; before: number | null; period: string }) {
  if (now === null || before === null) {
    return <span className="trend none">No comparable {period} figure</span>;
  }
  if (before === 0) {
    return (
      <span className="trend none">
        {now === 0 ? `None ${period} either` : `Nothing ${period} to compare against`}
      </span>
    );
  }
  const change = now - before;
  const pct = Math.round((change / before) * 100);
  const direction = change > 0 ? "up" : change < 0 ? "down" : "flat";
  const arrow = change > 0 ? "▲" : change < 0 ? "▼" : "→";
  return (
    <span className={`trend ${direction}`}>
      {arrow} {Math.abs(pct)}% vs {period} ({count(before)})
    </span>
  );
}

/** One cell of the consumption table: the number, or the reason it is missing. */
function Cell({ figure }: { figure: Figure }) {
  const value = printed(figure);
  if (value === null) {
    return (
      <td>
        <span className="tag warn">{NOT_AVAILABLE}</span>
        <span className="tile-note">{says(figure.unavailable ?? "")}</span>
      </td>
    );
  }
  return <td className="num">{value}</td>;
}

function ConsumptionTable({
  today,
  thisMonth,
  lastMonth,
}: {
  today: Consumption;
  thisMonth: Consumption;
  lastMonth: Consumption;
}) {
  const columns = [today, thisMonth, lastMonth];
  const rows: { label: string; key: keyof Omit<Consumption, "label" | "window"> }[] = [
    { label: "Contact reveals", key: "reveals" },
    { label: "Export rows metered", key: "export_rows" },
    { label: "Export files written", key: "export_files" },
    { label: "API calls", key: "api_calls" },
    { label: "Append rows metered", key: "append_rows" },
    { label: "Alert emails sent", key: "alert_emails" },
  ];
  return (
    <div className="table-wrap">
      <table className="owner-table">
        <caption className="sr-only">
          What customer organizations consumed today, this month and last month
        </caption>
        <thead>
          <tr>
            <th scope="col">Counter</th>
            {columns.map((column) => (
              <th scope="col" key={column.label}>
                {column.label}
                <span className="tile-note">{says(column.window)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <th scope="row">
                {row.label}
                <span className="tile-note">{says(thisMonth[row.key].what)}</span>
              </th>
              {columns.map((column) => (
                <Cell key={`${column.label}-${row.key}`} figure={column[row.key]} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Unreadable({ detail }: { detail: string }) {
  return (
    <main className="wrap app-main">
      <h1>Business dashboard</h1>
      <div className="notice stop" role="status" style={{ marginTop: 20 }}>
        <b>No figure on this page could be read.</b> {detail} Nothing is shown rather than a
        screen of zeros: a zero here would say the business had no customers, which is a
        different claim from not knowing.
      </div>
    </main>
  );
}

export default async function OwnerDashboard() {
  const me = await getMe();
  if (!me) return null; // the /app layout has already redirected
  if (!me.permissions.includes(INTERNAL_PERMISSION)) notFound();

  const result = await getOwnerMetrics();
  if (!result.ok) return <Unreadable detail={result.detail} />;
  const data: OwnerMetrics = result.data;
  const { organisations, users, exports, growth, freshness, revenue } = data;
  const trend = data.consumption_trend;

  const series = [
    { label: "Contact reveals", values: trend.days.map((day) => day.reveals) },
    { label: "Export rows", values: trend.days.map((day) => day.export_rows) },
    { label: "API calls", values: trend.days.map((day) => day.api_calls) },
  ];

  return (
    <main className="wrap app-main">
      <div className="owner-head">
        <div>
          <h1>Business dashboard</h1>
          <Link className="btn" href="/app/owner/customers">View customer accounts</Link>
          <p className="fine">
            Every figure is read from the database when this page loads, and prints the window it
            covers. A figure that cannot be read says so; nothing here is estimated unless it is
            marked with ≈.
          </p>
        </div>
        <p className="fine mono">Read at {stamp(data.generated_at)}</p>
      </div>

      <section className="section" style={{ paddingTop: 0 }} aria-labelledby="headline">
        <h2 id="headline">Where the business stands</h2>
        <div className="stats owner" style={{ marginTop: 16 }}>
          <Tile
            title="Customer organizations"
            figure={organisations.total}
            trend={
              organisations.new_30d.value === null ? undefined : (
                <span className="trend up">
                  +{count(organisations.new_30d.value)} in the last 30 days
                </span>
              )
            }
          />
          <Tile title="Organizations signed in (30d)" figure={organisations.active_30d} />
          <Tile title="On a paid plan" figure={organisations.on_paid_plan} />
          <Tile title="On the free plan" figure={organisations.on_free_plan} />
          <Tile title="Lapsed or canceled" figure={organisations.lapsed_or_cancelled} />
          <Tile title="New in 7 days" figure={organisations.new_7d} />
        </div>
        <div className="stats owner" style={{ marginTop: 16 }}>
          <Tile
            title="Contact reveals this month"
            figure={data.this_month.reveals}
            trend={
              <Trend
                now={data.this_month.reveals.value}
                before={data.previous_month.reveals.value}
                period="last month"
              />
            }
          />
          <Tile
            title="Export rows this month"
            figure={data.this_month.export_rows}
            trend={
              <Trend
                now={data.this_month.export_rows.value}
                before={data.previous_month.export_rows.value}
                period="last month"
              />
            }
          />
          <Tile
            title="API calls this month"
            figure={data.this_month.api_calls}
            trend={
              <Trend
                now={data.this_month.api_calls.value}
                before={data.previous_month.api_calls.value}
                period="last month"
              />
            }
          />
          <Tile title="People signed in (30d)" figure={users.active_30d} />
          <Tile title="Seats held" figure={users.seats_used} />
          <Tile title="Two-step sign-in on" figure={users.two_step_on} />
        </div>
      </section>

      <section className="section" aria-labelledby="growth">
        <h2 id="growth">Growth</h2>
        <div className="panel">
          <h3>New customer organizations a day</h3>
          <p className="fine">
            {says(`${growth.what}. Window: ${growth.window}.`)} {count(growth.total)} in the window.
          </p>
          <div style={{ marginTop: 14 }}>
            <SignupBars points={growth.signups} window={growth.window} />
          </div>
        </div>
        <div className="panel">
          <h3>Consumption, day by day</h3>
          {trend.unavailable ? (
            <div className="notice warn" role="status">
              <b>{NOT_AVAILABLE}.</b> {says(trend.unavailable)}
            </div>
          ) : (
            <>
              <p className="fine">
                {says(`${trend.what}. Window: ${trend.window}.`)}
                {trend.rollup_from ? ` The rollup starts on ${trend.rollup_from}.` : ""} Each line
                is scaled to its own peak, printed beside it - they are not on one scale.
              </p>
              <div style={{ marginTop: 6 }}>
                {series.map((one) => {
                  const peak = one.values.length ? Math.max(...one.values) : 0;
                  return (
                    <div className="spark-row" key={one.label}>
                      <span className="fine">{one.label}</span>
                      <Sparkline values={one.values} label={one.label} />
                      <span className="num fine">peak {count(peak)}/day</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="section" aria-labelledby="consumption">
        <h2 id="consumption">What is being consumed</h2>
        <p className="fine">
          Metered counters for customer organizations only - our own team&rsquo;s usage is not
          customer consumption and is left out of every figure on this page. &ldquo;Export rows
          metered&rdquo; is what was charged against an allowance; &ldquo;export files
          written&rdquo; counts the files that actually left.
        </p>
        <div style={{ marginTop: 16 }}>
          <ConsumptionTable
            today={data.today}
            thisMonth={data.this_month}
            lastMonth={data.previous_month}
          />
        </div>
      </section>

      <section className="section" aria-labelledby="exports">
        <h2 id="exports">Exports and downloads</h2>
        <div className="stats owner" style={{ marginTop: 16 }}>
          <Tile title="Export files" figure={exports.files} />
          <Tile title="Rows written to files" figure={exports.rows} />
          <Tile title="Downloads" figure={exports.downloads} />
        </div>
        <div className="panel" style={{ marginTop: 16 }}>
          <h3>Heaviest ten organizations</h3>
          <p className="fine">
            Window: {exports.top_orgs_window}. {exports.top_orgs_note}
          </p>
          {exports.top_orgs.length === 0 ? (
            <p className="fine" style={{ marginTop: 12 }}>
              No customer organization has used a metered counter in this window.
            </p>
          ) : (
            <div className="table-wrap" style={{ marginTop: 12 }}>
              <table>
                <caption className="sr-only">
                  Customer organizations ranked by metered units for {exports.top_orgs_window}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Organization</th>
                    <th scope="col">Plan</th>
                    <th scope="col">Metered units</th>
                    <th scope="col">Reveals</th>
                    <th scope="col">Export rows</th>
                    <th scope="col">API calls</th>
                    <th scope="col">Append rows</th>
                    <th scope="col">Files</th>
                    <th scope="col">Downloads</th>
                  </tr>
                </thead>
                <tbody>
                  {exports.top_orgs.map((org) => (
                    <tr key={org.org_id}>
                      <th scope="row">{org.name}</th>
                      <td>
                        {org.plan_code ? (
                          <span className="tag">{org.plan_code}</span>
                        ) : (
                          <span className="fine">no subscription</span>
                        )}
                      </td>
                      <td className="num">{count(org.metered_units)}</td>
                      <td className="num">{count(org.reveals)}</td>
                      <td className="num">{count(org.export_rows)}</td>
                      <td className="num">{count(org.api_calls)}</td>
                      <td className="num">{count(org.append_rows)}</td>
                      <td className="num">{count(org.export_files)}</td>
                      <td className="num">{count(org.downloads)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="section" aria-labelledby="queues">
        <h2 id="queues">Waiting on a person</h2>
        <p className="fine">
          Each queue links to the screen built for that kind of decision, on the internal admin
          application.
        </p>
        <div className="queue-list" style={{ marginTop: 16 }}>
          {data.queues.map((queue) => {
            const href = adminHref(queue.path);
            return (
              <div className="queue" key={queue.key}>
                {queue.waiting === null ? (
                  <span className="count unknown">{NOT_AVAILABLE}</span>
                ) : (
                  <span className="count num">{count(queue.waiting)}</span>
                )}
                <b>{queue.label}</b>
                <span className="fine">{says(queue.unavailable ?? queue.detail)}</span>
                {queue.by_status.length > 0 && (
                  <span className="statuses">
                    {queue.by_status.map((status) => (
                      <span className="tag" key={status.status}>
                        {status.status} {count(status.count)}
                      </span>
                    ))}
                  </span>
                )}
                {queue.oldest_waiting && (
                  <span className="tile-note">Oldest waiting since {stamp(queue.oldest_waiting)}</span>
                )}
                <span className="tile-note">{says(queue.description)}</span>
                {href ? (
                  <a href={href}>Open the queue</a>
                ) : (
                  <span className="tile-note">
                    On the admin application at <span className="mono">{queue.path}</span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="section" aria-labelledby="data">
        <h2 id="data">Data and money</h2>
        <div className="grid two">
          <div className="panel">
            <h3>Data freshness</h3>
            <dl className="rows">
              <div>
                <dt>Provider data</dt>
                <dd>
                  {freshness.provider_data.at ? (
                    stamp(freshness.provider_data.at)
                  ) : (
                    <span className="tag warn">{NOT_AVAILABLE}</span>
                  )}
                  <span className="tile-note">
                    {says(freshness.provider_data.unavailable ?? freshness.provider_data.what)}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Last load of anything</dt>
                <dd>
                  {freshness.latest_load.at ? (
                    <>
                      {stamp(freshness.latest_load.at)}
                      {freshness.latest_load_source ? (
                        <span className="tile-note mono">{freshness.latest_load_source}</span>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <span className="tag warn">{NOT_AVAILABLE}</span>
                      <span className="tile-note">{says(freshness.latest_load.unavailable ?? "")}</span>
                    </>
                  )}
                </dd>
              </div>
              <div>
                <dt>Providers published</dt>
                <dd>
                  {printed(freshness.providers_published) ?? (
                    <span className="tag warn">{NOT_AVAILABLE}</span>
                  )}
                  <span className="tile-note">
                    {says(
                      freshness.providers_published.unavailable ??
                        `${freshness.providers_published.what}. An approximation, marked with ≈.`,
                    )}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Public list counts</dt>
                <dd>
                  {freshness.public_list_counts.at ? (
                    stamp(freshness.public_list_counts.at)
                  ) : (
                    <span className="tag warn">{NOT_AVAILABLE}</span>
                  )}
                  <span className="tile-note">
                    {says(freshness.public_list_counts.unavailable ?? freshness.public_list_counts.what)}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
          <div className="panel">
            <h3>Revenue, churn and lifetime value</h3>
            <div className="notice warn" role="status">
              <b>{NOT_AVAILABLE}, and not zero.</b> {says(revenue.unavailable)}
            </div>
            <dl className="rows" style={{ marginTop: 14 }}>
              <div>
                <dt>Priced plans</dt>
                <dd>
                  {printed(revenue.priced_plans)}
                  <span className="tile-note">{says(revenue.priced_plans.what)}</span>
                </dd>
              </div>
              <div>
                <dt>Purchasable plans</dt>
                <dd>
                  {printed(revenue.purchasable_plans)}
                  <span className="tile-note">{says(revenue.purchasable_plans.what)}</span>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="seats">
        <h2 id="seats">Seats and accounts</h2>
        <div className="stats owner" style={{ marginTop: 16 }}>
          <Tile title="User accounts" figure={users.total} />
          <Tile title="Seats held" figure={users.seats_used} />
          <Tile title="Seats allowed" figure={users.seats_allowed} />
          <Tile title="Organizations with no seat cap" figure={users.orgs_without_seat_cap} />
          <Tile title="Organizations with no subscription" figure={organisations.no_subscription} />
          <Tile title="Subscriptions past due" figure={organisations.past_due} />
        </div>
      </section>
    </main>
  );
}

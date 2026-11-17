import type { Metadata } from "next";
import Link from "next/link";
import { CrmNote, FormatAndPreset } from "@/components/ExportControls";
import { DEFAULT_FORMAT, DEFAULT_PRESET } from "@/lib/exportPresets";
import {
  ALERT_EVENT_LABELS,
  getAlertHits,
  getAlerts,
  getBilling,
  type AlertRow,
} from "@/lib/session";

/**
 * Standing alerts: a saved search that is told, on a schedule, what changed inside it.
 *
 * Everything an alert found is here whether or not an email went. Email is a convenience that
 * only exists once a mail host is configured; this page is the product. The hits carry the
 * public record only - who, what happened, when, where - and link to the provider's page.
 * Contact details stay behind the metered reveal on the search page, so an alert is never a way
 * to collect them for free.
 *
 * Forms and redirects, no client JavaScript, like the rest of the signed-in site.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Alerts",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const ERRORS: Record<string, string> = {
  alert_limit:
    "Your plan's alert limit is reached, paused alerts included. Delete one to make room, or see Plan and usage for how to keep more.",
  conflict: "You already have an alert with that name. Choose another name.",
  "needs-name-and-events": "Give the alert a name and choose at least one kind of change to watch.",
  validation_error: "One of those filters was not valid, so nothing was saved.",
  subscription_inactive: "This organization's subscription is not active, so nothing was saved.",
  forbidden: "Your role cannot change alerts. Ask an admin on your team.",
  not_found: "That alert no longer exists.",
  quota_exceeded:
    "That export is larger than the rows left on your plan — for this month or for today. Your balance is on the exports page.",
  format_row_limit:
    "That is more rows than an Excel workbook holds. Narrow the alert's filters, or choose CSV.",
  failed: "That didn't work, and nothing was changed. Try again.",
};

const FILTER_LABELS: Record<string, string> = {
  q: "Name or NPI",
  state: "State",
  taxonomy_classification: "Specialty",
  type: "Type",
};

function one(params: Record<string, string | string[] | undefined>, key: string): string {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function when(value: string | null): string {
  return value ? value.slice(0, 16).replace("T", " ") : "Not yet";
}

function describeFilters(filters: Record<string, unknown>): string {
  const parts = Object.entries(filters).map(([key, value]) => {
    const shown = Array.isArray(value) ? value.join(", ") : String(value);
    return `${FILTER_LABELS[key] ?? key.replace(/_/g, " ")}: ${shown}`;
  });
  return parts.length ? parts.join(" · ") : "Every provider";
}

function searchLink(filters: Record<string, unknown>): string {
  const params = new URLSearchParams();
  const pick = (key: string, as: string) => {
    const value = filters[key];
    if (typeof value === "string" && value) params.set(as, value);
  };
  pick("q", "q");
  pick("state", "state");
  pick("taxonomy_classification", "classification");
  pick("type", "type");
  return `/app/search?${params}`;
}

/**
 * Export a saved search, from the saved search.
 *
 * An alert *is* a saved search - the same filters, kept - so the file it exports is the alert's
 * audience rather than a set of filters somebody retyped. The filters travel as hidden fields under
 * the names the API's provider search uses, exactly as the Save-as-alert form on /app/search sends
 * them, and the API validates them again with the search's own code.
 *
 * No row count beside it: this page has not run the search, and a count per alert would be one
 * whole-register query per row. The refusal still comes before the job exists, and the balance is
 * on /app/exports where the file is collected.
 */
function ExportAlert({ alert }: { alert: AlertRow }) {
  const value = (key: string) => {
    const raw = alert.filters[key];
    return typeof raw === "string" ? raw : "";
  };
  return (
    <details>
      <summary className="fine">Export these providers</summary>
      <form className="filters" method="post" action="/api/app/export" style={{ marginTop: 10 }}>
        <input type="hidden" name="q" value={value("q")} />
        <input type="hidden" name="state" value={value("state")} />
        <input type="hidden" name="classification" value={value("taxonomy_classification")} />
        <input type="hidden" name="type" value={value("type")} />
        <input type="hidden" name="return_to" value={`/app/alerts?alert=${alert.id}`} />
        <FormatAndPreset
          idPrefix={`export-${alert.id}`}
          preset={DEFAULT_PRESET}
          format={DEFAULT_FORMAT}
        />
        <button type="submit" className="btn sm">
          Queue export
        </button>
      </form>
      <CrmNote />
    </details>
  );
}


function ActionButton({ alert, action, label }: { alert: AlertRow; action: string; label: string }) {
  return (
    <form method="post" action="/api/app/alerts" style={{ display: "inline" }}>
      <input type="hidden" name="action" value={action} />
      <input type="hidden" name="id" value={alert.id} />
      <button type="submit" className="btn sm">
        {label}
      </button>
    </form>
  );
}

export default async function AlertsPage({ searchParams }: Props) {
  const params = await searchParams;
  const error = one(params, "error");

  const [alertsOrNull, billing] = await Promise.all([getAlerts(), getBilling()]);
  // The raw answer decides what the page says; everything that counts or picks works off a list.
  const alerts = alertsOrNull ?? [];
  const chosenId = one(params, "alert");
  const chosen = alerts.find((alert) => alert.id === chosenId) ?? alerts[0] ?? null;
  const hits = chosen ? await getAlertHits(chosen.id) : null;
  const cap = billing?.max_alerts ?? null;
  const latest = hits?.runs[0] ?? null;

  return (
    <main className="wrap app-main">
      <div className="eyebrow rule">Alerts</div>
      <h1>Hear when your territory changes.</h1>
      <p className="lede">
        An alert is a saved search that watches for new providers, practice moves, organizations
        hiring and deactivations. Every change names its public source and its date. Save one from{" "}
        <Link href="/app/search">the search page</Link>.
      </p>

      <p className="fine" style={{ marginTop: 10 }}>
        <b>
          {cap === null
            ? `${alerts.length.toLocaleString("en-US")} alerts`
            : `${alerts.length.toLocaleString("en-US")} of ${cap.toLocaleString("en-US")} alerts`}
        </b>{" "}
        on your plan, paused ones included.
      </p>

      {error && (
        <div className="notice stop" style={{ marginTop: 16 }} role="alert">
          {ERRORS[error] ?? ERRORS.failed}
        </div>
      )}
      {one(params, "queued") && !error && (
        <div className="notice ok" style={{ marginTop: 16 }}>
          Export queued from that saved search. Collect the file on{" "}
          <Link href="/app/exports">the exports page</Link>.
        </div>
      )}
      {one(params, "saved") && !error && (
        <div className="notice ok" style={{ marginTop: 16 }}>
          Alert saved. It first looks within a few minutes, and reports changes found from now on.
        </div>
      )}
      {one(params, "deleted") && !error && (
        <div className="notice ok" style={{ marginTop: 16 }}>
          Alert deleted. It will not run again.
        </div>
      )}

      {/* A failed read is not evidence that nobody set an alert. */}
      {alertsOrNull === null ? (
        <div className="notice warn" role="alert">
          Your alerts could not be read just now, so none are listed. That is not the same as
          having none &mdash; try again in a moment before setting one up again.
        </div>
      ) : alerts.length === 0 ? (
        <div className="panel" style={{ marginTop: 22 }}>
          <h2>You have no alerts yet</h2>
          <p className="fine">
            An alert watches one search and reports what changed inside it: a provider who is new to
            your filters, one who has moved practice, an organization that started hiring, a
            registration that stopped. It looks on its own, daily or weekly, and everything it finds
            is listed on this page whether or not a message goes out.
          </p>
          <p className="fine">
            To make the first one, run the search you care about, then open <b>Save as alert</b>
            {" "}underneath the filters and give it a name. Changing the filters afterwards means
            saving a new alert; an alert watches the search it was made from.
          </p>
          <div className="actions" style={{ marginTop: 14 }}>
            <Link className="btn primary" href="/app/search">
              Run a search
            </Link>
          </div>
        </div>
      ) : (
        <div className="table-wrap" style={{ marginTop: 22 }}>
          <table>
            <thead>
              <tr>
                <th>Alert</th>
                <th>Watching</th>
                <th>How often</th>
                <th>Last looked</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.id}>
                  <td>
                    <Link href={`/app/alerts?alert=${alert.id}`}>
                      <b>{alert.name}</b>
                    </Link>
                    <span className="fine" style={{ display: "block" }}>
                      <Link href={searchLink(alert.filters)}>{describeFilters(alert.filters)}</Link>
                    </span>
                  </td>
                  <td className="fine">
                    {alert.event_types.map((type) => ALERT_EVENT_LABELS[type] ?? type).join(", ")}
                  </td>
                  <td className="fine">{alert.cadence === "daily" ? "Daily" : "Weekly"}</td>
                  <td className="fine num">
                    {when(alert.last_run_at)}
                    {alert.latest_run && (
                      <span style={{ display: "block" }}>
                        {alert.latest_run.matched.toLocaleString("en-US")} found last time
                      </span>
                    )}
                  </td>
                  <td>
                    {alert.active ? <span className="tag ok">on</span> : <span className="tag warn">paused</span>}
                    {alert.last_error && (
                      <span className="fine" style={{ display: "block" }}>
                        {alert.last_error}
                      </span>
                    )}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {alert.active ? (
                      <ActionButton alert={alert} action="pause" label="Pause" />
                    ) : (
                      <ActionButton alert={alert} action="resume" label="Resume" />
                    )}{" "}
                    <ActionButton alert={alert} action="delete" label="Delete" />
                    <ExportAlert alert={alert} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {chosen && (
        <>
          <div className="results-head" style={{ marginTop: 28 }}>
            <b>What “{chosen.name}” found</b>
            {latest && latest.matched > latest.stored && (
              <span className="fine">
                The last run found {latest.matched.toLocaleString("en-US")}; the newest{" "}
                {latest.stored.toLocaleString("en-US")} are kept here.
              </span>
            )}
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>What happened</th>
                  <th>Provider</th>
                  <th>Specialty</th>
                  <th>Where</th>
                </tr>
              </thead>
              <tbody>
                {(hits?.items ?? []).map((hit) => (
                  <tr key={hit.event_id}>
                    <td className="fine num nowrap-cell">{hit.event_date}</td>
                    <td className="fine">{hit.label}</td>
                    <td>
                      <Link href={`/npi/${hit.npi}`}>
                        <b>{hit.name}</b>
                      </Link>
                      <span className="fine mono" style={{ display: "block" }}>
                        {hit.npi}
                      </span>
                    </td>
                    <td className="fine">{hit.specialty ?? "—"}</td>
                    <td className="fine">
                      {[hit.city, hit.state].filter(Boolean).join(", ") || "Not filed"}
                    </td>
                  </tr>
                ))}
                {(hits?.items.length ?? 0) === 0 && (
                  <tr>
                    <td colSpan={5} className="table-empty">
                      {chosen.last_run_at
                        ? "Nothing has matched yet. New events arrive with each weekly registry refresh."
                        : "This alert has not looked yet. It will within a few minutes."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}

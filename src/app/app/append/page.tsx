import type { Metadata } from "next";
import Link from "next/link";
import { getAppends, getBilling, type JobRow } from "@/lib/session";

/**
 * Append: bring a list, take it back with our data beside every row.
 *
 * The customer's own columns and row order come back untouched - this adds columns, it never
 * rewrites theirs. A row with an NPI is looked up directly; a row without one is matched on name
 * (and state, where the file has it), and the file says how each row was matched so a name match
 * is never read as a certainty.
 *
 * The allowance is held against the file's row count before anything runs and charged on the
 * rows that matched afterwards, so a list full of people we do not hold costs nothing for them.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Append to a list",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const FIELD_SETS = [
  { id: "email", label: "Work email", note: "NPI, name and the best work email we hold." },
  {
    id: "contact",
    label: "Contact details",
    note: "Adds credentials, practice phone and practice address.",
  },
  {
    id: "full",
    label: "Everything",
    note: "Adds specialty, every email, employer and EHR system.",
  },
] as const;

const ERRORS: Record<string, string> = {
  "download-unavailable": "That file is not available. It may have expired or you may not have permission. Refresh the list or contact your administrator.",
  "download-retry": "The download service is temporarily unavailable. Please try downloading again shortly.",
  no_file: "Choose a file to upload first.",
  file_type: "That kind of file can't be read. Upload a CSV, TSV or Excel (.xlsx) file.",
  too_big: "That file is over 25 MB. Split it, or send it through the API, which takes larger files.",
  quota_exceeded:
    "That list has more rows than you have left this month. Split it, or see Plan and usage for how to get a larger allowance.",
  email_unverified: "Confirm your email address first — the banner at the top can send the link again.",
  subscription_inactive: "This organization's subscription is not active, so nothing was queued.",
  forbidden: "Your role cannot append. Ask an admin on your team.",
  validation_error: "That file couldn't be read. Check it has a header row, then try again.",
  failed: "That didn't work, and nothing was queued.",
};

function one(params: Record<string, string | string[] | undefined>, key: string): string {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function StatusTag({ job }: { job: JobRow }) {
  if (job.status === "succeeded") return <span className="tag ok">ready</span>;
  if (job.status === "failed") return <span className="tag stop">failed</span>;
  if (job.status === "cancelled") return <span className="tag warn">canceled</span>;
  return <span className="tag">{job.status}</span>;
}

type AppendResult = { input_rows?: number; matched_rows?: number };

function matched(result: AppendResult): string {
  if (result.input_rows === undefined) return "—";
  const hit = (result.matched_rows ?? 0).toLocaleString("en-US");
  return `${hit} of ${result.input_rows.toLocaleString("en-US")}`;
}

export default async function AppendPage({ searchParams }: Props) {
  const params = await searchParams;
  const error = one(params, "error");
  const queued = one(params, "queued");

  const [jobs, billing] = await Promise.all([getAppends(), getBilling()]);
  const rows = billing?.limits?.append_rows;
  const none = rows !== undefined && rows.limit === 0;
  // Home address and cell are metered on their own allowance, so the figure belongs here rather
  // than only on the billing page: somebody about to upload fifty thousand rows and tick Cell phone
  // is spending two allowances, and finding that out from the finished job is finding out too late.
  // Shown only where the plan carries it - zero with nothing spent is a row about a product this
  // customer does not have.
  const home = billing?.limits?.residence_rows;
  const homeShown = home !== undefined && !(home.limit === 0 && home.used === 0);

  return (
    <main className="wrap app-main">
      <div className="eyebrow rule">Append</div>
      <h1>Bring a list. Take it back complete.</h1>
      <p className="lede">
        Upload a file of providers and get it back with the columns you choose added beside every
        row. Your columns and your row order are never changed.
      </p>

      {rows && (
        <p className="fine" style={{ marginTop: 10 }}>
          <b>
            {rows.limit === null
              ? `${rows.used.toLocaleString("en-US")} rows appended`
              : `${rows.used.toLocaleString("en-US")} of ${rows.limit.toLocaleString("en-US")} rows`}
          </b>{" "}
          this month. You are charged only for rows we matched.
        </p>
      )}

      {homeShown && home && (
        <p className="fine" style={{ marginTop: 6 }}>
          <b>
            {home.limit === null
              ? `${home.used.toLocaleString("en-US")} home address and cell rows`
              : `${home.used.toLocaleString("en-US")} of ${home.limit.toLocaleString("en-US")} home address and cell rows`}
          </b>{" "}
          this month, counted separately. A row costs one whether it carried both or just the one.
          If a file needs more than is left, it runs without those columns and nothing is charged.
        </p>
      )}

      {error && (
        <div className="notice stop" style={{ marginTop: 16 }} role="alert">
          {ERRORS[error] ?? ERRORS.failed}
        </div>
      )}
      {queued && !error && (
        <div className="notice ok" style={{ marginTop: 16 }} role="status">
          List received. It appears below as soon as it starts — refresh in a moment.
        </div>
      )}

      {none ? (
        <div className="panel" style={{ marginTop: 22 }}>
          <h2>Append is on paid plans</h2>
          <p className="fine">
            Your plan doesn&rsquo;t include append rows, so there is nothing to upload here. Search
            and reveals work as before, and nothing about your account has to be set up again if the
            plan changes.
          </p>
          <div className="actions" style={{ marginTop: 14 }}>
            <Link className="btn primary" href="/app/billing#upgrade">
              Upgrade your plan
            </Link>
          </div>
        </div>
      ) : (
        <div className="panel" style={{ marginTop: 22 }}>
          <h2>New append</h2>
          <form method="post" action="/api/app/append" encType="multipart/form-data" className="form">
            <div className="field">
              <label htmlFor="file">Your list</label>
              <input id="file" name="file" type="file" accept=".csv,.tsv,.txt,.xlsx" required />
            </div>
            <fieldset className="field" style={{ border: 0, padding: 0 }}>
              <legend>What to add</legend>
              {FIELD_SETS.map((set, index) => (
                <label key={set.id} style={{ display: "block", marginTop: 8 }}>
                  <input type="radio" name="fields" value={set.id} defaultChecked={index === 0} />{" "}
                  <b>{set.label}</b> <span className="fine">— {set.note}</span>
                </label>
              ))}
            </fieldset>
            <button type="submit" className="btn primary">
              Upload and append
            </button>
          </form>
          <p className="fine" style={{ marginTop: 12 }}>
            The file needs a header row and either an <b>NPI</b> column, or first and last names
            (a state column helps). CSV, TSV or Excel, up to 25 MB. Rows matched on name say so in
            a column of their own.
          </p>
        </div>
      )}

      {/* A read that failed and a customer who has never run one are different facts. */}
      {jobs === null ? (
        <div className="notice warn" role="alert">
          Your append jobs could not be read just now, so none are listed. That is not the same as having run
          none &mdash; try again in a moment.
        </div>
      ) : jobs.length === 0 ? (
        <div className="panel" style={{ marginTop: 28 }}>
          <h2>You have not appended a file yet</h2>
          <p className="fine">
            {none
              ? "Files you send us appear here, with how many rows we matched and a link to download the finished one. Your plan does not include append rows, so there is nothing to show yet."
              : "Files you send us appear here as soon as one starts, with how many rows we matched and a link to download the finished file. They are kept so you can fetch the same file again rather than paying for the same rows twice."}
          </p>
          <p className="fine">
            An append is the other direction from an export: you bring the list, and we add columns
            beside the rows you already have.{" "}
            <Link href="/app/exports">Exports</Link> is the page for taking a list away from a
            search instead.
          </p>
        </div>
      ) : (
        <>
          <div className="results-head" style={{ marginTop: 28 }}>
            <b>Recent appends</b>
            <Link className="btn sm" href="/app/append">
              Refresh
            </Link>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Started</th>
                  <th>File</th>
                  <th>Status</th>
                  <th>Matched</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td className="fine num nowrap-cell">{job.created_at.slice(0, 16).replace("T", " ")}</td>
                    <td className="fine">{job.label}</td>
                    <td>
                      <StatusTag job={job} />
                      {job.status === "failed" && job.error && (
                        <span className="fine" style={{ display: "block" }}>
                          {job.error}
                        </span>
                      )}
                    </td>
                    <td className="fine num">{matched((job.result ?? {}) as AppendResult)}</td>
                    <td>
                      {job.status === "succeeded" && (
                        <a className="btn sm" href={`/app/exports/${job.id}/download?from=append`}>
                          Download
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import Balance from "@/components/Balance";
import { CrmNote, ExportCost, FormatAndPreset } from "@/components/ExportControls";
import { DEFAULT_FORMAT, DEFAULT_PRESET, formatOrDefault, presetOrDefault } from "@/lib/exportPresets";
import { getBilling, getExports, searchAsUser, type JobRow } from "@/lib/session";
import { CLASSIFICATIONS, US_STATES } from "@/lib/site";

/**
 * Exports: start one from a set of filters, watch it, download it.
 *
 * The refusal happens before the job exists. An export that turned out to be too big after the
 * file was written would leave two bad options - hand over more than the plan allows, or delete
 * work the customer watched us do - so the row count is checked when they ask.
 *
 * That is also why there is a Count button beside Queue export. It submits the same filters as a
 * GET to this page, which counts them and says what the export would cost against what is left,
 * for both the month and the day. Nobody should have to press a button that spends something to
 * find out how much it spends. It is the same form and the same filters, so the number and the
 * file are one audience.
 *
 * There is no live progress socket and no polling loop. A finished export is a link; an
 * unfinished one says what it is doing and the page has a refresh button. That is less clever
 * than a spinner that updates itself and it fails in a way somebody can understand.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Exports",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const ERRORS: Record<string, string> = {
  "download-unavailable": "That file is not available. It may have expired or you may not have permission. Refresh the list or contact your administrator.",
  "download-retry": "The download service is temporarily unavailable. Please try downloading again shortly.",
  quota_exceeded:
    "That export is larger than the rows left on your plan - for this month or for today. The balance above says which. Narrow the filters, or see Plan and usage for how to get a bigger allowance.",
  format_row_limit:
    "That is more rows than an Excel workbook holds. Narrow the filters, or choose CSV, which has no limit.",
  forbidden: "Your role cannot export. Ask an owner or admin on your team.",
  validation_error: "One of those filters was not valid, so nothing was queued.",
  subscription_inactive: "This organization's subscription is not active, so nothing was queued.",
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

function size(bytes: number | undefined): string {
  if (!bytes) return "";
  const mb = bytes / 1_048_576;
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default async function ExportsPage({ searchParams }: Props) {
  const params = await searchParams;
  const error = one(params, "error");
  const queued = one(params, "queued");
  const state = one(params, "state");
  const classification = one(params, "classification");
  const type = one(params, "type");
  const hasEmail = one(params, "has_email");
  const preset = presetOrDefault(one(params, "preset") || DEFAULT_PRESET);
  const format = formatOrDefault(one(params, "format") || DEFAULT_FORMAT);
  // Only when they asked. A count is a query against the whole register, and running one on every
  // visit to this page would be a search nobody requested.
  const counting = one(params, "count") === "1";

  const [jobs, billing, counted] = await Promise.all([
    getExports(),
    getBilling(),
    counting
      ? searchAsUser({
          state: state || undefined,
          taxonomy_classification: classification || undefined,
          type: type || undefined,
          has_email: hasEmail === "true" ? "true" : undefined,
          page_size: 1,
        })
      : Promise.resolve(null),
  ]);
  const rows = billing?.limits?.export_rows;

  return (
    <main className="wrap app-main">
      <div className="eyebrow rule">Exports</div>
      <h1>Take a search away as a file.</h1>
      <p><Link className="btn" href="/app/integrations">Deliver an export to your tools →</Link></p>
      <p className="lede">
        A provider who has asked to be left alone is not in the search the file comes from. A
        suppressed email is left out of the file and counted below, so the difference between what
        you asked for and what you got is a number you can see rather than a silent gap.
      </p>

      <Balance billing={billing} />

      {error && (
        <div className="notice stop" style={{ marginTop: 16 }} role="alert">
          {ERRORS[error] ?? ERRORS.failed}
        </div>
      )}
      {queued && !error && (
        <div className="notice ok" style={{ marginTop: 16 }}>
          Export queued. It appears below as soon as the worker picks it up — refresh in a
          moment.
        </div>
      )}

      <div className="panel" style={{ marginTop: 22 }}>
        <h2>New export</h2>
        <form className="filters" method="post" action="/api/app/export">
          <div className="field">
            <label htmlFor="state">State</label>
            <select id="state" name="state" defaultValue={state}>
              <option value="">Any</option>
              {US_STATES.map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="classification">Specialty</label>
            <select id="classification" name="classification" defaultValue={classification}>
              <option value="">Any</option>
              {CLASSIFICATIONS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="type">Type</label>
            <select id="type" name="type" defaultValue={type}>
              <option value="">Any</option>
              <option value="individual">Individual</option>
              <option value="organization">Organization</option>
            </select>
          </div>
          <FormatAndPreset idPrefix="new-export" preset={preset} format={format} />
          <div className="field">
            <label htmlFor="has_email">Only with an email</label>
            <select id="has_email" name="has_email" defaultValue={hasEmail}>
              <option value="">No preference</option>
              <option value="true">Yes</option>
            </select>
          </div>
          <input type="hidden" name="return_to" value="/app/exports" />
          {/* Same form, same filters, submitted back here as a GET so the count below is of
              exactly what the button beside it would export. `count=1` is what asks for it. */}
          <input type="hidden" name="count" value="1" />
          <button type="submit" className="btn" formMethod="get" formAction="/app/exports">
            Count these filters
          </button>
          <button type="submit" className="btn primary">
            Queue export
          </button>
        </form>
        {counted !== null && <ExportCost rows={counted.total} limit={rows} />}
        <CrmNote />
        <p className="fine" style={{ marginTop: 12 }}>
          The row count is checked before the job is created, so an export that would exceed your
          plan — this month&apos;s allowance or today&apos;s cap — is refused now rather than after
          the file is written. Re-downloading a file you already have costs nothing.
        </p>
      </div>

      {/* A read that failed and a customer who has never run one are different facts. */}
      {jobs === null ? (
        <div className="notice warn" role="alert">
          Your exports could not be read just now, so none are listed. That is not the same as having run
          none &mdash; try again in a moment.
        </div>
      ) : jobs.length === 0 ? (
        <div className="panel" style={{ marginTop: 28 }}>
          <h2>You have not exported anything yet</h2>
          <p className="fine">
            An export writes every row your filters match to a file you download, with the columns
            you picked. It runs in the background, so a big one can be left to finish, and it turns
            up here with its row count and file size when it is ready.
          </p>
          <p className="fine">
            Start one from the filters above, or run the search first on{" "}
            <Link href="/app/search">the providers page</Link> so you can see what you are about to
            take. Files that come back from <Link href="/app/append">Append</Link> are listed on
            that page rather than this one.
          </p>
        </div>
      ) : (
        <>
          <div className="results-head" style={{ marginTop: 28 }}>
            <b>Recent exports</b>
            <Link className="btn sm" href="/app/exports">
              Refresh
            </Link>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Started</th>
                  <th>What</th>
                  <th>Status</th>
                  <th>Rows</th>
                  <th>File</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td className="fine num nowrap-cell">{job.created_at.slice(0, 16).replace("T", " ")}</td>
                    <td className="fine">{job.label}</td>
                    <td>
                      <StatusTag job={job} />
                      {job.status === "running" && job.progress.total ? (
                        <span className="fine" style={{ display: "block" }}>
                          {job.progress.done.toLocaleString("en-US")} of{" "}
                          {job.progress.total.toLocaleString("en-US")}
                        </span>
                      ) : null}
                      {job.error && (
                        <span className="fine" style={{ display: "block" }}>
                          {job.error}
                        </span>
                      )}
                    </td>
                    <td className="num fine">
                      {job.result?.row_count?.toLocaleString("en-US") ?? "—"}
                      {/* The count the lede promises. Without it "counted" is true only of a
                          JSON body nobody on this page ever sees. */}
                      {job.result?.suppressed_count ? (
                        <span className="fine" style={{ display: "block" }}>
                          {job.result.suppressed_count.toLocaleString("en-US")} suppressed, left out
                        </span>
                      ) : null}
                    </td>
                    <td>
                      {job.status === "succeeded" ? (
                        <a className="btn sm" href={`/app/exports/${job.id}/download`}>
                          Download {size(job.result?.byte_size)}
                        </a>
                      ) : (
                        <span className="fine">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* The one page somebody is staring at when they think we are broken: a job that has sat
          queued for longer than it should. The answer to "is it me or is it them" is a link
          rather than an email and a wait. */}
      <p className="fine" style={{ marginTop: 20 }}>
        A job that has been queued far longer than usual is worth checking against{" "}
        <Link href="/status">platform status</Link>, which says whether exports are running
        normally right now.
      </p>
    </main>
  );
}

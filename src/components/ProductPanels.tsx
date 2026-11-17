import Link from "next/link";
import { ProductWindow, Unreachable } from "@/components/ProductWindow";
import type { ProviderRow } from "@/lib/api";
import { providerCountWhere } from "@/lib/api";
import { CRM_NOTE, EXPORT_FORMATS, EXPORT_PRESETS } from "@/lib/exportPresets";

/**
 * The product surfaces, each filled from the platform by whatever page renders it.
 *
 * Four rules they are built around, carried over from the rest of the site:
 *
 *   1. No figure is typed into the markup. Every number in here arrives as a prop that was read
 *      from the API, so a number on the page is also the answer to "is this talking to the platform
 *      right now".
 *   2. A count that cannot be read is omitted, never shown as zero. `figure()` collapses both an
 *      unreadable count and a genuine zero to null, and every row of bars is built by pushing only
 *      what came back - so the row gets shorter instead of lying.
 *   3. Where a reference site puts a logo wall or a testimonial, these put a live count or put
 *      nothing. There are no customers yet; inventing one is not a design decision.
 *   4. The premium contact product is drawn in the state it is really in: present, and not openable
 *      from a web page. Never a blurred value, because a blurred value is a promise that there is a
 *      button somewhere.
 *
 * Built for the product-led candidate home page, and lifted out of it when the owner chose that
 * direction, so any page can put a surface on itself rather than only that one route.
 */

/** A count worth printing, or null. A zero we cannot stand behind is not a count. */
export function figure(value: number | null | undefined): number | null {
  return typeof value === "number" && value > 0 ? value : null;
}

/** Every number on a page goes through here, so grouping and locale can only be decided once. */
export const n = (value: number) => value.toLocaleString("en-US");

/** Never throws: a panel that cannot read its data renders its "not reachable" state instead. */
export async function attempt<T>(work: () => Promise<T>): Promise<T | null> {
  try {
    return await work();
  } catch {
    return null;
  }
}

/** The API returns the trust tier alongside the address; `lib/api` does not declare it yet. */
export type RowWithTier = ProviderRow & { email_trust_tier?: string | null };

/** A date as the site writes dates: the day, never a time, never "2 days ago". */
export function shortDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

/* ============================================================================================
 * Coverage: one live count per specialty
 * ==========================================================================================*/

export type Bar = { label: string; count: number };

/** The classifications to try. Only the ones that answer get drawn. */
export const COVERAGE_TRIES = [
  "Internal Medicine",
  "Family Medicine",
  "Nurse Practitioner",
  "Dentist",
  "Psychiatry & Neurology",
  "Pharmacist",
  "Physician Assistant",
  "Optometrist",
  "Chiropractor",
  "Physical Therapist",
  "Podiatrist",
  "Registered Nurse",
] as const;

export async function coverageBars(limit = 8): Promise<Bar[]> {
  const counted = await Promise.all(
    COVERAGE_TRIES.map(async (label): Promise<Bar | null> => {
      const count = figure(await providerCountWhere({ taxonomy_classification: label }));
      return count === null ? null : { label, count };
    }),
  );
  return counted
    .filter((row): row is Bar => row !== null)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/* ============================================================================================
 * The panels
 * ==========================================================================================*/

/** The search results surface: a real filter, the real columns, the rows that came back. */
export function SearchPanel({
  rows,
  total,
  filterLabel,
  href,
  tilt,
  limit,
}: {
  rows: RowWithTier[] | null;
  total: number | null;
  /** The specialty the filter chips name, so the chips and the link cannot disagree. */
  filterLabel: string;
  href: string;
  tilt?: "left" | "right";
  /** Fewer rows in a hero than in a feature section: there it is a glimpse, here a proof. */
  limit?: number;
}) {
  const shown = rows ? rows.slice(0, limit ?? rows.length) : null;
  return (
    <ProductWindow
      title="Search"
      path="/search"
      chip="live"
      tilt={tilt}
      foot={
        <>
          <span className="win-count">
            {shown && total !== null
              ? `${n(shown.length)} of ${n(total)} matching · page 1`
              : shown
                ? `${n(shown.length)} shown`
                : "no rows"}
          </span>
          <Link href={href} className="win-link">
            Open this search
          </Link>
        </>
      }
    >
      <div className="win-filters">
        <span className="chip filter">Specialty · {filterLabel}</span>
        <span className="chip filter">Work email on file · yes</span>
        <span className="chip ghost">+ state, city, ZIP, radius, NPI</span>
      </div>
      {!shown || shown.length === 0 ? (
        <Unreachable what="This search" />
      ) : (
        <div className="win-scroll">
          <table className="win-table">
            <caption className="sr-only">
              Providers matching {filterLabel} with a work email on file, read from the API when
              this page was rendered
            </caption>
            <thead>
              <tr>
                {/* Four columns rather than five: the NPI rides under the name. A fifth column of
                    ten monospaced digits squeezed the specialty into three lines at every width a
                    panel is ever given, and a provider's NPI belongs beside their name anyway. */}
                <th scope="col">Provider</th>
                <th scope="col">Specialty</th>
                <th scope="col">Location</th>
                <th scope="col">Work email</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => (
                <tr key={row.npi}>
                  <th scope="row">
                    <span className="cell-name">{row.name}</span>
                    {row.credentials && <span className="cell-cred">{row.credentials}</span>}
                    <code className="cell-npi">{row.npi}</code>
                  </th>
                  <td className="wrap-cell">{row.primary_taxonomy?.display ?? "—"}</td>
                  <td>{[row.city, row.state].filter(Boolean).join(", ") || "—"}</td>
                  <td>
                    {row.email ? (
                      <span className="chip ok">
                        {row.email_trust_tier === "trusted" ? "trusted" : "on file"}
                      </span>
                    ) : (
                      <span className="chip ghost">none</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ProductWindow>
  );
}

/**
 * The record surface: what opening one provider gives a signed-in customer.
 *
 * The identity block and the two contact lines are read from the same live row the search panel
 * drew. The two premium kinds are drawn in their locked state, because that is their real state:
 * home address and mobile are sold under a contract, never opened from a web page, and a page that
 * showed them behind a "Reveal" button would be advertising something that does not exist. The Do
 * Not Call line is the product's own null branch - the flag is stated as unknown, which is what it
 * is, and the sentence underneath is the one the product shows.
 */
export function RecordPanel({ row, tilt }: { row: RowWithTier | null; tilt?: "left" | "right" }) {
  return (
    <ProductWindow
      title="Provider record"
      path={row ? `/npi/${row.npi}` : "/npi"}
      chip="live"
      tilt={tilt}
      foot={
        <>
          <span className="win-count">
            A standard reveal uses one unit per provider, organization and calendar month.
            Newly unlocking licensed contact fields may use additional units.
          </span>
          <Link href="/pricing" className="win-link">
            What a reveal costs
          </Link>
        </>
      }
    >
      {!row ? (
        <Unreachable what="A provider record" />
      ) : (
        <>
          <div className="rec-head">
            <div>
              <p className="rec-name">
                {row.name}
                {row.credentials && <span className="cell-cred">{row.credentials}</span>}
              </p>
              <p className="rec-sub">
                {row.primary_taxonomy?.display ?? "Specialty not filed"}
                {row.city && row.state ? ` · ${row.city}, ${row.state}` : ""}
              </p>
            </div>
            <code className="rec-npi">NPI {row.npi}</code>
          </div>

          <p className="rec-label">Contact access</p>
          <ul className="rec-lines">
            {row.email ? (
              <li>
                <Link href="/sign-in">Sign in to reveal available contact details</Link>
                <span className="rec-kind">work email</span>
                {row.email_trust_tier && (
                  <span className={`chip ${row.email_trust_tier === "trusted" ? "ok" : "warn"}`}>
                    {row.email_trust_tier}
                  </span>
                )}
              </li>
            ) : (
              <li>
                <span className="rec-none">Email availability is checked after sign-in.</span>
              </li>
            )}
            {row.phone ? (
              <li>
                <code>{row.phone}</code>
                <span className="rec-kind">practice phone</span>
              </li>
            ) : (
              <li>
                <span className="rec-none">No practice phone on file.</span>
              </li>
            )}
          </ul>

          <p className="rec-label">On a contracted plan, agreed with us first</p>
          <ul className="rec-lines">
            <li>
              <span className="rec-bar" aria-hidden="true" />
              <span className="rec-kind">home address</span>
              <span className="chip lock">contract only</span>
            </li>
            <li>
              <span className="rec-bar" aria-hidden="true" />
              <span className="rec-kind">cell phone</span>
              <span className="chip lock">contract only</span>
              <span className="chip warn">Do Not Call status unknown</span>
            </li>
          </ul>
          <p className="rec-fine">
            Where a mobile carries a Do Not Call flag we show the flag when the number is opened, and
            we show it as unknown when it is unknown. Check the live registry before you call;
            calling rules are yours to keep.
          </p>
        </>
      )}
    </ProductWindow>
  );
}

/** The export surface: the real formats, the real column presets, the real CRM caveat. */
export function ExportPanel({ rows, tilt }: { rows: number | null; tilt?: "left" | "right" }) {
  const ours = EXPORT_PRESETS.filter((preset) => !preset.crm);
  const crm = EXPORT_PRESETS.filter((preset) => preset.crm);
  return (
    <ProductWindow
      title="Export"
      path="/app/exports"
      chip="live"
      tilt={tilt}
      foot={
        <>
          <span className="win-count">
            {rows !== null
              ? `This selection is ${n(rows)} ${rows === 1 ? "row" : "rows"}.`
              : "Row counts are read from the API, never typed in."}
          </span>
          <Link href="/lists" className="win-link">
            Browse the lists
          </Link>
        </>
      }
    >
      <div className="exp">
        <div>
          <p className="exp-label">Columns</p>
          <p className="exp-group">Ours</p>
          <ul className="exp-list">
            {ours.map((preset, index) => (
              <li key={preset.id} aria-current={index === 0 ? "true" : undefined}>
                {preset.label}
              </li>
            ))}
          </ul>
          <p className="exp-group">Ready for a CRM</p>
          <ul className="exp-list">
            {crm.map((preset) => (
              <li key={preset.id}>{preset.label}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="exp-label">Format</p>
          <ul className="exp-list">
            {EXPORT_FORMATS.map((format, index) => (
              <li key={format.id} aria-current={index === 0 ? "true" : undefined}>
                {format.label}
              </li>
            ))}
          </ul>
          <p className="exp-note">{CRM_NOTE}</p>
        </div>
      </div>
    </ProductWindow>
  );
}

/** The coverage surface: one live count per specialty, drawn as bars against the largest. */
export function CoveragePanel({
  bars,
  refreshed,
  tilt,
}: {
  bars: Bar[];
  refreshed: string | null;
  tilt?: "left" | "right";
}) {
  const top = bars.length > 0 ? bars[0].count : 0;
  return (
    <ProductWindow
      title="Coverage by specialty"
      path="/data"
      chip="live"
      tilt={tilt}
      foot={
        <>
          <span className="win-count">
            {refreshed ? `Counts refreshed ${refreshed}.` : "Counted on this request."}
          </span>
          <Link href="/data" className="win-link">
            What is in a record
          </Link>
        </>
      }
    >
      {bars.length === 0 ? (
        <Unreachable what="The per-specialty counts" />
      ) : (
        <ul className="bars">
          {bars.map((bar) => (
            <li key={bar.label}>
              <span className="bar-label">{bar.label}</span>
              <span className="bar-track" aria-hidden="true">
                <span
                  className="bar-fill"
                  style={
                    { "--w": `${Math.max(3, (bar.count / top) * 100)}%` } as React.CSSProperties
                  }
                />
              </span>
              <span className="bar-count">{n(bar.count)}</span>
            </li>
          ))}
        </ul>
      )}
    </ProductWindow>
  );
}

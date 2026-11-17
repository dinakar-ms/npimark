import { CLAIMS_NOTE, CRM_NOTE, EXPORT_FORMATS, EXPORT_PRESETS } from "@/lib/exportPresets";
import type { Limit } from "@/lib/session";
import { headroom } from "@/components/Balance";

/**
 * The two choices every export form offers, and the sentence that says what it will cost.
 *
 * One component, used by /app/exports, /app/search and /app/alerts, so the three cannot drift into
 * offering different formats or different presets. Plain labelled selects: the signed-in site is
 * forms and redirects with no client JavaScript, and `npm run lint` fails a control with no label.
 *
 * `idPrefix` exists because /app/alerts draws one of these per saved search. Two controls on one
 * page cannot share an id, or the label points at the wrong one.
 */

export function FormatAndPreset({
  idPrefix,
  preset,
  format,
  only,
}: {
  idPrefix: string;
  preset: string;
  format: string;
  /**
   * Show only one half of the list.
   *
   * `"crm"` is used by the campaign builder's CRM destination, where the sentence above the
   * control promises a file carrying that CRM's own field names. Offering ours in the same
   * dropdown let somebody take the promise and a file that does not keep it.
   */
  only?: "crm" | "ours";
}) {
  const presetId = `${idPrefix}-preset`;
  const formatId = `${idPrefix}-format`;
  return (
    <>
      <div className="field">
        <label htmlFor={presetId}>Columns</label>
        <select id={presetId} name="preset" defaultValue={preset}>
          {only !== "crm" && (
          <optgroup label="Ours">
            {EXPORT_PRESETS.filter((entry) => !entry.crm).map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </optgroup>
          )}
          {only !== "ours" && (
          <optgroup label="Ready for a CRM">
            {EXPORT_PRESETS.filter((entry) => entry.crm).map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </optgroup>
          )}
        </select>
      </div>
      <div className="field">
        <label htmlFor={formatId}>Format</label>
        <select id={formatId} name="format" defaultValue={format}>
          {EXPORT_FORMATS.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}

/**
 * What this export will cost, against what is left — before the button is pressed.
 *
 * `rows` is the count the screen is already showing, so this is the same audience the file will
 * hold rather than a second guess at it. The API counts it again and refuses before the job exists;
 * this is so nobody has to press a button to find out.
 */
export function ExportCost({ rows, limit }: { rows: number; limit: Limit | undefined }) {
  const left = headroom(limit);
  const n = (value: number) => value.toLocaleString("en-US");
  const overspend = left !== null && rows > left;
  const daily =
    limit?.daily_enforced && rows > (limit.daily_remaining ?? 0) && rows <= limit.remaining;
  return (
    <p className={overspend ? "notice warn" : "fine"} style={{ marginTop: 10 }} role="status">
      This export would use <b>{n(rows)}</b> {rows === 1 ? "row" : "rows"}
      {left === null ? (
        <>, and nothing caps your rows.</>
      ) : (
        <>
          {" "}
          of the <b>{n(left)}</b> you have left
          {daily ? " today" : ""}.
        </>
      )}
      {overspend && (
        <>
          {" "}
          {daily
            ? "It is refused until midnight UTC, when the daily cap resets — your month is not spent. Narrow the filters to take some of it now."
            : "It is refused before anything is written. Narrow the filters, or upgrade."}
        </>
      )}
    </p>
  );
}

/**
 * The caveats under the Columns select. Said once per form, never per option.
 *
 * Two of them: what a CRM preset does to the headers, and what the published-volume columns hold —
 * chiefly that five rows in six carry words rather than a number, which somebody choosing that
 * preset should read before the file arrives rather than after.
 *
 * Both live in this one component rather than one apiece, because the three forms that draw the
 * Columns select (/app/exports, /app/search, /app/alerts) already render it and nothing else on
 * those pages has to change for a note to reach all three. It keeps its old name for the same
 * reason.
 */
export function CrmNote() {
  return (
    <>
      <p className="fine" style={{ marginTop: 8 }}>
        {CRM_NOTE}
      </p>
      <p className="fine" style={{ marginTop: 6 }}>
        {CLAIMS_NOTE}
      </p>
    </>
  );
}

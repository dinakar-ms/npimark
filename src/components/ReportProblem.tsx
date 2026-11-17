import {
  FIELDS_FOR,
  FIELD_LABELS,
  REASON_LABELS,
  REASON_ORDER,
  type CorrectionField,
  type SubjectKind,
} from "@/lib/corrections";
import type { ReportedField } from "@/lib/session";

/**
 * "Report a problem" beside a record a signed-in customer is reading.
 *
 * A server component and a plain form, like every other form on this site: it posts to
 * /api/app/report-problem, which forwards it to the API and sends the browser back here. No client
 * JavaScript, so it works for somebody who has it switched off, and nothing is spent or changed by
 * pressing it - a report goes into a queue a person works through.
 *
 * It is a `<details>` rather than a dialog because that is what this codebase uses for a disclosure
 * (see the Medicare filters and "Save as alert" on the search screen), and because a closed
 * `<details>` costs one line beside a field instead of a modal nobody asked for.
 *
 * Every control is wrapped in its own `<label>` rather than carrying an id: the search screen
 * renders one of these per row, and ids built from the record would be a page full of near-misses
 * for a screen reader to read out. A wrapping label names the control with no id at all.
 *
 * `reported` is what this organisation has already said about this record. A field already reported
 * shows as "reported, under review" so nobody reports it twice, and so they can see we listened.
 */

type Props = {
  kind: SubjectKind;
  id: string;
  /** Where to come back to: the current path and query. Rebuilt by the handler, never trusted. */
  returnTo: string;
  /** Which fields this record actually shows. Defaults to everything the kind can carry. */
  fields?: readonly CorrectionField[];
  /** Pre-chosen in the select when the control sits beside one field rather than under a panel. */
  defaultField?: CorrectionField;
  /**
   * Fixes the field instead of offering a select. This is what a control sitting beside one row of
   * a `<dl>` uses: the field is not a question, it is where the person clicked.
   */
  field?: CorrectionField;
  /** This organisation's own reports for this record. */
  reported?: ReportedField[];
  /** Overrides the summary line, for a control that sits under a named panel. */
  summary?: string;
};

/** The words for one of our own reports, as the reporter's organisation should read them. */
function outcome(status: string): { tone: string; text: string } {
  if (status === "new") return { tone: "warn", text: "reported, under review" };
  if (status === "accepted") return { tone: "ok", text: "reported, and we agreed" };
  if (status === "duplicate") return { tone: "ok", text: "reported, already known" };
  return { tone: "", text: "reported, we did not change it" };
}

/**
 * The control that sits beside one row of a record - next to the number, the specialty, the
 * employer, the job title.
 *
 * A field this organisation has an open report on renders as the tag and **nothing else**: the
 * whole point of showing "reported, under review" is that they should not be invited to tell us
 * twice. A field whose report was already decided shows the outcome and offers the control again,
 * because that is a fresh claim rather than a repeat.
 */
export function ReportField({
  kind,
  id,
  field,
  returnTo,
  reported = [],
  summary,
}: {
  kind: SubjectKind;
  id: string;
  field: CorrectionField;
  returnTo: string;
  reported?: ReportedField[];
  /** Needed where two of these sit side by side and "This is wrong" would not say which. */
  summary?: string;
}) {
  const mine = reported.filter((r) => r.field === field);
  const open = mine.find((r) => r.status === "new");
  const decided = mine.find((r) => r.status !== "new");
  if (open) {
    const { tone, text } = outcome(open.status);
    return (
      <span className={tone ? `tag ${tone}` : "tag"} style={{ marginTop: 4 }}>
        {text}
      </span>
    );
  }
  return (
    <>
      {decided ? (
        <span
          className={outcome(decided.status).tone ? `tag ${outcome(decided.status).tone}` : "tag"}
        >
          {outcome(decided.status).text}
        </span>
      ) : null}
      <ReportProblem
        kind={kind}
        id={id}
        field={field}
        returnTo={returnTo}
        reported={mine}
        summary={summary}
      />
    </>
  );
}

export function ReportedTags({ reported }: { reported: ReportedField[] }) {
  if (reported.length === 0) return null;
  return (
    <p className="fine" style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "6px 0 0" }}>
      {reported.map((item) => {
        const { tone, text } = outcome(item.status);
        const label = FIELD_LABELS[item.field as CorrectionField] ?? item.field;
        return (
          <span className={tone ? `tag ${tone}` : "tag"} key={item.reference}>
            {label}: {text}
          </span>
        );
      })}
    </p>
  );
}

export default function ReportProblem({
  kind,
  id,
  returnTo,
  fields,
  defaultField,
  field,
  reported = [],
  summary,
}: Props) {
  const offered = (fields ?? FIELDS_FOR[kind]).filter((f) => FIELDS_FOR[kind].includes(f));
  const openFields = new Set(
    reported.filter((r) => r.status === "new").map((r) => r.field),
  );
  const fixed = field && FIELDS_FOR[kind].includes(field) ? field : null;
  const line = summary ?? (fixed ? "This is wrong" : "Report a problem");

  return (
    <details className="report-problem" style={{ marginTop: fixed ? 4 : 10 }}>
      <summary className="fine">{line}</summary>
      <form
        method="post"
        action="/api/app/report-problem"
        className="form"
        style={{ marginTop: 12, gap: 12 }}
      >
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="return_to" value={returnTo} />

        {fixed ? (
          <>
            <input type="hidden" name="field" value={fixed} />
            <p className="fine" style={{ margin: 0 }}>
              About the {FIELD_LABELS[fixed].toLowerCase()} on this record.
            </p>
          </>
        ) : (
          <div className="field">
            <label style={{ display: "grid", gap: 6 }}>
              Which part is wrong?
              <select name="field" defaultValue={defaultField ?? ""} required>
                <option value="">Choose a field</option>
                {offered.map((f) => (
                  <option key={f} value={f}>
                    {FIELD_LABELS[f]}
                    {openFields.has(f) ? " (already reported)" : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        <div className="field">
          <label style={{ display: "grid", gap: 6 }}>
            What is wrong with it?
            <select name="reason" defaultValue="" required>
              <option value="">Choose a reason</option>
              {REASON_ORDER.map((reason) => (
                <option key={reason} value={reason}>
                  {REASON_LABELS[reason]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="field">
          <label style={{ display: "grid", gap: 6 }}>
            Anything that would help us check (optional)
            <textarea name="note" maxLength={2000} rows={3} />
          </label>
        </div>

        <button type="submit" className="btn sm">
          Send report
        </button>
        <span className="fine">
          A person reads every report. Nothing on the record changes until they decide, and we never
          overwrite what the public registries publish.
        </span>
      </form>
    </details>
  );
}

const NOTICES: Record<string, { tone: "ok" | "warn" | "stop"; text: string }> = {
  reported: {
    tone: "ok",
    text: "Thank you - that is with our team. It shows as “reported, under review” until somebody has decided.",
  },
  again: {
    tone: "ok",
    text: "You had already told us about that field. It is written down again, which is useful - two voices on one field is evidence - and it is still under review.",
  },
  "bad-record": {
    tone: "stop",
    text: "We couldn't tell which record that was about, so nothing was sent.",
  },
  "bad-field": { tone: "stop", text: "Choose which part of the record is wrong." },
  "bad-reason": { tone: "stop", text: "Choose what is wrong with it." },
  "too-many": {
    tone: "warn",
    text: "That's a great many reports from this connection in the last hour. Wait an hour, or write in with the list and we will take the whole list.",
  },
  failed: {
    tone: "stop",
    text: "Something went wrong sending that report and nothing was saved. Please try again shortly.",
  },
};

/**
 * The line a record page shows after a report was sent, read off the query string the handler set.
 *
 * The only value carried back is a field name, and it is looked up in our own table before it is
 * shown - so nothing a URL says is ever rendered as text.
 */
export function ReportNotice({
  params,
}: {
  params: Record<string, string | string[] | undefined>;
}) {
  const one = (value: string | string[] | undefined) =>
    typeof value === "string" ? value : null;
  const sent = one(params.reported);
  const again = one(params.report_again);
  const error = one(params.report_error);
  const key = error ? (error in NOTICES ? error : "failed") : again ? "again" : sent ? "reported" : null;
  if (!key) return null;
  const notice = NOTICES[key];
  const field = sent ?? again;
  const label = field && field in FIELD_LABELS ? FIELD_LABELS[field as CorrectionField] : null;
  return (
    <div
      className={`notice ${notice.tone}`}
      role={notice.tone === "stop" ? "alert" : "status"}
      style={{ marginTop: 16 }}
    >
      {label ? <strong>{label}. </strong> : null}
      {notice.text}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import Turnstile from "@/components/Turnstile";
import {
  FIELDS_FOR,
  FIELD_LABELS,
  REASON_LABELS,
  REASON_ORDER,
  REFERENCE_PATTERN,
  isCorrectionField,
  isSubjectKind,
  subjectIdLooksRight,
  type SubjectKind,
} from "@/lib/corrections";
import { privacyEmail } from "@/content/legal/version";

export const metadata: Metadata = {
  title: "Report a problem with a listing",
  description:
    "Tell us a phone number, specialty, practice address or employer on an NPI Mark listing is wrong. A person reads every report, and nothing on a listing changes until they do.",
  alternates: { canonical: "/report-a-problem" },
};

/**
 * The public "this is wrong" form, for a provider or their office who found their own listing
 * wrong. A plain HTML form posting to /api/privacy/report, which forwards it to the API and
 * redirects back here with a notice - no client code but Cloudflare's Turnstile.
 *
 * It lives on its own page rather than on the profile pages for a plain reason: the profile pages
 * are cached for a day (`revalidate`), and a form that has to show "that didn't work" needs to
 * render per request. So each profile links here with the record already in the query string, and
 * the page stays a static read.
 *
 * Nothing typed is ever shown back, and nothing we hold is ever shown either. The record is named
 * only by the id in the link - we do not look it up, so this page cannot be used to ask whether we
 * hold a listing, or what is on it. The only value read from the URL and displayed is a
 * reference,
 * and only in the FC-2026-A1B2C3D4E5F6 shape the API mints (`REFERENCE_PATTERN`).
 */

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const FIELD_HELP: Record<string, string> = {
  subject_id: "We couldn't read which listing this is about. Use the link on the listing itself.",
  field: "Choose which part of the listing is wrong.",
  reason: "Choose what is wrong with it.",
  contact_email: "That email address doesn't look right.",
  note: "The note is limited to 2,000 characters.",
};

const ERRORS: Record<string, string> = {
  "too-many":
    "That's several reports from this connection in the last hour. Wait an hour and try again - or put the rest in the note on one report and we will work through them.",
  challenge:
    "We couldn't confirm you're a person, so nothing was sent. Complete the check above the button and try again.",
  "challenge-down":
    "The check that keeps automated reports out isn't answering. Try again in a minute.",
  unavailable: "Something went wrong on our side and nothing was saved. Please try again shortly.",
  "no-record":
    "We couldn't read which listing this is about. Go back to the listing and use the “Report a problem” link on it.",
  failed: "Some of the information needs attention. Please check the form and try again.",
};

const KIND_LABELS: Record<SubjectKind, string> = {
  npi: "provider or organization",
  ccn: "facility",
  org_contact: "person",
};

function one(value: string | string[] | undefined): string | null {
  return typeof value === "string" ? value : null;
}

export default async function ReportProblemPage({ searchParams }: Props) {
  await connection();
  const params = await searchParams;
  const notice = one(params.notice);
  const error = one(params.error);
  const fields = (one(params.fields) ?? "").split(",").filter((f) => f in FIELD_HELP);
  const ref = one(params.ref);
  const reference = ref && REFERENCE_PATTERN.test(ref) ? ref : null;
  const privacy = privacyEmail();

  const rawKind = (one(params.kind) ?? "").trim();
  const rawId = (one(params.id) ?? "").trim();
  const kind: SubjectKind | null = isSubjectKind(rawKind) ? rawKind : null;
  const subjectId = kind && subjectIdLooksRight(kind, rawId) ? rawId : null;
  const rawField = (one(params.field) ?? "").trim();
  const offered = kind ? FIELDS_FOR[kind] : [];
  const preselect = isCorrectionField(rawField) && offered.includes(rawField) ? rawField : null;

  return (
    <main>
      <section className="wrap remove-layout">
        <div>
          <div className="eyebrow rule">Corrections</div>
          <h1>Report a problem with a listing</h1>
          <p className="lede">
            If a phone number, specialty, practice address or employer on one of our listings is
            wrong, tell us here. A person reads every report, and nothing on a listing changes until
            they do.
          </p>
          <p className="fine">
            If you would rather your details were not listed at all, use{" "}
            <Link href="/remove-my-information">Remove my information</Link> instead - a correction
            fixes a field, that takes the whole record out.
          </p>

          {notice === "sent" && (
            <div className="notice ok" role="status" style={{ marginTop: 20 }}>
              <strong>Thank you - check your email.</strong> Your report is already with our team.
              We have sent a link to the address you gave; follow it and we will email you what we
              decide. The link works for seven days.
            </div>
          )}
          {notice === "received" && (
            <div className="notice ok" role="status" style={{ marginTop: 20 }}>
              <strong>Thank you - report received{reference ? ` (${reference})` : ""}.</strong> A
              member of our team will read it and decide. Nothing on the listing changes until they
              do.
            </div>
          )}
          {error && (
            <div className="notice stop" role="alert" style={{ marginTop: 20 }}>
              {ERRORS[error] ?? ERRORS.failed}
              {fields.length > 0 && (
                <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
                  {fields.map((f) => (
                    <li key={f}>{FIELD_HELP[f]}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {!subjectId || !kind ? (
            <div className="notice warn" role="status" style={{ marginTop: 24 }}>
              <strong>Start from the listing.</strong> This form needs to know which listing you
              mean, and the &ldquo;Report a problem&rdquo; link on the listing carries that for you.
              Find it from <Link href="/search">search</Link> or the{" "}
              <Link href="/directory">directory</Link>.
            </div>
          ) : (
            <form
              className="form"
              method="post"
              action="/api/privacy/report"
              style={{ marginTop: 24 }}
            >
              <input type="hidden" name="kind" value={kind} />
              <input type="hidden" name="id" value={subjectId} />

              <p className="fine">
                About one {KIND_LABELS[kind]} listing. We have carried the listing over from the
                page you came from, so you do not need to type it.
              </p>

              <div className="field">
                <label htmlFor="field">What is wrong?</label>
                <select id="field" name="field" defaultValue={preselect ?? ""} required>
                  <option value="">Choose a part of the listing</option>
                  {offered.map((f) => (
                    <option key={f} value={f}>
                      {FIELD_LABELS[f]}
                    </option>
                  ))}
                </select>
              </div>

              <fieldset className="scopes">
                <legend>Why is it wrong?</legend>
                {REASON_ORDER.map((reason) => (
                  <label key={reason}>
                    <input type="radio" name="reason" value={reason} required />
                    <span>{REASON_LABELS[reason]}</span>
                  </label>
                ))}
              </fieldset>

              <div className="field">
                <label htmlFor="note">Anything that would help us check (optional)</label>
                <textarea id="note" name="note" maxLength={2000} rows={4} />
                <span className="fine">
                  Please don&apos;t put a home address or a personal mobile number here - we do not
                  need them to fix a listing, and we would only have to delete them.
                </span>
              </div>

              <div className="field">
                <label htmlFor="contact_email">Your email, if you want to hear the outcome</label>
                <input
                  id="contact_email"
                  name="contact_email"
                  type="email"
                  autoComplete="email"
                  maxLength={320}
                />
                <span className="fine">
                  Optional. We send one link to confirm the address is yours, and after that we
                  write to it only about this report. We never write to an address that was not
                  confirmed, and we use it for nothing else.
                </span>
              </div>

              <Turnstile action="report" />
              <button type="submit" className="btn primary lg">
                Send report
              </button>
            </form>
          )}
        </div>

        <aside className="panel">
          <h2 style={{ fontSize: "1.15rem" }}>What happens next</h2>
          <ol
            className="fine"
            style={{ paddingLeft: 18, display: "grid", gap: 10, marginTop: 12 }}
          >
            <li>
              Your report goes into a queue a person works through. Nothing a form says can change a
              listing on its own - that would let anybody edit anybody&apos;s record.
            </li>
            <li>
              If we agree, the detail you told us about stops being shown, revealed or included in
              anything we hand to a customer, and the listing is queued to be looked at again the
              next time we refresh it.
            </li>
            <li>
              We do not overwrite what the public registries publish about you. Where a listing
              disagrees with us, the registry is still the registry - what changes is what we will
              hand out.
            </li>
            <li>
              If you gave an email address and confirmed it, we write and tell you what we decided.
              We will not tell you anything else about the listing.
            </li>
          </ol>
          <p className="fine" style={{ marginTop: 16 }}>
            To have your details taken out altogether, use{" "}
            <Link href="/remove-my-information">Remove my information</Link>
            {privacy ? (
              <>
                , or write to <a href={`mailto:${privacy}`}>{privacy}</a>
              </>
            ) : null}
            .
          </p>
        </aside>
      </section>
    </main>
  );
}

/**
 * The pieces a page needs to offer a metered reveal of a person with no NPI: the button, and the
 * sentence that explains what just happened. Shared by the facility page and the person page so
 * the two cannot describe the same refusal in different words.
 *
 * Plain forms, no client JavaScript - the handler at /api/app/reveal-contact does the work and
 * sends the browser back.
 *
 * `ContactLines` joined them when the signed-in provider page needed to render an opened
 * provider exactly as the search results do - see the note above it.
 */

import Link from "next/link";
import type { OpenedContacts } from "@/lib/session";
import { salesHref } from "@/lib/site";

const ERRORS: Record<string, string> = {
  quota_exceeded:
    "This month's reveals are spent. People and providers you have already opened stay available — upgrade to open new ones.",
  subscription_inactive: "This organization's subscription is not active, so nothing was opened.",
  reveal_rate_limited:
    "That's faster than new contacts can be opened. Wait a minute and try again — what you have already opened stays available, and nothing was counted.",
  reveals_locked:
    "Opening new contacts is paused for your organization while we review how quickly they were being opened. What you have already opened stays available; write to us to have it reviewed.",
  email_unverified:
    "Confirm your email address first — the link is in the message we sent when you signed up. Nothing was counted.",
  forbidden: "Your role cannot open contact details. Ask an owner or admin on your team.",
  not_found:
    "That person is no longer on file — the list is rebuilt from the federal filings. Nothing was counted.",
  "bad-contact": "That was not a person we could look up, so nothing was opened.",
  signed_out: "Your session expired. Sign in again and nothing will have been counted.",
  failed: "That didn't work, and nothing was counted. Try again.",
};

type Params = Record<string, string | string[] | undefined>;

function one(params: Params, key: string): string {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/** What the last reveal on this page did, in one sentence - or nothing. */
export function RevealNotice({ params, names }: { params: Params; names: Map<string, string> }) {
  const error = one(params, "reveal_error");
  const opened = one(params, "opened");
  const free = one(params, "free");
  const empty = one(params, "empty");
  const who = (id: string) => names.get(id) ?? "That person";

  if (error) {
    return (
      <div className="notice stop" style={{ marginTop: 16 }} role="alert">
        {ERRORS[error] ?? ERRORS.failed}
      </div>
    );
  }
  if (opened) {
    return (
      <div className="notice ok" style={{ marginTop: 16 }} role="status">
        Opened {who(opened)}. That used one reveal; coming back to them this month is free.
      </div>
    );
  }
  if (free) {
    return (
      <div className="notice ok" style={{ marginTop: 16 }} role="status">
        You had already opened {who(free)} this month, so that was free.
      </div>
    );
  }
  if (empty) {
    return (
      <div className="notice warn" style={{ marginTop: 16 }} role="status">
        There is no number we can give out for {who(empty)} — none is on file, or the person has
        asked not to be contacted. Nothing was counted.
      </div>
    );
  }
  return null;
}

/** The number once it is theirs, the Reveal button while it is not, or why there is neither. */
export function ContactCell({
  id,
  hasPhone,
  phone,
  suppressed,
  returnTo,
  spent,
}: {
  id: number;
  hasPhone: boolean;
  phone: string | null;
  suppressed: boolean;
  returnTo: string;
  spent: boolean;
}) {
  if (phone) return <span className="mono">{phone}</span>;
  if (suppressed) return <span className="fine">Asked not to be contacted</span>;
  if (!hasPhone) return <span className="fine">No number on file</span>;
  return (
    <form method="post" action="/api/app/reveal-contact">
      <input type="hidden" name="contact_id" value={id} />
      <input type="hidden" name="return_to" value={returnTo} />
      <button type="submit" className="btn sm" disabled={spent}>
        Reveal
      </button>
    </form>
  );
}

/* ----------------------------------------------------------------------------------
   The opened contact points, as lines.

   Lived in /app/search while that was the only screen that opened one. The signed-in
   provider page opens one too, and the caveats here - that a home address and cell are a
   match rather than a guarantee, that a suppressed value is named and withheld rather than
   quietly dropped, that do-not-call and TCPA are the caller's to check - are statements we
   make about our own data. Two copies of them would eventually say different things.
   ---------------------------------------------------------------------------------- */

const PREMIUM_KINDS = new Set(["home_address", "cell_phone"]);

const KIND_LABELS: Record<string, string> = {
  work_email: "work email",
  personal_email: "personal email",
  practice_phone: "practice phone",
  home_address: "home address",
  cell_phone: "cell phone",
};

/**
 * The vendor's Do-Not-Call flag on a revealed cell phone - the condition the number is sold on.
 * `null` is unknown and is said as unknown: never shown as "not flagged". The flag is the
 * vendor's as of its release, not the live registry, so nothing here may read as "safe to call".
 */
function DoNotCall({ flag }: { flag: boolean | null }) {
  return (
    <>
      {flag === true && <> <span className="tag stop">On the Do Not Call list</span></>}
      {flag === null && <> <span className="tag warn">Do Not Call status unknown</span></>}
      {flag === false && <> <span className="tag">Not flagged</span></>}
      <span className="fine" style={{ display: "block" }}>
        Check against the live registry before calling. Calling rules are your responsibility.
      </span>
    </>
  );
}

export function ContactLines({ opened }: { opened: OpenedContacts }) {
  const { rows, restricted, restrictedReason, withheld } = opened;
  const standard = rows.filter((row) => !PREMIUM_KINDS.has(row.type));
  const premium = rows.filter((row) => PREMIUM_KINDS.has(row.type));
  const premiumRestricted = restricted.some((kind) => PREMIUM_KINDS.has(kind));
  return (
    <>
      {rows.length === 0 ? (
        <span className="fine">Nothing on file for this provider.</span>
      ) : (
        <ul className="contact-list">
          {standard.map((row) => (
            <li key={`${row.type}-${row.value}`}>
              <span className="mono">{row.value}</span>{" "}
              <span className="fine">{KIND_LABELS[row.type] ?? row.type.replace(/_/g, " ")}</span>
              {row.tier && <span className={`tag ${row.tier === "trusted" ? "ok" : "warn"}`}>{row.tier}</span>}
            </li>
          ))}
          {premium.map((row) => (
            <li key={`${row.type}-${row.value}`}>
              <span className="mono">{row.value}</span>{" "}
              <span className="fine">{KIND_LABELS[row.type]}</span>{" "}
              <span className="tag accent">
                {row.tier === "confirmed" ? "confirmed match" : (row.tier ?? "match")}
                {row.confidence !== null ? ` · score ${row.confidence}` : ""}
              </span>
              {row.type === "cell_phone" && <DoNotCall flag={row.do_not_call ?? null} />}
            </li>
          ))}
        </ul>
      )}
      {premium.length > 0 && (
        <p className="fine" style={{ marginTop: 6 }}>
          Home address and cell phone are matched, not guaranteed: Residence Match links this
          provider to the household it believes is theirs, and the score is how sure it is. Phone
          type, do-not-call and TCPA compliance are yours to check before you call or text.
        </p>
      )}
      {withheld.length > 0 && (
        <p className="fine" style={{ marginTop: 6 }}>
          Held back: {withheld.map((kind) => KIND_LABELS[kind] ?? kind).join(", ")} — on our
          suppression list, so we do not hand it over.
        </p>
      )}
      {premiumRestricted && (
        <p className="fine" style={{ marginTop: 6 }}>
          {restrictedReason === "not_enabled" ? (
            <>
              Home address and cell phone are part of your contract but not switched on yet.{" "}
              <Link href={salesHref("Contact plan")}>Talk to us</Link> about when.
            </>
          ) : (
            <>
              Home address and cell phone are available on the Contact plan, under contract —{" "}
              <Link href={salesHref("Contact plan")}>talk to us</Link>.
            </>
          )}
        </p>
      )}
    </>
  );
}

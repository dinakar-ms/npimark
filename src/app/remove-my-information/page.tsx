import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import Turnstile from "@/components/Turnstile";
import { TARGET_DAYS } from "@/content/legal/removal";
import { privacyEmail } from "@/content/legal/version";

export const metadata: Metadata = {
  title: "Remove my information",
  description:
    "Opt out of the sale and sharing of your personal information, ask NPI Mark to delete it, or have your work email, phone, home address and cell phone removed.",
  alternates: { canonical: "/remove-my-information" },
};

/**
 * The public removal form. A plain HTML form posting to /api/privacy/remove, which forwards it to
 * the API and redirects back here with a notice - no client code but Cloudflare's Turnstile.
 *
 * Nothing typed is ever shown back: after a post the form comes back empty, and a refused field
 * is named from a fixed list (`FIELD_HELP`), never repeated from the query string. The only value
 * read from the URL and displayed is a request reference, and only in the
 * RR-2026-A1B2C3D4E5F6 shape the API mints.
 */

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const FIELD_HELP: Record<string, string> = {
  npi: "That NPI doesn't look right - it is ten digits.",
  full_name: "Give your name as it appears in the record (or your NPI, if you are a provider).",
  organization_name: "Give the organization you are listed at.",
  phone_to_remove: "Enter the phone number, with its area code.",
  email_to_remove: "That email address doesn't look right.",
  street_address: "The street address is limited to 200 characters.",
  zip_code: "A ZIP code is five digits, or nine with the +4.",
  contact_email: "Enter an email address we can reply to.",
  remove:
    "Choose which fields to remove. Home address and cell phone are held only for providers.",
  note: "The note is limited to 2,000 characters.",
};

const ERRORS: Record<string, string> = {
  "too-many":
    "That's several requests from this connection in the last hour. Wait an hour and try again - one request can cover your email, phone and home address together.",
  challenge:
    "We couldn't confirm you're a person, so nothing was sent. Complete the check above the button and try again.",
  "challenge-down": "The check that keeps automated requests out isn't answering. Try again in a minute.",
  unavailable: "Something went wrong on our side and nothing was saved. Please try again shortly.",
  failed: "Some of the information needs attention. Please check the form and try again.",
};

function one(value: string | string[] | undefined): string | null {
  return typeof value === "string" ? value : null;
}

export default async function RemovePage({ searchParams }: Props) {
  await connection();
  const params = await searchParams;
  const notice = one(params.notice);
  const error = one(params.error);
  const fields = (one(params.fields) ?? "").split(",").filter((f) => f in FIELD_HELP);
  const ref = one(params.ref);
  const reference = ref && /^RR-\d{4}-[0-9A-F]{6,24}$/.test(ref) ? ref : null;
  const privacy = privacyEmail();

  return (
    <main>
      <section className="wrap remove-layout">
        <div>
          <div className="eyebrow rule">Privacy</div>
          <h1>Remove my information</h1>
          <p className="lede">
            If you are a healthcare professional, or you lead a healthcare organization, you can opt
            out of the sale and sharing of your personal information, ask us to delete it, or have
            particular fields removed.
          </p>
          <p className="fine">
            What each choice means is set out under{" "}
            <Link href="/privacy-choices">Your Privacy Choices</Link>.
          </p>

          {notice === "sent" && (
            <div className="notice ok" role="status" style={{ marginTop: 20 }}>
              <strong>Check your email.</strong> We have sent a confirmation link to the address you
              gave. Your request is reviewed once you follow it - the link works for seven days. If
              it hasn&apos;t arrived in a few minutes, check the spam folder.
            </div>
          )}
          {notice === "received" && (
            <div className="notice ok" role="status" style={{ marginTop: 20 }}>
              <strong>Request received{reference ? ` - reference ${reference}` : ""}.</strong> A
              member of our team will review it and may contact you at the address you gave to
              confirm it is you before acting.
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

          <form className="form" method="post" action="/api/privacy/remove" style={{ marginTop: 24 }}>
            <fieldset className="scopes">
              <legend>What are you asking for?</legend>
              <label>
                <input type="radio" name="request_type" value="opt_out" defaultChecked required />
                <span>
                  Do Not Sell or Share My Personal Information - opt out of the sale and sharing of
                  my personal information
                </span>
              </label>
              {/* NARROWED ON PURPOSE - 2026-09-22. An approved deletion suppresses the record
                  immediately and is recorded as needing erasure; the queue that erases the values
                  from our own copies is being built separately and is not in the product yet, so
                  this option and step four below say erasure follows rather than claiming it has
                  already happened. RESTORE WHEN THE ERASURE QUEUE LANDS: "suppress my record now,
                  and erase my name, address, email, phone and cell phone from your copies", and the
                  present tense in step four. The same sentence was narrowed in /privacy-choices and
                  in section 12 of src/content/legal/privacy.ts. */}
              <label>
                <input type="radio" name="request_type" value="delete" />
                <span>
                  Delete my information - suppress my record now, and erase my name, address, email,
                  phone and cell phone from your copies afterwards
                </span>
              </label>
              <label>
                <input type="radio" name="request_type" value="remove_fields" />
                <span>Remove specific fields only - listed below</span>
              </label>
            </fieldset>

            <fieldset className="scopes">
              <legend>Who is this about?</legend>
              <label>
                <input type="radio" name="subject_type" value="provider" defaultChecked required />
                <span>I am a healthcare provider with an NPI</span>
              </label>
              <label>
                <input type="radio" name="subject_type" value="org_person" />
                <span>I am listed as an owner, executive or leader of a healthcare organization</span>
              </label>
              <label>
                <input type="radio" name="subject_type" value="contact" />
                <span>My email address or phone number appears, whoever it is listed against</span>
              </label>
            </fieldset>

            <p className="fine" style={{ marginTop: 20 }}>
              <strong>How we find you.</strong> Give us what you can. We use these details to match
              your record and for nothing else, and we never add them to the database.
            </p>
            <div className="field">
              <label htmlFor="full_name">Your full name</label>
              <input id="full_name" name="full_name" autoComplete="name" maxLength={200} />
            </div>
            <div className="field">
              <label htmlFor="email_to_remove">Email address</label>
              <input id="email_to_remove" name="email_to_remove" type="email" autoComplete="off" maxLength={320} />
              <span className="fine">Leave blank if it is the same as your contact email below.</span>
            </div>
            <div className="field">
              <label htmlFor="phone_to_remove">Phone number</label>
              <input id="phone_to_remove" name="phone_to_remove" type="tel" autoComplete="off" maxLength={40} />
            </div>
            <div className="field">
              <label htmlFor="street_address">Street address</label>
              <input id="street_address" name="street_address" autoComplete="off" maxLength={200} />
            </div>
            <div className="field">
              <label htmlFor="zip_code">ZIP code</label>
              <input id="zip_code" name="zip_code" inputMode="numeric" autoComplete="off" maxLength={10} placeholder="78701" />
            </div>
            <div className="field">
              <label htmlFor="npi">NPI (optional)</label>
              <input id="npi" name="npi" inputMode="numeric" autoComplete="off" maxLength={12} placeholder="10 digits" />
              <span className="fine">If you are a healthcare provider.</span>
            </div>
            <div className="field">
              <label htmlFor="organization_name">Organization (organization leaders)</label>
              <input id="organization_name" name="organization_name" autoComplete="organization" maxLength={200} />
            </div>

            <fieldset className="scopes">
              <legend>If you chose &quot;remove specific fields&quot;, which ones?</legend>
              <label>
                <input type="checkbox" name="remove" value="email" />
                <span>My work email address</span>
              </label>
              <label>
                <input type="checkbox" name="remove" value="phone" />
                <span>My phone number</span>
              </label>
              <label>
                <input type="checkbox" name="remove" value="home" />
                <span>My home address and cell phone (providers only)</span>
              </label>
              <span className="fine">
                Opting out and deleting always cover the whole record, so these are only read for
                &quot;remove specific fields&quot;.
              </span>
            </fieldset>

            <div className="field">
              <label htmlFor="contact_email">Your contact email</label>
              <input id="contact_email" name="contact_email" type="email" autoComplete="email" maxLength={320} required />
              <span className="fine">
                We send a confirmation link here and write to it about this request. We never use it
                for anything else.
              </span>
            </div>
            <div className="field">
              <label htmlFor="note">Anything we should know (optional)</label>
              <textarea id="note" name="note" maxLength={2000} rows={4} />
            </div>

            <Turnstile action="remove" />
            <button type="submit" className="btn primary lg">
              Send privacy request
            </button>
          </form>
        </div>

        <aside className="panel">
          <h2 style={{ fontSize: "1.15rem" }}>What happens next</h2>
          <ol className="fine" style={{ paddingLeft: 18, display: "grid", gap: 10, marginTop: 12 }}>
            <li>
              We email a confirmation link to the contact address you give. Nothing is reviewed until
              you follow it, so nobody can remove someone else&apos;s listing.
            </li>
            <li>
              A member of our team checks the request against our records. If we can&apos;t match it,
              we will write to you before deciding.
            </li>
            <li>
              Our target is to complete requests within {TARGET_DAYS} days. We will email you the
              outcome.

            </li>
            <li>
              Once removed, the information no longer appears in search, contact reveals, exports,
              list append or the API. We keep a minimal note of what was removed so it stays removed
              when our data is next refreshed.
            </li>
            <li>
              For a deletion, erasing your name, address, email, phone and cell phone from our own
              copies follows as a second step. Until it runs we still hold them, suppressed and
              supplied to nobody, and your request is recorded as awaiting erasure. When it runs, all
              that is kept is a one-way hash of them, so the same details are never loaded again.
            </li>
          </ol>
          <p className="fine" style={{ marginTop: 16 }}>
            If your browser sends Global Privacy Control we already treat that as an opt-out of sale
            and sharing for that browser - see{" "}
            <Link href="/privacy-choices">Your Privacy Choices</Link>.
          </p>
          <p className="fine" style={{ marginTop: 16 }}>
            We can&apos;t recall copies a customer obtained before your request. Read more in our{" "}
            <Link href="/privacy#remove">Privacy Policy</Link>
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

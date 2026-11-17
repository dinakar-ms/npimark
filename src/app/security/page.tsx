import { connection } from "next/server";
import type { Metadata } from "next";
import { draftOf, draftRobots } from "@/lib/draft";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { ChannelNote, DraftNotice, FactParagraph } from "@/components/OwnerNotes";
import { COMPANY, channel, visible } from "@/content/company";
import { siteUrl, socialCard } from "@/lib/site";

/**
 * What a buyer's security review asks, answered from the code.
 *
 * Three rules were applied while writing this, and they are worth keeping when it is edited:
 *
 * 1. Every control described here was read in the backend first. Sessions and two-step sign-in are
 *    `app/security/sessions.py` and `app/security/mfa.py`; key scopes and metering are
 *    `app/models/api_key.py`, `app/security/key_auth.py`, `app/security/api_ratelimit.py` and
 *    `app/api/public_api.py`; auditing is `app/audit.py`; export lineage is `app/lineage/exports.py`
 *    and the trap records are `app/abuse/canaries.py`; pacing and the reveal lock are
 *    `app/security/ratelimit.py` and `app/abuse/velocity.py`; suppression is `app/suppression.py`;
 *    the edge is `infra/Caddyfile.public`. A control we could not find in the code is not on this
 *    page, however good it would look.
 *
 * 2. No thresholds, no windows, no mechanics. A page that publishes the number of attempts, the
 *    length of a window or how a trap record is constructed has written the evasion guide for it.
 *    Effects are public; parameters are not.
 *
 * 3. Describe controls against current backend enforcement, including organization-wide two-step policy.
 *    Where a capability is unavailable or unverified, the page says so. A security page that reads as though nothing is missing is the one nobody
 *    believes.
 */

const SCOPES = [
  { scope: "providers.read", grants: "Search and read providers, organizations and facilities." },
  { scope: "providers.export", grants: "Start an export and download the file it produces." },
  {
    scope: "contacts.reveal",
    grants: "Open the contact details of one provider at a time, metered and logged.",
  },
  { scope: "append.run", grants: "Submit a file to the append tool and collect the result." },
  { scope: "jobs.read", grants: "Read the status and result of jobs this key started." },
  { scope: "usage.read", grants: "Read the organization plan and its month-to-date usage." },
] as const;

const FAQ = [
  {
    q: "Is two-step sign-in available, and can we require it?",
    a: "It is available to every user, using an authenticator app, with single-use recovery codes. An organization admin can require it from the Team page after enabling it on their own account. Members without it must complete setup before using protected workspace features. API keys are not affected by this interactive sign-in policy. Where an account has two-step sign-in on, single sign-on is refused for that account rather than quietly bypassing the second factor.",
  },
  {
    q: "What can somebody do with a stolen API key?",
    a: "Only what the key's scopes allow, only against the organization it belongs to, and only within its pace and monthly quota. A key carries no user identity, so anything that needs a person - changing a password, inviting a user, creating or revoking keys, reading billing - cannot be done with one at all. Keys are shown once and stored only as a hash, so nobody, including us, can read one back. Revoke it and the row stays, with who revoked it and when.",
  },
  {
    q: "Can we get an audit trail of what our team revealed and exported?",
    a: "Every reveal, export, append, sign-in, key creation and key revocation is written to an audit log against your organization, and it is how we trace misuse of the data. Be clear about the limit, though: there is no endpoint that returns the log to a customer today, so it is evidence we hold rather than a report you can run.",
  },
  {
    q: "How do you know an export file came from us?",
    a: "Every row of a provider export carries a reference that resolves to the export that produced it, the file name carries the same reference, and the file itself is hashed and recorded against your organization, the user who ran it and the data it read. Provider export files also carry a small number of synthetic records unique to the organization that exported them - they are not real people, and if a file appears somewhere it should not, they say which export it came from.",
  },
  {
    q: "Is there any patient data in the platform?",
    a: "No: no patient-level record in any form, identified, de-identified or aggregated, and no clinical note, diagnosis or outcome. Where the platform holds published Medicare utilization statistics they are provider-level figures as the federal publisher released them, including that publisher's own suppression of small counts, which we preserve rather than filling in with a zero.",
  },
  {
    q: "What happens to data about a person who asks to be removed?",
    a: "A suppression, applied everywhere - search, pages, counts, exports, append and the API - and it holds through the weekly refresh. The record is not deleted, because a deleted record is one the next refresh recreates. Suppression is global rather than per-customer: an opt-out one team honors and another does not is not an opt-out. Customers cannot add or lift a suppression.",
  },
] as const;

export const metadata: Metadata = {
  // Not indexed while any fact below is still a question: the page prints the question
  // itself, and an internal note is not something to leave in a search index. It
  // re-indexes itself when the last one is answered. See lib/draft.ts.
  ...draftRobots("/security"),
  title: "Security and trust",
  description:
    "How sign-in, two-step verification, API key scopes, quotas, auditing, export fingerprinting and suppression work, and how to report a vulnerability.",
  alternates: { canonical: "/security" },
  openGraph: socialCard(
    "/security",
    "Security and trust",
    "Sign-in, API key scopes, auditing, export fingerprinting, suppression, and how to report a vulnerability.",
  ),
};

export default async function SecurityPage() {
  // Read at request time: the address a report goes to comes from the environment, so it can be
  // set without a deploy. Nothing about the visitor is read.
  await connection();
  const security = channel("security");

  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebPage",
              "@id": siteUrl("/security#page"),
              name: "Security and trust",
              url: siteUrl("/security"),
              description: metadata.description as string,
            },
            {
              "@type": "FAQPage",
              mainEntity: FAQ.map(({ q, a }) => ({
                "@type": "Question",
                name: q,
                acceptedAnswer: { "@type": "Answer", text: a },
              })),
            },
          ],
        }}
      />

      <section className="section" style={{ paddingTop: 40 }}>
        <div className="wrap">
          <DraftNotice {...draftOf("/security")} />
          <div className="section-head">
            <div className="eyebrow rule">Security and trust</div>
            <h1 style={{ fontSize: "clamp(1.8rem, 3.8vw, 2.7rem)" }}>
              What is actually implemented, and what is not.
            </h1>
            <p className="lede">
              This page answers the questions a security review sends us, and it is written from the
              code rather than from a template. Where a control exists it is described by what it
              does; where one does not exist it is missing from this page, and where the honest
              answer is uncomfortable it is on the page anyway. Parameters are deliberately absent:
              how many attempts, over how long, and how anything is constructed are not published,
              because publishing them would be publishing the way round them.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow rule">Accounts and sign-in</div>
            <h2>A session is a record we can end, not a token you carry.</h2>
          </div>
          <div className="grid">
            <div className="card feature">
              <h3>Sessions are server-side and revocable</h3>
              <p>
                Every session is a row in our database, and the cookie holds a random token of which
                only a hash is stored - a stolen database does not yield usable sessions. The cookie
                is HTTP-only, same-site, and marked secure outside local development. A session
                expires both on idle and at an absolute age, checked every time it is used, and a
                session belonging to a disabled user stops working immediately.
              </p>
            </div>
            <div className="card feature">
              <h3>Signing out everywhere is one action</h3>
              <p>
                A user can end every other session on their account from the application. It also
                happens on its own where it matters: changing a password ends the other sessions,
                turning on two-step sign-in ends them, and a password reset ends all of them
                including the one that asked. An administrator can end a colleague&apos;s sessions,
                and that is written to the audit log.
              </p>
            </div>
            <div className="card feature">
              <h3>Passwords are hashed with Argon2id</h3>
              <p>
                Stored as an Argon2id hash and re-hashed transparently when the parameters move on.
                Sign-in does the same work whether or not the address exists, so the form cannot be
                used to find out who has an account. Every state-changing request also carries a
                CSRF token, compared in constant time.
              </p>
            </div>
            <div className="card feature">
              <h3>Two-step sign-in, honestly described</h3>
              <p>
                Available to every user with an authenticator app. The shared secret is encrypted at
                rest, a code is accepted once and a replayed code is refused, comparisons are
                constant-time, and recovery codes are single-use and stored only as hashes. It is a
                per-user setup that an organization admin can require from the Team page after
                enabling it on their own account. Members must complete setup before accessing
                protected workspace features. This sign-in policy does not change API-key access. Where an account has it on, single sign-on is
                refused for that account rather than bypassing the code.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow rule">API keys</div>
            <h2>A key reaches one organization, through the scopes you gave it.</h2>
            <p className="lede">
              A key is shown once, at creation, and only its hash is stored - there is no way to
              read one back, including for us. It carries an organization and no user identity, so
              anything that needs a person is closed to it by design rather than by a list of
              exceptions: passwords, invitations, billing, and creating or revoking keys cannot be
              done with a key at all. A key can never be given a scope the person who created it did
              not hold, and asking for one is refused rather than quietly narrowed.
            </p>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Scope</th>
                  <th>What it grants</th>
                </tr>
              </thead>
              <tbody>
                {SCOPES.map((row) => (
                  <tr key={row.scope}>
                    <td>
                      <b>{row.scope}</b>
                    </td>
                    <td className="fine">{row.grants}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid two" style={{ alignItems: "start", marginTop: 26 }}>
            <div className="panel">
              <h3>Pace and quota, reported rather than hidden</h3>
              <p className="fine">
                Calls are paced per minute and counted against a monthly quota, and both are in the
                response headers of every call so your own code can see where it stands. A call
                refused for pace or quota is not charged against the monthly quota. It does count
                against the per-minute window, so ignoring a refusal does not earn a fresh
                allowance. The per-minute count is shared across our servers rather than held in
                one process, so the limit is the limit.
              </p>
            </div>
            <div className="panel">
              <h3>Revoking, expiring, and what rotation means here</h3>
              <p className="fine">
                A key can carry an expiry date and can be revoked at any time; the row is never
                deleted, so who revoked what and when has an answer. Each key records when and from
                where it was last used, so &ldquo;is anything still calling with this&rdquo; can be
                answered before you revoke it. There is no rotate-in-place operation: rotation is
                creating the new key, moving your callers, then revoking the old one. Every refused
                call answers the same way whatever was wrong with the key, so a probe learns
                nothing from the difference.
              </p>
            </div>
          </div>
          <p className="fine" style={{ marginTop: 16 }}>
            Scopes for other data domains exist in the platform for our own operations and are
            outside what any customer account can hold, so a customer key cannot be given one.
            The API reference is at <Link href="/docs/api">/docs/api</Link>.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow rule">Auditing and exports</div>
            <h2>Every reveal, export and append is recorded against the organization.</h2>
          </div>
          <div className="grid">
            <div className="card feature">
              <h3>What the log holds</h3>
              <p>
                Contact reveals, exports and their downloads, append runs, sign-ins and failed
                sign-ins, single sign-on, two-step changes, key creation and revocation, user
                invitations and changes, suppression and removal-request decisions, and billing
                changes. Each entry names the organization it belongs to. The action must be one the
                code knows, and an entry carrying anything that looks like a password or a token is
                refused rather than written - a log is not a second place secrets live.
              </p>
            </div>
            <div className="card feature">
              <h3>What the log is not, yet</h3>
              <p>
                It is internal. There is no endpoint that hands a customer their own audit log
                today, so treat it as evidence we can produce rather than a report you can run. Its
                retention is being settled with counsel and will be stated in the{" "}
                <Link href="/privacy">Privacy Policy</Link> rather than guessed at here.
              </p>
            </div>
            <div className="card feature">
              <h3>An export is traceable to the export</h3>
              <p>
                Each row of a provider export carries a reference that resolves to the export that
                produced it, and the file name carries the same reference so a file is recognisable
                even with the column removed. The file is hashed and recorded against the
                organization, the user, the job and the data loads it read, and a file of ours
                coming back to us - in an append, for instance - is recognized as one of ours.
              </p>
            </div>
            <div className="card feature">
              <h3>Provider exports are fingerprinted to you</h3>
              <p>
                A provider export carries a small number of synthetic records unique to the
                organization that exported it. They are not real people and cannot collide with a
                real provider or a real phone line, they are not charged against your allowance, and
                every placement is recorded internally. If a file turns up where it should not be,
                they say whose export it was. How they are made and where they sit is not published,
                for the obvious reason.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow rule">Anti-scraping and abuse</div>
            <h2>The controls that make bulk extraction fail rather than succeed slowly.</h2>
            <p className="lede">
              Described by effect only. The thresholds, the windows and the order things happen in
              are not published anywhere on this site.
            </p>
          </div>
          <div className="grid two">
            <div className="card feature">
              <h3>Repeated failures stop being answered</h3>
              <p>
                Enough failed sign-ins and the attempts stop being answered. Wrong two-step codes
                stop being answered for that account however many places they arrive from, so
                spreading the attempt around does not walk past the control. Sign-ups, password
                resets, single sign-on callbacks and public removal requests are paced too, and the
                sign-up and password-reset forms can require a human check. These are pauses that
                lift themselves rather than permanent locks.
              </p>
            </div>
            <div className="card feature">
              <h3>Contact reveals are paced, and can be suspended</h3>
              <p>
                New reveals are paced per organization and per actor, whether the actor is a person
                or a key, so one API key cannot outrun what a browser could do. An organization that
                keeps hitting that pace, or opens an unusual volume of new contacts in a day, has
                new reveals suspended: records already opened still read back, nothing new opens,
                and only we can clear it - after looking at what happened. The lock, its reason and
                the clearing are all in the audit log.
              </p>
            </div>
            <div className="card feature">
              <h3>Contact details are never in bulk anywhere</h3>
              <p>
                No public page carries a work email, a direct phone, a home address or a cell phone,
                and no page names a person who does not hold an NPI - leadership is counted by role
                in public and named only for signed-in customers. A contact is opened one record at
                a time, against an allowance, and written to the log. There is no endpoint, and no
                plan, that hands over a file of contact details.
              </p>
            </div>
            <div className="card feature">
              <h3>The public surface is deliberately small</h3>
              <p>
                On the public API host, only the versioned API, its schema, a health check and one
                signature-checked billing webhook are served. Everything else answers 404 rather
                than redirecting or proxying, so the administrative side of the platform is not
                reachable by guessing a URL. The internal application is not published to the
                internet at all. Client addresses are read only from a proxy we trust, so a
                forwarded header cannot be forged to defeat the pacing above.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow rule">Suppression</div>
            <h2>One definition of suppressed, used by everything that reads the data.</h2>
          </div>
          <div className="grid">
            <div className="card feature">
              <h3>One rule, two languages, no drift</h3>
              <p>
                Suppression is defined once and compiled into both the database queries and the
                application code, so search, a record page, the published counts, exports, append
                and the API cannot disagree about whether something is suppressed. Values are
                normalized on both sides, so a phone number written one way on a request matches the
                same number written another way on a record.
              </p>
            </div>
            <div className="card feature">
              <h3>Global, and at the grain the person asked for</h3>
              <p>
                A suppression can cover a value wherever it appears, one field of one subject, or a
                subject entirely. It applies to every customer, because an opt-out one team honors
                and another does not is not an opt-out, and it takes effect on the next request
                rather than when a cache expires. Customers cannot add or lift one.
              </p>
            </div>
            <div className="card feature">
              <h3>Never a deletion</h3>
              <p>
                Records are rebuilt from filings regularly, so a removal has to survive the rebuild:
                the mark is held against the identifier rather than the row. Lifting a suppression
                keeps the record of it too, so &ldquo;why did this start appearing again&rdquo; has
                an answer. What each kind of request does is set out in{" "}
                <Link href="/privacy-choices">your privacy choices</Link>, and the form is{" "}
                <Link href="/remove-my-information">remove my information</Link>.
              </p>
            </div>
            <div className="card feature">
              <h3>A public form that does not write to the database</h3>
              <p>
                The removal form is open and anonymous, so it confirms the request by email and a
                person reviews it before anything is suppressed. A form that acted on submission
                would let anyone suppress somebody else&apos;s listing.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow rule">What is held</div>
            <h2>The data that is not here is the answer to half the review.</h2>
          </div>
          <div className="grid two">
            <div className="card feature">
              <h3>No patient or clinical data</h3>
              <p>
                There is no patient-level record in the platform in any form - not identified, not
                de-identified, not aggregated - and no clinical note, diagnosis or outcome. Published
                Medicare utilization statistics are held as provider-level figures exactly as the
                federal publisher released them, including that publisher&apos;s suppression of
                small counts, which is preserved rather than filled in.
              </p>
            </div>
            <div className="card feature">
              <h3>Home address and cell phone are gated three ways</h3>
              <p>
                Provider-matched home address and cell phone require a platform setting, a plan that
                carries the contract flag, and a per-reveal charge against the allowance - all
                three, not any one. A payment event can never move an organization onto a
                contract-only plan, so it cannot be bought online. Only a confirmed match is ever
                sellable: a probable one reads as nothing on file, so you are not charged for a
                guess. Where the gate refuses, it says which gate refused.
              </p>
            </div>
            <div className="card feature">
              <h3>Other data domains are not reachable from a customer account</h3>
              <p>
                The platform serves our own operations as well as this product, and the permissions
                for those other domains sit outside what any customer account can hold - not behind a
                plan, outside the ceiling entirely. A customer account cannot be configured into
                them, and no customer API key can carry their scopes.
              </p>
            </div>
            <div className="card feature">
              <h3>No advertising or analytics scripts</h3>
              <p>
                This site loads no advertising, analytics or session-recording script. That is not a
                promise in a policy: the names of the common ones are in a check that runs on every
                lint, so a pull request that added one would fail. The one third party a form loads
                is the human check, and the <Link href="/privacy">Privacy Policy</Link> names it.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow rule">Transport and secrets</div>
            <h2>What the edge enforces, and what is encrypted.</h2>
          </div>
          <div className="grid two">
            <div className="panel">
              <h3>At the edge</h3>
              <p className="fine">
                TLS with automatically renewed certificates, HTTP Strict Transport Security including
                subdomains, and a content security policy that permits no inline script - every page
                is rendered on the server, so none is needed. Framing is denied, content-type
                sniffing is off, the referrer policy is strict on cross-origin, camera, microphone
                and location are denied, and the server banner is stripped. Form submissions are
                restricted to us and the payment provider.
              </p>
            </div>
            <div className="panel">
              <h3>How secrets are stored</h3>
              <p className="fine">
                Passwords and API key secrets are Argon2 hashes. Session, CSRF, invitation, password
                reset, email verification and recovery-code tokens are stored only as hashes.
                Two-step secrets and organization settings are held with authenticated encryption.
                Backups are encrypted before they leave the server. We are not going to claim
                database or full-disk encryption at rest: what the hosting layer does underneath is
                not something we can evidence to you, so we do not put it on this page.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap narrow">
          <div className="section-head">
            <div className="eyebrow rule">Reporting a vulnerability</div>
            <h2>Tell us, and we will confirm we have it.</h2>
          </div>
          <div className="prose">
            <p>
              Send what you found and enough to reproduce it. In scope: this site, the customer API,
              and the application behind sign-in. Please do not test against other people&apos;s
              accounts or records, do not run load or denial-of-service tests, and take no more data
              than the minimum that demonstrates the problem - if a single record proves it, one
              record is the right amount. Tell us before you tell anybody else, and we will tell you
              when it is fixed.
            </p>
            <p>
              {security.address !== null ? (
                <a className="btn primary" href={security.href}>
                  Report to {security.address}
                </a>
              ) : (
                <Link className="btn primary" href="/contact">
                  Contact routes
                </Link>
              )}
            </p>
            {security.address === null && (
              <p className="fine">
                <ChannelNote of={security} />
              </p>
            )}
            {[COMPANY.securityAssurance, COMPANY.securityRewards].some(visible) && (
              <>
                <h3>Assurance, and whether a report earns anything</h3>
                <FactParagraph of={COMPANY.securityAssurance} />
                <FactParagraph of={COMPANY.securityRewards} />
              </>
            )}
            <p className="fine">
              If the problem is that your own details are in the database, that is not a security
              report and you do not need to write to anybody: use{" "}
              <Link href="/remove-my-information">remove my information</Link>. If a login or an API
              key has been compromised, tell support and revoke the key - the{" "}
              <Link href="/contact">contact page</Link> has the route.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap narrow">
          <div className="section-head">
            <div className="eyebrow rule">Questions</div>
            <h2>What security reviews ask us.</h2>
          </div>
          <div className="faq">
            {FAQ.map(({ q, a }) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
          <div className="cta" style={{ marginTop: 32 }}>
            <h2>The rest of the review is the data itself.</h2>
            <p className="lede">
              What a record holds, how current each part of it is and what the platform does not hold
              are on the data page. What a customer may and may not do with it is in the terms.
            </p>
            <div className="actions">
              <Link className="btn primary lg" href="/data">
                What is in the data
              </Link>
              <Link className="btn lg" href="/terms">
                Terms of Service
              </Link>
              <Link className="btn lg" href="/privacy">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

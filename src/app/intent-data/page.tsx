import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { siteUrl, socialCard } from "@/lib/site";

/**
 * What we sell instead of an intent score.
 *
 * The page exists because "intent data" is the term buyers search for, and because the honest
 * answer to it is a differentiator rather than an apology: we sell dated, checkable changes, and
 * we say plainly that we do not sell a propensity number. Every claim here matches a rule in
 * `app/jobs/trigger_events.py` - including the qualifications, because a marketing page that
 * overstates what a rule does is a page the first technical buyer will disprove.
 *
 * There is no count of events on this page and there should not be one. The platform publishes no
 * public total of detected events, so any figure here would be a number typed once and left to
 * drift - the thing that had to be taken off `/ehr-data`. What the page does say is how many
 * kinds of event there are, and that is read from the table below rather than written twice.
 */

export const revalidate = 86_400;

const EVENTS = [
  {
    type: "New provider",
    signal: "A clinician was newly issued an identifier.",
    why: "Somebody setting up. Every vendor decision is open, and nobody has been chosen yet.",
    rule: "An active identifier first issued inside the lookback window.",
  },
  {
    type: "Hiring",
    signal: "An organization gained several newly credentialed clinicians at once.",
    why: "Capacity is growing, budget is moving, and the people arriving need equipping.",
    rule: "Three or more newly credentialed clinicians tied to one active organization, either by a practice address that exactly one organization files, or by a billing-group reassignment matched by name within the clinician's own state. The event reports what was seen — how many, and how each was tied — because a new credential is not proof of a hire.",
  },
  {
    type: "Deactivated",
    signal: "An identifier was retired.",
    why: "Stop paying to reach somebody who is no longer practicing. This one saves your customer money, which is its own kind of sale.",
    rule: "Keyed by identifier and date, so somebody deactivated, reactivated and deactivated again is two events. A later reactivation does not erase the first: it happened.",
  },
  {
    type: "Practice moved",
    signal: "A clinician's practice address changed to a different city or ZIP.",
    why: "The strongest buying window there is: re-stocking, re-contracting, re-listing, new referral patterns.",
    rule: "A change of city or ZIP, dated by the record's own update date. A retyped suite number at the same address is not a move and is left out.",
  },
  {
    type: "Ownership change",
    signal: "A facility's owners changed.",
    why: "New owners re-open vendor decisions, often across the whole estate at once.",
    rule: "Captured at the moment of the change, because the previous owners are overwritten by the next refresh and cannot be recovered afterwards.",
  },
  {
    type: "Rating change",
    signal: "A facility's published quality rating moved.",
    why: "A facility under pressure is a facility looking for help — and one that improved is worth a different conversation.",
    rule: "Written in the same transaction as the overwrite, for the same reason as ownership: the old value is gone a second later.",
  },
] as const;

const FAQ = [
  {
    q: "Is this intent data?",
    a: "It is event-based intent: dated, checkable changes that give you a reason to call. It is not behavioral intent — we do not track who read what article, and we do not sell a propensity score.",
  },
  {
    q: "Why not sell a buying-propensity score?",
    a: "Because a score cannot be checked. A number we assembled would be a claim a buyer could test and find hollow, and the first technical buyer would test it. A change with a date behind it is either true or it is not, and you can hold us to it.",
  },
  {
    q: "How fresh are the events?",
    a: "Detection runs against a rolling window, so what you see is a reason to call now rather than a year-old change nobody cares about. Each event carries both the date the change happened and the date we noticed it.",
  },
  {
    q: "Will the same event appear twice?",
    a: "No. Every event carries a key derived from the fact itself, so re-running detection — or retrying it after a failure — adds nothing that is already there. Events are never edited or deleted.",
  },
  {
    q: "Can I get events for my own list?",
    a: "Yes. Upload the identifiers you care about and get their events back against your own rows, or call the API for one provider, organization or facility and read its history.",
  },
  {
    q: "Can I be told when something changes?",
    a: "Yes. Standing alerts — tell me when a cardiologist is newly credentialed in my territory — run from a saved search and send a digest, and every plan includes some; how many an organization may keep is on the pricing page. You can also poll the API or pull a dated feed instead.",
  },
] as const;

export const metadata: Metadata = {
  title: "Intent data",
  description:
    "Dated, checkable changes that give you a reason to call: new credentials, retirements, practice moves, ownership and rating changes. Never a propensity score.",
  alternates: { canonical: "/intent-data" },
  openGraph: socialCard(
    "/intent-data",
    "Intent data",
    "Dated, checkable changes that give you a reason to call. Never a propensity score.",
  ),
};

export default function IntentDataPage() {
  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebPage",
              "@id": siteUrl("/intent-data#page"),
              name: "Intent data",
              url: siteUrl("/intent-data"),
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

      {/* `short`: this hero ends at a row of two buttons. The full bottom padding is there to
          give a block room - the panels on the home page, the figure strip on /data - and under a
          button row it was 92 points of empty colour field. */}
      <section className="hero short">
        <div className="wrap">
          <span className="eyebrow">
            <span className="dot" aria-hidden="true" />
            {EVENTS.length} event types · every one dated and checkable
          </span>
          <h1>We sell facts with dates on them, not a score.</h1>
          <p className="lede">
            Most &ldquo;intent data&rdquo; is a number somebody assembled from behavior you
            cannot see, about people you cannot name. Ours is the opposite: a clinician was newly
            credentialed last month, an organization took on four at once, an identifier was
            retired. Each one is a reason to call, each has a date, and each can be checked.
          </p>
          <div className="actions" style={{ marginTop: 22 }}>
            <Link className="btn primary lg" href="/sign-up">
              Get started
            </Link>
            <Link className="btn lg" href="/docs/api">
              See the API
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow rule">What we detect</div>
            <h2>The changes worth a phone call.</h2>
            <p className="lede">
              The exact rule is published beside each one. A signal whose rule you cannot read is
              a signal you cannot argue with when it is wrong.
            </p>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Why it matters</th>
                  <th>The rule</th>
                </tr>
              </thead>
              <tbody>
                {EVENTS.map((e) => (
                  <tr key={e.type}>
                    <td>
                      <b>{e.type}</b>
                      <span className="fine" style={{ display: "block", marginTop: 4 }}>
                        {e.signal}
                      </span>
                    </td>
                    <td className="fine">{e.why}</td>
                    <td className="fine">{e.rule}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow rule">Why this and not a score</div>
            <h2>A number you cannot check is a number you cannot sell twice.</h2>
          </div>
          <div className="grid">
            <div className="card feature">
              <h3>Checkable</h3>
              <p>
                Every event names what changed and when. If we say a practice moved in March, you
                can look at the record and see that it did. Nobody has ever been able to do that
                with a surge score.
              </p>
            </div>
            <div className="card feature">
              <h3>Qualified, not inflated</h3>
              <p>
                A hiring event says how many clinicians were seen and how each was tied to the
                organization, because several new credentials at one address is evidence, not
                proof. We would rather be trusted on six events than doubted on sixty.
              </p>
            </div>
            <div className="card feature">
              <h3>Nothing is ever rewritten</h3>
              <p>
                Events are append-only and de-duplicated by the fact itself, so detection can be
                re-run safely and a later reversal never erases what happened. Your campaign
                history stays explainable a year from now.
              </p>
            </div>
            <div className="card feature">
              <h3>Caught before it vanishes</h3>
              <p>
                An old address, a previous owner and a former rating are all overwritten by the
                next refresh. They are written down at the moment they change, because a month
                without that is a month of history nobody can ever recover.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap narrow">
          <div className="section-head">
            <div className="eyebrow rule">Questions</div>
            <h2>Asked by everyone who has been sold intent before.</h2>
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
            <h2>Put a reason to call in front of your team.</h2>
            <p className="lede">
              Search the records free. Sign in to pull events for your own list, or read them
              through the API.
            </p>
            <div className="actions" style={{ marginTop: 16 }}>
              <Link className="btn primary lg" href="/sign-up">
                Get started
              </Link>
              <Link className="btn lg" href="/physicians">
                Browse physicians
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

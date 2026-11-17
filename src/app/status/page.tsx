import type { Metadata } from "next";
import Link from "next/link";
import { channel } from "@/content/company";
import { STATE_WORDS, momentInUtc, platformStatus } from "@/lib/status";
import { socialCard } from "@/lib/site";

/**
 * Somewhere to look when the platform is slow, instead of emailing the owner and waiting.
 *
 * Three decisions carry this page.
 *
 * 1. **It does not depend on the thing it reports on in order to load.** `platformStatus()` never
 *    throws and never waits more than a couple of seconds, so this component always renders: with
 *    an answer, or with "we could not get an answer", which during an outage is the true thing to
 *    say. The site and the API are separate upstreams in `infra/Caddyfile.public`, so the API
 *    container, the worker and Postgres can each be down with this page still served. What that
 *    does not survive is the site, the host or the edge being gone - and then nobody loads this
 *    page at all, so the page says so and prints a mailbox that does not run on our hardware.
 *    Never cached: a cached "operating normally" served through an outage is the one unforgivable
 *    thing a status page can do, which is why `dynamic` is forced rather than left to revalidate.
 *
 * 2. **It is public, so it says as little as it can while still being useful.** Everything printed
 *    here comes from `/api/status`, which is already reduced to five words - the reduction is in
 *    `app/api/public_status.py`, in the process that holds the facts, not in this file, so no edit
 *    here can print a field a visitor may not read. There is no component name, no count, no
 *    threshold, no version, no note about which check failed, and nothing about any organisation.
 *    "Exports and appends: degraded" is what a customer needs; which process is down is what
 *    somebody probing us needs.
 *
 * 3. **No uptime percentage.** `monitor_checks` holds each check's current state and when that
 *    state began - state, not a series of events - so no window's percentage is computable from
 *    what we keep. A 99.9% on the most-read page we have, derived from nothing, would be a lie
 *    told at scale. The page publishes the two timestamps the records actually support and says
 *    plainly why there is no figure.
 */

export const dynamic = "force-dynamic";

const TITLE = "Platform status";
const DESCRIPTION =
  "Whether search, contact reveals, exports and the API are working right now, when we last " +
  "checked, and what to do if something is wrong.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/status" },
  openGraph: socialCard("/status", TITLE, DESCRIPTION),
};

/** The lead sentence for each overall state, including the one where we cannot say. */
const SUMMARY: Record<string, { notice: string; line: string }> = {
  operating: {
    notice: "notice ok",
    line: "Everything below is operating normally.",
  },
  degraded: {
    notice: "notice warn",
    line: "Something below is degraded. It is working, but not as it should be.",
  },
  down: {
    notice: "notice stop",
    line: "Something below is not working. We are on it.",
  },
  unknown: {
    notice: "notice",
    line:
      "We cannot confirm the state of everything below right now, so nothing here should be " +
      "read as an assurance.",
  },
};

export default async function StatusPage() {
  const status = await platformStatus();
  const support = channel("support");
  const summary = SUMMARY[status?.state ?? "unknown"];
  const checked = momentInUtc(status?.checked_at);

  return (
    <main>
      <section className="section" style={{ paddingTop: 40 }}>
        <div className="wrap narrow">
          <div className="section-head">
            <div className="eyebrow rule">Status</div>
            <h1 style={{ fontSize: "clamp(1.8rem, 3.8vw, 2.7rem)" }}>
              Whether the platform is working, right now.
            </h1>
            <p className="lede">
              The handful of things you actually do with NPI Mark, and whether each of them is
              working. Check here
              before writing to us &mdash; if something is degraded or down, it is on this page, and
              you do not have to wait for a reply to find out.
            </p>
          </div>

          {status === null ? (
            /* The state this page exists for. Note what it does *not* claim: not that the platform
               is down, only that we could not get an answer from here - which is itself worth
               knowing, and is as much as we honestly have. */
            <div className="notice stop" role="status">
              <b>We could not get an answer from the platform just now.</b> That usually means it is
              not responding, so searches, reveals and exports are likely to be failing too. We are
              not able to say more than that from this page. Nothing below is being reported, and no
              row on it should be read as working.
            </div>
          ) : (
            <div className={summary.notice} role="status">
              <b>{summary.line}</b>
              {checked ? ` Last checked ${checked}.` : " We have not checked yet."}
            </div>
          )}

          {status !== null && (
            <>
              <h2 style={{ marginTop: 34 }}>Right now</h2>
              {/* A list rather than a table: five rows of a name, a chip and two sentences fit in
                  a 320px column without a horizontal scrollbar, and a table of the same content
                  does not. Layout only - every colour and every type size below is the design
                  system's, through `.panel`, `.fine` and `.tag`. */}
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {status.services.map((service) => {
                  const words = STATE_WORDS[service.state];
                  const since = momentInUtc(service.since);
                  const wasWell = momentInUtc(service.last_operating_at);
                  return (
                    <li className="panel" key={service.key}>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 10,
                        }}
                      >
                        <h3 style={{ fontSize: "1.05rem", margin: 0 }}>{service.name}</h3>
                        <span className={words.tag}>{words.label}</span>
                      </div>
                      <p className="fine" style={{ marginTop: 8 }}>
                        {service.what}
                      </p>
                      {/* Only what the records actually hold. A row with nothing to report says
                          nothing rather than filling the space. */}
                      {since && (
                        <p className="fine" style={{ marginTop: 6 }}>
                          {service.state === "operating"
                            ? `Operating normally since ${since}.`
                            : service.state === "unknown"
                              ? `Last confirmed ${since}.`
                              : `In this state since ${since}.`}
                          {wasWell ? ` Last operating normally ${wasWell}.` : ""}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          <h2 style={{ marginTop: 40 }}>How to read this page</h2>
          <div className="prose">
            <p>
              Each row is one thing you do, not one piece of our machinery, and it says one of four
              things. <b>Operating normally</b> means it is working. <b>Degraded</b> means it is
              working but not as it should &mdash; slower, or with something behind it unwell.{" "}
              <b>Not working</b> means it is failing now. <b>Not confirmed</b> means our own
              monitoring has not reported recently enough for us to stand behind an answer, and it
              is deliberately not the same as &ldquo;fine&rdquo;: a status page that served its last
              cheerful reading through an outage would be worth nothing.
            </p>
            <p>
              The platform checks itself continuously and this page reads the result of the most
              recent check, which is what the time stamps are. They are given to the minute and in
              UTC, so that the page has one clock however far away you are reading it.
            </p>
            <h3>There is no uptime percentage here, on purpose</h3>
            <p>
              We keep the current state of each check and when that state began. We do not keep a
              history we could honestly compute a monthly or yearly percentage from, so we do not
              print one. A figure on this page that came from nowhere would undo the only thing the
              page is for. What we can tell you truthfully is the state of each row now, how long it
              has been that way, and when it was last working &mdash; and that is what is above.
            </p>
            <h3>Why some of what we know is not published</h3>
            <p>
              This page is open to everybody, including whoever is trying to break in. So it names
              what a customer needs to know and not the parts inside: not which component is
              unwell, not how much of anything is left, not how many of anything failed, and nothing
              about any customer&rsquo;s account or organization. If you are a customer and you need
              more detail than this for something specific, write to support and we will tell you
              what we can.
            </p>
          </div>

          <h2 style={{ marginTop: 40 }}>If something is wrong</h2>
          <div className="prose">
            <p>
              If a row above is degraded or down, we already know and are working on it; you do not
              need to report it. It is worth writing to us when what you are seeing is not on this
              page &mdash; a search returning the wrong thing, one export that failed while the row
              above says exports are fine, or a job that has been queued far longer than usual. Say
              what you did and, where there is one, the identifier of the job: every export and
              append keeps one, and it is what lets us find your run rather than guess at it.
            </p>
            <p className="fine">
              If this page itself will not load, we are unreachable in a way no page of ours can
              describe. {support.address ? (
                <>
                  Write to <a href={support.href}>{support.address}</a>, which does not run on the
                  same machine as the site.
                </>
              ) : (
                <>
                  The <Link href="/contact">contact page</Link> lists every route to us, and the
                  help pages are the fastest answer to most questions.
                </>
              )}
            </p>
          </div>

          <div className="actions" style={{ marginTop: 26 }}>
            <a className="btn primary lg" href={support.href}>
              {support.address ? "Write to support" : "Read the help pages"}
            </a>
            <Link className="btn lg" href="/help">
              Help and FAQ
            </Link>
            <Link className="btn lg" href="/contact">
              Other ways to reach us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

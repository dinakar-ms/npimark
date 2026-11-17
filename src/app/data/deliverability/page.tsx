import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { type Run, margin, measuredOn, percent, tierLabel } from "@/lib/deliverability";
import { deliverability } from "@/lib/deliverabilityApi";
import { siteUrl, socialCard } from "@/lib/site";

/**
 * "How accurate is your data?" - answered with a measured number and the method that produced it.
 *
 * Why this page exists
 * --------------------
 * It is the question every prospect asks, and until this page there was no answer to it. What the
 * rest of `/data` gives them is the data described by the people who assembled it: trust tiers,
 * confirmed dates, coverage counts. All true, all useful, and all of it our own reasoning about our
 * own file. None of it is a measurement.
 *
 * Nobody else in this market publishes one either. The large vendors answer with an audit they
 * commissioned and the small ones answer with an adjective, which is precisely why publishing ours
 * is worth more than having a slightly better rate and keeping quiet about it. A figure with a
 * sample size, a date and a method beside it can be checked; that is the whole proposition, and it
 * is the same proposition as the export references, the published suppression rules and
 * `/test-your-list`.
 *
 * Its own URL rather than a section of `/data`, for three reasons: it is the page a sales reply
 * links to and a buyer forwards, so it needs an address of its own; the figure it carries is a
 * series rather than a fact, and a series needs room to accumulate; and `/data` is already long
 * enough that a reader looking for this would have to be told where to scroll.
 *
 * Four rules, which matter more here than anywhere else on the site
 * ----------------------------------------------------------------
 * 1. **No number that was not measured.** Every figure is read live from the platform. Before the
 *    first run the page says so in words - it does not render an empty table, it does not show a
 *    zero, and it does not reach for "industry-leading". An unreachable API reads the same way as
 *    an unmeasured rate, deliberately: both are honestly "nothing published", and a placeholder
 *    would be neither.
 * 2. **If the honest answer is 91%, the page says 91%.** There is no rounding in a flattering
 *    direction and no arithmetic that quietly excludes the addresses that went badly.
 * 3. **No supplier is named.** Which service performs the checks is a competitor's question. The
 *    API does not return it and this page could not print it if it wanted to.
 * 4. **What the number does not mean is on the page, at full size.** A deliverable address is not a
 *    correct one. That sentence is what makes the rest of the page credible, and it comes from the
 *    platform (`app.deliverability.LIMITS`) rather than being written twice.
 */

export const metadata: Metadata = {
  title: "How accurate is the data? The measured bounce rate",
  description:
    "We sample our email library at random, verify it, and publish the deliverable rate per trust tier with the sample size, the date, the margin of error and the method.",
  alternates: { canonical: "/data/deliverability" },
  openGraph: socialCard(
    "/data/deliverability",
    "The measured bounce rate",
    "A random, stratified sample of our email library, verified and published per trust tier - with the method, the sample size and the margin of error.",
  ),
};

/** A count with thousands separators, or a dash. */
function n(value: number | null | undefined): string {
  return value === null || value === undefined ? "—" : value.toLocaleString("en-US");
}

/**
 * One headline figure, or "Not measured yet" in a face that cannot be mistaken for a number.
 *
 * `.value.unknown` exists in the stylesheet for exactly this: deliberately not the big display
 * face, so an absent figure is never read as a small one and never read as a zero.
 */
function Stat({ value, label }: { value: string | null; label: string }) {
  return (
    <div className="stat">
      {value === null ? (
        <span className="value unknown">Not measured yet</span>
      ) : (
        <span className="value">{value}</span>
      )}
      <span className="label">{label}</span>
    </div>
  );
}

/** The per-tier table: the figures a buyer is actually choosing between. */
function TierTable({ run }: { run: Run }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Trust tier</th>
            <th>Addresses held</th>
            <th>Checked</th>
            <th>Deliverable</th>
            <th>Bounced</th>
            <th>No clear answer</th>
            <th>Margin of error</th>
          </tr>
        </thead>
        <tbody>
          {run.tiers.map((tier) => (
            <tr key={tier.tier}>
              <td>
                <b>{tierLabel(tier.tier)}</b>
              </td>
              <td>{n(tier.population)}</td>
              <td>{n(tier.sampled)}</td>
              <td>
                <b>{percent(tier.deliverable_rate) ?? "Not measured"}</b>
              </td>
              <td>{percent(tier.undeliverable_rate) ?? "Not measured"}</td>
              <td>{percent(tier.undetermined_rate) ?? "Not measured"}</td>
              <td className="fine">{margin(tier.margin_points) ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function DeliverabilityPage() {
  const measurement = await deliverability();
  const latest = measurement.latest;
  const method = measurement.method;
  const when = measuredOn(latest?.measured_at);
  const perTier = method?.per_tier ?? latest?.per_tier_target ?? null;

  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "@id": siteUrl("/data/deliverability#page"),
          name: "The measured bounce rate",
          url: siteUrl("/data/deliverability"),
          description: metadata.description as string,
          isPartOf: { "@id": siteUrl("/data#page") },
        }}
      />

      <section className="section" style={{ paddingTop: 40 }}>
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow rule">Measured deliverability</div>
            <h1 style={{ fontSize: "clamp(1.8rem, 3.8vw, 2.7rem)" }}>
              We check our own email data at random and publish what we find.
            </h1>
            <p className="lede">
              &ldquo;How accurate is your data?&rdquo; is the first question we get asked, and
              everywhere else in this industry the answer is an adjective. So here is ours as a
              number instead: a random sample of our email library, drawn separately from each
              trust tier, put through an independent verification service, and published with the
              sample size, the date, the margin of error and the method that produced it. Nothing on
              this page is estimated, and nothing is rounded in our favor. If the answer were 91%,
              the page would say 91%.
            </p>
          </div>

          {latest ? (
            <>
              <div className="stats" style={{ marginTop: 8 }}>
                <Stat
                  value={percent(latest.deliverable_rate)}
                  label={`Deliverable across the whole library${
                    latest.margin_points !== null ? `, ${margin(latest.margin_points)}` : ""
                  }`}
                />
                <Stat value={percent(latest.undeliverable_rate)} label="Bounced when checked" />
                <Stat value={n(latest.sampled)} label="Addresses checked in this run" />
                <Stat value={when} label="Measured on" />
              </div>
              <p className="fine" style={{ marginTop: 18 }}>
                Drawn from {n(latest.population)} addresses that were live, in a trust tier, and not
                suppressed on the day. The whole-library figure above is weighted by how many
                addresses sit in each tier, which is not the same as averaging the four tiers
                together - the tiers themselves are below, and they are the numbers worth reading.
              </p>
            </>
          ) : (
            <div className="panel" style={{ marginTop: 8 }}>
              <h2 style={{ marginTop: 0 }}>No measurement has been published yet.</h2>
              <p>
                This page has no number on it today, and we would rather leave it empty than fill it
                with one nobody took. The measurement is built and scheduled to run monthly; it
                needs an account with an email verification service, which we are in the middle of
                arranging. The first run will appear here with its date, its sample size and its
                margin of error, whatever it says.
              </p>
              <p className="fine">
                {method
                  ? `When it runs, it will draw ${n(method.per_tier)} addresses at random from each of the ${method.tiers.length} trust tiers and publish the result at ${method.confidence}% confidence, by the method set out below.`
                  : "The method is set out below."}{" "}
                In the meantime you can measure us yourself, on your own list, without paying
                anything or talking to anybody: <Link href="/test-your-list">test your list</Link>{" "}
                and we will tell you how much of it we hold and how full each field is.
              </p>
            </div>
          )}
        </div>
      </section>

      {latest && (
        <section className="section">
          <div className="wrap">
            <div className="section-head">
              <div className="eyebrow rule">By trust tier</div>
              <h2>The tier you buy is the tier we measure.</h2>
              <p className="lede">
                A single blended figure would hide the one thing worth knowing. Nobody buys
                &ldquo;the email library&rdquo; - you buy a tier, and the append tool will not touch
                anything below <b>trusted</b> unless you widen it yourself. So each tier is sampled
                separately, at the same sample size, and published separately. The tiers themselves
                are explained on <Link href="/data">what is in the data</Link>.
              </p>
            </div>
            <TierTable run={latest} />
            <p className="fine" style={{ marginTop: 16 }}>
              &ldquo;No clear answer&rdquo; is its own column rather than being split between the
              other two. It is mostly domains configured to accept mail to every address, where no
              check can tell a real mailbox from an invented one, plus the addresses the check could
              not resolve at all. Counting those as deliverable would flatter the first column and
              counting them as bounces would flatter nobody - so they stand on their own and you can
              decide what to make of them.
            </p>
          </div>
        </section>
      )}

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow rule">What this does not mean</div>
            <h2>A deliverable address is not a correct address.</h2>
          </div>
          <div className="grid two" style={{ alignItems: "start" }}>
            <div className="panel">
              <h3>The limit, in full</h3>
              <p>
                {method?.limits ??
                  "A deliverable address is not a correct one. This measures whether mail arrives at the mailbox, and nothing else: an address can be deliverable and still belong to the wrong person, or be a shared departmental mailbox rather than the clinician. It says nothing about whether a specialty, an employer or a license on the record is right, and nothing about whether a phone number is answered. It is one measurement of one field."}
              </p>
            </div>
            <div className="panel">
              <h3>What it is still good for</h3>
              <p>
                It is the number that decides whether a campaign lands or gets your sending domain
                in trouble, and it is the one figure in this industry that is usually asserted rather
                than shown. Read it as what it is: evidence about one field, taken the same way every
                month, that you can watch move rather than take on trust.
              </p>
              <p className="fine">
                For the accuracy of the rest of a record - specialty, employer, address, license -
                the honest answer is a different one: every field carries the date it was last
                confirmed, and you can check any of it against the public record yourself. That is on{" "}
                <Link href="/data">what is in the data</Link>, and anything you find wrong can be{" "}
                <Link href="/report-a-problem">reported</Link> and will be fixed for everybody.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow rule">The method</div>
            <h2>Written down, so you can argue with it.</h2>
            <p className="lede">
              A number without a method is a claim. This is the method, in the order it happens, and
              it is the same one every month - which is what makes one run comparable with the next.
            </p>
          </div>
          <div className="grid">
            <div className="card feature">
              <h3>The sample is random and reproducible</h3>
              <p>
                Each run records the seed it drew with, the size it drew, and the population it drew
                from. The same seed over the same population draws the same addresses - not a
                similar set, the same rows - so any figure here can be redrawn and recounted rather
                than taken on faith.
                {latest ? (
                  <>
                    {" "}
                    The run above used seed <code>{latest.seed}</code>.
                  </>
                ) : null}
              </p>
            </div>
            <div className="card feature">
              <h3>
                {perTier !== null
                  ? `${n(perTier)} addresses from every tier`
                  : "The same sample size from every tier"}
              </h3>
              <p>
                The same number from each tier rather than a share of each, so every published figure
                carries the same precision. Sampling in proportion to size would put nearly the whole
                sample into the largest tier and leave a smaller one with a handful of addresses and
                an interval too wide to mean anything - and the small tiers are exactly where somebody
                needs to know what they are getting.
              </p>
            </div>
            <div className="card feature">
              <h3>
                {method ? `${method.confidence}% confidence, stated as points` : "Stated as points"}
              </h3>
              <p>
                Every figure carries the margin of error that goes with its sample size, computed by
                a method that cannot produce an impossible bound - no interval here reaches above
                100%, which the textbook formula does at the rates the trusted tier measures. A
                measurement without its interval is a number pretending to be exact.
              </p>
            </div>
            <div className="card feature">
              <h3>Suppression wins, before anything is sent anywhere</h3>
              <p>
                An address covered by a suppression is never drawn and never submitted to anybody,
                and it is checked twice - once when the sample is drawn, and again immediately before
                each check, so a request filed in between is still honored. Addresses we have taken
                out of use are excluded too. Somebody who asked not to be contacted is not quietly
                included in our accuracy measurement.
              </p>
            </div>
            <div className="card feature">
              <h3>The result is a count, never a list</h3>
              <p>
                What we keep from a run is how many addresses were checked and how many of them each
                answer applied to. No address appears in the record, on this page, or in any log. An
                exported list of &ldquo;addresses that bounced&rdquo; would be a contact file with a
                tidier name, so it does not exist.
              </p>
            </div>
            <div className="card feature">
              <h3>Monthly, and dated</h3>
              <p>
                It runs once a month, every month, so the figure on this page has an age you can see
                rather than one you have to ask about. A measurement does not get quietly kept
                because it was flattering: the date is beside the number, and the runs before it are
                below.
              </p>
            </div>
          </div>
        </div>
      </section>

      {measurement.history.length > 0 && (
        <section className="section">
          <div className="wrap">
            <div className="section-head">
              <div className="eyebrow rule">Every run so far</div>
              <h2>One measurement is a number. A series is a record.</h2>
              <p className="lede">
                Older runs stay on the page, including the ones we would rather not have published.
                A rate that only ever appears when it is good is not a measurement, and a reader can
                tell the difference.
              </p>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Measured</th>
                    <th>Checked</th>
                    <th>Drawn from</th>
                    <th>Deliverable</th>
                    <th>Bounced</th>
                    <th>Margin of error</th>
                  </tr>
                </thead>
                <tbody>
                  {[latest, ...measurement.history]
                    .filter((run): run is Run => run !== null)
                    .map((run) => (
                      <tr key={run.id}>
                        <td>{measuredOn(run.measured_at) ?? "—"}</td>
                        <td>{n(run.sampled)}</td>
                        <td>{n(run.population)}</td>
                        <td>
                          <b>{percent(run.deliverable_rate) ?? "Not measured"}</b>
                        </td>
                        <td>{percent(run.undeliverable_rate) ?? "Not measured"}</td>
                        <td className="fine">{margin(run.margin_points) ?? "—"}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow rule">Check us yourself</div>
            <h2>Do not take this page&apos;s word for it.</h2>
            <p className="lede">
              Paste your own identifiers into <Link href="/test-your-list">test your list</Link> and
              we will tell you, before you pay anything or speak to anybody, how much of your list we
              hold and how full each field is on it. Coverage per specialty and per state is
              published on the <Link href="/lists">list pages</Link>, and what a record actually
              contains is on <Link href="/data">what is in the data</Link>.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

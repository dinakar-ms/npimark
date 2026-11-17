import type { Metadata } from "next";
import Link from "next/link";
import { ProductWindow } from "@/components/ProductWindow";
import {
  type Bar,
  type Bucket,
  LIST_TEST_PATH,
  type ListTestReport,
  fieldHref,
  ofList,
  onDate,
  readListTest,
  share,
} from "@/lib/listTest";
import { siteUrl } from "@/lib/site";

/**
 * The result of «test it on your own list»: one page of counts about one buyer's own segment.
 *
 * Why it is a page at a token rather than a rendered POST
 * ------------------------------------------------------
 * Because a buyer who forwards our result to their manager is doing our selling, and you cannot
 * forward the response body of a form submission. The token is the credential: unguessable, in the
 * URL, and the platform deletes the row after a fortnight. The identifiers that produced these
 * counts were never stored, so a link that leaks tells a reader what one anonymous segment's
 * coverage was and nothing about whose records were asked about.
 *
 * What is on it, and the one rule the numbers keep
 * ------------------------------------------------
 * Every figure is printed as *n* of the number they sent. Never a percentage on its own: a share of
 * an unstated denominator is exactly how a coverage figure gets misread, and a reader who multiplies
 * 37% by their own four thousand rows has been misled by arithmetic we handed them. The share is
 * offered after the count, as a reading of it.
 *
 * And what is not on it: no email address, no phone number, no name, not one row of a record, and
 * nothing from the consumer file - not even as a count. That is stated on the page, twice, because
 * a reader who assumed otherwise would feel tricked at exactly the moment we are asking them to
 * trust the numbers.
 *
 * Never indexed: every render is about one token, and `robots.ts` disallows the path as well.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "What we hold for your list",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ token: string }> };

/** A block of fill rates: the platform's own words, linked to the field reference entry. */
function Bars({ rows, listed }: { rows: Bar[]; listed: number }) {
  return (
    <ul className="bars stacked">
      {rows.map((row) => {
        const href = fieldHref(row.key);
        return (
          <li key={row.key}>
            <span className="bar-label">
              {href ? <Link href={href}>{row.label}</Link> : row.label}
              <small>{row.detail}</small>
            </span>
            <span className="bar-track" aria-hidden="true">
              <span
                className="bar-fill"
                style={{ "--w": `${share(row.count, listed)}%` } as React.CSSProperties}
              />
            </span>
            <span className="bar-count">{ofList(row.count, listed)}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** A distribution with no field behind it: the confirmed-date ranges. */
function Buckets({ rows, of, unit }: { rows: Bucket[]; of: number; unit: string }) {
  return (
    <ul className="bars stacked">
      {rows.map((row) => (
        <li key={row.key}>
          <span className="bar-label">{row.label}</span>
          <span className="bar-track" aria-hidden="true">
            <span
              className="bar-fill"
              style={{ "--w": `${share(row.count, of)}%` } as React.CSSProperties}
            />
          </span>
          <span className="bar-count">
            {row.count.toLocaleString()} of {of.toLocaleString()} {unit}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Missing({ what }: { what: string }) {
  return (
    <main>
      <section className="wrap narrow" style={{ paddingBlock: "clamp(48px, 10vw, 96px)" }}>
        <div className="eyebrow rule">Your list</div>
        <h1>{what}</h1>
        <p className="lede">
          A report keeps its link for a fortnight and then the row is deleted - we do not hold the
          identifiers it was about, so there is nothing to rebuild it from. Running the list again
          takes a few seconds and nothing is charged for it.
        </p>
        <div className="actions" style={{ marginTop: 24 }}>
          <Link className="btn primary lg" href={LIST_TEST_PATH}>
            Test a list again
          </Link>
        </div>
      </section>
    </main>
  );
}

export default async function ListTestResultPage({ params }: Props) {
  const { token } = await params;
  const result = await readListTest(token);
  if (!result.ok) {
    return (
      <Missing
        what={
          result.status === 404
            ? "That report has expired, or never existed."
            : "We could not read that report just now."
        }
      />
    );
  }
  const report: ListTestReport = result.data;
  const { listed, held } = report;
  const permalink = siteUrl(`${LIST_TEST_PATH}/${report.token}`);
  const carriedFlags = report.flags.filter((flag) => flag.count > 0);

  return (
    <main>
      <section className="hero short">
        <div className="wrap">
          <span className="eyebrow">
            <span className="dot" aria-hidden="true" />
            Measured {onDate(report.created_at)} · your list, not a sample of ours
          </span>
          <h1>
            We hold {held.toLocaleString()} of the {listed.toLocaleString()} NPIs you sent.
          </h1>
          <p className="lede">
            Every number below is counted over the {listed.toLocaleString()} identifiers you sent,
            by the engine that fills a file when you send us one. The{" "}
            {report.not_held.toLocaleString()} we do not hold are counted in the gaps rather than
            left out of them, so a fill rate here is what your own file would come back as.
          </p>
          <div className="stats" style={{ marginTop: 26 }}>
            <div className="stat">
              <span className="value num">{listed.toLocaleString()}</span>
              <span className="label">NPIs you sent, after duplicates</span>
            </div>
            <div className="stat">
              <span className="value num">{held.toLocaleString()}</span>
              <span className="label">we hold a record for</span>
            </div>
            <div className="stat">
              <span className="value num">{report.held_inactive.toLocaleString()}</span>
              <span className="label">of those are inactive identifiers</span>
            </div>
            <div className="stat">
              <span className="value num">{report.not_held.toLocaleString()}</span>
              <span className="label">not in our data at all</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section wrap">
        <div className="section-head">
          <div className="eyebrow rule">What you sent</div>
          <h2>The arithmetic, so you can check ours against yours.</h2>
        </div>
        <div className="panel">
          <dl className="rows">
            <div>
              <dt>Ten-digit numbers found</dt>
              <dd className="fine">{report.submitted.toLocaleString()}</dd>
            </div>
            <div>
              <dt>Repeats dropped</dt>
              <dd className="fine">{report.duplicates.toLocaleString()}</dd>
            </div>
            <div>
              <dt>Not valid NPIs</dt>
              <dd className="fine">
                {report.rejected.toLocaleString()}
                {report.rejected > 0
                  ? " - ten digits, but the identifier's own check digit did not hold, so it is not an NPI and nothing was looked up for it."
                  : ""}
              </dd>
            </div>
            <div>
              <dt>Measured</dt>
              <dd className="fine">
                {listed.toLocaleString()} distinct identifiers
                {report.column
                  ? `, read from the “${report.column}” column of your file`
                  : ""}
              </dd>
            </div>
            <div>
              <dt>What we hold</dt>
              <dd className="fine">
                {report.individuals.toLocaleString()} people and{" "}
                {report.organizations.toLocaleString()}{" "}
                {report.organizations === 1 ? "organisation" : "organizations"}, of which{" "}
                {report.held_active.toLocaleString()}{" "}
                {report.held_active === 1 ? "identifier is" : "identifiers are"} still active.
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="section wrap">
        <div className="section-head">
          <div className="eyebrow rule">Fill rate, field by field</div>
          <h2>The fields you asked about.</h2>
          <p className="lede">
            Counted as <em>n</em> of the {listed.toLocaleString()} you sent. A percentage of a
            denominator nobody stated is how a coverage figure gets misread, so the denominator is on
            every line.
          </p>
        </div>

        <ProductWindow
          title="Your coverage"
          path={LIST_TEST_PATH}
          chip="your list"
          foot={
            <>
              <span className="win-count">
                Out of {listed.toLocaleString()} identifiers; {report.not_held.toLocaleString()} of
                them we hold no record for.
              </span>
              <Link href="/lists" className="win-link">
                The same counts by specialty
              </Link>
            </>
          }
        >
          <h3 style={{ fontSize: "0.95rem", marginBottom: 12 }}>Work email, by trust tier</h3>
          <Bars rows={report.email.tiers} listed={listed} />
          <p className="fine" style={{ marginTop: 12 }}>
            {ofList(report.email.any, listed)} carry at least one address we hold and would stand
            behind measuring. An export or an appended file gives you the trusted tier by default;
            the tiers below it are on file, named, and yours if you ask for them - we would rather
            show you the number than fold it into the one above.
          </p>

          <h3 style={{ fontSize: "0.95rem", margin: "22px 0 12px" }}>Everything else you asked for</h3>
          <Bars rows={report.asked} listed={listed} />
        </ProductWindow>
      </section>

      <section className="section wrap">
        <div className="section-head">
          <div className="eyebrow rule">Also on these records</div>
          <h2>Fields you probably did not think to ask for.</h2>
          <p className="lede">
            A supplier comparison usually comes down to email and phone, which is two columns of a
            wider record. These are the rest of it, on the same list.
          </p>
        </div>
        <ProductWindow title="The record" path="/fields" chip="your list">
          <Bars rows={report.extra} listed={listed} />
        </ProductWindow>
        {carriedFlags.length > 0 && (
          <div className="panel">
            <h3>Flags carried by some of your list</h3>
            <p className="fine" style={{ marginBottom: 12 }}>
              Facts about a provider rather than coverage, so these are counts and not fill rates -
              nobody wants this number to be high.
            </p>
            <ul className="bars stacked">
              {carriedFlags.map((flag) => (
                <li key={flag.key}>
                  <span className="bar-label">{flag.label}</span>
                  <span className="bar-track" aria-hidden="true">
                    <span
                      className="bar-fill"
                      style={{ "--w": `${share(flag.count, listed)}%` } as React.CSSProperties}
                    />
                  </span>
                  <span className="bar-count">{ofList(flag.count, listed)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="section wrap">
        <div className="section-head">
          <div className="eyebrow rule">How fresh your segment is</div>
          <h2>When each of these records was last confirmed.</h2>
          <p className="lede">
            Out of the {held.toLocaleString()} we hold, not out of your whole list. Ranges rather
            than one average, because a single figure over a segment refreshed on several schedules
            is a number nobody can act on.
          </p>
        </div>
        <ProductWindow
          title="Last confirmed"
          path="/fields#updated_at"
          chip="your list"
          foot={
            <>
              <span className="win-count">
                Out of the {held.toLocaleString()} records we hold for your list.
              </span>
              <Link href="/data" className="win-link">
                What a confirmed date means
              </Link>
            </>
          }
        >
          <Buckets rows={report.confirmed} of={held} unit="records" />
        </ProductWindow>
      </section>

      <section className="section wrap">
        <div className="section-head">
          <div className="eyebrow rule">The gaps</div>
          <h2>What we do not hold for this list.</h2>
        </div>
        <div className="panel">
          {report.gaps.length === 0 ? (
            <p>
              Every field this report measures is on at least one of your records. That is not a
              claim that any of them is complete - the fill rates above are the honest version of
              that, and several of them are far from full.
            </p>
          ) : (
            <>
              <p>
                Nothing in your list carries these. Counted and named rather than left off the page:
                a report that only showed you our good columns would be worth nothing to you.
              </p>
              <ul className="ticks" style={{ marginTop: 14 }}>
                {report.gaps.map((gap) => {
                  const href = fieldHref(gap.key);
                  return (
                    <li key={gap.key}>
                      {href ? <Link href={href}>{gap.label}</Link> : gap.label}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          <p className="fine" style={{ marginTop: 18 }}>
            <strong>And what this report will never show.</strong> No email address, no phone
            number, no name, not one row of a record. Home address and cell phone are licensed under
            an agreement that names the permitted use, matched one provider at a time, and are not
            measured here at all - not even as a count. This page proves coverage; it does not hand
            over content.
          </p>
          <p className="fine" style={{ marginTop: 12 }}>
            Records somebody has asked us to suppress are not counted as held, and read exactly as an
            identifier we have never had. That is deliberate: a suppression that could be detected
            would not be much of a suppression.
          </p>
        </div>
      </section>

      <section className="section on-ink">
        <div className="wrap narrow" style={{ textAlign: "center" }}>
          <div className="eyebrow rule" style={{ justifyContent: "center" }}>
            The next step
          </div>
          <h2>Open an account and reveal these records.</h2>
          <p className="lede">
            The counts above are what we hold. An account turns them into the records themselves,
            metered so you only spend on the ones you want. If you would rather we ran the whole
            segment instead of a sample of {listed.toLocaleString()},{" "}
            <Link href="/contact">tell us what you need</Link> and we will measure it and quote it.
          </p>
          <div className="actions" style={{ marginTop: 22, justifyContent: "center" }}>
            <Link className="btn primary lg" href="/sign-up">
              Get started
            </Link>
          </div>
        </div>
      </section>

      <section className="section wrap">
        <div className="section-head">
          <div className="eyebrow rule">Keep this</div>
          <h2>Send it to whoever has to sign off.</h2>
        </div>
        <div className="panel">
          <p>
            This page has its own link. Anybody you send it to sees these numbers without signing in,
            for {Math.max(1, Math.round((new Date(report.expires_at).getTime() - new Date(report.created_at).getTime()) / 86_400_000))}{" "}
            days from when it was run - it stops answering on {onDate(report.expires_at)} and the row
            is then deleted.
          </p>
          <p className="mono fine" style={{ marginTop: 12, overflowWrap: "anywhere" }}>
            {permalink}
          </p>
          <div className="actions" style={{ marginTop: 18 }}>
            <a className="btn" href={`${LIST_TEST_PATH}/${report.token}/summary`} download>
              Download the summary as CSV
            </a>
            <Link className="btn ghost" href={LIST_TEST_PATH}>
              Test another list
            </Link>
          </div>
          <p className="fine" style={{ marginTop: 16 }}>
            We did not keep your list. The identifiers you pasted were read, counted against and
            discarded inside the request; what is stored is this page&rsquo;s counts, and only until
            the date above.
          </p>
        </div>
      </section>
    </main>
  );
}

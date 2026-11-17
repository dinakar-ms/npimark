import { connection } from "next/server";
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { listCatalogue } from "@/lib/api";
import {
  boundaryShort,
  fromApi,
  METERING,
  percent,
  publishable,
  type Utilisation,
  count as claimsCount,
} from "@/lib/claims";
import {
  ALL_FIELDS,
  COST_LABELS,
  type CostBand,
  type CoverageKey,
  FIELD_COUNT,
  FIELD_GROUPS,
  type Field,
  SURFACE_COUNTS,
  surfaceClause,
} from "@/lib/fields";
import { PLATFORM_DATASET_ID, breadcrumb, websiteRef } from "@/lib/schema";
import { SITE_NAME, siteUrl, socialCard } from "@/lib/site";

/**
 * The field reference: one entry per attribute the product supplies.
 *
 * Why this page exists, and why at `/fields` rather than inside `/data`
 * --------------------------------------------------------------------
 * `/data` answers "is this database good enough to buy" - groups of facts, refresh cadences, what
 * is deliberately absent. `/docs/api` answers "which endpoint do I call". Neither answers "what is
 * `employer_source`, what is it for, how full is it, and does my plan include it", so support
 * answered that by email and a procurement reviewer asked for a data dictionary before signing.
 *
 * It sits at its own top-level path for three reasons. It is arrived at by field name from a
 * search engine rather than by browsing, and a short stable path is what that traffic lands on.
 * Folding fifty-odd entries into `/data` would bury the buying argument under a reference table.
 * And the machine-readable twin hangs off it as `/fields.json`, which only reads as a sibling when
 * the page is `/fields`.
 *
 * Three rules this page keeps
 * ---------------------------
 * 1. **The catalogue is one constant.** Every entry here and every entry in `/fields.json` comes
 *    from `lib/fields.ts`, so the page a buyer reads and the file a machine reads cannot drift.
 * 2. **Coverage is live, measured-and-dated, or it is "not published".** Every figure here is read
 *    through `lib/api.ts` - the platform's own published list counts, and, for the two Medicare
 *    utilisation fields, the coverage measurement it publishes beside them with the date it was
 *    taken on. Those two are dated rather than live because counting distinct providers across ten
 *    million procedure lines is not a per-request query; they are still read rather than typed, so
 *    the page cannot drift from the database the way a constant in this repository would. A field
 *    the platform cannot answer for says so in words. What there is not, and must never be, is an
 *    invented fill rate: a buyer plans against it.
 * 3. **No source is named.** Not a registry, an agency, a verifier or a supplier - the same rule
 *    `/data` keeps. Three append fields could not be named here without breaking it, because
 *    their own names say which filing or published dataset they are read from; rather than print
 *    them or leave three entries without a parameter name, the platform grew a neutral alias for
 *    each (`FIELD_ALIASES` in `backend/app/jobs/append_enrich.py`), and those are the names below.
 *    A programme a provider participates in is different and is named plainly: whether somebody
 *    opted out of Medicare is a fact about the clinician, not a pointer at a supplier.
 *
 * The layout problem, solved deliberately
 * ---------------------------------------
 * Fifty-odd fields with eight facts each is a table nobody can read on a phone. So there is no
 * wide table: each entry is a `.panel` with a `dl.rows` inside it, and `.rows` already collapses
 * its two columns to one below 640px. That is the whole mobile strategy - no horizontal scroll at
 * any width, no second stylesheet, and the same markup in both directions.
 */

type Coverage = {
  /** Providers on the published specialty lists - what every share below is a share of. */
  listed: number | null;
  withEmail: number | null;
  withTrustedEmail: number | null;
  withPhone: number | null;
  withLocation: number | null;
  /** The day the platform last recomputed these counts, `YYYY-MM-DD`, or null. */
  refreshed: string | null;
  /**
   * The Medicare utilisation measurement, over a different population from everything above it:
   * active individual providers, nationally. Kept in its own field rather than folded in beside
   * the list-page counts precisely because the base is different - a share quoted against the
   * wrong one of these two bases is the mistake this page exists to avoid.
   */
  utilisation: Utilisation | null;
};

const NO_COVERAGE: Coverage = {
  listed: null,
  withEmail: null,
  withTrustedEmail: null,
  withPhone: null,
  withLocation: null,
  refreshed: null,
  utilisation: null,
};

/** A positive number, or null - so "we could not read it" and "it is zero" never render alike. */
function some(value: number): number | null {
  return value > 0 ? value : null;
}

/**
 * The coverage figures, read live, exactly the way `/data` reads them.
 *
 * Summed over the catalogue's classification rows only. A specialisation sits inside its
 * classification, so adding both would count the same providers twice - and what these are is
 * "providers on a published specialty list", which is what the page says rather than a total
 * dressed up as one.
 */
async function coverage(): Promise<Coverage> {
  const catalogue = await listCatalogue();
  const classes = catalogue.taxonomies.filter((t) => t.level === "classification");
  const sum = (pick: (t: (typeof classes)[number]) => number) =>
    classes.reduce((total, row) => total + pick(row), 0);
  return {
    listed: some(sum((t) => t.counts.total)),
    withEmail: some(sum((t) => t.counts.with_email)),
    withTrustedEmail: some(sum((t) => t.counts.with_trusted_email)),
    withPhone: some(sum((t) => t.counts.with_phone)),
    withLocation: some(sum((t) => t.counts.with_location)),
    refreshed: catalogue.refreshed_at ? catalogue.refreshed_at.slice(0, 10) : null,
    utilisation: publishable(fromApi(catalogue.medicare_utilisation)),
  };
}

function n(value: number): string {
  return value.toLocaleString("en-US");
}

/** `62,145 of 88,300 (70%)`, or null when either half could not be read. */
function share(held: number | null, of: number | null): string | null {
  if (held === null || of === null || of === 0) return null;
  return `${n(held)} of ${n(of)} (${Math.round((held / of) * 100)}%)`;
}

/**
 * What to say under "How complete". A live share where the platform publishes one; the sentence
 * "Not published" where it does not. Never a guess, and never a number typed into this file.
 */
function completeness(key: CoverageKey | null, c: Coverage): string {
  if (key === null) {
    return "Not published. We do not measure a fill rate for this field, so there is not one to quote.";
  }
  // Measured rather than live, and said as measured. The denominator is active individual
  // providers, not the providers on the published specialty lists, so these two do not share the
  // sentence below - quoting one share against another's base is how a data sheet starts lying.
  if (key === "procedures" || key === "prescribing") {
    const u = c.utilisation;
    if (u === null) {
      return "Measured over active individual providers rather than over the published specialty lists, and the platform did not answer for it just now, so no figure is quoted here. The data page publishes it nationally and per specialty.";
    }
    const held = key === "procedures" ? u.withProcedures : u.withPrescribing;
    const what = key === "procedures" ? "a published procedure line" : "a published prescribing row";
    return (
      `${claimsCount(held)} of ${claimsCount(u.clinicians)} active individual providers ` +
      `${u.sharePublished ? `(${percent(held, u.clinicians)}) ` : ""}have ${what}` +
      `${u.measuredOn ? `, measured ${u.measuredOn}` : ""}. ` +
      "That is a count of providers, not an estimate, and it is a national one: the share is far " +
      "higher in the specialties that bill Medicare Part B most, and the data page publishes it " +
      "per specialty. The rest are blank on these fields, and low-volume providers are removed " +
      "from the published file before we receive it - so a blank does not mean they do none of it."
    );
  }
  const map: Record<
    Exclude<CoverageKey, "procedures" | "prescribing">,
    { held: number | null; says: string }
  > = {
    email: { held: c.withEmail, says: "carry a work email" },
    trustedEmail: { held: c.withTrustedEmail, says: "carry a work email in the trusted tier" },
    phone: { held: c.withPhone, says: "carry a practice phone" },
    location: { held: c.withLocation, says: "carry a practice location" },
  };
  const row = map[key];
  const figure = share(row.held, c.listed);
  if (figure === null) {
    return "Published per specialty and per state on the list pages. The platform did not answer for it just now, so no figure is quoted here.";
  }
  return `${figure} of the providers on the published specialty lists ${row.says}. The same count is published per specialty and per state on the list pages.`;
}

const BAND_TAG: Record<CostBand, string> = {
  public: "tag ok",
  account: "tag accent",
  reveal: "tag warn",
  contract: "tag stop",
};

/** One field: the plain sentence, then the eight facts, as a definition list. */
function Entry({ field, c }: { field: Field; c: Coverage }) {
  return (
    <div className="panel" id={field.key} style={{ marginTop: 18 }}>
      <h3 style={{ marginBottom: 6 }}>{field.name}</h3>
      <p className="fine" style={{ marginBottom: 14 }}>
        {field.what}
      </p>
      <dl className="rows">
        <div>
          <dt>Example</dt>
          <dd className="mono fine">{field.example}</dd>
        </div>
        <div>
          <dt>What it is for</dt>
          <dd className="fine">{field.uses}</dd>
        </div>
        <div>
          <dt>How complete</dt>
          <dd className="fine">{completeness(field.coverage, c)}</dd>
        </div>
        <div>
          <dt>What it costs</dt>
          <dd className="fine">
            <span className={BAND_TAG[field.band]}>{COST_LABELS[field.band]}</span>{" "}
            <span style={{ display: "block", marginTop: 6 }}>
              {field.cost} {surfaceClause(field)}
            </span>
          </dd>
        </div>
        <div>
          <dt>API field</dt>
          <dd className="mono fine">{field.api ?? "Not on the API"}</dd>
        </div>
        <div>
          <dt>Export column</dt>
          <dd className="fine">
            {field.exportHeader ? (
              <span className="mono">{field.exportHeader}</span>
            ) : (
              "Not exportable"
            )}
          </dd>
        </div>
        <div>
          <dt>Append field</dt>
          <dd className="fine">
            {field.append ? <span className="mono">{field.append}</span> : "Not appendable"}
          </dd>
        </div>
        {field.note && (
          <div>
            <dt>Worth knowing</dt>
            <dd className="fine">{field.note}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

export const metadata: Metadata = {
  title: "Field reference",
  description:
    "Every field NPI Mark supplies, one entry each: what it means, what it is used for, how complete it is, what it costs, and its API, export and append names.",
  alternates: { canonical: "/fields" },
  openGraph: socialCard(
    "/fields",
    "Field reference",
    "Every field the platform supplies, with its API name, export header, append name and what it costs.",
  ),
};

export default async function FieldsPage() {
  // At request time, not at build: the build has no API to call, and a page baked without its
  // coverage figures would serve that until the next revalidation. `call()` in lib/api.ts keeps
  // the response cached for a day, so a crawl lands on the cache.
  await connection();
  const c = await coverage().catch(() => NO_COVERAGE);

  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebPage",
              "@id": siteUrl("/fields#page"),
              name: "Field reference",
              url: siteUrl("/fields"),
              description: metadata.description as string,
              isPartOf: websiteRef(),
              // The dictionary is a description of the dataset `/data` declares. Saying so is what
              // lets an assistant find the field list from the data and the data from the list.
              about: { "@id": PLATFORM_DATASET_ID() },
              mainEntity: { "@id": siteUrl("/fields#terms") },
            },
            // The catalogue itself, generated from the same constant the page renders, so the
            // markup cannot drift from the words. No source is named here either.
            {
              "@type": "DefinedTermSet",
              "@id": siteUrl("/fields#terms"),
              name: `${SITE_NAME} field reference`,
              description:
                "Every attribute a provider, organization or facility record carries, with what it means and what it is used for.",
              url: siteUrl("/fields"),
              hasDefinedTerm: ALL_FIELDS.map((field) => ({
                "@type": "DefinedTerm",
                "@id": siteUrl(`/fields#${field.key}`),
                name: field.name,
                termCode: field.api ?? field.append ?? field.key,
                description: field.what,
                inDefinedTermSet: { "@id": siteUrl("/fields#terms") },
              })),
            },
            breadcrumb([
              { name: "What is in the data", href: "/data" },
              { name: "Field reference", href: "/fields" },
            ]),
          ],
        }}
      />

      <section className="hero short">
        <div className="wrap">
          <span className="eyebrow">
            <span className="dot" aria-hidden="true" />
            Every field · what it means · what it costs
          </span>
          <h1>The data dictionary, written down rather than emailed.</h1>
          <p className="lede">
            {FIELD_COUNT} fields, grouped so you can find one fast. Each entry says what the field
            is in a sentence, what it is actually used for, how complete it is where we can measure
            that, what it costs on your plan, and the three names it travels under - in the API, in
            an export, and in an append. Where a field exists on one surface and not another, the
            entry says so, because that is the thing people write in to ask.
          </p>
          <div className="actions" style={{ marginTop: 22 }}>
            <Link className="btn primary lg" href="/pricing">
              See plans
            </Link>
            <Link className="btn lg" href="/data">
              What is in the data
            </Link>
            <Link className="btn lg" href="/fields.json">
              The same list as JSON
            </Link>
          </div>
          <div className="stats" style={{ marginTop: 26 }}>
            <div className="stat">
              <span className="value num">{FIELD_COUNT}</span>
              <span className="label">fields documented here</span>
            </div>
            <div className="stat">
              <span className="value num">{SURFACE_COUNTS.api}</span>
              <span className="label">returned by the API</span>
            </div>
            <div className="stat">
              <span className="value num">{SURFACE_COUNTS.exports}</span>
              <span className="label">available as export columns</span>
            </div>
            <div className="stat">
              <span className="value num">{SURFACE_COUNTS.append}</span>
              <span className="label">you can append to your own file</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow rule">How to read an entry</div>
            <h2>Five things a reference page usually leaves out.</h2>
          </div>
          <div className="grid two">
            <div className="card feature">
              <h3>The examples are invented, and say so</h3>
              <p>
                Every example value on this page is fictional - the shape of the value, in obviously
                made-up data. We do not put a real provider&apos;s details on a public page to
                illustrate a field, and we never dress an invented value up as a real one.
              </p>
            </div>
            <div className="card feature">
              <h3>Coverage is live, dated, or it says &ldquo;not published&rdquo;</h3>
              <p>
                Work email, trusted-tier email, practice phone and practice location are counted by
                the platform and quoted here from that count.
                {c.refreshed !== null && ` Those counts were last recomputed on ${c.refreshed}.`} The
                two Medicare utilization fields are counted over ten million procedure lines, which
                is too slow to do while you wait, so they are read from the platform&apos;s own
                measurement and carry the date it was taken on instead of pretending to be live.
                Every other field says <b>not published</b> rather than carrying a fill rate nobody
                measured.
              </p>
            </div>
            <div className="card feature">
              <h3>Three names, because there are three surfaces</h3>
              <p>
                A field can be on the API, in an export column, in the append catalog, or in some
                but not all three. Each entry gives all three names and prints{" "}
                <b>Not exportable</b> or <b>Not appendable</b> where one is missing, so a developer
                and a buyer can use the same page.
              </p>
            </div>
            <div className="card feature">
              <h3>Cost in the plan&apos;s own terms</h3>
              <p>
                Free and public, included with an account, a metered reveal, or contract only. The{" "}
                <Link href="/pricing">plans page</Link> is where the numbers behind those words
                live; this page never restates an allowance, because a figure repeated where nobody
                is looking is a figure that goes stale.
              </p>
              <p>
                The band describes the field, not the door. Taking a record out of the platform
                costs one row against your plan&apos;s row allowance whatever its fields cost, in
                an export and in an API response alike, and a metered reveal costs its reveal on
                top of that wherever you ask for it.
              </p>
            </div>
            <div className="card feature">
              <h3>What they do has limits, and they are on the entries</h3>
              <p>
                {boundaryShort(c.utilisation)} A provider with nothing there has <b>no published Medicare
                volume</b> &mdash; which covers no volume, volume below the publication threshold,
                and not billing Medicare at all, because the published file does not separate them.
                One year is held, so nothing supports a trend.
              </p>
              <p>{METERING}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow rule">Contents</div>
            <h2>{FIELD_GROUPS.length} groups.</h2>
          </div>
          <div className="hints" style={{ justifyContent: "flex-start" }}>
            {FIELD_GROUPS.map((group) => (
              <Link key={group.key} href={`#${group.key}`}>
                {group.title} ({group.fields.length})
              </Link>
            ))}
          </div>
        </div>
      </section>

      {FIELD_GROUPS.map((group) => (
        <section className="section" key={group.key} id={group.key}>
          <div className="wrap">
            <div className="section-head">
              <div className="eyebrow rule">
                {group.fields.length} {group.fields.length === 1 ? "field" : "fields"}
              </div>
              <h2>{group.title}</h2>
              <p className="lede">{group.blurb}</p>
            </div>
            {group.fields.map((field) => (
              <Entry key={field.key} field={field} c={c} />
            ))}
          </div>
        </section>
      ))}

      <section className="section">
        <div className="wrap narrow">
          <div className="section-head">
            <div className="eyebrow rule">What this page does not answer</div>
            <h2>The questions a field list cannot settle.</h2>
          </div>
          <div className="faq">
            <details>
              <summary>Where does each field come from?</summary>
              <p>
                Not published, and deliberately so. Which registries, filings and suppliers a record
                is assembled from is a competitor&apos;s question rather than a customer&apos;s, so
                this site says what a field holds and how current it is and stops there. What we
                will tell you is how a value was reached in plain words, which is what the source
                columns on this page are for.
              </p>
            </details>
            <details>
              <summary>What is the fill rate for a field that says &ldquo;not published&rdquo;?</summary>
              <p>
                We have not measured it, so we will not quote one. The four figures we do publish -
                work email, trusted-tier email, practice phone and practice location - are counted
                per specialty and per state on the <Link href="/lists">list pages</Link>, so you can
                check coverage for your own segment rather than for the database as a whole. If a
                segment matters enough to buy on, ask and we will count it for you.
              </p>
            </details>
            <details>
              <summary>How accurate is a field, as opposed to how complete?</summary>
              <p>
                This page does not claim an accuracy rate, because a single number for a whole
                database would not mean anything. What it gives you instead is per-field: the date
                the record was last confirmed, a measured tier on the one field that has to be
                confirmed rather than filed, and a plain-words source column on every derived field
                so you can see how a value was reached before you rely on it. Search is open without
                an account, so the fastest check is to look up a provider you already know.
              </p>
            </details>
            <details>
              <summary>Can I get a field that is not on this list?</summary>
              <p>
                This is everything the product supplies today. There is no hidden tier of fields and
                no propensity score, likelihood-to-buy number or invented completeness grade - if it
                is not here, we do not have it. If something you need is missing,{" "}
                <Link href="/contact">tell us</Link>; it is a better use of the conversation than a
                field we would have to make up.
              </p>
            </details>
            <details>
              <summary>Which fields can I filter on?</summary>
              <p>
                More than can usefully be listed on one page, and the set changes as filters are
                added. The <Link href="/docs/api">API reference</Link> is the current list for a key,
                and the search screen is the current list for a person. This page is about what a
                field <i>is</i>; that one is about what you can ask for.
              </p>
            </details>
          </div>

          <div className="cta" style={{ marginTop: 32 }}>
            <h2>Check a field against a provider you already know.</h2>
            <p className="lede">
              Search is open without an account. Look somebody up, see which of these fields we
              actually hold for them, and judge the reference from that rather than from a page.
            </p>
            <div className="actions">
              <Link className="btn primary lg" href="/search">
                Search providers
              </Link>
              <Link className="btn lg" href="/docs/api">
                API reference
              </Link>
              <Link className="btn lg" href="/help/exports-and-append">
                Exports and append
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

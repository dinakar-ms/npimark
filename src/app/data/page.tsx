import { connection } from "next/server";
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { listCatalogue, listSystems, providerCount } from "@/lib/api";
import {
  boundary,
  fromApi,
  heldNone,
  METERING,
  NOT_HELD,
  publishable,
  oneInWords,
  percent,
  SHARE_IS_NOT_CONTACT_DATA,
  tooFewToPublish,
  type Utilisation,
  YEAR,
  count,
} from "@/lib/claims";
import { FACILITY_KINDS } from "@/lib/facilities";
import { listPath } from "@/lib/lists";
import { roleIndexOrEmpty } from "@/lib/roles";
import { PLATFORM_DATASET_ID, datasetBase, websiteRef } from "@/lib/schema";
import { SITE_NAME, siteUrl, socialCard } from "@/lib/site";

/**
 * The data itself: what a record holds, how current each part of it is, how it is checked, and
 * what is deliberately not here.
 *
 * Somebody who lands here is deciding whether the database is good enough to buy, and the
 * question behind every section is "can I check that". So the page is specific about fields and
 * cadences, publishes the email trust tiers with what each one means (the arithmetic is in
 * `docs/email-trust.md` and `app/emails/trust.py`), and gives a section of its own to what we
 * do not hold - which is the part a careful buyer reads first.
 *
 * Two rules the page obeys and the codebase does not have to:
 *
 * 1. No source is named. Which registries, files and suppliers a record is assembled from is not
 *    a customer's question and is a competitor's business, so the page says "the public record",
 *    "federal filings" and "the providers themselves" and stops there. Internal comments and
 *    `docs/public-record-datasets.md` name them; a public page never does.
 * 2. Every number is read live through `lib/api.ts`, or it is not on the page. When a call
 *    cannot be answered the figure is simply absent, the way `AudienceLanding` handles it - a
 *    row of zeros reads as "we have none", which is worse than saying nothing. The Medicare
 *    utilisation figures are the one kind that is measured rather than counted per request - a pass
 *    over every active clinician is not something a page load starts - but they are still *read*,
 *    with the date they were taken on, rather than typed into this repository.
 * 3. The utilisation share is published per specialty, not only nationally. One in six is the
 *    national figure and it is dragged down by every profession that never bills Medicare Part B;
 *    a prospect in cardiology who is shown only the national number is being told something
 *    misleading about cardiology. The per-specialty table below is the same measurement cut by the
 *    specialty's own primary taxonomy, and a specialty too small to carry a percentage gets its
 *    counts and an explicit refusal rather than a number rounded off a base of sixty.
 */

type Figures = {
  providers: number | null;
  facilities: number | null;
  beds: number | null;
  specialtyLists: number | null;
  listed: number | null;
  withEmail: number | null;
  withTrustedEmail: number | null;
  withPhone: number | null;
  systems: number | null;
  systemFloor: number | null;
  leadership: number | null;
  /**
   * The day the platform last recomputed the counts this page quotes, `YYYY-MM-DD`, or null when
   * it did not say. The only date this page can honestly publish: the field catalogue below is
   * described in this repository and has no date of its own to give.
   */
  refreshed: string | null;
  /** The national Medicare utilisation measurement, or null when the platform did not answer. */
  utilisation: Utilisation | null;
  /** The same measurement per specialty - see `SPECIALTIES_SHOWN` for which ones and why. */
  specialties: SpecialtyShare[];
};

/** One row of the per-specialty table: the published list it belongs to, and its measurement. */
type SpecialtyShare = { slug: string; label: string; measured: Utilisation };

/**
 * How many specialties the table shows.
 *
 * Every published specialty carries its own figure on its own list page and all of them are in
 * `/fields.json`; this page shows a readable number of them, because four hundred rows is not a
 * table anybody reads and is certainly not one that works on a phone.
 *
 * The ones shown are the **largest by clinician count** - a rule that does not depend on the answer,
 * so the table cannot be a shortlist of our best numbers. They are then ordered by share, highest
 * first, which is what a reader is looking for once the selection is honest.
 */
const SPECIALTIES_SHOWN = 24;

const NONE: Figures = {
  providers: null,
  facilities: null,
  beds: null,
  specialtyLists: null,
  listed: null,
  withEmail: null,
  withTrustedEmail: null,
  withPhone: null,
  systems: null,
  systemFloor: null,
  leadership: null,
  refreshed: null,
  utilisation: null,
  specialties: [],
};

/** A positive number, or null - so "we could not read it" and "it is zero" render the same way. */
function some(value: number): number | null {
  return value > 0 ? value : null;
}

/**
 * Every figure on the page, from four cached calls the rest of the site already makes.
 *
 * The coverage counts are summed over the classification rows of the catalogue only. A
 * specialization sits inside its classification, so adding both would count the same providers
 * twice - and the sum is "providers on a published specialty list", which is what the page says
 * it is rather than a total dressed up as one.
 */
async function figures(): Promise<Figures> {
  const [providers, catalogue, systems, roles] = await Promise.all([
    providerCount(),
    listCatalogue().catch(() => null),
    listSystems().catch(() => null),
    roleIndexOrEmpty(),
  ]);

  const classes = (catalogue?.taxonomies ?? []).filter((t) => t.level === "classification");
  const sum = (pick: (t: (typeof classes)[number]) => number) =>
    classes.reduce((total, row) => total + pick(row), 0);
  const facilities = catalogue?.facility_types ?? [];

  return {
    providers,
    facilities: some(facilities.reduce((total, f) => total + f.counts.facilities, 0)),
    beds: some(facilities.reduce((total, f) => total + f.counts.beds, 0)),
    specialtyLists: some(catalogue?.taxonomies.length ?? 0),
    listed: some(sum((t) => t.counts.total)),
    withEmail: some(sum((t) => t.counts.with_email)),
    withTrustedEmail: some(sum((t) => t.counts.with_trusted_email)),
    withPhone: some(sum((t) => t.counts.with_phone)),
    systems: some(systems?.items.length ?? 0),
    systemFloor: systems?.floor ?? null,
    leadership: some(
      FACILITY_KINDS.reduce((total, kind) => total + (roles.get("all", kind.type)?.people ?? 0), 0),
    ),
    refreshed: catalogue?.refreshed_at ? catalogue.refreshed_at.slice(0, 10) : null,
    utilisation: fromApi(catalogue?.medicare_utilisation ?? null),
    specialties: specialtyShares(classes),
  };
}

/**
 * The per-specialty rows, from the classification rows of the catalogue.
 *
 * Classifications only, and for the same reason the counts above sum only those: a specialisation
 * sits inside its classification, so a table carrying both would list the same clinicians twice and
 * invite a reader to add up a column that must not be added up. A buyer who wants the
 * specialisation - interventional cardiology rather than cardiology - reads it on that list's own
 * page, where it is published the same way.
 *
 * A specialty with no measurement is left out rather than shown as a zero.
 */
function specialtyShares(
  classes: { slug: string; label: string; medicare_utilisation: unknown }[],
): SpecialtyShare[] {
  const rows = classes
    .flatMap((row) => {
      const measured = fromApi(row.medicare_utilisation as Parameters<typeof fromApi>[0]);
      return measured ? [{ slug: row.slug, label: row.label, measured }] : [];
    })
    .sort((a, b) => b.measured.clinicians - a.measured.clinicians)
    .slice(0, SPECIALTIES_SHOWN)
    .sort((a, b) => shareOf(b.measured) - shareOf(a.measured));
  // With nothing loaded every row would read "0", and a table of zeros is the reading this page
  // refuses everywhere else: it says "none of these specialties bills Medicare" rather than "we
  // have not loaded it". No table at all, and the sentence above the boundary says which it is.
  return rows.some((row) => !heldNone(row.measured)) ? rows : [];
}

/** For ordering only. A specialty whose base is under the floor sorts last and prints no share. */
function shareOf(measured: Utilisation): number {
  if (!measured.sharePublished || measured.clinicians === 0) return -1;
  return measured.withProcedures / measured.clinicians;
}

function n(value: number | null): string | null {
  return value === null ? null : value.toLocaleString("en-US");
}

/**
 * The facility sentence, from whichever of its three figures came back. Each clause stands on
 * its own so one unreadable count does not take the others with it, and an empty sentence is
 * null rather than a paragraph of nothing.
 */
function facilityNote(f: Figures): string | null {
  const parts: string[] = [];
  if (f.facilities !== null) {
    parts.push(
      f.beds !== null
        ? `${n(f.facilities)} certified facilities on file, ${n(f.beds)} certified beds between them.`
        : `${n(f.facilities)} certified facilities on file.`,
    );
  }
  if (f.systems !== null) {
    parts.push(
      f.systemFloor !== null
        ? `${n(f.systems)} systems and chains have a page of their own, which takes ${f.systemFloor} or more active facilities.`
        : `${n(f.systems)} systems and chains have a page of their own.`,
    );
  }
  return parts.length > 0 ? parts.join(" ") : null;
}

const PROVIDER_FIELDS = [
  {
    group: "Identity",
    holds:
      "Name and credentials as filed — the whole name, and the parts it was filed in: prefix, first, middle, last and suffix for a person, its own name for an organization. The ten-digit identifier, whether the record is a person or an organization, whether it is active, and the date the identifier was first issued.",
    cadence: "Weekly",
  },
  {
    group: "Specialty",
    holds:
      "Primary and secondary taxonomies, the classification and specialization each one sits under, and the state each was filed against. Asking for a classification matches every specialty beneath it.",
    cadence: "Weekly",
  },
  {
    group: "Practice location",
    holds:
      "Practice and mailing address, city, state and ZIP, practice phone and fax, and the additional locations an organization files under the same identifier.",
    cadence: "Weekly",
  },
  {
    group: "Affiliations",
    holds:
      "The employer or group a provider bills under, billing reassignments, and the organization identifier where the employer has one of its own.",
    cadence: "Monthly",
  },
  {
    group: "Licenses",
    holds: "License number and state as filed against each taxonomy on the record.",
    cadence: "Monthly",
  },
  {
    group: "Standing",
    holds:
      "Federal program exclusions with the dates they began, and opt-out and revocation flags - so you can see, before you spend anything, whether a provider can be billed for at all.",
    cadence: "Monthly",
  },
  {
    group: "Work email",
    holds:
      "A work email where one has been confirmed, carrying the tier it was confirmed at and the date. Shown to signed-in customers, one provider at a time, never on a public page.",
    cadence: "Continuous",
  },
] as const;

const ORG_FIELDS = [
  {
    group: "Family",
    holds:
      "Which kind of certified organization it is - hospital, nursing home, hospice, home health agency, dialysis center, or another certified type - and the category beneath that.",
    cadence: "Monthly",
  },
  {
    group: "Certification",
    holds:
      "The certification number where the organization holds one, the date it was certified, and whether it is still in the program. One that has left is dropped from search and from its own page rather than left standing.",
    cadence: "Monthly",
  },
  {
    group: "Size and ownership",
    holds:
      "Certified beds, ownership type, the chain it reports under, whether it offers emergency services, and its published quality ratings.",
    cadence: "Monthly",
  },
  {
    group: "Health system",
    holds:
      "Whether it belongs to a system or chain large enough to publish, which one, and what else that system operates.",
    cadence: "Monthly",
  },
  {
    group: "Leadership",
    holds:
      "How many named leadership contacts the organization has, by role - chief executives, finance, nursing, medical directors, administrators, compliance, board members and owners. Counts on public pages; the names themselves for signed-in customers.",
    cadence: "Monthly",
  },
  {
    group: "Linked providers",
    holds:
      "The clinicians who bill under the organization or practice at the facility, counted by specialty, and the other locations filed under the same identifier.",
    cadence: "Weekly",
  },
] as const;

const TIERS = [
  {
    tier: "Trusted",
    means: "Safe to send. This is the only tier the append tool will use unless you widen it.",
  },
  {
    tier: "Probable",
    means: "Good enough to tell you where somebody works, not good enough to mail without care.",
  },
  { tier: "Doubtful", means: "Kept and shown to you, and never acted on." },
  { tier: "Rejected", means: "Not usable, and said so rather than quietly dropped." },
] as const;

/**
 * The questions, as a function of the measurement: one answer quotes the coverage share, and that
 * figure is read from the platform rather than typed here. With nothing to hand the answer states
 * the limit without a number instead of quoting one from memory.
 */
function faq(measured: Utilisation | null) {
  const coverage = measured
    ? `it covers about one in ${oneInWords(measured)} clinicians nationally rather than nearly all of them - far more in the specialties that bill Medicare Part B most, which is published per specialty on this page -`
    : "it covers a minority of clinicians rather than nearly all of them, per the measurement published on this page,";
  return [
  {
    q: "Where does the data come from?",
    a: "The public record: what providers and the organizations they work for file about themselves in federal filings, plus the published certification and quality records for facilities. We assemble and verify it; we do not invent any part of it, and every field carries the date it was last confirmed so you can see how current it is before you rely on it.",
  },
  {
    q: "What does the confirmed date actually mean?",
    a: "The date that field was last confirmed against a refresh - not the date the page was built, and not the date the record was created. A field nobody has confirmed recently says so, which is the point: you can decide what is fresh enough for what you are doing rather than trusting a single figure for the whole database.",
  },
  {
    q: "How complete is the contact coverage?",
    a: "Practice phone is on the large majority of records because it is filed with the public record. Work email is smaller by a wide margin and always will be, because it has to be confirmed rather than filed. We publish the counts per specialty and per state on the list pages so you can check coverage for your own segment before you buy anything.",
  },
  {
    q: "Do you have claims data?",
    a: `We have published Medicare data - what a provider billed, procedure by procedure, and what they prescribed under Part D - for ${YEAR}, one data year. We do not have all-payor claims. The difference matters twice: ours is Medicare fee-for-service only, so commercial, Medicaid and Medicare Advantage volume is not in it, and ${coverage} because low-volume providers are removed from the published file before we receive it. If what you need is every payor for every clinician, a claims licensee has it and we do not. If what you need is to find the clinicians who demonstrably do a procedure or write a drug, and reach them, that is what this is for.`,
  },
  {
    q: "Why is a provider blank on the procedure columns?",
    a: "Because nothing was published for them, and we cannot tell you which of three reasons applies. Low-volume rows are removed from the published file before we ever see it, so a blank covers a provider with no Medicare volume, one whose volume was below the publication threshold, and one who does not bill Medicare at all. Nothing in the published data separates them, so we show one phrase for all three rather than a badge that implies we know.",
  },
  {
    q: "Is there a field-by-field data dictionary?",
    a: "Yes, at /fields. The tables on this page are groups; the reference has one entry per field with what it means in plain English, what it is actually used for, how complete it is where we measure that, what it costs on your plan, and the name it travels under in the API, in an export column and in the append tool. The same list is machine-readable at /fields.json.",
  },
  {
    q: "Is there any patient data in here?",
    a: "No. None, in any form: not identified, not de-identified, not aggregated. The platform holds who a provider is, what they practice, where they practice, who they work for, and - from published Medicare data - what they billed and prescribed. That last part is an aggregate published about the provider: a count of procedures and of prescriptions, attached to the provider, with nobody behind it. There is no record of any individual patient, no visit, no diagnosis and no prescription traceable to a person.",
  },
  {
    q: "What happens when a provider asks to be removed?",
    a: "The request applies to every search, every page, every count and every file, and it keeps applying - a later refresh does not bring the values back. On a page a suppressed field says it was withheld rather than reading as blank; in a file the value is left out and counted in the job result, so the gap is a number rather than an absence somebody mistakes for nothing on file. The record is never deleted outright, because deleting it is what would let the next refresh recreate it.",
  },
  {
    q: "Can I check a claim on this page?",
    a: "Every count here is read live from the same API a customer calls, and the same numbers appear on the directory, the list pages and the facility pages. Search is open without an account, so the fastest way to judge the data is to look up a provider you already know and see whether we have them right.",
  },
  ] as const;
}

export const metadata: Metadata = {
  title: "What is in the provider data",
  description:
    "What a provider and an organization record hold, how often each part is refreshed, how a work email is confirmed, and what is deliberately not in the platform.",
  alternates: { canonical: "/data" },
  openGraph: socialCard(
    "/data",
    "What is in the provider data",
    "The fields, the refresh cadence, how email is confirmed, and what we do not hold.",
  ),
};

export default async function DataPage() {
  // At request time, not at build: the build has no API to call, and a page baked without its
  // numbers would serve that until the next revalidation. The calls inside stay cached for a
  // day by `call()` in lib/api.ts, so a crawl lands on the cache.
  await connection();
  const f = await figures().catch(() => NONE);
  // The raw measurement stays on `f` because the table below has to say which of the two states we
  // are in; everything that quotes a share in prose reads this one, which is null when there is no
  // share to quote.
  const measured = publishable(f.utilisation);
  const stats: { value: string; label: string }[] = [];
  const push = (value: string | null, label: string) => {
    if (value !== null) stats.push({ value, label });
  };
  push(n(f.providers), "providers, individuals and organizations");
  push(n(f.facilities), "certified facilities, across five families");
  push(n(f.specialtyLists), "specialty lists with rows behind them");
  push(n(f.leadership), "leadership contacts, counted by role on public pages");

  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebPage",
              "@id": siteUrl("/data#page"),
              name: "What is in the provider data",
              url: siteUrl("/data"),
              description: metadata.description as string,
              isPartOf: websiteRef(),
              // The page is the description of the dataset; saying so is what lets a dataset
              // search or an assistant find the description from the data and the data from the
              // description.
              mainEntity: { "@id": PLATFORM_DATASET_ID() },
            },
            // The dataset this whole site is a view of, described where the site describes it in
            // words: the same field groups, the same coverage, the same refresh cadences. Every
            // list page declares itself part of this node. Nothing is claimed here that the page
            // below does not say, and no source is named - what the data is, not where it is from.
            {
              "@type": "Dataset",
              "@id": PLATFORM_DATASET_ID(),
              name: `${SITE_NAME} US healthcare provider data`,
              alternateName: "US healthcare provider and organization records",
              description: metadata.description as string,
              url: siteUrl("/data"),
              ...(f.refreshed ? { dateModified: f.refreshed } : {}),
              spatialCoverage: "United States",
              keywords: [
                "healthcare providers",
                "National Provider Identifier",
                "NPI",
                "medical specialties",
                "healthcare organizations",
                "certified facilities",
                "health systems",
              ],
              // The two tables below, in the vocabulary a machine reads them in: the same groups,
              // the same wording, generated from the same constants, so the markup cannot drift
              // from the page.
              variableMeasured: [...PROVIDER_FIELDS, ...ORG_FIELDS].map((row) => ({
                "@type": "PropertyValue",
                name: row.group,
                description: row.holds,
              })),
              // The refresh promise the tables make, said once per cadence rather than per row.
              measurementTechnique: [
                ...new Set(
                  [...PROVIDER_FIELDS, ...ORG_FIELDS].map(
                    (row) => `${row.group}: refreshed ${row.cadence.toLowerCase()}`,
                  ),
                ),
              ],
              distribution: {
                "@type": "DataDownload",
                encodingFormat: "application/json",
                name: `${SITE_NAME} REST API, version 1`,
                description:
                  "Read access over the versioned REST API, with a scoped key. The reference is public.",
                url: siteUrl("/docs/api"),
              },
              ...datasetBase(),
            },
            {
              "@type": "FAQPage",
              mainEntity: faq(measured).map(({ q, a }) => ({
                "@type": "Question",
                name: q,
                acceptedAnswer: { "@type": "Answer", text: a },
              })),
            },
          ],
        }}
      />

      <section className="hero">
        <div className="wrap">
          <span className="eyebrow">
            <span className="dot" aria-hidden="true" />
            What is in it · how fresh · how it is checked
          </span>
          <h1>Every field carries the date it was last confirmed.</h1>
          <p className="lede">
            Most provider databases are sold on a single number and a promise. This page is the
            other thing: what a record actually holds, how current each part of it is, how a work
            email earns the right to be shown to you, and what we do not hold at all. Every count
            on this page is read from the same API a customer calls.
          </p>
          <div className="actions" style={{ marginTop: 22 }}>
            <Link className="btn primary lg" href="/search">
              Search the records
            </Link>
            <Link className="btn lg" href="/pricing">
              See plans
            </Link>
          </div>

          {stats.length > 0 && (
            <div className="stats" style={{ marginTop: 26 }}>
              {stats.map((s) => (
                <div className="stat" key={s.label}>
                  <span className="value num">{s.value}</span>
                  <span className="label">{s.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow rule">A provider record</div>
            <h2>Seven kinds of fact about one person, reconciled onto one record.</h2>
            <p className="lede">
              Each group is refreshed on its own schedule, and each field carries the date it was
              last confirmed - so a record is never uniformly &ldquo;current&rdquo; or
              &ldquo;stale&rdquo;, and you can see which parts of it to lean on.
            </p>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Group</th>
                  <th>What it holds</th>
                  <th>Refreshed</th>
                </tr>
              </thead>
              <tbody>
                {PROVIDER_FIELDS.map((row) => (
                  <tr key={row.group}>
                    <td>
                      <b>{row.group}</b>
                    </td>
                    <td className="fine">{row.holds}</td>
                    <td className="fine">{row.cadence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="fine" style={{ marginTop: 16 }}>
            These are groups, not fields. Every individual field - what it means, what it is used
            for, how complete it is, what it costs, and its name in the API, in an export column
            and in the append tool - is on the{" "}
            <Link href="/fields">field reference</Link>.
          </p>
          <p className="fine" style={{ marginTop: 16 }}>
            A provider&apos;s home address and personal mobile are a separate, licensed product:
            available under contract only, matched to the named provider, and never included in an
            export or a list. They are revealed one provider at a time, counted, and logged.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow rule">What they do</div>
            <h2>What a provider bills, and what they prescribe.</h2>
            <p className="lede">
              The rest of this page is who a provider is. This part is what they do: the
              procedures they billed Medicare for, code by code, and the drugs they prescribed
              under Part D, drug by drug. You can filter on either without knowing a code &mdash;
              search &ldquo;total knee replacement&rdquo; or &ldquo;Eliquis&rdquo; &mdash; and read
              the detail for a provider you care about. The limits are below, in full, because they
              decide whether this is any use to you.
            </p>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>What it holds</th>
                  <th>Year</th>
                  <th>Clinicians with a published row</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <b>Procedures billed</b>
                    <span className="fine" style={{ display: "block" }}>
                      Every procedure code a provider billed, at each place of service, with the
                      volume and the published average charge, allowed amount and payment.
                    </span>
                  </td>
                  <td className="fine">{YEAR}</td>
                  <td className="fine">
                    {f.utilisation === null ? (
                      "Not published just now"
                    ) : heldNone(f.utilisation) ? (
                      NOT_HELD
                    ) : (
                      <>
                        <b className="num">{count(f.utilisation.withProcedures)}</b> of{" "}
                        {count(f.utilisation.clinicians)}{" "}
                        <span style={{ display: "block" }}>
                          {f.utilisation.sharePublished
                            ? `${percent(
                                f.utilisation.withProcedures,
                                f.utilisation.clinicians,
                              )} of active individual providers`
                            : "active individual providers - too few to publish a share"}
                        </span>
                      </>
                    )}
                  </td>
                </tr>
                <tr>
                  <td>
                    <b>Prescribing</b>
                    <span className="fine" style={{ display: "block" }}>
                      Every drug a prescriber wrote under Part D, by brand and by generic name,
                      with claims, beneficiaries and drug cost as published.
                    </span>
                  </td>
                  <td className="fine">{YEAR}</td>
                  <td className="fine">
                    {f.utilisation === null ? (
                      "Not published just now"
                    ) : heldNone(f.utilisation) ? (
                      NOT_HELD
                    ) : (
                      <>
                        <b className="num">{count(f.utilisation.withPrescribing)}</b> of{" "}
                        {count(f.utilisation.clinicians)}{" "}
                        <span style={{ display: "block" }}>
                          {f.utilisation.sharePublished
                            ? `${percent(
                                f.utilisation.withPrescribing,
                                f.utilisation.clinicians,
                              )} of active individual providers`
                            : "active individual providers - too few to publish a share"}
                        </span>
                      </>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="fine" style={{ marginTop: 16 }}>
            {f.utilisation === null
              ? "The platform did not answer for these counts just now, so no figure is shown rather than a zero — a zero here would say nobody bills Medicare."
              : heldNone(f.utilisation)
                ? `The platform measured this and found none of it loaded: the count is not a statement about the ${count(
                    f.utilisation.clinicians,
                  )} clinicians it was measured over, it is one about us. Nothing published here is a coverage figure until the data is in.`
                : `${
                  f.utilisation.measuredOn
                    ? `Both counts were measured on ${f.utilisation.measuredOn}.`
                    : "Both counts are measured rather than estimated."
                } They are counts of providers with at least one published row, not estimates, and they are read from the platform's own measurement rather than typed onto this page. Counting distinct providers across ten million procedure lines is not something a page load can do while you wait, which is why they carry a date instead of claiming to be live.`}
          </p>

          <div className="card feature" style={{ marginTop: 22 }}>
            <h3>Read this before you price it in</h3>
            <ul className="fine">
              {boundary(measured).map((line) => (
                <li key={line.slice(0, 32)} style={{ marginTop: 8 }}>
                  {line}
                </li>
              ))}
            </ul>
            <p className="fine" style={{ marginTop: 14 }}>
              {METERING} How it compares with an all-payor claims vendor is set out on{" "}
              <Link href="/why-npi-mark">why NPI Mark</Link>; the individual fields, and what each
              one is for, are on the <Link href="/fields">field reference</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* The same measurement, cut by specialty. It sits directly under the boundary because the
          national share is the number a prospect leaves with otherwise, and for the specialties
          that bill Medicare Part B for a living it is the wrong number to leave with. */}
      {f.specialties.length > 0 && (
        <section className="section">
          <div className="wrap">
            <div className="section-head">
              <div className="eyebrow rule">By specialty</div>
              <h2>The national share is not your specialty&apos;s share.</h2>
              <p className="lede">
                {measured
                  ? `About one in ${oneInWords(
                      measured,
                    )} clinicians has a published procedure line, and that average carries every profession that never bills Medicare Part B at all — dentists, most therapists, practices that see no Medicare patients. `
                  : ""}
                Measured per specialty, over the same population and in the same pass, the picture
                is different enough to matter. These are the largest specialties we publish a list
                for, highest share first. Each one links to its own list page, where the same
                figure appears beside the contact coverage for that segment.
              </p>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Specialty</th>
                    <th>Clinicians</th>
                    <th>With a procedure line</th>
                    <th>With prescribing</th>
                  </tr>
                </thead>
                <tbody>
                  {f.specialties.map((s) => (
                    <tr key={s.slug}>
                      <td>
                        <Link href={listPath(s.slug)}>{s.label}</Link>
                      </td>
                      <td className="num fine">{count(s.measured.clinicians)}</td>
                      <td className="fine">
                        {s.measured.sharePublished ? (
                          <>
                            <b className="num">
                              {percent(s.measured.withProcedures, s.measured.clinicians)}
                            </b>
                            <span style={{ display: "block" }}>
                              {count(s.measured.withProcedures)} clinicians
                            </span>
                          </>
                        ) : (
                          <>
                            <b className="num">{count(s.measured.withProcedures)}</b>
                            <span style={{ display: "block" }}>too few to publish a share</span>
                          </>
                        )}
                      </td>
                      <td className="fine">
                        {s.measured.sharePublished ? (
                          <>
                            <b className="num">
                              {percent(s.measured.withPrescribing, s.measured.clinicians)}
                            </b>
                            <span style={{ display: "block" }}>
                              {count(s.measured.withPrescribing)} clinicians
                            </span>
                          </>
                        ) : (
                          <>
                            <b className="num">{count(s.measured.withPrescribing)}</b>
                            <span style={{ display: "block" }}>too few to publish a share</span>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="fine" style={{ marginTop: 12 }}>
              Counted over active individual providers filed under each specialty - the same
              population as the national figure above, so the two can be read together and the
              specialties sum back to it. That is a different base from the record counts on a list
              page, which are after removals and include the organizations filed under the same
              specialty.{" "}
              {f.specialties.some((s) => !s.measured.sharePublished)
                ? `${tooFewToPublish(f.specialties[0].measured)} `
                : ""}
              Every published specialty carries its own figure on its own list page, and all of
              them are in <Link href="/fields.json">fields.json</Link>.
            </p>
            <p className="fine" style={{ marginTop: 10 }}>
              {SHARE_IS_NOT_CONTACT_DATA}
            </p>
            <p className="fine" style={{ marginTop: 10 }}>
              Everything in the boundary above applies to every row here: published Medicare
              fee-for-service data for {YEAR}, low-volume rows removed before publication so a
              blank cannot be told from no volume, one year and no history, and provider-level
              aggregates only.
            </p>
          </div>
        </section>
      )}

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow rule">An organization record</div>
            <h2>The places they practice, and who runs them.</h2>
            <p className="lede">
              Certified facilities carry everything a provider record does, plus what only an
              organization has: a certification, a size, an owner, a chain and a leadership team.
            </p>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Group</th>
                  <th>What it holds</th>
                  <th>Refreshed</th>
                </tr>
              </thead>
              <tbody>
                {ORG_FIELDS.map((row) => (
                  <tr key={row.group}>
                    <td>
                      <b>{row.group}</b>
                    </td>
                    <td className="fine">{row.holds}</td>
                    <td className="fine">{row.cadence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="hints" style={{ justifyContent: "flex-start", marginTop: 20 }}>
            <span>Browse it:</span>
            {FACILITY_KINDS.map((kind) => (
              <Link key={kind.type} href={`/${kind.slug}`}>
                {kind.plural}
              </Link>
            ))}
            <Link href="/systems">Health systems</Link>
            <Link href="/directory">The whole directory</Link>
          </div>
          {facilityNote(f) !== null && (
            <p className="fine" style={{ marginTop: 16 }}>
              {facilityNote(f)}
            </p>
          )}
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow rule">How a work email is confirmed</div>
            <h2>A tier with its reasoning attached, not a green tick.</h2>
            <p className="lede">
              A work email is the one field on a record that cannot simply be read off a filing,
              so it is the one field we score. Each address is measured against signals we can
              each name - whether its domain belongs to a real employer or is a consumer mailbox,
              whether a verifier found it deliverable, whether the address matches the
              provider&apos;s own name, whether it is a shared desk address rather than a person,
              how many other providers carry the identical address, and whether the domain
              resolves at all.
            </p>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tier</th>
                  <th>What it means for you</th>
                </tr>
              </thead>
              <tbody>
                {TIERS.map((row) => (
                  <tr key={row.tier}>
                    <td>
                      <b>{row.tier}</b>
                    </td>
                    <td className="fine">{row.means}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid two" style={{ alignItems: "start", marginTop: 26 }}>
            <div className="panel">
              <h3>Every score keeps its own arithmetic</h3>
              <p className="fine">
                A tier stores the signals that produced it and what each one contributed, so a
                badge is explainable rather than asserted. When you ask why an address is only
                probable, there is an answer, and it is the same answer every time.
              </p>
            </div>
            <div className="panel">
              <h3>Unmeasured is never treated as fine</h3>
              <p className="fine">
                An address that has not been scored yet fails every trust filter and is not used
                to derive anything. The alternative - defaulting an unknown to acceptable - is how
                a database quietly fills with addresses nobody ever checked.
              </p>
            </div>
          </div>
          {f.withEmail !== null && f.listed !== null && (
            <p className="fine" style={{ marginTop: 20 }}>
              Across the published specialty lists - {n(f.listed)} providers -{" "}
              {n(f.withEmail)} carry a work email
              {f.withTrustedEmail !== null ? `, ${n(f.withTrustedEmail)} of them in the trusted tier` : ""}
              {f.withPhone !== null ? `, and ${n(f.withPhone)} carry a practice phone` : ""}. The
              same counts are published per specialty and per state on the{" "}
              <Link href="/lists">list pages</Link>, so you can check coverage for your own
              segment before you buy anything.
            </p>
          )}
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow rule">When somebody asks to be left alone</div>
            <h2>Suppression applies to every search, page, count and file.</h2>
          </div>
          <div className="grid">
            <div className="card feature">
              <h3>Everywhere, not just the search box</h3>
              <p>
                A request reaches the public pages, the signed-in search, the counts the directory
                publishes, every export and every appended file. A suppression that held in one
                place and not another would be no suppression at all.
              </p>
            </div>
            <div className="card feature">
              <h3>Withheld, and never just missing</h3>
              <p>
                On a page a withheld value says it was withheld, because a quiet blank reads as
                &ldquo;nothing on file&rdquo; and sends somebody looking for it somewhere else. In
                a file the value is left out and counted in the job result, so the gap is a number
                you can check rather than one you have to notice.
              </p>
            </div>
            <div className="card feature">
              <h3>It keeps applying</h3>
              <p>
                Records are rebuilt from filings every week, so a removal has to survive the
                rebuild. The mark is held against the identifier rather than the row, which is why
                the record is never simply deleted: a deleted record is one the next refresh
                recreates.
              </p>
            </div>
          </div>
          <p className="fine" style={{ marginTop: 20 }}>
            Healthcare professionals can ask for their own details to be removed at{" "}
            <Link href="/remove-my-information">remove my information</Link>. Customers are held
            to the same line in the <Link href="/terms">terms</Link>.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow rule">What is not here</div>
            <h2>The part of a data sheet nobody else writes down.</h2>
            <p className="lede">
              A buyer can verify what we claim to hold by looking. What we do not hold has to be
              said out loud, because absence is the one thing a search cannot demonstrate.
            </p>
          </div>
          <div className="grid two">
            <div className="card feature">
              <h3>No patient data, in any form</h3>
              <p>
                Not identified, not de-identified, not aggregated, not a single line with a person
                behind it. The platform knows who a provider is and where they practice. It knows
                nothing about anybody they have treated, and it never will.
              </p>
            </div>
            <div className="card feature">
              <h3>No all-payor claims</h3>
              <p>
                What we hold is published Medicare fee-for-service volume for {YEAR}, covering{" "}
                {measured
                  ? `about one in ${oneInWords(measured)} clinicians nationally, and more of the specialties that bill it most`
                  : "a minority of clinicians rather than nearly all of them"}
                . A vendor licensing all-payor claims sees
                commercial, Medicaid and Medicare Advantage volume across nearly every clinician,
                and sees it sooner. That is a real difference and we are not going to argue it
                away &mdash; <Link href="/why-npi-mark">we set out where each one wins</Link>.
              </p>
            </div>
            <div className="card feature">
              <h3>No clinical records</h3>
              <p>
                No diagnoses, no notes, no outcomes attributable to an individual patient. Where we
                carry a facility&apos;s quality rating it is the rating as published, about the
                facility, and we neither recompute it nor infer anything beneath it.
              </p>
            </div>
            <div className="card feature">
              <h3>No consumer marketing file mixed in</h3>
              <p>
                A provider record is a provider record. Nothing from a consumer audience is folded
                into it, blended into a count, or shipped inside a provider export. The licensed
                home address and mobile are a contract of their own, revealed per provider and
                never listed.
              </p>
            </div>
            <div className="card feature">
              <h3>No scores we cannot show you the working for</h3>
              <p>
                No propensity number, no likelihood-to-buy, no invented completeness grade. Where
                we do score something - a work email - the arithmetic travels with it. Changes we
                report are <Link href="/intent-data">dated facts</Link> instead.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap narrow">
          <div className="section-head">
            <div className="eyebrow rule">Questions</div>
            <h2>What buyers ask before they trust a file.</h2>
          </div>
          <div className="faq">
            {faq(measured).map(({ q, a }) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>

          <div className="cta" style={{ marginTop: 32 }}>
            <h2>Judge it on a provider you already know.</h2>
            <p className="lede">
              Search is open without an account. Look somebody up, check what we have against what
              you know, and decide from that rather than from a page.
            </p>
            <div className="actions">
              <Link className="btn primary lg" href="/search">
                Search providers
              </Link>
              <Link className="btn lg" href="/physicians">
                Physician data
              </Link>
              <Link className="btn lg" href="/nurses">
                Nurse and NP data
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

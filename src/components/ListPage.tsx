import { POSITIONING } from "@/content/positioning";
import Link from "next/link";
import { CtaLink } from "@/components/CtaLink";
import { JsonLd } from "@/components/JsonLd";
import type { FacilityListDetail, TaxonomyListDetail } from "@/lib/api";
import {
  boundaryShort,
  fromApi,
  percent,
  publishable,
  SHARE_IS_NOT_CONTACT_DATA,
  tooFewToPublish,
  YEAR,
} from "@/lib/claims";
import { kindPath } from "@/lib/facilities";
import { glossaryForList, glossaryPath } from "@/lib/glossary";
import {
  FACILITY_FIELDS,
  FACILITY_USE_CASES,
  PROVIDER_FIELDS,
  PROVIDER_USE_CASES,
  type Faq,
  facilityCountRows,
  facilityKindForList,
  faqJsonLd,
  fmt,
  listPath,
  providerCountRows,
  refreshedOn,
  sampleFacilityRecord,
  sampleProviderRecord,
  share,
  utilisationRows,
} from "@/lib/lists";
import { breadcrumb, datasetBase, platformDatasetRef } from "@/lib/schema";
import { siteUrl, stateName } from "@/lib/site";

/**
 * One list product page - a taxonomy or a facility type, nationally or in one state.
 *
 * Built like a list broker's product page, but every number on it is counted: the records, the
 * share with a work email, the share of those emails in the trusted tier, phone and location.
 * The FAQ is generated from those same numbers and nothing else, so it can never claim what the
 * data does not back. The sample record is invented and labelled as such.
 *
 * A provider list also carries what the people on it *do*: the share of the specialty whose Medicare
 * utilisation is published, measured by the platform over active individual clinicians filed under
 * the specialty. It is the answer to "one in six is discouraging" for a buyer who is already looking
 * at their own segment, and it is deliberately a panel of its own beside the counts, because its
 * denominator is not the record count - and a buyer who reads the two as one number has been misled
 * by the layout. `SHARE_IS_NOT_CONTACT_DATA` says the rest of that out loud.
 */

type Crumb = { name: string; href: string };

function Breadcrumbs({ crumbs, current }: { crumbs: Crumb[]; current: string }) {
  return (
    <ol className="crumbs">
      <li>
        <Link href="/">Home</Link>
      </li>
      {crumbs.map((c) => (
        <li key={c.href}>
          <Link href={c.href}>{c.name}</Link>
        </li>
      ))}
      <li aria-current="page">{current}</li>
    </ol>
  );
}

/** The same trail `Breadcrumbs` above displays, written once in `lib/schema.ts`. */
function breadcrumbJsonLd(crumbs: Crumb[], current: string, path: string) {
  return breadcrumb([...crumbs, { name: current, href: path }]);
}

function Panel({ title, rows }: { title: string; rows: { name: string; value: string; note: string }[] }) {
  return (
    <div className="panel">
      <h2>{title}</h2>
      <dl className="rows">
        {rows.map((r) => (
          <div key={r.name}>
            <dt>
              {r.name}
              <span className="fine" style={{ display: "block" }}>
                {r.note}
              </span>
            </dt>
            <dd className="num">
              <b>{r.value}</b>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Fields({ fields, sample, label }: { fields: readonly { field: string; detail: string }[]; sample: { field: string; value: string }[]; label: string }) {
  return (
    <div className="grid two" style={{ alignItems: "start" }}>
      <div className="panel">
        <h3>What each record carries</h3>
        <dl className="rows">
          {fields.map((f) => (
            <div key={f.field}>
              <dt>{f.field}</dt>
              <dd className="fine">{f.detail}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="panel">
        <h3>Sample record</h3>
        <p className="fine">
          Invented for illustration - not a real {label}. Names, numbers and addresses here are
          fictional.
        </p>
        <dl className="rows">
          {sample.map((f) => (
            <div key={f.field}>
              <dt>{f.field}</dt>
              <dd className="mono fine">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function UseCases({ items }: { items: readonly { title: string; body: string }[] }) {
  return (
    <div className="grid two" style={{ alignItems: "start" }}>
      {items.map((u) => (
        <div className="panel" key={u.title}>
          <h3>{u.title}</h3>
          <p className="fine">{u.body}</p>
        </div>
      ))}
    </div>
  );
}

function FaqBlock({ faq }: { faq: readonly Faq[] }) {
  return (
    <div>
      {faq.map((f) => (
        <div className="panel" key={f.q}>
          <h3>{f.q}</h3>
          <p>{f.a}</p>
        </div>
      ))}
    </div>
  );
}

function Cta({ label, buildHref, buildLabel = "Browse records" }: { label: string; buildHref: string; buildLabel?: string }) {
  return (
    <div className="cta" style={{ marginTop: 32 }}>
      <h2>Get the {label.toLowerCase()} list</h2>
      <p className="lede">
        Sign up free to build this list with your own filters and see what each record carries
        before you buy anything.
      </p>
      <div className="actions" style={{ marginTop: 16 }}>
        <Link className="btn primary lg" href="/sign-up">
          Get started
        </Link>
        <Link className="btn lg" href={buildHref}>
          {buildLabel}
        </Link>
        <CtaLink event="bulk_data_cta_click" className="btn lg" href={`/bulk-data?${new URLSearchParams({list: label})}`}>Buy bulk data · Request a quote</CtaLink>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------ */

export function taxonomyTitle(list: TaxonomyListDetail): string {
  const place = list.state ? ` in ${stateName(list.state) ?? list.state}` : "";
  return `${list.label}${place} - email and mailing list`;
}

export function taxonomyDescription(list: TaxonomyListDetail): string {
  const place = list.state ? stateName(list.state) ?? list.state : "the US";
  const c = list.counts;
  return `${fmt(c.total)} ${list.label.toLowerCase()} in ${place}: ${fmt(c.with_email)} with work email (${fmt(
    c.with_trusted_email,
  )} trusted tier), ${fmt(c.with_phone)} with practice phone. Counts refreshed nightly.`;
}

function taxonomyFaq(list: TaxonomyListDetail): Faq[] {
  const c = list.counts;
  const place = list.state ? stateName(list.state) ?? list.state : "the United States";
  const lower = list.label.toLowerCase();
  const faq: Faq[] = [
    {
      q: `How many ${lower} are on the list?`,
      a: `${fmt(c.total)} active ${lower} in ${place}, counted from the register${
        refreshedOn(list.refreshed_at) ? ` on ${refreshedOn(list.refreshed_at)}` : ""
      }.`,
    },
    {
      q: `How many ${lower} have an email address?`,
      a: `${fmt(c.with_email)} (${share(c.with_email, c.total)}) have at least one work email on file, and ${fmt(
        c.with_trusted_email,
      )} of them have an address in the trusted tier.`,
    },
    {
      q: `How many have a phone number?`,
      a: `${fmt(c.with_phone)} (${share(c.with_phone, c.total)}) have a practice phone on their record.`,
    },
    {
      q: "What does a record include?",
      a: `NPI, name and credentials, specialty, practice city, state and ZIP, practice phone, employer, up to three work emails with where each came from, EHR system where evidenced, and the date the record was last updated.`,
    },
  ];
  if (!list.state && list.states.length > 0) {
    const top = list.by_state.slice(0, 3).map((s) => `${stateName(s.state) ?? s.state} (${fmt(s.counts.total)})`);
    faq.push({
      q: `Which states have the most ${lower}?`,
      a: `${top.join(", ")}. ${list.states.length} states have ${fmt(list.floor)} or more and a list page of their own.`,
    });
  }
  if (list.state) {
    faq.push({
      q: `What share of all US ${lower} practice in ${place}?`,
      a: `${share(c.total, list.national.total)} - ${fmt(c.total)} of ${fmt(list.national.total)} nationally.`,
    });
  }
  const measured = publishable(fromApi(list.medicare_utilisation));
  if (measured) {
    // Nationally, and the answer says so even on a state page: the measurement is taken once for
    // the country, and a state cut of it would be a share off a base a tenth the size.
    const answer = measured.sharePublished
      ? `${percent(measured.withProcedures, measured.clinicians)} of the ${fmt(
          measured.clinicians,
        )} active individual ${lower} on file have at least one published Medicare procedure line, and ${percent(
          measured.withPrescribing,
          measured.clinicians,
        )} have published prescribing - measured nationally${
          measured.measuredOn ? ` on ${measured.measuredOn}` : ""
        }. ${boundaryShort(measured)}`
      : `${fmt(measured.withProcedures)} of the ${fmt(
          measured.clinicians,
        )} active individual ${lower} on file have at least one published Medicare procedure line and ${fmt(
          measured.withPrescribing,
        )} have published prescribing, measured nationally. ${tooFewToPublish(measured)}`;
    faq.push({ q: `How many ${lower} have published Medicare data?`, a: answer });
  }
  return faq;
}

export function TaxonomyListPage({ list, path }: { list: TaxonomyListDetail; path: string }) {
  const glossary = glossaryForList(list.slug);
  const region = list.state ? stateName(list.state) ?? list.state : null;
  const heading = region ? `${list.label} in ${region}` : `${list.label} list`;
  const crumbs: Crumb[] = [{ name: "Lists", href: "/lists" }];
  if (region) crumbs.push({ name: list.label, href: listPath(list.slug) });
  const faq = taxonomyFaq(list);
  const measured = publishable(fromApi(list.medicare_utilisation));
  const searchHref = `/search?${new URLSearchParams({
    classification: list.classification,
    ...(list.state ? { state: list.state } : {}),
  })}`;
  const refreshed = refreshedOn(list.refreshed_at);

  return (
    <main className="np-list-detail">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Dataset",
              "@id": siteUrl(`${path}#dataset`),
              name: heading,
              description: taxonomyDescription(list),
              url: siteUrl(path),
              // The day the platform recounted this list, and nothing when it did not say. A
              // dataset that claims to have changed today, every day, is a dataset nobody trusts.
              ...(refreshed ? { dateModified: refreshed } : {}),
              spatialCoverage: region ?? "United States",
              // The columns a record on this list actually has - the same ones the page names
              // below, in the same words. Nothing here is a field we do not publish.
              variableMeasured: PROVIDER_FIELDS.map((f) => ({
                "@type": "PropertyValue",
                name: f.field,
                description: f.detail,
              })),
              isPartOf: platformDatasetRef(),
              ...datasetBase(),
            },
            faqJsonLd(faq),
            breadcrumbJsonLd(crumbs, heading, path),
          ],
        }}
      />
      <section className="section" style={{ paddingTop: 36 }}>
        <div className="wrap">
          <Breadcrumbs crumbs={crumbs} current={heading} />
          <div className="eyebrow rule">
            {list.grouping ?? "Providers"} · {list.level === "specialization" ? list.classification : "classification"}
            {refreshed ? ` · counts refreshed ${refreshed}` : ""}
          </div>
          <h1 style={{ fontSize: "clamp(1.8rem, 3.8vw, 2.7rem)" }}>{heading}</h1>
          <p className="lede">{taxonomyDescription(list)}</p>
          <p className="np-list-intro">{POSITIONING.directory} {POSITIONING.access}</p>
          <div className="np-list-metrics" aria-label="List coverage at a glance">
            <div><strong>{fmt(list.counts.total)}</strong><span>Active provider records</span></div>
            <div><strong>{share(list.counts.with_email, list.counts.total)}</strong><span>With work email on file</span></div>
            <div><strong>{fmt(list.counts.with_phone)}</strong><span>With practice phone</span></div>
            <div><strong>{refreshed ?? "Not supplied"}</strong><span>Counts last refreshed</span></div>
          </div>
          <div className="actions" style={{ marginTop: 16 }}>
            <Link className="btn primary lg" href="/sign-up">
              Get a free sample
            </Link>
            <Link className="btn lg" href={searchHref}>
              Explore {list.classification} records
            </Link>
          </div>
          {list.level === "specialization" && <p className="fine" style={{ marginTop: 12 }}>Search opens the broader {list.classification} classification. {list.codes.length > 0 ? "Use the taxonomy codes below to identify this specialization; " : ""}The broader search total may differ from this list.</p>}
          <nav className="np-list-jumps" aria-label="On this list page"><a href="#list-overview">Overview</a><a href="#list-geography">By state</a><a href="#list-fields">Included fields</a><a href="#list-uses">Use cases</a><a href="#list-questions">Questions</a></nav>

          <div id="list-overview" className="grid two" style={{ marginTop: 28, alignItems: "start" }}>
            <div>
              <Panel title="What the list holds" rows={providerCountRows(list.counts)} />
              {measured && (
                <div className="panel">
                  <h2>What they bill and prescribe</h2>
                  <p className="fine">
                    Published Medicare data for {YEAR}, measured over the{" "}
                    {fmt(measured.clinicians)} active individual {list.label.toLowerCase()} on file
                    nationally
                    {measured.measuredOn ? ` on ${measured.measuredOn}` : ""} &mdash; a different
                    base from the records above, and the same measurement the{" "}
                    <Link href="/data">data page</Link> publishes for every specialty.
                  </p>
                  <dl className="rows" style={{ marginTop: 10 }}>
                    {utilisationRows(measured, list.label).map((r) => (
                      <div key={r.name}>
                        <dt>
                          {r.name}
                          <span className="fine" style={{ display: "block" }}>
                            {r.note}
                          </span>
                        </dt>
                        <dd className="num">
                          <b>{r.value}</b>
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <p className="fine" style={{ marginTop: 10 }}>
                    {boundaryShort(measured)} A provider with nothing there has no published
                    Medicare volume, which covers no volume, volume below the publication threshold
                    and not billing Medicare at all &mdash; the published data does not separate
                    them, and one year is held, so nothing here is a trend.
                  </p>
                  <p className="fine" style={{ marginTop: 10 }}>
                    {SHARE_IS_NOT_CONTACT_DATA}
                  </p>
                </div>
              )}
            </div>
            <div>
              <div className="panel np-list-guide">
                <span className="eyebrow">Understand this audience</span>
                <h2>What does {list.label} mean here?</h2>
                <p>This list follows the provider taxonomy filed in the registry. {list.level === "specialization" ? `${list.label} is a specialization within ${list.classification}.` : `${list.classification} is the classification used for this audience.`} A taxonomy match describes a filed category; it does not establish current employment, board certification or availability for recruitment.</p>
                {list.codes.length > 0 && <p className="np-taxonomy-codes"><b>Taxonomy codes</b><br />{list.codes.map(code => <code key={code}>{code}</code>)}</p>}
                <h3>Make the list useful for your team</h3>
                <ol><li>Choose a state from the breakdown below.</li><li>Review the email and practice-phone coverage separately.</li><li>Check each provider’s practice location and available affiliation.</li><li>Sign in to reveal eligible contacts or prepare an export under your plan.</li></ol>
                <p className="fine">An email count is availability, not a promise of delivery. Contact access and export limits depend on your plan. <Link href="/help/email-trust">Understand email trust tiers</Link>.</p>
              </div>
              {list.related.length > 0 && (
                <div className="panel">
                  <h2>Related lists{region ? ` in ${region}` : ""}</h2>
                  <ul className="ticks" style={{ marginTop: 10 }}>
                    {list.related.slice(0, 12).map((r) => (
                      <li key={r.slug}>
                        <Link href={listPath(r.slug, list.state)}>{r.label}</Link>{" "}
                        <span className="fine num">{fmt(r.total)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {/* The reference page for this profession, where one is written. A buyer who has
                  landed on a list they are not certain about should not have to leave the site to
                  find out what the people on it do. */}
              {glossary && (
                <div className="panel">
                  <h2>{glossary.title}</h2>
                  <p className="fine">
                    {glossary.lede} <Link href={glossaryPath(glossary.term)}>Read the entry</Link> -
                    training, where they practice, what the letters mean and the closely related
                    professions.
                  </p>
                </div>
              )}
              <div className="panel">
                <h2>Leadership and facilities</h2>
                <p className="fine">
                  Reaching the organizations these providers work for?{" "}
                  <Link href="/leadership">Healthcare leadership by role</Link>,{" "}
                  <Link href="/systems">health systems</Link> and{" "}
                  <Link href="/lists">facility lists</Link>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div id="list-geography" className="eyebrow rule">By state</div>
            <h2>{region ? `Compare ${list.label} across states` : `${list.label} by state`}</h2>
          </div>
          <div className="table-wrap" role="region" aria-label="State coverage comparison" tabIndex={0}>
            <table>
              <thead>
                <tr>
                  <th>State</th>
                  <th>Records</th>
                  <th>With email</th>
                  <th>Trusted-tier email</th>
                  <th>With phone</th>
                </tr>
              </thead>
              <tbody>
                {list.by_state.length === 0 && <tr><td colSpan={5}>A state breakdown is not available for this list yet. The totals above are the available coverage.</td></tr>}
                {list.by_state.map((s) => (
                  <tr key={s.state} aria-current={s.state === list.state ? "true" : undefined}>
                    <td>
                      {s.published && s.state !== list.state ? (
                        <Link href={listPath(list.slug, s.state)}>{stateName(s.state) ?? s.state}</Link>
                      ) : (
                        stateName(s.state) ?? s.state
                      )}
                    </td>
                    <td className="num">{fmt(s.counts.total)}</td>
                    <td className="num">{fmt(s.counts.with_email)}</td>
                    <td className="num">{fmt(s.counts.with_trusted_email)}</td>
                    <td className="num">{fmt(s.counts.with_phone)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="fine" style={{ marginTop: 12 }}>
            States with fewer than {fmt(list.floor)} {list.label.toLowerCase()} are counted here but
            have no page of their own.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow rule">The data</div>
            <h2 id="list-fields">Fields and a sample</h2>
          </div>
          <Fields fields={PROVIDER_FIELDS} sample={sampleProviderRecord(list.label)} label="provider" />
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow rule">Use cases</div>
            <h2 id="list-uses">What teams use it for</h2>
          </div>
          <UseCases items={PROVIDER_USE_CASES} />
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow rule">FAQ</div>
            <h2 id="list-questions">Questions about this list</h2>
          </div>
          <FaqBlock faq={faq} />
          <Cta label={list.label} buildHref={searchHref} buildLabel={`Explore ${list.classification} records`} />
        </div>
      </section>
    </main>
  );
}

/* ------------------------------------------------------------------------------------------ */

export function facilityTitle(list: FacilityListDetail): string {
  const place = list.state ? ` in ${stateName(list.state) ?? list.state}` : "";
  // "with leadership contacts" is 24 characters of a title that a long label and a long
  // state name have already spent; the description still says it.
  return `${list.label}${place} - facility list`;
}

export function facilityDescription(list: FacilityListDetail): string {
  const place = list.state ? stateName(list.state) ?? list.state : "the US";
  const c = list.counts;
  return `${fmt(c.facilities)} certified ${list.label.toLowerCase()} in ${place}, ${fmt(c.beds)} certified beds, ${fmt(
    c.with_phone,
  )} with a main phone and ${fmt(c.with_leadership)} with named leadership on file.`;
}

function facilityFaq(list: FacilityListDetail): Faq[] {
  const c = list.counts;
  const place = list.state ? stateName(list.state) ?? list.state : "the United States";
  const lower = list.label.toLowerCase();
  const faq: Faq[] = [
    {
      q: `How many ${lower} are on the list?`,
      a: `${fmt(c.facilities)} certified ${lower} still operating in ${place}, with ${fmt(c.beds)} certified beds between them.`,
    },
    {
      q: `How many have leadership contacts?`,
      a: `${fmt(c.with_leadership)} (${share(c.with_leadership, c.facilities)}) have at least one named executive, officer or owner on file. Names and titles are available to signed-in customers.`,
    },
    {
      q: "What does a record include?",
      a: "Certification number, name and enrolled legal name, address, county and main phone, organization NPI, ownership type and chain, certified beds and published ratings, owners, and certification category and date.",
    },
  ];
  if (!list.state && list.by_state.length > 0) {
    const top = list.by_state.slice(0, 3).map((s) => `${stateName(s.state) ?? s.state} (${fmt(s.counts.facilities)})`);
    faq.push({ q: `Which states have the most ${lower}?`, a: `${top.join(", ")}.` });
  }
  return faq;
}

export function FacilityListPage({ list, path }: { list: FacilityListDetail; path: string }) {
  const kind = facilityKindForList(list.slug);
  const region = list.state ? stateName(list.state) ?? list.state : null;
  const heading = region ? `${list.label} in ${region}` : `${list.label} list`;
  const crumbs: Crumb[] = [{ name: "Lists", href: "/lists" }];
  if (region) crumbs.push({ name: list.label, href: listPath(list.slug) });
  const faq = facilityFaq(list);
  const directoryHref = kind ? kindPath(kind, list.state ?? undefined) : "/directory";
  const refreshed = refreshedOn(list.refreshed_at);

  return (
    <main className="np-list-detail np-facility-list">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Dataset",
              "@id": siteUrl(`${path}#dataset`),
              name: heading,
              description: facilityDescription(list),
              url: siteUrl(path),
              ...(refreshed ? { dateModified: refreshed } : {}),
              spatialCoverage: region ?? "United States",
              variableMeasured: FACILITY_FIELDS.map((f) => ({
                "@type": "PropertyValue",
                name: f.field,
                description: f.detail,
              })),
              isPartOf: platformDatasetRef(),
              ...datasetBase(),
            },
            faqJsonLd(faq),
            breadcrumbJsonLd(crumbs, heading, path),
          ],
        }}
      />
      <section className="section" style={{ paddingTop: 36 }}>
        <div className="wrap">
          <Breadcrumbs crumbs={crumbs} current={heading} />
          <div className="eyebrow rule">
            Facilities{refreshed ? ` · counts refreshed ${refreshed}` : ""}
          </div>
          <h1 style={{ fontSize: "clamp(1.8rem, 3.8vw, 2.7rem)" }}>{heading}</h1>
          <p className="lede">{facilityDescription(list)}</p>
<div className="np-list-metrics" aria-label="Facility coverage at a glance"><div><strong>{fmt(list.counts.facilities)}</strong><span>Facilities on file</span></div><div><strong>{fmt(list.counts.with_phone)}</strong><span>With main phone</span></div><div><strong>{fmt(list.counts.with_leadership)}</strong><span>With leadership on file</span></div><div><strong>{refreshed ?? "Not supplied"}</strong><span>Counts last refreshed</span></div></div>
          <div className="actions" style={{ marginTop: 16 }}>
            <Link className="btn primary lg" href="/sign-up">
              Get a free sample
            </Link>
            <Link className="btn lg" href={directoryHref}>
              Browse facility profiles
            </Link>
          </div>
          <div className="grid two" style={{ marginTop: 28, alignItems: "start" }}>
            <Panel title="What the list holds" rows={facilityCountRows(list.counts)} />
            <div className="panel">
              <h2>Browse them</h2>
              <p className="fine">
                Every facility on this list has a public profile.{" "}
                <Link href={directoryHref}>
                  Browse {list.label.toLowerCase()}
                  {region ? ` in ${region}` : " by state"}
                </Link>
                , see <Link href="/systems">health systems and chains</Link>, or{" "}
                <Link href="/leadership">leadership by role</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div id="list-geography" className="eyebrow rule">By state</div>
            <h2>{region ? `Compare ${list.label} across states` : `${list.label} by state`}</h2>
          </div>
          <div className="table-wrap" role="region" aria-label="State coverage comparison" tabIndex={0}>
            <table>
              <thead>
                <tr>
                  <th>State</th>
                  <th>Facilities</th>
                  <th>Certified beds</th>
                  <th>With main phone</th>
                  <th>With leadership</th>
                </tr>
              </thead>
              <tbody>
                {list.by_state.length === 0 && <tr><td colSpan={5}>A state breakdown is not available for this list yet. The totals above are the available coverage.</td></tr>}
                {list.by_state.map((s) => (
                  <tr key={s.state}>
                    <td>
                      {s.published && s.state !== list.state ? (
                        <Link href={listPath(list.slug, s.state)}>{stateName(s.state) ?? s.state}</Link>
                      ) : (
                        stateName(s.state) ?? s.state
                      )}
                    </td>
                    <td className="num">{fmt(s.counts.facilities)}</td>
                    <td className="num">{fmt(s.counts.beds)}</td>
                    <td className="num">{fmt(s.counts.with_phone)}</td>
                    <td className="num">{fmt(s.counts.with_leadership)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="fine" style={{ marginTop: 12 }}>
            States with fewer than {fmt(list.floor)} are counted here and listed in the directory,
            without a list page of their own.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow rule">The data</div>
            <h2 id="list-fields">Fields and a sample</h2>
          </div>
          <Fields
            fields={FACILITY_FIELDS}
            sample={sampleFacilityRecord(kind?.singular.toLowerCase() ?? "facility")}
            label="facility"
          />
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow rule">Use cases</div>
            <h2 id="list-uses">What teams use it for</h2>
          </div>
          <UseCases items={FACILITY_USE_CASES} />
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow rule">FAQ</div>
            <h2 id="list-questions">Questions about this list</h2>
          </div>
          <FaqBlock faq={faq} />
          <Cta label={list.label} buildHref="/sign-up" />
        </div>
      </section>
    </main>
  );
}



import { connection } from "next/server";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { listCatalogue, type ListCatalogue, type TaxonomyListSummary } from "@/lib/api";
import { METROS, specialtyPath } from "@/lib/geo";
import { glossaryForAudience, glossaryLinkable, glossaryPath } from "@/lib/glossary";
import { listPath } from "@/lib/lists";
import { websiteRef } from "@/lib/schema";
import { siteUrl, US_STATES } from "@/lib/site";

/**
 * One shape for the audience landing pages: physicians, nurses, and the wider professions.
 *
 * These exist to be found. Somebody searching "physician data" or "nurse practitioner list" is
 * describing a population, not a provider, so the page answers in those terms - how many, with
 * what, where - and then hands them a search or a list that is already narrowed. Three pages
 * sharing one component keeps them consistent and cheap to extend.
 *
 * The numbers and the specialty links come from the nightly list counts (`listCatalogue`), not
 * from a list typed into this file. A taxonomy spelled slightly wrong here would have been a
 * link to an empty search; one that comes from the catalogue has rows behind it by construction.
 * When the catalogue cannot be read (no key yet, or the API is down) the page falls back to plain
 * search links and shows no numbers at all - never a row of zeros, which reads as "we have none".
 *
 * The glossary links at the bottom are filtered by the same catalogue. A specialty's glossary page
 * 404s when the platform does not publish that specialty's list, so the entries of this audience
 * are put through `glossaryLinkable` - the one rule the hub and the sitemap use - and no term is
 * linked at all when the catalogue could not be read. This page used to link every entry for its
 * audience, which is how an audience page came to advertise reference pages that answered 404.
 */

export type Audience = {
  slug: string;
  title: string;
  h1: string;
  lede: string;
  /** NUCC classifications this population covers, spelled as the reference list spells them. */
  classifications: readonly string[];
  /** What the buyer of this population is usually trying to do. */
  useCases: readonly { title: string; body: string }[];
  faq: readonly { q: string; a: string }[];
  /** Shown as the searchable dimensions, in this population's own words. */
  filters: readonly string[];
  /** Where to go next on the site: role pages, facility directories, the A-Z. */
  deeper?: readonly { href: string; label: string; note: string }[];
};

const BIG_STATES = ["CA", "TX", "FL", "NY", "PA", "IL", "OH", "GA", "NC", "MI"];

function stateLabel(code: string): string {
  return US_STATES.find(([c]) => c === code)?.[1] ?? code;
}

function n(value: number): string {
  return value.toLocaleString("en-US");
}

/** The catalogue, or null when it cannot be read - the page then shows no numbers. */
async function catalogue(): Promise<ListCatalogue | null> {
  try {
    const body = await listCatalogue();
    return body.taxonomies.length > 0 ? body : null;
  } catch {
    return null;
  }
}

export async function AudienceLanding({ audience }: { audience: Audience }) {
  // At request time, not at build - a catalogue read at build would fail and leave the page
  // without its numbers until the next revalidation.
  await connection();
  const primary = audience.classifications[0];
  const lists = await catalogue();
  // The taxonomy slugs the platform publishes: the authoritative list of which glossary pages
  // resolve, and null when the catalogue could not be read - which links none of them.
  const published = lists ? new Set(lists.taxonomies.map((t) => t.slug)) : null;
  const glossary = glossaryLinkable(glossaryForAudience(audience.slug), published);

  const wanted = new Set(audience.classifications);
  const mine: TaxonomyListSummary[] = (lists?.taxonomies ?? []).filter((t) =>
    wanted.has(t.classification),
  );
  // Headline figures from the classification rows only: a specialization is a subset of its
  // classification, so adding both would count the same people twice.
  const tops = mine
    .filter((t) => t.level === "classification")
    .sort((a, b) => b.counts.total - a.counts.total);
  const totals = tops.reduce(
    (sum, t) => ({
      total: sum.total + t.counts.total,
      trusted: sum.trusted + t.counts.with_trusted_email,
      phone: sum.phone + t.counts.with_phone,
    }),
    { total: 0, trusted: 0, phone: 0 },
  );
  const specialties = [...mine].sort((a, b) => b.counts.total - a.counts.total).slice(0, 10);
  const lead = tops[0];
  const leadStates = lead
    ? BIG_STATES.filter((code) => lead.states.includes(code)).slice(0, 10)
    : [];

  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebPage",
              "@id": siteUrl(`/${audience.slug}#page`),
              name: audience.title,
              description: audience.lede,
              url: siteUrl(`/${audience.slug}`),
              isPartOf: websiteRef(),
            },
            {
              "@type": "FAQPage",
              mainEntity: audience.faq.map(({ q, a }) => ({
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
            Refreshed weekly · confirmed date on every record
          </span>
          <h1>{audience.h1}</h1>
          <p className="lede">{audience.lede}</p>

          <form className="searchbar" method="get" action="/search" role="search">
            <label htmlFor="q" className="sr-only">
              Search by name, organization or NPI
            </label>
            <input
              id="q"
              name="q"
              type="search"
              placeholder="Name, organization or NPI"
              maxLength={200}
              autoComplete="off"
            />
            <input type="hidden" name="classification" value={primary} />
            <button type="submit" className="btn primary">
              Search
            </button>
          </form>

          <div className="hints">
            {tops.length > 0
              ? tops.slice(0, 5).map((t) => (
                  <Link key={t.slug} href={listPath(t.slug)}>
                    {t.label}
                  </Link>
                ))
              : audience.classifications.slice(0, 5).map((c) => (
                  <Link key={c} href={`/search?classification=${encodeURIComponent(c)}`}>
                    {c}
                  </Link>
                ))}
          </div>

          {totals.total > 0 && (
            <div className="stats" style={{ marginTop: 28 }}>
              <div className="stat">
                <span className="value num">{n(totals.total)}</span>
                <span className="label">{audience.title.toLowerCase()} on record</span>
              </div>
              <div className="stat">
                <span className="value num">{n(totals.trusted)}</span>
                <span className="label">with a confirmed work email</span>
              </div>
              <div className="stat">
                <span className="value num">{n(totals.phone)}</span>
                <span className="label">with a practice phone</span>
              </div>
              <div className="stat">
                <span className="value num">{tops.length}</span>
                <span className="label">
                  {tops.length === 1 ? "profession" : "professions"}, each with its own list
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow rule">What you can do with it</div>
            <h2>Built for the work, not just the lookup.</h2>
          </div>
          {/* Two by two when there are four: three and an orphan read as a missing card. */}
          <div className={audience.useCases.length === 4 ? "grid pairs" : "grid"}>
            {audience.useCases.map((u) => (
              <div className="card feature" key={u.title}>
                <h3>{u.title}</h3>
                <p>{u.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow rule">Narrow it</div>
            <h2>Every record is filterable on the things that decide a list.</h2>
            <p className="lede">{audience.filters.join(" · ")}</p>
          </div>

          <div className="grid pairs">
            <div className="panel">
              <h3>By specialty</h3>
              <ul className="ticks" style={{ marginTop: 10 }}>
                {specialties.length > 0
                  ? specialties.map((t) => (
                      <li key={t.slug}>
                        <Link href={listPath(t.slug)}>{t.label}</Link>{" "}
                        <span className="fine num">{n(t.counts.total)}</span>
                      </li>
                    ))
                  : audience.classifications.map((c) => (
                      <li key={c}>
                        <Link href={`/search?classification=${encodeURIComponent(c)}`}>{c}</Link>
                      </li>
                    ))}
              </ul>
            </div>
            <div className="panel">
              <h3>By state</h3>
              <ul className="ticks" style={{ marginTop: 10 }}>
                {lead && leadStates.length > 0
                  ? leadStates.map((code) => (
                      <li key={code}>
                        <Link href={listPath(lead.slug, code)}>
                          {lead.label} in {stateLabel(code)}
                        </Link>
                      </li>
                    ))
                  : BIG_STATES.slice(0, 8).map((code) => {
                      // To the directory page when this wave publishes one, because /search is
                      // noindex and a crawler that follows it learns nothing.
                      const metro = METROS.find((m) => m.state === code);
                      const href = metro
                        ? specialtyPath(primary, metro)
                        : `/search?classification=${encodeURIComponent(primary)}&state=${code}`;
                      return (
                        <li key={code}>
                          <Link href={href}>
                            {audience.title} in{" "}
                            {metro ? `${metro.city}, ${code}` : stateLabel(code)}
                          </Link>
                        </li>
                      );
                    })}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* The glossary entries for this population, minus any whose page does not resolve.
          Somebody who has arrived here from a search for their own profession often wants the
          definition rather than the product, and a buyer who is new to the market needs it before
          the filters mean anything - but not at a 404, and the whole section goes rather than
          shrinking to nothing when the catalogue is unreadable. */}
      {glossary.length > 0 && (
        <section className="section">
          <div className="wrap">
            <div className="section-head">
              <div className="eyebrow rule">In plain English</div>
              <h2>What each of these professions actually is.</h2>
              <p className="lede">
                Reference pages for people about to buy data about a profession: what the work is,
                how its people qualify, where they practice, and what the letters after their name
                mean.
              </p>
            </div>
            <ul className="ticks">
              {glossary.slice(0, 10).map((entry) => (
                <li key={entry.term}>
                  <Link href={glossaryPath(entry.term)}>{entry.title}</Link>{" "}
                  <span className="fine">{entry.blurb}</span>
                </li>
              ))}
            </ul>
            <p className="fine" style={{ marginTop: 16 }}>
              <Link href={glossaryPath()}>The whole glossary</Link> covers every profession family
              and the credential letters that go with them.
            </p>
          </div>
        </section>
      )}

      {audience.deeper && audience.deeper.length > 0 && (
        <section className="section">
          <div className="wrap">
            <div className="section-head">
              <div className="eyebrow rule">Go deeper</div>
              <h2>The organizations and people around them.</h2>
            </div>
            <div className="grid">
              {audience.deeper.map((d) => (
                <Link className="card feature" key={d.href} href={d.href}>
                  <h3>{d.label}</h3>
                  <p>{d.note}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="wrap narrow">
          <div className="section-head">
            <div className="eyebrow rule">Questions</div>
            <h2>What buyers ask first.</h2>
          </div>
          <div className="faq">
            {audience.faq.map(({ q, a }) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>

          <div className="cta" style={{ marginTop: 32 }}>
            <h2>Search it now, free.</h2>
            <p className="lede">
              Create an account to reveal contact details, export a list, or pull the same records
              through the API.
            </p>
            <div className="actions" style={{ marginTop: 16 }}>
              <Link className="btn primary lg" href="/sign-up">
                Get started
              </Link>
              <Link className="btn lg" href="/lists">
                Browse the lists
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

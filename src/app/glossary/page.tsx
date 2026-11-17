import { connection } from "next/server";
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { listCatalogue, type ListCounts } from "@/lib/api";
import {
  GLOSSARY,
  GLOSSARY_FAMILIES,
  glossaryFamilyEntries,
  glossaryPath,
  glossaryTermIsListed,
} from "@/lib/glossary";
import { fmt, listPath, refreshedOn } from "@/lib/lists";
import { SITE_NAME, siteUrl, socialCard } from "@/lib/site";

/**
 * The glossary hub: every profession and every set of credential letters we explain, grouped by
 * profession family.
 *
 * Only what resolves is linked. A specialty page 404s when the platform does not publish its list
 * (`app/glossary/[term]/page.tsx`), and the sitemap has always filtered on that; the hub did not,
 * so it advertised pages that answered 404 - to a visitor, and to the crawler that reached them
 * from here rather than from the sitemap. Both now ask `glossaryTermIsListed`, which reads the one
 * authoritative list: the taxonomy slugs in the catalogue this page already fetches for its counts,
 * published above the same floor the term route checks against. No extra call, one rule.
 *
 * The entries and their copy come from `lib/glossary.ts`; the counts beside them come from the
 * platform's nightly list summary at request time. When that cannot be read the hub prints the
 * professions without a single figure rather than a column of zeros - the rule /data and the
 * audience pages follow - and every link still works, because a glossary page's substance is its
 * explanation and not its numbers.
 */

// Rendered when first requested, not at build: the build has no API to call, and a hub baked
// without its counts would serve that for a day. The API response inside stays cached for a day.

const TITLE = "Healthcare specialty and credential glossary";
const DESCRIPTION =
  "What each healthcare specialty and credential actually is - CRNA, DO, PA-C, physiatrist and more - with how many of each are on the public record.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: glossaryPath() },
  openGraph: socialCard(glossaryPath(), TITLE, DESCRIPTION),
};

export default async function GlossaryHubPage() {
  // At request time, not at build - a catalogue read at build would fail and leave the hub without
  // its numbers until the next revalidation.
  await connection();
  const catalogue = await listCatalogue().catch(() => null);
  const counts = new Map<string, { label: string; counts: ListCounts }>();
  for (const list of catalogue?.taxonomies ?? []) {
    counts.set(list.slug, { label: list.label, counts: list.counts });
  }
  const refreshed = refreshedOn(catalogue?.refreshed_at);
  // Null when the catalogue could not be read, which filters nothing - see `glossaryTermIsListed`.
  const published = catalogue ? new Set(catalogue.taxonomies.map((list) => list.slug)) : null;
  const listed = GLOSSARY.filter((entry) => glossaryTermIsListed(entry, published));
  const professions = listed.filter((entry) => entry.kind === "specialty").length;

  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "DefinedTermSet",
              "@id": siteUrl("/glossary#set"),
              name: TITLE,
              description: DESCRIPTION,
              url: siteUrl("/glossary"),
              isPartOf: { "@type": "WebSite", name: SITE_NAME, url: siteUrl("/") },
              hasDefinedTerm: listed.map((entry) => ({
                "@type": "DefinedTerm",
                "@id": siteUrl(`${glossaryPath(entry.term)}#term`),
                name: entry.label,
                url: siteUrl(glossaryPath(entry.term)),
              })),
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: siteUrl("/") },
                { "@type": "ListItem", position: 2, name: "Glossary", item: siteUrl("/glossary") },
              ],
            },
          ],
        }}
      />

      <section className="section" style={{ paddingTop: 36 }}>
        <div className="wrap">
          <ol className="crumbs">
            <li>
              <Link href="/">Home</Link>
            </li>
            <li aria-current="page">Glossary</li>
          </ol>
          {/* The same block every other page opens with, rather than three loose children of the
              wrap: the eyebrow, the title and the lede share one measure. Bare, the title ran 1069
              points across a 1120-point page while the paragraph under it stopped at 645. */}
          <div className="section-head">
            <div className="eyebrow rule">
              Reference{refreshed ? ` · counts refreshed ${refreshed}` : ""}
            </div>
            <h1 style={{ fontSize: "clamp(1.8rem, 3.8vw, 2.7rem)" }}>
              What each healthcare specialty and credential actually is.
            </h1>
            <p className="lede">
              {professions} professions and the credential letters that go with them, written in
              plain sentences: what the work is, how its people qualify, where they practice, and
              which closely related profession it is most often confused with. Every entry ends with
              what we hold on that population - counted from the live register, or left out when it
              cannot be read.
            </p>
          </div>
          <div className="actions" style={{ marginTop: 16 }}>
            <Link className="btn primary lg" href="/lists">
              Lists by specialty
            </Link>
            <Link className="btn lg" href="/data">
              What a record carries
            </Link>
          </div>
        </div>
      </section>

      {GLOSSARY_FAMILIES.map((family) => {
        const entries = glossaryFamilyEntries(family.key).filter((entry) =>
          glossaryTermIsListed(entry, published),
        );
        if (entries.length === 0) return null;
        const letters = family.key === "credentials";
        return (
          <section className="section" key={family.key}>
            <div className="wrap">
              <div className="section-head">
                <div className="eyebrow rule">{letters ? "Letters after a name" : "Profession family"}</div>
                <h2>{family.name}</h2>
                <p className="lede">{family.blurb}</p>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{letters ? "Letters" : "Profession"}</th>
                      <th>What it is</th>
                      {catalogue && <th>On record</th>}
                      {catalogue && <th>The list</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => {
                      const found = entry.list ? counts.get(entry.list) : undefined;
                      return (
                        <tr key={entry.term}>
                          <td>
                            <Link href={glossaryPath(entry.term)}>
                              <b>{entry.label}</b>
                            </Link>
                          </td>
                          <td className="fine">{entry.blurb}</td>
                          {catalogue && <td className="num">{found ? fmt(found.counts.total) : "—"}</td>}
                          {catalogue && (
                            <td className="fine">
                              {found && entry.list ? (
                                <Link href={listPath(entry.list)}>{found.label}</Link>
                              ) : (
                                "—"
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        );
      })}

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow rule">How to read these pages</div>
            <h2>Reference first, product second.</h2>
          </div>
          <div className="grid pairs" style={{ alignItems: "start" }}>
            <div className="panel">
              <h3>A classification is not a sub-specialty</h3>
              <p className="fine">
                Most physician sub-specialties are filed beneath a broader classification - a
                cardiologist sits under internal medicine. Filtering on the classification finds the
                sub-specialists too; filtering on one sub-specialty code does not.{" "}
                <Link href="/help/search-and-filters">How the filters combine</Link>.
              </p>
            </div>
            <div className="panel">
              <h3>Letters are filed, not verified</h3>
              <p className="fine">
                The credentials on a record are what the provider wrote about themselves, so MD, DO
                and a fellowship may appear in any combination. What somebody practices comes from
                the specialty codes, never from the letters, and an identifier is not a license.
              </p>
            </div>
            <div className="panel">
              <h3>Every number here is read live</h3>
              <p className="fine">
                Counts come from the register at the time the page is built for you. Where a figure
                cannot be read it is left out rather than shown as a zero, so a missing number means
                exactly that and nothing worse.
              </p>
            </div>
            <div className="panel">
              <h3>Where to go for the data</h3>
              <p className="fine">
                <Link href="/lists">Lists by specialty and state</Link>,{" "}
                <Link href="/search">provider search</Link>, the{" "}
                <Link href="/directory">A to Z directory</Link>, or{" "}
                <Link href="/docs/api">the API</Link> for teams that would rather not click.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

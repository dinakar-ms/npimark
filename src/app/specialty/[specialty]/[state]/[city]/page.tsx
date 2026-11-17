import { POSITIONING } from "@/content/positioning";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { withDirectoryFallback, withDirectoryMetadata } from "@/components/DirectoryFallback";
import { JsonLd } from "@/components/JsonLd";
import { searchProviders, toPublic } from "@/lib/api";
import {
  DIRECTORY_SPECIALTIES,
  METROS,
  metroFromSlug,
  siblingMetros,
  specialtyFromSlug,
  specialtyPath,
  type Metro,
} from "@/lib/geo";
import { websiteRef } from "@/lib/schema";
import { siteUrl, stateName } from "@/lib/site";

/**
 * One specialty in one metro: the page that answers "endocrinologists in Dallas".
 *
 * This is the traffic surface. Somebody searching that phrase is not looking for a company, so
 * the page answers the question first - who is there, where, how many - and sells second.
 *
 * Two rules keep it from becoming the thin-content farm these pages usually are. A combination
 * outside the published wave is a 404, not an improvised page. And a combination with no
 * providers behind it is also a 404, because a page whose only content is its own title is
 * worse than no page: it teaches a crawler that this template is empty.
 *
 * Public record only. Successful API reads are cached; recovery HTML is never shared-cached.
 */

// Render recovery states per request; successful API reads retain their explicit data cache.
export const revalidate = 0;

type Props = {
  params: Promise<{ specialty: string; state: string; city: string }>;
};

const SHOWN = 25;

async function resolve(params: Awaited<Props["params"]>) {
  const specialty = specialtyFromSlug(params.specialty);
  const metro = metroFromSlug(params.state, params.city);
  if (!specialty || !metro) return null;
  const filters = {
    taxonomy_classification: specialty,
    state: metro.state,
    city: metro.city,
  };
  const page = await searchProviders({ ...filters, page_size: SHOWN });
  if (!page || !Array.isArray(page.items) || !Number.isSafeInteger(page.total) || page.total < 0 ||
      (page.total > 0 && page.items.length === 0)) {
    throw new Error("Invalid specialty directory response");
  }
  if (page.total === 0) return null;

  /* How many of them we hold a work email for.
   *
   * The search response carries `total` and nothing else, so reach is a second count with the
   * same filters and `has_email` on. It is the figure a buyer is actually deciding on - "are
   * there enough of them to be worth it" - and the one an answer engine quotes off a page like
   * this, which is why it belongs in the first sentence rather than in a panel further down.
   *
   * `has_email` is the platform's own tri-state flag (lib/placeFilters). A name it does not know
   * is ignored rather than refused, so a typo here would return the unfiltered total and this
   * page would claim complete coverage. If the count cannot be read the sentence is left out
   * rather than shown as nought - the rule the rest of the site already follows.
   */
  const reached = await attemptCount({ ...filters, has_email: true, page_size: 1 });
  return { specialty, metro, page, reached: reached !== null && reached <= page.total ? reached : null };
}

/** A count, or null when the API will not answer. Never throws: one page is not worth a 500. */
async function attemptCount(
  filters: Record<string, string | number | boolean | undefined>,
): Promise<number | null> {
  try {
    const page = await searchProviders(filters, { revalidate: 3600 });
    return Number.isSafeInteger(page?.total) && page.total >= 0 ? page.total : null;
  } catch {
    return null;
  }
}

function title(specialty: string, metro: Metro): string {
  return `${specialty} in ${metro.city}, ${metro.state}`;
}

async function loadMetadata({ params }: Props): Promise<Metadata> {
  const resolved = await resolve(await params);
  if (!resolved) return { title: "Not found", robots: { index: false } };
  const { specialty, metro, page, reached } = resolved;
  const heading = title(specialty, metro);
  return {
    title: heading,
    description:
      `${page.total.toLocaleString("en-US")} ${specialty.toLowerCase()} providers in ` +
      `${metro.city}, ${stateName(metro.state) ?? metro.state}` +
      (reached !== null && page.total > 0
        ? `, with an email on file for ${reached.toLocaleString("en-US")} of them ` +
          `(${Math.round((reached / page.total) * 100)}%)`
        : "") +
      `. Browse names, practice locations and specialties.`,
    alternates: { canonical: specialtyPath(specialty, metro) },
  };
}

async function SpecialtyMetroPage({ params }: Props) {
  const resolved = await resolve(await params);
  if (!resolved) notFound();
  const { specialty, metro, page, reached } = resolved;
  const rows = page.items.map(toPublic);
  const region = stateName(metro.state) ?? metro.state;
  const heading = title(specialty, metro);
  const path = specialtyPath(specialty, metro);
  const searchHref = `/search?${new URLSearchParams({ classification: specialty, state: metro.state, city: metro.city })}`;

  // Every other specialty published in this metro, not a first handful of them. The list used to
  // be `.slice(0, 8)`, which always returned the same eight names at the top of
  // DIRECTORY_SPECIALTIES: the specialties below them were in the sitemap and linked from no page
  // on the site at all. Twenty-three links in a panel is a small price for a grid a crawler can
  // walk.
  const others = DIRECTORY_SPECIALTIES.filter((name) => name !== specialty);
  // Every other metro in this state, for the same reason.
  const nearby = siblingMetros(metro, METROS.length);

  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "CollectionPage",
              "@id": siteUrl(`${path}#page`),
              name: heading,
              url: siteUrl(path),
              about: specialty,
              isPartOf: websiteRef(),
            },
            {
              "@type": "ItemList",
              numberOfItems: rows.length,
              itemListElement: rows.map((row, index) => ({
                "@type": "ListItem",
                position: index + 1,
                url: siteUrl(`/npi/${row.npi}`),
                name: row.name,
              })),
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Search", item: siteUrl("/search") },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: region,
                  item: siteUrl(`/search?state=${metro.state}`),
                },
                { "@type": "ListItem", position: 3, name: heading, item: siteUrl(path) },
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
            <li>
              <Link href="/search">Search</Link>
            </li>
            <li>
              <Link href={`/search?state=${metro.state}`}>{region}</Link>
            </li>
            <li aria-current="page">{heading}</li>
          </ol>

          <div className="eyebrow rule">
            {region} · {page.total.toLocaleString("en-US")} matching records
          </div>
          <h1 style={{ fontSize: "clamp(1.7rem, 3.6vw, 2.5rem)" }}>{heading}</h1>
          <p className="lede">
            There are <b>{page.total.toLocaleString("en-US")}</b> {specialty.toLowerCase()}{" "}
            providers with a practice address in {metro.city}, {region}.
            {reached !== null && page.total > 0 ? (
              <>
                {" "}
                We have an email on file for{" "}
                <b>
                  {reached.toLocaleString("en-US")} of them (
                  {Math.round((reached / page.total) * 100)}%)
                </b>
                . Availability does not establish deliverability or permission to contact.
              </>
            ) : null}{" "}
            {POSITIONING.directory} {POSITIONING.access}
          </p>

          <div className="actions" style={{ marginTop: 20 }}>
            <Link className="btn primary lg" href={searchHref}>Search this specialty in {metro.city}</Link>
            <Link className="btn lg" href="/contact">Discuss your data needs</Link>
          </div>

          <div className="table-wrap" style={{ marginTop: 26 }}>
            <table>
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Specialty</th>
                  <th>Practice</th>
                  <th>Contact</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.npi}>
                    <td>
                      <Link href={`/npi/${row.npi}`}>
                        <b>{row.name}</b>
                      </Link>
                      <span className="fine mono" style={{ display: "block" }}>
                        NPI {row.npi}
                        {row.credentials ? ` · ${row.credentials}` : ""}
                      </span>
                    </td>
                    <td className="fine">
                      {row.primary_taxonomy?.display ?? "Not listed"}
                      {row.matched_taxonomy && <span style={{ display: "block" }}>Also listed: {row.matched_taxonomy.display}</span>}
                    </td>
                    <td className="fine">
                      {[row.city, row.state, row.postal_code?.slice(0, 5)]
                        .filter(Boolean)
                        .join(" ")}
                      {row.employer_name && (
                        <span style={{ display: "block" }}>{row.employer_name}</span>
                      )}
                    </td>
                    <td className="fine">
                      {row.phone ? <span className="num">{row.phone}</span> : "—"}
                      {row.has_email && (
                        <Link href="/sign-up" className="locked" style={{ display: "block" }}>
                          email on file
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {page.total > rows.length && (
            <p className="fine" style={{ marginTop: 14 }}>
              Showing {rows.length} of {page.total.toLocaleString("en-US")}.{" "}
              <Link
                href={searchHref}
              >
                Search all {specialty.toLowerCase()} in {metro.city}
              </Link>
              .
            </p>
          )}
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow rule">Nearby and related</div>
            <h2>More of the same register.</h2>
          </div>
          <div className="grid two" style={{ alignItems: "start" }}>
            <div className="panel">
              <h3>Other specialties in {metro.city}</h3>
              <ul className="ticks" style={{ marginTop: 10 }}>
                {others.map((name) => (
                  <li key={name}>
                    <Link href={specialtyPath(name, metro)}>
                      {name} in {metro.city}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            {nearby.length > 0 && (
              <div className="panel">
                <h3>
                  {specialty} elsewhere in {region}
                </h3>
                <ul className="ticks" style={{ marginTop: 10 }}>
                  {nearby.map((other) => (
                    <li key={`${other.city}-${other.state}`}>
                      <Link href={specialtyPath(specialty, other)}>
                        {specialty} in {other.city}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="cta" style={{ marginTop: 32 }}>
            <h2>Need to reach them?</h2>
            <p className="lede">
              Create an account to review available contact options. Access and reveal costs
              depend on your plan; availability is shown before you act.
            </p>
            <div className="actions" style={{ marginTop: 16 }}>
              <Link className="btn primary lg" href="/sign-up">
                Get started
              </Link>
              <Link className="btn lg" href={`/search?state=${metro.state}`}>
                Search {region}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export const generateMetadata = withDirectoryMetadata(loadMetadata);
export default withDirectoryFallback(SpecialtyMetroPage);

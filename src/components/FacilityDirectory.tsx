import { POSITIONING } from "@/content/positioning";
import { withDirectoryFallback, withDirectoryMetadata } from "@/components/DirectoryFallback";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { RoleLinks } from "@/components/RoleLinks";
import { facilityPlaces, searchFacilities, type Place, type PublicFacility } from "@/lib/api";
import {
  FACILITY_KINDS,
  MIN_CITY,
  facilityName,
  facilityPath,
  kindFromSlug,
  kindPath,
  stars,
  stateFromSlug,
  titleCase,
  type FacilityKind,
} from "@/lib/facilities";
import { slugify } from "@/lib/geo";
import { roleIndexOrEmpty } from "@/lib/roles";
import { breadcrumb } from "@/lib/schema";
import { siteUrl, stateName } from "@/lib/site";

/**
 * The facility directory, one template for all five kinds: a kind's index of states, a state's
 * cities, and a city's facilities.
 *
 * Every level publishes only what has rows behind it. A state with none of a kind is a 404; a
 * city needs `MIN_CITY` facilities of the kind to have a page, and the facilities in smaller
 * towns are listed on the state page instead, so no facility is left without a path to it and
 * no page is a title over one row. Cached for a day like every public page: a crawl lands on the
 * cache, not on the platform.
 */

const PAGE = 200;
/** Enough pages for the largest state list of any kind; beyond it a state page links cities. */
const MAX_PAGES = 15;

async function allFacilities(filters: Record<string, string>): Promise<PublicFacility[]> {
  const first = await searchFacilities({ ...filters, page_size: PAGE });
  const pages = Math.min(Math.ceil(first.total / PAGE), MAX_PAGES);
  const rest = await Promise.all(
    Array.from({ length: Math.max(pages - 1, 0) }, (_, i) =>
      searchFacilities({ ...filters, page_size: PAGE, page: i + 2 }),
    ),
  );
  return [first, ...rest].flatMap((page) => page.items);
}

function count(n: number): string {
  return n.toLocaleString("en-US");
}

export function Crumbs({ items }: { items: { name: string; href?: string }[] }) {
  return (
    <ol className="crumbs">
      <li>
        <Link href="/">Home</Link>
      </li>
      {items.map((item) =>
        item.href ? (
          <li key={item.name}>
            <Link href={item.href}>{item.name}</Link>
          </li>
        ) : (
          <li key={item.name} aria-current="page">
            {item.name}
          </li>
        ),
      )}
    </ol>
  );
}


function FacilityTable({ rows, showCity }: { rows: PublicFacility[]; showCity?: boolean }) {
  return (
    <div className="table-wrap" style={{ marginTop: 26 }}>
      <table>
        <thead>
          <tr>
            <th>Facility</th>
            <th>{showCity ? "Town" : "Address"}</th>
            <th>Beds</th>
            <th>Overall rating</th>
            <th>Ownership</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((f) => (
            <tr key={f.ccn}>
              <td>
                <Link href={facilityPath(f)}>
                  <b>{facilityName(f)}</b>
                </Link>
                <span className="fine mono" style={{ display: "block" }}>
                  CCN {f.ccn}
                </span>
              </td>
              <td className="fine">
                {showCity ? titleCase(f.city) : titleCase(f.address_line) || "—"}
              </td>
              <td className="fine num">{f.beds ?? "—"}</td>
              <td className="fine num">{stars(f.overall_rating) ?? "—"}</td>
              <td className="fine">{f.ownership_type ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Cta() {
  return (
    <div className="cta" style={{ marginTop: 32 }}>
      <h2>Need the people behind them?</h2>
      <p className="lede">
        Signed-in customers see each facility&apos;s named executives and owners, the clinicians
        who practice there, and changes to ownership and ratings as they happen.
      </p>
      <div className="actions" style={{ marginTop: 16 }}>
        <Link className="btn primary lg" href="/sign-up">
          Get started
        </Link>
        <Link className="btn lg" href="/pricing">
          See plans
        </Link>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------------------- */
/* a kind's index: /hospitals                                                                */
/* ---------------------------------------------------------------------------------------- */

async function resolveKind(slug: string) {
  const kind = kindFromSlug(slug);
  if (!kind) return null;
  const states = (await facilityPlaces(kind.type)).filter((p) => stateName(p.state));
  if (states.length === 0) return null;
  return { kind, states, total: states.reduce((sum, p) => sum + p.count, 0) };
}

async function loadkindMetadata(slug: string): Promise<Metadata> {
  const resolved = await resolveKind(slug);
  if (!resolved) return { title: "Not found", robots: { index: false } };
  const { kind, total, states } = resolved;
  return {
    title: `${kind.plural} in the United States`,
    description: `${count(total)} certified ${kind.plural.toLowerCase()} across ${
      states.length
    } states and territories: ${kind.blurb}. Size, ownership, ratings and location for each.`,
    alternates: { canonical: kindPath(kind) },
  };
}

async function loadKindIndex({ slug }: { slug: string }) {
  const resolved = await resolveKind(slug);
  if (!resolved) notFound();
  const { kind, states, total } = resolved;
  const path = kindPath(kind);
  const roles = await roleIndexOrEmpty();
  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            { "@type": "CollectionPage", name: `${kind.plural} in the United States`, url: siteUrl(path) },
            breadcrumb([
              { name: "Directory", href: "/directory" },
              { name: kind.plural, href: path },
            ]),
          ],
        }}
      />
      <section className="section" style={{ paddingTop: 36 }}>
        <div className="wrap">
          <Crumbs items={[{ name: "Directory", href: "/directory" }, { name: kind.plural }]} />
          <div className="eyebrow rule">{count(total)} certified · refreshed monthly</div>
          <h1 style={{ fontSize: "clamp(1.7rem, 3.6vw, 2.5rem)" }}>
            {kind.plural} in the United States
          </h1>
          <p className="lede">
            Every certified {kind.singular.toLowerCase()} still operating - {kind.blurb} - with its
            size, ownership, chain, published ratings and the organization it bills under. Choose
            a state.
          </p>
          <p>{POSITIONING.organizations}</p>
          <div className="table-wrap" style={{ marginTop: 26 }}>
            <table>
              <thead>
                <tr>
                  <th>State</th>
                  <th>{kind.plural}</th>
                </tr>
              </thead>
              <tbody>
                {states.map((p) => (
                  <tr key={p.state}>
                    <td>
                      <Link href={kindPath(kind, p.state)}>{stateName(p.state)}</Link>
                    </td>
                    <td className="num">{count(p.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <RoleLinks index={roles} kind={kind} />
          <OtherKinds kind={kind} />
          <Cta />
        </div>
      </section>
    </main>
  );
}

function OtherKinds({ kind, state }: { kind: FacilityKind; state?: string }) {
  return (
    <div className="hints" style={{ justifyContent: "flex-start", marginTop: 24 }}>
      <span>Also:</span>
      {FACILITY_KINDS.filter((k) => k.type !== kind.type).map((k) => (
        <Link key={k.type} href={kindPath(k, state)}>
          {k.plural}
          {state ? ` in ${stateName(state)}` : ""}
        </Link>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------------------------- */
/* a state: /hospitals/tx                                                                    */
/* ---------------------------------------------------------------------------------------- */

async function resolveState(kindSlug: string, stateSlug: string) {
  const kind = kindFromSlug(kindSlug);
  const state = stateFromSlug(stateSlug);
  if (!kind || !state) return null;
  const cities = await facilityPlaces(kind.type, { state });
  const total = cities.reduce((sum, p) => sum + p.count, 0);
  if (total === 0) return null;
  const big = cities.filter((p) => p.count >= MIN_CITY);
  return { kind, state, cities, big, total };
}

async function loadstateMetadata(kindSlug: string, stateSlug: string): Promise<Metadata> {
  const resolved = await resolveState(kindSlug, stateSlug);
  if (!resolved) return { title: "Not found", robots: { index: false } };
  const { kind, state, total, cities } = resolved;
  const region = stateName(state);
  return {
    title: `${kind.plural} in ${region}`,
    description: `${count(total)} certified ${kind.plural.toLowerCase()} in ${region}, across ${
      cities.length
    } ${cities.length === 1 ? "town" : "towns"}. Size, ownership, ratings and address for each.`,
    alternates: { canonical: kindPath(kind, state) },
  };
}

async function loadStateIndex({ kindSlug, stateSlug }: { kindSlug: string; stateSlug: string }) {
  const resolved = await resolveState(kindSlug, stateSlug);
  if (!resolved) notFound();
  const { kind, state, big, total } = resolved;
  const region = stateName(state) ?? state;
  const bigCities = new Set(big.map((p) => slugify(p.city ?? "")));
  const smallTowns =
    big.length === resolved.cities.length
      ? []
      : (await allFacilities({ state, facility_type: kind.type })).filter(
          (f) => !bigCities.has(slugify(f.city ?? "")),
        );
  const path = kindPath(kind, state);
  const heading = `${kind.plural} in ${region}`;
  const roles = await roleIndexOrEmpty();

  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            { "@type": "CollectionPage", name: heading, url: siteUrl(path) },
            breadcrumb([
              { name: kind.plural, href: kindPath(kind) },
              { name: region, href: path },
            ]),
          ],
        }}
      />
      <section className="section" style={{ paddingTop: 36 }}>
        <div className="wrap">
          <Crumbs items={[{ name: kind.plural, href: kindPath(kind) }, { name: region }]} />
          <div className="eyebrow rule">
            {region} · {count(total)} certified
          </div>
          <h1 style={{ fontSize: "clamp(1.7rem, 3.6vw, 2.5rem)" }}>{heading}</h1>
          <p className="lede">
            {count(total)} certified {kind.plural.toLowerCase()} in {region}.{" "}
            {big.length > 0
              ? `Towns with ${MIN_CITY} or more have their own page; the rest are listed below.`
              : "Each is listed below."}
          </p>

          <p>{POSITIONING.organizations}</p>
          {big.length > 0 && (
            <div className="table-wrap" style={{ marginTop: 26 }}>
              <table>
                <thead>
                  <tr>
                    <th>Town</th>
                    <th>{kind.plural}</th>
                  </tr>
                </thead>
                <tbody>
                  {big.map((p: Place) => (
                    <tr key={p.city}>
                      <td>
                        <Link href={kindPath(kind, state, p.city ?? "")}>{titleCase(p.city)}</Link>
                      </td>
                      <td className="num">{count(p.count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {smallTowns.length > 0 && (
            <>
              <h2 style={{ marginTop: 36 }}>
                {big.length > 0 ? `Elsewhere in ${region}` : `Every ${kind.singular.toLowerCase()}`}
              </h2>
              <FacilityTable rows={smallTowns} showCity />
            </>
          )}

          <RoleLinks index={roles} kind={kind} state={state} />
          <OtherKinds kind={kind} state={state} />
          <Cta />
        </div>
      </section>
    </main>
  );
}

/* ---------------------------------------------------------------------------------------- */
/* a city: /hospitals/tx/houston                                                             */
/* ---------------------------------------------------------------------------------------- */

async function resolveCity(kindSlug: string, stateSlug: string, citySlug: string) {
  const kind = kindFromSlug(kindSlug);
  const state = stateFromSlug(stateSlug);
  if (!kind || !state) return null;
  const cities = await facilityPlaces(kind.type, { state });
  const city = cities.find((p) => slugify(p.city ?? "") === citySlug && p.count >= MIN_CITY);
  if (!city?.city) return null;
  return { kind, state, city: city.city, cities };
}

async function loadcityMetadata(
  kindSlug: string,
  stateSlug: string,
  citySlug: string,
): Promise<Metadata> {
  const resolved = await resolveCity(kindSlug, stateSlug, citySlug);
  if (!resolved) return { title: "Not found", robots: { index: false } };
  const { kind, state, city, cities } = resolved;
  const n = cities.find((p) => p.city === city)?.count ?? 0;
  return {
    title: `${kind.plural} in ${titleCase(city)}, ${state}`,
    description: `${count(n)} certified ${kind.plural.toLowerCase()} in ${titleCase(city)}, ${stateName(
      state,
    )}. Beds, ownership, chain, published ratings and address for each.`,
    alternates: { canonical: kindPath(kind, state, city) },
  };
}

async function loadCityPage({
  kindSlug,
  stateSlug,
  citySlug,
}: {
  kindSlug: string;
  stateSlug: string;
  citySlug: string;
}) {
  const resolved = await resolveCity(kindSlug, stateSlug, citySlug);
  if (!resolved) notFound();
  const { kind, state, city, cities } = resolved;
  const rows = await allFacilities({ state, city, facility_type: kind.type });
  if (rows.length === 0) notFound();
  const region = stateName(state) ?? state;
  const town = titleCase(city);
  const heading = `${kind.plural} in ${town}, ${state}`;
  const path = kindPath(kind, state, city);

  // Other kinds with a page in this town, and other towns with a page for this kind.
  const otherKinds = (
    await Promise.all(
      FACILITY_KINDS.filter((k) => k.type !== kind.type).map(async (k) => {
        const places = await facilityPlaces(k.type, { state });
        const hit = places.find(
          (p) => slugify(p.city ?? "") === citySlug && p.count >= MIN_CITY,
        );
        return hit ? { kind: k, count: hit.count } : null;
      }),
    )
  ).filter((x): x is { kind: FacilityKind; count: number } => x !== null);
  const otherTowns = cities
    .filter((p) => p.city !== city && p.count >= MIN_CITY)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            { "@type": "CollectionPage", "@id": siteUrl(`${path}#page`), name: heading, url: siteUrl(path) },
            {
              "@type": "ItemList",
              numberOfItems: rows.length,
              itemListElement: rows.slice(0, 100).map((f, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: siteUrl(facilityPath(f)),
                name: facilityName(f),
              })),
            },
            breadcrumb([
              { name: kind.plural, href: kindPath(kind) },
              { name: region, href: kindPath(kind, state) },
              { name: town, href: path },
            ]),
          ],
        }}
      />
      <section className="section" style={{ paddingTop: 36 }}>
        <div className="wrap">
          <Crumbs
            items={[
              { name: kind.plural, href: kindPath(kind) },
              { name: region, href: kindPath(kind, state) },
              { name: town },
            ]}
          />
          <div className="eyebrow rule">
            {region} · {count(rows.length)} certified · refreshed monthly
          </div>
          <h1 style={{ fontSize: "clamp(1.7rem, 3.6vw, 2.5rem)" }}>{heading}</h1>
          <p className="lede">
            {count(rows.length)} certified {kind.plural.toLowerCase()} in {town}, with their size,
            ownership and published ratings. Each links to its full record: chain, organization,
            certification date, and how many named leadership contacts it has.
          </p>
          <p>{POSITIONING.organizations}</p>
          <FacilityTable rows={rows} />

          {(otherKinds.length > 0 || otherTowns.length > 0) && (
            <div className="grid two" style={{ alignItems: "start", marginTop: 32 }}>
              {otherKinds.length > 0 && (
                <div className="panel">
                  {/* h2, not h3: a town page has no h2 above these, and h1 to h3 is a skipped
                      level. `.panel h2` keeps them the size they were. */}
                  <h2>Other facilities in {town}</h2>
                  <ul className="ticks" style={{ marginTop: 10 }}>
                    {otherKinds.map(({ kind: k, count: n }) => (
                      <li key={k.type}>
                        <Link href={kindPath(k, state, city)}>
                          {k.plural} in {town}
                        </Link>{" "}
                        <span className="fine num">({count(n)})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {otherTowns.length > 0 && (
                <div className="panel">
                  <h2>
                    {kind.plural} elsewhere in {region}
                  </h2>
                  <ul className="ticks" style={{ marginTop: 10 }}>
                    {otherTowns.map((p) => (
                      <li key={p.city}>
                        <Link href={kindPath(kind, state, p.city ?? "")}>{titleCase(p.city)}</Link>{" "}
                        <span className="fine num">({count(p.count)})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <Cta />
        </div>
      </section>
    </main>
  );
}

export const KindIndex = withDirectoryFallback(loadKindIndex);

export const StateIndex = withDirectoryFallback(loadStateIndex);

export const CityPage = withDirectoryFallback(loadCityPage);

export const kindMetadata = withDirectoryMetadata(loadkindMetadata);

export const stateMetadata = withDirectoryMetadata(loadstateMetadata);

export const cityMetadata = withDirectoryMetadata(loadcityMetadata);

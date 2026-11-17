import { POSITIONING } from "@/content/positioning";
import type { Metadata } from "next";
import Link from "next/link";
import { PublicDecisionNetwork } from "@/components/DecisionNetwork";
import { notFound, permanentRedirect } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { LeadershipPanel, OrgProfileSections, profileFacts, profileFaq } from "@/components/OrgProfile";
import {
  facilityPlaces,
  facilityProfile,
  getFacility,
  searchFacilities,
  type PublicFacility,
  type PublicFacilityDetail,
} from "@/lib/api";
import {
  MIN_CITY,
  ccnFromSlug,
  facilityLabel,
  facilityName,
  facilityPath,
  kindOf,
  kindPath,
  schemaFor,
  stars,
  titleCase,
} from "@/lib/facilities";
import { reportPath } from "@/lib/corrections";
import { slugify } from "@/lib/geo";
import { type Faq, faqJsonLd, listPath, systemPath } from "@/lib/lists";
import { breadcrumb } from "@/lib/schema";
import { siteUrl, stateName } from "@/lib/site";
import { withDirectoryFallback, withDirectoryMetadata } from "@/components/DirectoryFallback";

/**
 * One certified facility: what it is, where, how big, who holds it and how it is rated.
 *
 * Everything shown is public record. The one thing a facility page never shows is a person
 * without an NPI: the people who run and own it are counted by role, and their names and titles
 * are for signed-in customers. The organisation it bills under links to that organisation's own
 * provider page, and its neighbours link to theirs, so the page is part of a web rather than a
 * dead end.
 *
 * It is also the organisation profile: linked providers by specialty, the EHR, its locations, its
 * health system, peers, and an FAQ built only from these facts. Where an organisation NPI has
 * exactly this one facility, `/npi/<npi>` redirects here, so the organisation has one address.
 *
 * The address is `/facility/<name>-<ccn>`. The CCN resolves it; a stale or hand-typed name
 * redirects to the canonical one, so a renamed facility keeps its links. Cached for a day.
 */

// Request-time, and not 86,400 seconds. It was a day, which is right for a provider record and
// wrong for the page that renders when the record cannot be read: the recovery state below would
// have been stored as this route's output and served for a day after the platform recovered. The
// `no-store` line for this tree in `next.config.ts` is the other half of the same decision - one
// stops Next caching the outage, the other stops a shared cache doing it.
//
// What it costs: these URLs no longer come out of the full route cache. Small, because the traffic
// on them is overwhelmingly enumeration of distinct ids that never hit a cache anyway (measured
// 19 Oct 2026: 23,006 distinct `/npi/<id>` requests in one hour), and worth paying rather than
// telling a crawler for a day that a page it has indexed is now noindex.
export const revalidate = 0;

type Props = { params: Promise<{ slug: string }> };

async function resolve(slug: string): Promise<PublicFacilityDetail | null> {
  const ccn = ccnFromSlug(slug);
  if (!ccn) return null;
  return getFacility(ccn);
}

function place(f: PublicFacility): string {
  return [titleCase(f.city), f.state].filter(Boolean).join(", ");
}

function describe(f: PublicFacilityDetail): string {
  const parts = [`${facilityLabel(f)}${place(f) ? ` in ${place(f)}` : ""}`];
  if (f.beds) parts.push(`${f.beds.toLocaleString("en-US")} certified beds`);
  if (f.overall_rating !== null) parts.push(`overall rating ${stars(f.overall_rating)}`);
  if (f.ownership_type) parts.push(f.ownership_type.toLowerCase());
  return parts.join(", ");
}

async function facilityMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const f = await resolve(slug);
  if (!f) return { title: "Facility not found", robots: { index: false } };
  const title = `${facilityName(f)} · ${facilityLabel(f)}${place(f) ? ` in ${place(f)}` : ""}`;
  const description = `${describe(f)}. Certification number ${f.ccn}${
    f.npi ? `, NPI ${f.npi}` : ""
  }.`;
  return {
    title,
    description,
    alternates: { canonical: facilityPath(f) },
    openGraph: { title, description, type: "website", url: siteUrl(facilityPath(f)) },
  };
}

async function FacilityPage({ params }: Props) {
  const { slug } = await params;
  const f = await resolve(slug);
  if (!f) notFound();
  const path = facilityPath(f);
  if (`/facility/${slug}` !== path) permanentRedirect(path);

  const kind = kindOf(f.facility_type);
  const name = facilityName(f);
  const region = stateName(f.state) ?? f.state ?? "";

  // The neighbours: every certified facility in the same city, and whether this kind has a
  // city page there. Both are cached calls other pages make too.
  const [neighbours, cities, profile] = await Promise.all([
    f.state && f.city
      ? searchFacilities({ state: f.state, city: f.city, page_size: 13 })
      : Promise.resolve(null),
    kind && f.state ? facilityPlaces(kind.type, { state: f.state }) : Promise.resolve([]),
    facilityProfile(f.ccn).catch(() => null),
  ]);
  const nearby = (neighbours?.items ?? []).filter((n) => n.ccn !== f.ccn).slice(0, 12);
  const cityListed =
    kind && f.city
      ? cities.some((c) => slugify(c.city ?? "") === slugify(f.city ?? "") && c.count >= MIN_CITY)
      : false;

  const crumbs: { name: string; href: string }[] = [];
  if (kind) {
    crumbs.push({ name: kind.plural, href: kindPath(kind) });
    if (f.state) crumbs.push({ name: region, href: kindPath(kind, f.state) });
    if (f.state && f.city && cityListed) {
      crumbs.push({ name: titleCase(f.city), href: kindPath(kind, f.state, f.city) });
    }
  } else {
    crumbs.push({ name: "Directory", href: "/directory" });
  }

  const facts: { name: string; value: string }[] = [];
  if (f.beds) facts.push({ name: "Certified beds", value: String(f.beds) });
  if (f.ownership_type) facts.push({ name: "Ownership", value: f.ownership_type });
  if (f.emergency_services !== null) {
    facts.push({ name: "Emergency services", value: f.emergency_services ? "Yes" : "No" });
  }
  if (f.county) facts.push({ name: "County", value: titleCase(f.county) });
  if (f.medicare_since) facts.push({ name: "Certified since", value: f.medicare_since });
  const ratings = [
    { name: "Overall rating", value: f.overall_rating },
    { name: "Health inspection rating", value: f.health_inspection_rating },
    { name: "Staffing rating", value: f.staffing_rating },
    { name: "Quality measure rating", value: f.quality_measure_rating },
  ].filter((r) => r.value !== null);

  // An organisation NPI with more than one facility has its own profile at /npi/<npi>; with
  // only this one, /npi/<npi> redirects here, so linking it would link this page to itself.
  const orgHasOwnPage = Boolean(f.npi) && (profile?.facility_count ?? 0) > 1;
  const where = place(f);
  const faq: Faq[] = profileFaq(name, profile, f.leadership, [
    {
      q: `What kind of facility is ${name}?`,
      a: `${facilityLabel(f)}${f.subtype ? ` (${titleCase(f.subtype)})` : ""}${where ? ` in ${where}` : ""}${
        f.medicare_since ? `, certified since ${f.medicare_since}` : ""
      }.`,
    },
    ...(f.beds
      ? [{ q: `How many beds does ${name} have?`, a: `${f.beds.toLocaleString("en-US")} certified beds.` }]
      : []),
    ...(f.phone
      ? [{ q: `What is the main phone number for ${name}?`, a: `The published main line is ${f.phone}.` }]
      : []),
    ...(f.ownership_type
      ? [{ q: `Who owns ${name}?`, a: `Its ownership type is ${f.ownership_type.toLowerCase()}.${f.organization_name ? ` The enrolled legal entity is ${titleCase(f.organization_name)}.` : ""}` }]
      : []),
    ...(f.overall_rating !== null
      ? [{ q: `How is ${name} rated?`, a: `Its published overall rating is ${stars(f.overall_rating)}.` }]
      : []),
  ]);

  const entity = {
    ...schemaFor(f.facility_type),
    "@id": siteUrl(`${path}#entity`),
    name,
    url: siteUrl(path),
    ...(f.organization_name ? { legalName: titleCase(f.organization_name) } : {}),
    identifier: [
      { "@type": "PropertyValue", propertyID: "CCN", value: f.ccn },
      ...(f.npi ? [{ "@type": "PropertyValue", propertyID: "NPI", value: f.npi }] : []),
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: f.address_line ?? undefined,
      addressLocality: titleCase(f.city) || undefined,
      addressRegion: f.state ?? undefined,
      postalCode: f.postal_code ?? undefined,
      addressCountry: "US",
    },
    // The facility's published main line: an institution's switchboard, public record.
    telephone: f.phone ?? undefined,
    ...(profile?.system
      ? {
          parentOrganization: {
            "@type": "Organization",
            name: titleCase(profile.system.label),
            url: siteUrl(systemPath(profile.system.slug)),
          },
        }
      : f.chain_organization
        ? { parentOrganization: { "@type": "Organization", name: titleCase(f.chain_organization) } }
        : {}),
    // Beds, ownership and ratings have no schema.org property of their own. The ratings are a
    // published assessment, not reviews, so they are never `aggregateRating`.
    additionalProperty: [
      ...facts.map((fact) => ({ "@type": "PropertyValue", name: fact.name, value: fact.value })),
      ...ratings.map((r) => ({
        "@type": "PropertyValue",
        name: r.name,
        value: r.value,
        maxValue: 5,
        minValue: 1,
      })),
    ],
  };

  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            entity,
            ...(faq.length > 0 ? [faqJsonLd(faq)] : []),
            // The trail the crumbs below show, home page included. See lib/schema.ts.
            breadcrumb([...crumbs, { name, href: path }]),
          ],
        }}
      />

      <section className="section" style={{ paddingTop: 36 }}>
        <div className="wrap">
          <ol className="crumbs">
            <li>
              <Link href="/">Home</Link>
            </li>
            {crumbs.map((c) => (
              <li key={c.href}>
                <Link href={c.href}>{c.name}</Link>
              </li>
            ))}
            <li aria-current="page">{name}</li>
          </ol>

          <div className="eyebrow rule">
            {facilityLabel(f)} · certification number <span className="mono">{f.ccn}</span>
          </div>
          <h1 style={{ fontSize: "clamp(1.8rem, 3.8vw, 2.7rem)" }}>{name}</h1>
          <p className="lede">{describe(f)}.</p>
          <p>{POSITIONING.organizations}</p>
          <div className="actions" style={{ marginTop: 18 }}>
            <Link className="btn primary" href={`/app/facility/${encodeURIComponent(f.ccn)}`}>Open facility workspace</Link>
            <Link className="btn" href={reportPath("ccn", f.ccn)}>Suggest a correction</Link>
          </div>
          <p className="fine">Already signed in? Open this same record in your workspace. If asked to sign in, return to this page and open the link again.</p>

          <div className="grid two" style={{ marginTop: 28, alignItems: "start" }}>
            <div className="panel">
              <h2>Record</h2>
              <dl className="rows">
                <div>
                  <dt>Type</dt>
                  <dd>
                    {facilityLabel(f)}
                    {f.subtype ? ` · ${titleCase(f.subtype)}` : ""}
                  </dd>
                </div>
                <div>
                  <dt>Address</dt>
                  <dd>
                    {[
                      titleCase(f.address_line),
                      [titleCase(f.city), f.state, f.postal_code].filter(Boolean).join(" "),
                    ]
                      .filter(Boolean)
                      .join(", ") || "Not filed"}
                  </dd>
                </div>
                {f.phone && (
                  <div>
                    <dt>Main phone</dt>
                    <dd className="num">{f.phone}</dd>
                  </div>
                )}
                {facts.map((fact) => (
                  <div key={fact.name}>
                    <dt>{fact.name}</dt>
                    <dd className={fact.name === "Certified beds" ? "num" : undefined}>
                      {fact.value}
                    </dd>
                  </div>
                ))}
                {f.chain_organization && !profile?.system && (
                  <div>
                    <dt>Chain</dt>
                    <dd>{titleCase(f.chain_organization)}</dd>
                  </div>
                )}
                {profileFacts(profile).map((fact) => (
                  <div key={fact.name}>
                    <dt>{fact.name}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
                {(f.npi || f.organization_name) && (
                  <div>
                    <dt>Organization</dt>
                    <dd>
                      {f.npi && orgHasOwnPage ? (
                        <Link href={`/npi/${f.npi}`}>
                          {titleCase(f.organization_name) || `NPI ${f.npi}`}
                        </Link>
                      ) : (
                        titleCase(f.organization_name)
                      )}
                      {f.npi && (
                        <span className="fine mono" style={{ display: "block" }}>
                          NPI {f.npi}
                        </span>
                      )}
                    </dd>
                  </div>
                )}
              </dl>
              <p className="fine" style={{ marginTop: 14 }}>
                Do you work here, and is something on this listing wrong?{" "}
                <Link href={reportPath("ccn", f.ccn)}>Report a problem with this listing</Link> — a
                person reads every report, and nothing changes until they decide.
              </p>
            </div>

            <div>
              {ratings.length > 0 && (
                <div className="panel">
                  <h2>Published ratings</h2>
                  <dl className="rows">
                    {ratings.map((r) => (
                      <div key={r.name}>
                        <dt>{r.name}</dt>
                        <dd className="num">{stars(r.value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              <LeadershipPanel leadership={f.leadership} workspaceHref={`/app/facility/${encodeURIComponent(f.ccn)}`} />
            </div>
          </div>
        </div>
      </section>

      {f.network?.links.length ? <div className="wrap"><PublicDecisionNetwork name={name} network={f.network} organizationName={f.organization_name} ownershipType={f.ownership_type} leadership={f.leadership} workspaceHref={`/app/facility/${encodeURIComponent(f.ccn)}`} /></div> : null}
      <OrgProfileSections name={name} profile={profile} showFacilities={(profile?.facility_count ?? 0) > 1} />

      {(nearby.length > 0 || kind) && (
        <section className="section">
          <div className="wrap">
            <div className="section-head">
              <div className="eyebrow rule">Nearby</div>
              <h2>
                {f.city ? `Other certified facilities in ${titleCase(f.city)}` : "Related facilities"}
              </h2>
              <p className="fine">These records share a city. Proximity does not establish an affiliation with {name}.</p>
            </div>
            {nearby.length > 0 && (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Facility</th>
                      <th>Type</th>
                      <th>Beds</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nearby.map((n) => (
                      <tr key={n.ccn}>
                        <td>
                          <Link href={facilityPath(n)}>
                            <b>{facilityName(n)}</b>
                          </Link>
                        </td>
                        <td className="fine">{facilityLabel(n)}</td>
                        <td className="fine num">{n.beds ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {kind && f.state && (
              <div className="hints" style={{ justifyContent: "flex-start", marginTop: 20 }}>
                <span>More:</span>
                {cityListed && f.city && (
                  <Link href={kindPath(kind, f.state, f.city)}>
                    {kind.plural} in {titleCase(f.city)}
                  </Link>
                )}
                <Link href={kindPath(kind, f.state)}>
                  {kind.plural} in {region}
                </Link>
                {kind && <Link href={listPath(kind.slug)}>{kind.plural} list</Link>}
                {profile?.system && (
                  <Link href={systemPath(profile.system.slug)}>{titleCase(profile.system.label)}</Link>
                )}
              </div>
            )}
          </div>
        </section>
      )}
      <section className="section">
        <div className="wrap">
          {faq.length > 0 && (
            <>
              <div className="section-head">
                <div className="eyebrow rule">FAQ</div>
                <h2>About {name}</h2>
              </div>
              {faq.map((q) => (
                <div className="panel" key={q.q}>
                  <h3>{q.q}</h3>
                  <p>{q.a}</p>
                </div>
              ))}
            </>
          )}
          <div className="cta" style={{ marginTop: 32 }}>
            <h2>Continue researching {name}</h2>
            <p className="lede">
              Open the facility record in your workspace to review the information available.
              Available contact details depend on your permissions and plan allowance. Review the roles and organizations listed before choosing whom to approach.
            </p>
            <div className="actions" style={{ marginTop: 16 }}>
              <Link className="btn primary lg" href={`/app/facility/${encodeURIComponent(f.ccn)}`}>
                Open facility workspace
              </Link>
              <Link className="btn lg" href="/pricing">
                See plans
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

// A refused read is not a broken page, and it is not an absence either. The same wrapper the
// specialty pages use: Next's own redirect and notFound control flow is rethrown, anything else
// renders the recovery state with working links and noindex. Measured 19 Oct 2026, after the row
// allowance ran out: FacilityPage was one of the families still answering HTTP 500.
export default withDirectoryFallback(FacilityPage);
export const generateMetadata = withDirectoryMetadata(facilityMetadata);

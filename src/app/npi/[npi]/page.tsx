import type { Metadata } from "next";
import Link from "next/link";
import { providerDiscoveryLinks } from "@/lib/providerDiscovery";
import { PublicDecisionNetwork } from "@/components/DecisionNetwork";
import { notFound, permanentRedirect } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { LeadershipPanel, OrgProfileSections, profileFacts, profileFaq } from "@/components/OrgProfile";
import {
  getProvider,
  organizationLeadership,
  organizationProfile,
  toPublic,
  type LeadershipCounts,
  type OrganizationProfile,
  type PublicProvider,
} from "@/lib/api";
import { boundaryShort, utilisation, YEAR } from "@/lib/claims";
import { reportPath } from "@/lib/corrections";
import { facilityPath } from "@/lib/facilities";
import { faqJsonLd, systemPath } from "@/lib/lists";
import { breadcrumb } from "@/lib/schema";
import { siteUrl, stateName } from "@/lib/site";
import { withDirectoryFallback, withDirectoryMetadata } from "@/components/DirectoryFallback";

/**
 * One provider, server-rendered.
 *
 * This is the template the SEO surface is made of: real HTML with no JavaScript required to
 * read it, a title and description drawn from the record itself, and structured data carrying
 * the same facts in a form an assistant can quote. Everything on this page is the federal
 * public record. Contact details exist behind a sign-in, one reveal at a time, and this page
 * says only whether they exist.
 *
 * An organisation's page is its profile: linked providers by specialty, the EHR, its locations,
 * its health system and peers, leadership counted by role, and an FAQ built from those facts.
 * One address per organisation: an organisation NPI with exactly one certified facility
 * redirects to that facility's page, which carries the same profile; with several, this page is
 * the organisation and each facility's page is a location of it.
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

type Props = { params: Promise<{ npi: string }> };

/**
 * For an organisation: how many named leadership contacts it has, by role, and its profile.
 * Counts, never names - the people are not NPI holders. Either failing leaves the page as it
 * was rather than failing it.
 */
async function organisationExtras(
  p: PublicProvider,
): Promise<{ leadership: LeadershipCounts | null; profile: OrganizationProfile | null }> {
  if (p.type !== "organization") return { leadership: null, profile: null };
  const [leadership, profile] = await Promise.all([
    organizationLeadership(p.npi).catch(() => null),
    organizationProfile(p.npi).catch(() => null),
  ]);
  return { leadership, profile };
}

/** The facility page this organisation redirects to, when it has exactly one facility. */
function singleFacilityPath(profile: OrganizationProfile | null): string | null {
  if (!profile || profile.facility_count !== 1 || profile.facilities.length !== 1) return null;
  return facilityPath(profile.facilities[0]);
}

function describe(p: PublicProvider): string {
  const specialty = p.primary_taxonomy?.display ?? "Healthcare provider";
  const place = [p.city, stateName(p.state) ?? p.state].filter(Boolean).join(", ");
  return place ? `${specialty} in ${place}` : specialty;
}

async function providerMetadata({ params }: Props): Promise<Metadata> {
  const { npi } = await params;
  if (!/^\d{10}$/.test(npi)) return { title: "Not a valid NPI", robots: { index: false } };
  const row = await getProvider(npi);
  if (!row) return { title: `NPI ${npi} not found`, robots: { index: false } };
  const p = toPublic(row);
  const single =
    p.type === "organization" ? singleFacilityPath(await organizationProfile(p.npi).catch(() => null)) : null;
  const title = `${p.name} · NPI ${p.npi}`;
  const description = `${describe(p)}. NPI ${p.npi}, ${p.type}, ${p.status} provider record${
    p.employer_name ? `; affiliated with ${p.employer_name}` : ""
  }.`;
  return {
    title,
    description,
    alternates: { canonical: single ?? `/npi/${p.npi}` },
    openGraph: { title, description, type: "profile", url: siteUrl(`/npi/${p.npi}`) },
  };
}

async function ProviderPage({ params }: Props) {
  const { npi } = await params;
  if (!/^\d{10}$/.test(npi)) notFound();
  const row = await getProvider(npi);
  if (!row) notFound();
  const p = toPublic(row);
  // The coverage figure inside the boundary sentence is read, not typed: see `lib/claims.ts`.
  // Null when the platform did not answer, and the sentence then states the limit without a
  // figure rather than quoting one from memory.
  const measured = await utilisation();
  const { leadership, profile } = await organisationExtras(p);
  const single = singleFacilityPath(profile);
  if (single) permanentRedirect(single);
  const faq = p.type === "organization" ? profileFaq(p.name, profile, leadership) : [];

  const region = stateName(p.state) ?? p.state ?? undefined;
  const entity = {
    "@type": p.type === "organization" ? "MedicalOrganization" : "Person",
    "@id": siteUrl(`/npi/${p.npi}#entity`),
    name: p.name,
    url: siteUrl(`/npi/${p.npi}`),
    identifier: { "@type": "PropertyValue", propertyID: "NPI", value: p.npi },
    ...(p.type === "organization"
      ? { medicalSpecialty: p.primary_taxonomy?.display }
      : { hasOccupation: p.primary_taxonomy?.display ? { "@type": "Occupation", name: p.primary_taxonomy.display } : undefined }),
    address: {
      "@type": "PostalAddress",
      addressLocality: p.city ?? undefined,
      addressRegion: p.state ?? undefined,
      postalCode: p.postal_code?.slice(0, 5),
      addressCountry: "US",
    },
    telephone: p.phone ?? undefined,
    ...(p.employer_name && p.type !== "organization"
      ? { affiliation: { "@type": "MedicalOrganization", name: p.employer_name } }
      : {}),
    ...(profile?.system
      ? {
          parentOrganization: {
            "@type": "Organization",
            name: profile.system.label,
            url: siteUrl(systemPath(profile.system.slug)),
          },
        }
      : {}),
  };
  const crumbs = providerDiscoveryLinks(p);

  return (
    <main className="np-profile-page">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            entity,
            ...(faq.length > 0 ? [faqJsonLd(faq)] : []),
            // Visible crawlable directory links match the structured breadcrumb trail.
            breadcrumb([...crumbs, { name: p.name, href: `/npi/${p.npi}` }]),
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
            <li aria-current="page">{p.name}</li>
          </ol>

          <div className="eyebrow rule">
            Provider record · NPI {p.npi} ·{" "}
            <span className={`tag ${p.status === "active" ? "ok" : "warn"}`}>{p.status}</span>
          </div>
          <h1 style={{ fontSize: "clamp(1.8rem, 3.8vw, 2.7rem)" }}>{p.name}</h1>
          <p className="lede">{describe(p)}</p>
          <nav className="np-list-jumps" aria-label="Provider profile sections"><a href="#professional-overview">Professional overview</a><a href="#contact-access">Contact access</a><Link href="/search">Find another provider</Link></nav>

          <div className="grid two np-profile-grid" style={{ marginTop: 28, alignItems: "start" }}>
            <div className="panel">
              <span className="eyebrow">Public registry</span><h2 id="professional-overview">Professional overview</h2>
              <dl className="rows">
                <div>
                  <dt>NPI</dt>
                  <dd className="mono num">{p.npi}</dd>
                </div>
                <div>
                  <dt>Type</dt>
                  <dd>{p.type === "organization" ? "Organization (NPI-2)" : "Individual (NPI-1)"}</dd>
                </div>
                {p.primary_taxonomy && (
                  <div>
                    <dt>Specialty</dt>
                    <dd>
                      {p.primary_taxonomy.display}{" "}
                      <span className="mono fine">({p.primary_taxonomy.code})</span>
                    </dd>
                  </div>
                )}
                {p.credentials && (
                  <div>
                    <dt>Credentials</dt>
                    <dd>{p.credentials}</dd>
                  </div>
                )}
                <div>
                  <dt>Practice location</dt>
                  <dd>
                    {[p.city, p.state, p.postal_code?.slice(0, 5)].filter(Boolean).join(" ") ||
                      "Not filed"}
                  </dd>
                </div>
                {p.phone && (
                  <div>
                    <dt>Practice phone</dt>
                    <dd className="num">{p.phone}</dd>
                  </div>
                )}
                {p.employer_name && (
                  <div>
                    <dt>Affiliated with</dt>
                    <dd>{p.employer_name}</dd>
                  </div>
                )}
                {profileFacts(profile).map((fact) => (
                  <div key={fact.name}>
                    <dt>{fact.name}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
                <div>
                  <dt>Last updated</dt>
                  <dd className="num">{p.updated_at ? p.updated_at.slice(0, 10) : "Unknown"}</dd>
                </div>
              </dl>
              <p className="fine" style={{ marginTop: 14 }}>
                Is this you, and is something here wrong?{" "}
                <Link href={reportPath("npi", p.npi)}>Report a problem with this listing</Link> — a
                person reads every report, and nothing changes until they decide. To have your
                details taken out altogether, use{" "}
                <Link href="/remove-my-information">Remove my information</Link>.
              </p>
            </div>

            <div>
              <div className="panel">
                <span className="eyebrow">Available with an eligible plan</span><h2 id="contact-access">Make the connection</h2>
                <dl className="rows">
                  <div>
                    <dt>Work email</dt>
                    <dd>
                      {p.has_email ? (
                        <Link href="/sign-in" className="locked">
                          on file · sign in to reveal
                        </Link>
                      ) : (
                        <span className="fine">Not on file</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Home address</dt>
                    <dd>
                      {p.has_home_contact ? (
                        <Link href="/sign-in" className="locked">
                          Check plan eligibility
                        </Link>
                      ) : (
                        <span className="fine">Not matched</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Cell phone</dt>
                    <dd>
                      {p.has_home_contact ? (
                        <Link href="/sign-in" className="locked">
                          Check plan eligibility
                        </Link>
                      ) : (
                        <span className="fine">Not matched</span>
                      )}
                    </dd>
                  </div>
                </dl>
                <p className="fine" style={{ marginTop: 14 }}>
                  Contact details are revealed to signed-in customers one provider at a time,
                  subject to plan, permission and reveal limits. Newly unlocking premium details may use additional units.{" "}
                  <Link href="/pricing">See plans</Link>.
                </p>
              </div>

              {p.type === "organization" && <LeadershipPanel leadership={leadership} workspaceHref={`/app/organization/${p.npi}`} />}

              <div className="panel">
                <h2>What they bill and prescribe</h2>
                <p className="fine">
                  The procedures this provider billed Medicare for, code by code, and the drugs they
                  prescribed under Part D &mdash; from published Medicare data for {YEAR}, for
                  signed-in customers. Search can be filtered on either by name, so
                  &ldquo;knee replacement&rdquo; and &ldquo;Eliquis&rdquo; are queries rather than
                  codes.
                </p>
                <p className="fine" style={{ marginTop: 10 }}>
                  {boundaryShort(measured)} A provider with nothing published has{" "}
                  <b>no published Medicare volume</b>, which covers no volume, volume below the
                  publication threshold and not billing Medicare at all &mdash; the published data
                  does not separate them. Provider-level aggregates only; nothing patient-level
                  exists here. <Link href="/data">What it covers</Link>.
                </p>
              </div>

              <div className="panel">
                <h2>Also in the record</h2>
                <p className="fine">
                  Group affiliations and employers, facility ownership, program standing and
                  license detail appear here for signed-in
                  customers.
                </p>
              </div>
            </div>
          </div>

          <div className="hints" style={{ justifyContent: "flex-start", marginTop: 24 }}>
            <span>Explore related directories:</span>
            {crumbs.map(link => <Link key={link.href} href={link.href}>{link.name}</Link>)}
            <Link href="/lists">Browse specialty and facility lists</Link>
            <Link href={`/bulk-data?${new URLSearchParams({list: p.primary_taxonomy?.display ?? "Healthcare providers"})}`}>Request a bulk data quote</Link>
            {p.primary_taxonomy && p.state && (
              <Link href={`/search?state=${p.state}&q=${encodeURIComponent(p.primary_taxonomy.display)}`}>
                {p.primary_taxonomy.display} in {region}
              </Link>
            )}
            {p.city && p.state && (
              <Link href={`/search?city=${encodeURIComponent(p.city)}&state=${p.state}`}>
                Providers in {p.city}, {p.state}
              </Link>
            )}
            {p.employer_name && (
              <Link href={`/search?q=${encodeURIComponent(p.employer_name)}&type=organization`}>
                {p.employer_name}
              </Link>
            )}
          </div>
        </div>
      </section>

      {p.type === "organization" && (
        <>
          {profile?.network?.links.length ? <div className="wrap"><PublicDecisionNetwork name={p.name} network={profile.network} leadership={leadership} workspaceHref={`/app/organization/${p.npi}`} /></div> : null}
          <OrgProfileSections name={p.name} profile={profile} showFacilities />
        </>
      )}

      <section className="section">
        <div className="wrap">
          {faq.length > 0 && (
            <>
              <div className="section-head">
                <div className="eyebrow rule">FAQ</div>
                <h2>About {p.name}</h2>
              </div>
              {faq.map((q) => (
                <div className="panel" key={q.q}>
                  <h3>{q.q}</h3>
                  <p>{q.a}</p>
                </div>
              ))}
              <div className="cta" style={{ marginTop: 32 }}>
                <h2>Reach the people behind {p.name}</h2>
                <div className="actions" style={{ marginTop: 16 }}>
                  <Link className="btn primary lg" href="/sign-up">
                    Create an account
                  </Link>
                </div>
              </div>
            </>
          )}
          <p className="fine" style={{ marginTop: 28 }}>
            An NPI is an identifier, not a credential: it
            says this provider is enumerated, not that they are licensed or in good standing
            today.
          </p>
        </div>
      </section>
    </main>
  );
}

// A refused read is not a broken page, and it is not an absence either. The same wrapper the
// specialty pages use: Next's own redirect and notFound control flow is rethrown, anything else
// renders the recovery state with working links and noindex. Measured 19 Oct 2026, after the row
// allowance ran out: ProviderPage was one of the families still answering HTTP 500.
export default withDirectoryFallback(ProviderPage);
export const generateMetadata = withDirectoryMetadata(providerMetadata);

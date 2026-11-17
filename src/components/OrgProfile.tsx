import Link from "next/link";
import type { LeadershipCounts, OrganizationProfile } from "@/lib/api";
import { ROLE_LABELS, facilityLabel, facilityName, facilityPath, titleCase } from "@/lib/facilities";
import { type Faq, fmt, systemPath } from "@/lib/lists";

/**
 * The organisation-profile sections shared by a facility's page and an organisation NPI's page:
 * the linked providers by specialty, a few of them by name (NPI holders - public record), the
 * locations, the system it belongs to, peers, and an FAQ built only from these facts.
 *
 * Never a person without an NPI: leadership is a count by role, with a workspace link when available.
 */

/** Rows for the header fact box. Only facts that exist are returned. */
export function profileFacts(p: OrganizationProfile | null): { name: string; value: React.ReactNode }[] {
  if (!p) return [];
  const rows: { name: string; value: React.ReactNode }[] = [];
  if (p.affiliated_providers > 0) {
    rows.push({ name: "Affiliated providers", value: <span className="num">{fmt(p.affiliated_providers)}</span> });
  }
  if (p.by_specialty.length > 0) {
    rows.push({
      name: "Top specialties",
      value: p.by_specialty
        .slice(0, 3)
        .map((s) => s.label)
        .join(", "),
    });
  }
  const locations = Math.max(p.practice_locations, p.facility_count);
  if (locations > 1) {
    rows.push({
      name: "Locations",
      value: (
        <>
          <span className="num">{fmt(locations)}</span>
          <span className="fine" style={{ display: "block" }}>
            {p.facility_count > 1 ? `${fmt(p.facility_count)} certified facilities` : null}
            {p.facility_count > 1 && p.practice_locations > 1 ? " · " : null}
            {p.practice_locations > 1 ? `${fmt(p.practice_locations)} practice addresses on file` : null}
          </span>
        </>
      ),
    });
  }
  if (p.ehr_system) {
    rows.push({
      name: "EHR system",
      value: (
        <>
          {p.ehr_system}
          <span className="fine" style={{ display: "block" }}>
            {ehrBasisText(p)}
          </span>
        </>
      ),
    });
  }
  if (p.system) {
    rows.push({
      name: "Health system",
      value: (
        <Link href={systemPath(p.system.slug)}>
          {titleCase(p.system.label)} ({fmt(p.system.facilities)} facilities)
        </Link>
      ),
    });
  }
  return rows;
}

function basisText(p: OrganizationProfile): string {
  const parts: string[] = [];
  if (p.affiliation_basis.includes("billing")) parts.push("bill under this organization");
  if (p.affiliation_basis.includes("directory")) parts.push("are listed in its published provider directory");
  return parts.join(" or ") || "have a recorded affiliation in this profile";
}

function ehrBasisText(p: OrganizationProfile): string {
  if (p.ehr_basis === "organization") return "Reported against the organization record; not a verified installation at every location.";
  if (p.ehr_basis === "affiliated_providers") return "Inferred from linked providers with a known EHR; not a confirmed facility installation.";
  return "EHR recorded; the relationship source is not available in this profile.";
}

function exampleReview(p: OrganizationProfile): { href: string; count: number } | null {
  const ids = [...new Set(p.examples.map(e => e.npi).filter(npi => /^[0-9]{10}$/.test(npi)))].slice(0,100);
  if (!ids.length) return null;
  const query = new URLSearchParams();
  for (const npi of ids) query.append("npi", npi);
  return { href: `/app/search?${query}`, count: ids.length };
}

export function profileFaq(
  name: string,
  p: OrganizationProfile | null,
  leadership: LeadershipCounts | null,
  extra: Faq[] = [],
): Faq[] {
  const faq: Faq[] = [...extra];
  if (p && p.affiliated_providers > 0) {
    const top = p.by_specialty.slice(0, 3).map((s) => `${s.label} (${fmt(s.count)})`);
    faq.push({
      q: `How many providers are affiliated with ${name}?`,
      a: `${fmt(p.affiliated_providers)} active individual providers ${basisText(p)}${
        top.length ? `. The largest specialties are ${top.join(", ")}` : ""
      }.`,
    });
  }
  if (p?.ehr_system) {
    faq.push({
      q: `What EHR does ${name} use?`,
      a: `${p.ehr_system}. ${ehrBasisText(p)}`,
    });
  }
  if (p?.system) {
    faq.push({
      q: `Is ${name} part of a health system?`,
      a: `Yes - ${titleCase(p.system.label)}, which has ${fmt(p.system.facilities)} certified facilities.`,
    });
  }
  if (leadership && leadership.total > 0) {
    faq.push({
      q: `Who runs ${name}?`,
      a: `${fmt(leadership.total)} named leadership ${leadership.total === 1 ? "contact is" : "contacts are"} on file (${leadership.by_role
        .map((r) => `${(ROLE_LABELS[r.role] ?? titleCase(r.role)).toLowerCase()} ${fmt(r.count)}`)
        .join(", ")}). Names and titles are available to signed-in customers.`,
    });
  }
  return faq;
}

export function OrgProfileSections({
  name,
  profile,
  showFacilities,
}: {
  name: string;
  profile: OrganizationProfile | null;
  showFacilities: boolean;
}) {
  if (!profile) return (
    <section className="section"><div className="wrap"><h2>Connected profile unavailable</h2>
      <p>The linked-provider, technology and health-system information could not be loaded for this record. This does not mean no relationships exist.</p>
    </div></section>
  );
  const p = profile;
  const review = exampleReview(p);
  return (
    <>
      <section className="section" id="connected-profile">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow rule">Connected research</div>
            <h2>What is connected to this record</h2>
            <p>Review the evidence behind each relationship before building your list. Organization links can cover more than one location; they do not establish employment or admitting privileges at this facility.</p>
          </div>
          <div className="grid pairs">
            <div className="panel" style={{ marginTop: 0 }}><h3>Linked providers</h3>
              <p>{p.affiliated_providers > 0 ? `${fmt(p.affiliated_providers)} active individual providers linked through billing or directory records.` : "No linked providers are recorded in this profile. This is not a count of everyone working here."}</p>
              {p.affiliated_providers > 0 && <Link href="#linked-providers">Review providers and specialties</Link>}
            </div>
            <div className="panel" style={{ marginTop: 0 }}><h3>Organization and health system</h3>
              {p.npi ? <p><Link href={`/app/organization/${p.npi}`}>Open organization NPI {p.npi}</Link></p> : <p>No organization NPI is linked to this record.</p>}
              {p.system ? <Link href={systemPath(p.system.slug)}>{titleCase(p.system.label)}</Link> : <p className="fine">No health-system relationship is available in this profile. That does not establish independent ownership.</p>}
            </div>
            <div className="panel" style={{ marginTop: 0 }}><h3>Technology evidence</h3>
              <p>{p.ehr_system || "No EHR information is available in this profile."}</p>
              {p.ehr_system && <p className="fine">{ehrBasisText(p)}</p>}
            </div>
            <div className="panel" style={{ marginTop: 0 }}><h3>Coverage and source</h3>
              <p>Provider links use billing enrollment and published directory relationships where available. Nearby and similar facilities are discovery suggestions, not affiliations.</p>
              <p className="fine">A relationship verification date is not supplied with this profile. Missing information is not unlocked by spending a reveal credit.</p>
              <Link href="/data">Understand data coverage</Link>
            </div>
          </div>
        </div>
      </section>
      {p.affiliated_providers > 0 && (
        <section className="section" id="linked-providers">
          <div className="wrap">
            <div className="section-head">
              <div className="eyebrow rule">Affiliated providers</div>
              <h2>
                {fmt(p.affiliated_providers)} providers affiliated with {name}
              </h2>
              <p className="fine">Individual providers who {basisText(p)}. These links may describe the wider organization rather than this one location.</p>
            </div>
            <div className="grid pairs" style={{ alignItems: "start" }}>
              <div className="panel" style={{ marginTop: 0 }}>
                <h3>By specialty</h3>
                <dl className="rows">
                  {p.by_specialty.map((s) => (
                    <div key={s.label}>
                      <dt>{s.label}</dt>
                      <dd className="num">{fmt(s.count)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="panel" style={{ marginTop: 0 }}>
                <h3>Provider examples</h3>
                <ul className="ticks" style={{ marginTop: 10 }}>
                  {p.examples.map((e) => (
                    <li key={e.npi}>
                      <Link href={`/npi/${e.npi}`}>{e.name}</Link>
                      {e.credentials ? `, ${e.credentials}` : ""}{" "}
                      <span className="fine">
                        {[e.specialty, [e.city, e.state].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}
                      </span>
                    </li>
                  ))}
                </ul>
                {review ? <div className="actions" style={{ marginTop: 12 }}>
                  <Link href={review.href} className="btn primary">{review.count === 1 ? "Review this provider" : `Review these ${review.count} providers`}</Link>
                </div> : <p className="fine">Individual examples are not available in this response.</p>}
                <p className="fine">This is a sample of the linked providers, not the complete audience. The workspace lets you review records and save selected providers; contact access depends on availability and your plan.</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {showFacilities && p.facilities.length > 0 && (
        <section className="section">
          <div className="wrap">
            <div className="section-head">
              <div className="eyebrow rule">Locations</div>
              <h2>Certified facilities</h2>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Facility</th>
                    <th>Type</th>
                    <th>State</th>
                  </tr>
                </thead>
                <tbody>
                  {p.facilities.map((f) => (
                    <tr key={f.ccn}>
                      <td>
                        <Link href={facilityPath(f)}>
                          <b>{facilityName({ ccn: f.ccn, name: f.name })}</b>
                        </Link>
                      </td>
                      <td className="fine">{facilityLabel({ facility_type: f.facility_type, category: null })}</td>
                      <td className="fine">{f.state}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {p.facility_count > p.facilities.length && (
              <p className="fine" style={{ marginTop: 12 }}>
                Showing {p.facilities.length} of {fmt(p.facility_count)}.
              </p>
            )}
          </div>
        </section>
      )}

      {p.similar.length > 0 && (
        <section className="section">
          <div className="wrap">
            <div className="section-head">
              <div className="eyebrow rule">Similar organizations</div>
              <h2>Organizations like {name}</h2>
              <p className="fine">Suggested comparisons, not evidence of common ownership or an affiliation.</p>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Organization</th>
                    <th>Type</th>
                    <th>Location</th>
                    <th>Beds</th>
                  </tr>
                </thead>
                <tbody>
                  {p.similar.map((s) => (
                    <tr key={s.ccn ?? s.npi ?? s.name}>
                      <td>
                        {s.ccn ? (
                          <Link href={facilityPath({ ccn: s.ccn, name: s.name })}>
                            <b>{facilityName({ ccn: s.ccn, name: s.name })}</b>
                          </Link>
                        ) : (
                          <Link href={`/npi/${s.npi}`}>
                            <b>{titleCase(s.name)}</b>
                          </Link>
                        )}
                      </td>
                      <td className="fine">
                        {s.facility_type ? facilityLabel({ facility_type: s.facility_type, category: null }) : s.specialty}
                      </td>
                      <td className="fine">{[titleCase(s.city), s.state].filter(Boolean).join(", ")}</td>
                      <td className="fine num">{s.beds ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export function LeadershipPanel({ leadership, workspaceHref }: { leadership: LeadershipCounts | null; workspaceHref?: string }) {
  return (
    <div className="panel" style={{ marginTop: 0 }}>
      <h2>Leadership on file</h2>
      {leadership && leadership.total > 0 ? (
        <>
          <p>
            <b>{fmt(leadership.total)}</b> named leadership {leadership.total === 1 ? "contact" : "contacts"} on
            file, by role:
          </p>
          <dl className="rows">
            {leadership.by_role.map((r) => (
              <div key={r.role}>
                <dt>{ROLE_LABELS[r.role] ?? titleCase(r.role)}</dt>
                <dd className="num">{r.count}</dd>
              </div>
            ))}
          </dl>
        </>
      ) : (
        <p className="fine">{leadership ? "No named leadership contacts on file. Signing in does not add contacts to this record." : "Leadership information is unavailable for this record. This does not mean no contacts exist."}</p>
      )}
      <p className="fine" style={{ marginTop: 14 }}>
        Executives, officers and owners as public filings name them, with the title each filing
        gives them. <Link href="/leadership">Leadership across US healthcare, by role</Link>.
      </p>
      {leadership && leadership.total > 0 && <div className="actions" style={{ marginTop: 12 }}>
        <Link className="btn primary" href={workspaceHref || "/app/find"}>
          Review leadership in workspace
        </Link>
      </div>}
    </div>
  );
}

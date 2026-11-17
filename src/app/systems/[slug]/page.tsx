import { POSITIONING } from "@/content/positioning";
import { withDirectoryFallback, withDirectoryMetadata } from "@/components/DirectoryFallback";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import {
  getHealthSystem,
  getSystem,
  type FacilityType,
  type HealthSystemDetail,
  type HealthSystemMember,
  type HealthSystemMemberGroup,
  type HealthSystemMemberKind,
  type SystemDetail,
} from "@/lib/api";
import { facilityPath, kindOf, schemaFor, titleCase } from "@/lib/facilities";
import {
  SYSTEM_COUNT_LABELS,
  type Faq,
  faqJsonLd,
  fmt,
  listPath,
  memberLabel,
  ownershipPhrase,
  systemPath,
} from "@/lib/lists";
import { breadcrumb } from "@/lib/schema";
import { siteUrl, socialCard, stateName } from "@/lib/site";

/**
 * One health system or chain: where it is, how big it is, and its member facilities by kind.
 *
 * Read from the health-system endpoint (`/v1/health-systems`) rather than from the nightly chain
 * summary this page used to read. What that changes, and what it must not:
 *
 * * **No URL goes dark.** A chain's slug is the same string the chain summary used, so every
 *   `/systems/<slug>` that worked keeps working. Where the health-system load has not run in an
 *   environment yet, `fromChainSummary` adapts the old shape into the new one so the page still
 *   answers - one render path, not two. That fallback can be deleted once the load runs everywhere.
 * * **A merged system moves, once.** Slugs are permanent, so a system folded into another answers a
 *   permanent redirect to its target rather than a 404 or a second copy of the same page.
 * * **Nobody is named.** Providers are a count and a link to a search, never a list.
 * * **Ownership qualifies the system**, printed with the footnote the API sends beside it. There is
 *   no wording here that can put the word next to a single facility.
 * * **"Facilities" says so.** The wide count is labelled "Facilities (all kinds)"; hospitals are
 *   their own row. Outpatient centers are outpatient centers, never physician groups.
 * * **A member links out only where we hold the facility**, which is what `facility_type` says.
 *
 * Cached for a day.
 */

export const revalidate = 0;

type Props = { params: Promise<{ slug: string }> };

/** Main's own check, kept as it was: anything else is somebody else's URL, not a slug of ours. */
function couldBeSlug(slug: string): boolean {
  return /^[a-z0-9-]{1,160}$/.test(slug);
}

const MEMBER_ORDER: HealthSystemMemberKind[] = [
  "hospital",
  "nursing_home",
  "home_health",
  "facility",
];

/** Where a facility type sits among the member groups. Hospice reads with home health. */
function kindForType(type: FacilityType | null): HealthSystemMemberKind {
  switch (type) {
    case "hospital":
      return "hospital";
    case "nursing_home":
      return "nursing_home";
    case "home_health":
    case "hospice":
      return "home_health";
    default:
      return "facility";
  }
}

/**
 * The old chain summary as a system, for a slug the health-system load has not reached yet.
 *
 * Only the fields that shape exists to carry: no ownership word (the summary has none to state), no
 * provider count, and the counts it does have are of its member facilities.
 */
function fromChainSummary(chain: SystemDetail): HealthSystemDetail {
  const members = new Map<HealthSystemMemberKind, HealthSystemMember[]>();
  for (const facility of chain.members) {
    const kind = kindForType(facility.facility_type);
    members.set(kind, [
      ...(members.get(kind) ?? []),
      {
        name: facility.name,
        ccn: facility.ccn,
        city: facility.city,
        state: facility.state,
        member_kind: kind,
        member_type: null,
        facility_type: facility.facility_type,
        beds: facility.beds,
        corp_parent_name: null,
        corp_parent_type: null,
      },
    ]);
  }
  const count = (kind: HealthSystemMemberKind) => members.get(kind)?.length ?? 0;
  return {
    slug: chain.slug,
    name: chain.label,
    kind: "chain",
    hq_city: null,
    hq_state: null,
    beds: chain.beds,
    states: chain.states,
    organization_npis: [],
    ownership: null,
    multistate: chain.states.length > 1,
    counts: {
      hospitals: count("hospital"),
      nursing_homes: count("nursing_home"),
      home_health: count("home_health"),
      facilities: chain.facilities,
      groups: 0,
      organizations: 0,
      providers: 0,
      outpatient_centers: null,
    },
    members: MEMBER_ORDER.filter((kind) => count(kind) > 0).map((kind) => ({
      member_kind: kind,
      label: memberLabel(kind),
      total: count(kind),
      items: members.get(kind) ?? [],
      truncated: false,
    })),
    ownership_note: "",
    notes: [],
  };
}

type Resolved =
  | { kind: "system"; system: HealthSystemDetail }
  | { kind: "moved"; to: string }
  | { kind: "missing" };

async function resolve(slug: string): Promise<Resolved> {
  if (!couldBeSlug(slug)) return { kind: "missing" };
  const found = await getHealthSystem(slug);
  if (found.kind !== "missing") return found;
  // Not a health system we hold: the chain summary still knows this slug in an environment where
  // the health-system load has not run. Serve it rather than retire a URL.
  const chain = await getSystem(slug);
  return chain ? { kind: "system", system: fromChainSummary(chain) } : { kind: "missing" };
}

/**
 * What the page says where the member list would be, when there is none.
 *
 * The same sentence the API sends as a note, deliberately: the page says it in the place a reader
 * needs it, and drops it from the notes list below so it is not read twice. The constant is also
 * what the chain-summary fallback falls back to, which sends no notes at all.
 */
const NO_MEMBERS = "No member facility of this system is on file by certification number.";

/** The counts worth a row, in reading order. `facilities` is last: it is the sum, not a kind. */
const COUNT_ROWS = [
  "hospitals",
  "nursing_homes",
  "home_health",
  "outpatient_centers",
  "groups",
  "organizations",
  "facilities",
] as const;

/** "Health system" or "facility chain" - what this row is, in the words the eyebrow uses too. */
function kindWord(s: HealthSystemDetail): string {
  return s.kind === "chain" ? "facility chain" : "health system";
}

/**
 * The system in one sentence, built only from figures it has.
 *
 * It always opens "<name> is a ...", because the clauses that follow are all "with"/"in"/"and":
 * without a subject and a verb, a system carrying no ownership word read "Example Sierra Health
 * Partners with 3 member hospitals", which is a sentence fragment. Where there is an ownership
 * word the phrase carries the noun ("a nonprofit system"); where there is not, the kind does.
 */
function describe(s: HealthSystemDetail): string {
  const name = titleCase(s.name);
  const phrase = ownershipPhrase(s.ownership);
  const parts = [`${name} is ${phrase ?? `a ${kindWord(s)}`}`];
  if (s.counts.hospitals > 0) {
    parts.push(`with ${fmt(s.counts.hospitals)} member hospitals`);
  } else if (s.counts.facilities > 0) {
    parts.push(`with ${fmt(s.counts.facilities)} member facilities`);
  }
  if (s.states.length > 0) {
    const where =
      s.states.length === 1 ? stateName(s.states[0]) ?? s.states[0] : `${s.states.length} states`;
    parts.push(`in ${where}`);
  }
  if (s.beds > 0) parts.push(`and ${fmt(s.beds)} certified beds`);
  return `${parts.join(" ")}.`;
}

async function readMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const found = await resolve(slug);
  if (found.kind === "moved") {
    // The redirect happens on the page; the canonical is the target's either way.
    return {
      title: "Moved",
      robots: { index: false },
      alternates: { canonical: systemPath(found.to) },
    };
  }
  if (found.kind === "missing") return { title: "System not found", robots: { index: false } };
  const s = found.system;
  const name = titleCase(s.name);
  // A figure in the title only where there is one: "with 0 facilities" is a title that reads as
  // an empty page, and what a system with no certified member on file has is its own name.
  const counted = s.counts.hospitals > 0 ? s.counts.hospitals : s.counts.facilities;
  const noun = s.counts.hospitals > 0 ? "hospitals" : "facilities";
  const title =
    counted > 0
      ? `${name} · ${kindWord(s)} with ${fmt(counted)} ${noun}`
      : `${name} · ${kindWord(s)}`;
  return {
    title,
    description: describe(s),
    alternates: { canonical: systemPath(s.slug) },
    openGraph: socialCard(systemPath(s.slug), title, describe(s)),
  };
}

/** A member's facility profile, where the platform holds one for this CCN. */
function memberHref(member: HealthSystemMember): string | null {
  if (!member.ccn || !member.facility_type) return null;
  return facilityPath({ ccn: member.ccn, name: member.name });
}

function memberName(member: HealthSystemMember): string {
  return titleCase(member.name) || `Facility ${member.ccn ?? ""}`.trim();
}

function memberLabelFor(member: HealthSystemMember): string {
  if (member.member_type) return member.member_type;
  const kind = member.facility_type ? kindOf(member.facility_type) : null;
  return kind ? kind.singular : "Certified facility";
}

function MemberGroup({ group }: { group: HealthSystemMemberGroup }) {
  const parents = group.items.some((m) => m.corp_parent_name);
  return (
    <div style={{ marginBottom: 28 }}>
      <h3 id={group.member_kind}>
        {group.label} <span className="fine num">({fmt(group.total)})</span>
      </h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Facility</th>
              <th>Type</th>
              <th>City</th>
              <th>CCN</th>
              {parents && <th>Corporate parent</th>}
            </tr>
          </thead>
          <tbody>
            {group.items.map((m) => {
              const href = memberHref(m);
              return (
                <tr key={`${m.ccn ?? m.name}`}>
                  <td>
                    {href ? (
                      <Link href={href}>
                        <b>{memberName(m)}</b>
                      </Link>
                    ) : (
                      <b>{memberName(m)}</b>
                    )}
                  </td>
                  <td className="fine">{memberLabelFor(m)}</td>
                  <td className="fine">{titleCase(m.city)}</td>
                  <td className="fine mono">{m.ccn ?? "—"}</td>
                  {parents && (
                    <td className="fine">
                      {m.corp_parent_name ? titleCase(m.corp_parent_name) : "—"}
                      {m.corp_parent_name && m.corp_parent_type && (
                        <span className="fine" style={{ display: "block" }}>
                          {m.corp_parent_type}
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {group.truncated && (
        <p className="fine" style={{ marginTop: 10 }}>
          Showing {fmt(group.items.length)} of {fmt(group.total)}.
        </p>
      )}
    </div>
  );
}

async function SystemPage({ params }: Props) {
  const { slug } = await params;
  const found = await resolve(slug);
  // A merged system keeps its slug for ever and points at its target: the old URL moves, once.
  if (found.kind === "moved") permanentRedirect(systemPath(found.to));
  if (found.kind === "missing") notFound();

  const s = found.system;
  const name = titleCase(s.name);
  const path = systemPath(s.slug);
  const hq = [titleCase(s.hq_city), s.hq_state].filter(Boolean).join(", ");
  const providerSearch = `/search?system=${encodeURIComponent(s.slug)}`;
  const allMembers = s.members.flatMap((group) => group.items);
  // The page says `NO_MEMBERS` itself, above, where the list would have been.
  const notes = s.notes.filter((note) => note !== NO_MEMBERS);

  // Only the kinds it has: "and 0 home health agencies" is true and reads as an apology. A
  // system with no certified member at all says so rather than breaking the sentence down.
  const breakdown = [
    [s.counts.hospitals, "hospitals"],
    [s.counts.nursing_homes, "nursing homes"],
    [s.counts.home_health, "home health or hospice agencies"],
  ] as const;
  const kinds = breakdown
    .filter(([n]) => n > 0)
    .map(([n, word]) => `${fmt(n)} ${word}`)
    .join(", ");

  const faq: Faq[] = [
    {
      q: `How many facilities does ${name} operate?`,
      a:
        s.counts.facilities > 0
          ? `${fmt(s.counts.facilities)} certified member facilities${
              kinds ? `: ${kinds}` : ""
            }.`
          : "No certified facility of this system is on record by certification number yet.",
    },
    {
      q: `Which states is ${name} in?`,
      a:
        s.states.length > 0
          ? s.states.map((c) => stateName(c) ?? c).join(", ") + "."
          : "No member facility of this system has a state on record.",
    },
  ];
  if (s.beds > 0) {
    faq.push({
      q: `How many beds does ${name} have?`,
      a: `${fmt(s.beds)} certified beds across the member facilities that publish a count.`,
    });
  }
  if (s.ownership) {
    faq.push({ q: `Who owns ${name}?`, a: `${s.ownership}. ${s.ownership_note}` });
  }

  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": siteUrl(`${path}#entity`),
              name,
              url: siteUrl(path),
              description: describe(s),
              ...(hq
                ? {
                    address: {
                      "@type": "PostalAddress",
                      addressLocality: s.hq_city ?? undefined,
                      addressRegion: s.hq_state ?? undefined,
                      addressCountry: "US",
                    },
                  }
                : {}),
              subOrganization: allMembers.slice(0, 100).map((m) => ({
                "@type": m.facility_type
                  ? schemaFor(m.facility_type)["@type"]
                  : "MedicalOrganization",
                name: memberName(m),
                ...(memberHref(m) ? { url: siteUrl(memberHref(m) as string) } : {}),
              })),
            },
            faqJsonLd(faq),
            // The trail the crumbs below show, home page included. See lib/schema.ts.
            breadcrumb([{ name: "Health systems", href: "/systems" }, { name, href: path }]),
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
              <Link href="/systems">Health systems</Link>
            </li>
            <li aria-current="page">{name}</li>
          </ol>
          <div className="eyebrow rule">
            {s.kind === "chain" ? "Facility chain" : "Health system"}
            {hq ? ` · ${hq}` : ""}
            {s.multistate ? " · multi-state" : ""}
          </div>
          <h1 style={{ fontSize: "clamp(1.8rem, 3.8vw, 2.7rem)" }}>{name}</h1>
          <p className="lede">{describe(s)}</p>
          <p>{POSITIONING.organizations}</p>

          <div className="grid two" style={{ marginTop: 28, alignItems: "start" }}>
            <div className="panel">
              <h2>At a glance</h2>
              <dl className="rows">
                {hq && (
                  <div>
                    <dt>Headquarters</dt>
                    <dd>{hq}</dd>
                  </div>
                )}
                {COUNT_ROWS.map((key) => {
                  const value = s.counts[key];
                  // A count the platform has nothing to say about is left out, never zeroed - and
                  // a zero is nothing to say. "Home health and hospice: 0" is true of a system
                  // whose members are all hospitals, and in a facts list it reads as a gap in the
                  // record rather than as the record. The kinds a system has are the rows it gets.
                  if (!value) return null;
                  const kind =
                    key === "hospitals"
                      ? kindOf("hospital")
                      : key === "nursing_homes"
                        ? kindOf("nursing_home")
                        : key === "home_health"
                          ? kindOf("home_health")
                          : null;
                  return (
                    <div key={key}>
                      <dt>
                        {kind ? (
                          <Link href={listPath(kind.slug)}>{SYSTEM_COUNT_LABELS[key]}</Link>
                        ) : (
                          SYSTEM_COUNT_LABELS[key]
                        )}
                      </dt>
                      <dd className="num">{fmt(value)}</dd>
                    </div>
                  );
                })}
                {s.beds > 0 && (
                  <div>
                    <dt>Certified beds</dt>
                    <dd className="num">{fmt(s.beds)}</dd>
                  </div>
                )}
                <div>
                  <dt>States</dt>
                  <dd>
                    {s.states.length > 0
                      ? s.states.map((c) => stateName(c) ?? c).join(", ")
                      : "Not on record"}
                  </dd>
                </div>
                {s.ownership && (
                  <div>
                    <dt>Ownership</dt>
                    <dd>{s.ownership}</dd>
                  </div>
                )}
                {s.organization_npis.length > 0 && (
                  <div>
                    <dt>Organization NPIs</dt>
                    <dd className="mono">
                      {s.organization_npis.map((npi, index) => (
                        <span key={npi}>
                          {index > 0 && " · "}
                          <Link href={`/npi/${npi}`}>{npi}</Link>
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
              {/* Each sentence only where the thing it explains is on the page above it. */}
              <p className="fine" style={{ marginTop: 12 }}>
                {s.ownership && s.ownership_note ? `${s.ownership_note} ` : ""}
                {s.counts.facilities > 0 && (
                  <>
                    &ldquo;{SYSTEM_COUNT_LABELS.facilities}&rdquo; counts every certified member
                    together.{" "}
                  </>
                )}
                {s.counts.outpatient_centers ? (
                  <>
                    &ldquo;{SYSTEM_COUNT_LABELS.outpatient_centers}&rdquo; counts clinic and other
                    outpatient sites, not physician groups.
                  </>
                ) : null}
              </p>
            </div>
            <div className="panel">
              <h2>Providers and leadership</h2>
              <p className="fine">
                {s.counts.providers > 0
                  ? `${fmt(
                      s.counts.providers,
                    )} providers are tied to this system by identifiers - a member's own NPI, or Medicare billing and affiliation filings. Counted, never listed.`
                  : "Providers are tied to a system by identifiers only, and are counted rather than listed."}
              </p>
              <p className="fine">
                Each member facility&apos;s profile counts its named executives, officers and owners
                by role. Names and titles are for signed-in customers.{" "}
                <Link href="/leadership">Leadership by role</Link>.
              </p>
              <div className="actions" style={{ marginTop: 14 }}>
                <Link className="btn primary" href={providerSearch}>
                  Search providers at {name}
                </Link>
                <Link className="btn" href="/sign-up">
                  View contacts - sign up free
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow rule">Members</div>
            <h2>Facilities in {name}</h2>
          </div>
          {s.members.length === 0 && <p className="lede">{NO_MEMBERS}</p>}
          {s.members.length > 1 && (
            <div className="hints" style={{ justifyContent: "flex-start", marginBottom: 18 }}>
              <span>Jump to:</span>
              {s.members.map((group) => (
                <a href={`#${group.member_kind}`} key={group.member_kind}>
                  {group.label} ({fmt(group.total)})
                </a>
              ))}
            </div>
          )}
          {s.members.map((group) => (
            <MemberGroup group={group} key={group.member_kind} />
          ))}
          {notes.length > 0 && (
            <ul className="ticks">
              {notes.map((note) => (
                <li className="fine" key={note}>
                  {note}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow rule">FAQ</div>
            <h2>About {name}</h2>
          </div>
          {faq.map((f) => (
            <div className="panel" key={f.q}>
              <h3>{f.q}</h3>
              <p>{f.a}</p>
            </div>
          ))}
          <div className="hints" style={{ justifyContent: "flex-start", marginTop: 20 }}>
            <span>Also:</span>
            <Link href="/systems">Every health system and chain</Link>
            <Link href={listPath("hospitals")}>Hospital lists</Link>
            <Link href="/leadership">Healthcare leadership by role</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export const generateMetadata = withDirectoryMetadata(readMetadata);
export default withDirectoryFallback(SystemPage);

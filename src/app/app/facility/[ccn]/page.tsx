import type { Metadata } from "next";
import Link from "next/link";
import { WorkspaceDecisionNetwork } from "@/components/DecisionNetwork";
import { notFound } from "next/navigation";
import { ContactCell, RevealNotice } from "@/components/ContactReveal";
import ReportProblem, { ReportField, ReportNotice, ReportedTags } from "@/components/ReportProblem";
import { financial } from "@/lib/financials";
import { titleCase } from "@/lib/names";
import { getBilling, getFacility, getReportedFields } from "@/lib/session";

/**
 * One Medicare-certified facility, as a signed-in customer sees it.
 *
 * Everything CMS publishes about the place is here for free - type, beds, ownership, chain, star
 * ratings, certification - because that is public record and it is what makes a facility worth
 * approaching. The people are listed by name, title and role for the same reason. What is not
 * free is reaching them: each person's number sits behind a Reveal button that spends one of the
 * month's reveals, and the facility's own main line is not shown to customers at all. The API
 * enforces both - a number this organisation has not opened is never in the payload this page
 * receives - so the page cannot leak what it was never sent.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Facility",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ ccn: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const TYPE_LABELS: Record<string, string> = {
  hospital: "Hospital",
  nursing_home: "Nursing home",
  home_health: "Home health agency",
  hospice: "Hospice",
  dialysis: "Dialysis facility",
  other: "Other certified provider",
};

function stars(value: number | null): string {
  return value === null ? "Not rated" : `${value} of 5`;
}

function yesNo(value: boolean | null): string {
  return value === null ? "Not reported" : value ? "Yes" : "No";
}

function count(value: number | null | undefined): string {
  return value === null || value === undefined ? "Not reported" : value.toLocaleString("en-US");
}


export default async function FacilityPage({ params, searchParams }: Props) {
  const { ccn } = await params;
  if (!/^[0-9A-Za-z]{6,10}$/.test(ccn)) notFound();
  const query = await searchParams;
  const [facility, billing, reportedFacility] = await Promise.all([
    getFacility(ccn),
    getBilling(),
    getReportedFields("ccn", [ccn]),
  ]);
  if (!facility) notFound();
  // The leadership rows are their own subject, so they are asked for separately - one call for the
  // whole table rather than one per person.
  const reportedPeople = await getReportedFields(
    "org_contact",
    facility.contacts.map((c) => String(c.id)),
  );
  const mine = reportedFacility.get(ccn) ?? [];

  const reveals = billing?.limits?.reveals;
  const spent = reveals?.limit !== null && reveals?.remaining === 0;
  const pos = facility.medicare;
  const returnTo = `/app/facility/${encodeURIComponent(facility.ccn)}`;
  const names = new Map(facility.contacts.map((c) => [String(c.id), c.name]));
  const address = [
    titleCase(facility.address_line),
    [titleCase(facility.city), facility.state].filter(Boolean).join(", "),
    facility.postal_code,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <main className="wrap app-main">
      <nav className="crumbs fine" aria-label="Breadcrumb">
        <Link href="/app/find">Search</Link> / Facility {facility.ccn}
      </nav>
      <div className="eyebrow rule">{TYPE_LABELS[facility.facility_type] ?? facility.facility_type}</div>
      <h1>
        {titleCase(facility.name ?? facility.organization_name) || `Facility ${facility.ccn}`}
      </h1>
      <p className="lede">{address || "Address not filed"}</p>
      {/* The name and the address are the heading and the lede, not rows in the panel, so their
          controls sit here. Two side by side need their own words: "This is wrong" would not say
          which. */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 18 }}>
        <ReportField
          kind="ccn"
          id={facility.ccn}
          field="name"
          returnTo={returnTo}
          reported={mine}
          summary="The name is wrong"
        />
        <ReportField
          kind="ccn"
          id={facility.ccn}
          field="practice_address"
          returnTo={returnTo}
          reported={mine}
          summary="The address is wrong"
        />
      </div>

      <RevealNotice params={query} names={names} />
      <ReportNotice params={query} />
      <WorkspaceDecisionNetwork name={facility.name || facility.organization_name || `Facility ${facility.ccn}`} network={facility.network} organizationName={facility.organization_name} ownershipType={facility.ownership_type} owners={facility.owners} people={facility.contacts.map(person => ({id:person.id,name:person.name,title:person.title,role:person.role_group || person.role}))} />

      <div className="grid" style={{ marginTop: 22 }}>
        <div className="panel">
          <h2>The facility</h2>
          <dl className="rows">
            <div>
              <dt>CMS Certification Number</dt>
              <dd className="mono">{facility.ccn}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{TYPE_LABELS[facility.facility_type] ?? facility.facility_type}</dd>
            </div>
            {pos?.category && (
              <div>
                <dt>Medicare category</dt>
                <dd>
                  {pos.category}
                  {pos.subtype ? ` — ${pos.subtype}` : ""}
                </dd>
              </div>
            )}
            <div>
              <dt>County</dt>
              <dd>{titleCase(facility.county) || "Not filed"}</dd>
            </div>
            <div>
              <dt>Main line</dt>
              <dd className="num">
                {facility.phone ?? "Not filed"}
                <ReportField
                  kind="ccn"
                  id={facility.ccn}
                  field="phone"
                  returnTo={returnTo}
                  reported={mine}
                />
              </dd>
            </div>
            <div>
              <dt>Ownership</dt>
              <dd>{facility.ownership_type ?? pos?.control_type ?? "Not filed"}</dd>
            </div>
            <div>
              <dt>Chain</dt>
              <dd>
                {titleCase(facility.chain_organization) || "None filed"}
                <ReportField
                  kind="ccn"
                  id={facility.ccn}
                  field="employment"
                  returnTo={returnTo}
                  reported={mine}
                />
              </dd>
            </div>
            <div>
              <dt>Emergency services</dt>
              <dd>{yesNo(facility.emergency_services)}</dd>
            </div>
            <div>
              <dt>Medicare certification</dt>
              <dd className="num">
                {facility.certification_date ?? pos?.certification_date ?? "Not filed"}
                {pos?.participation_date ? ` (joined ${pos.participation_date})` : ""}
                {pos?.terminated ? " — has left Medicare" : ""}
              </dd>
            </div>
            <div>
              <dt>Organization NPI</dt>
              <dd>
                {facility.npi ? (
                  <>
                    <Link href={`/app/search?q=${facility.npi}&type=organization`} className="mono">
                      {facility.npi}
                    </Link>
                    {facility.organization_name && (
                      <span className="fine" style={{ display: "block" }}>
                        {titleCase(facility.organization_name)}
                      </span>
                    )}
                    {facility.npi_source === "address" && (
                      <span className="fine" style={{ display: "block" }}>
                        Matched by address, not by CMS&apos;s enrollment record.
                      </span>
                    )}
                  </>
                ) : (
                  <span className="fine">We could not tie this facility to an NPI.</span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        <div className="panel">
          <h2>Beds and ratings</h2>
          <dl className="rows">
            <div>
              <dt>Certified beds</dt>
              <dd className="num">{count(facility.certified_beds)}</dd>
            </div>
            {pos && (
              <>
                <div>
                  <dt>Beds on the Medicare census</dt>
                  <dd className="num">
                    {count(pos.bed_count)} total · {count(pos.certified_bed_count)} certified
                  </dd>
                </div>
              </>
            )}
            <div>
              <dt>Overall rating</dt>
              <dd>{stars(facility.overall_rating)}</dd>
            </div>
            {facility.health_inspection_rating !== null && (
              <div>
                <dt>Health inspections</dt>
                <dd>{stars(facility.health_inspection_rating)}</dd>
              </div>
            )}
            {facility.staffing_rating !== null && (
              <div>
                <dt>Staffing</dt>
                <dd>{stars(facility.staffing_rating)}</dd>
              </div>
            )}
            {facility.quality_measure_rating !== null && (
              <div>
                <dt>Quality measures</dt>
                <dd>{stars(facility.quality_measure_rating)}</dd>
              </div>
            )}
          </dl>
          <p className="fine" style={{ marginTop: 10 }}>
            <b>Certified beds</b> is Care Compare&apos;s count where it publishes one, otherwise the
            Provider of Services census&apos;s. The census line underneath is CMS&apos;s quarterly
            Provider of Services file on its own: <i>total</i> is every bed the facility reports,
            <i> certified</i> the ones Medicare certifies{pos ? ` (quarter ${pos.pos_quarter})` : ""}.
            The two sources are published on different schedules, so they can differ.
          </p>
        </div>
      </div>

      {facility.financials && (
        <div className="panel" style={{ marginTop: 18 }}>
          <h2>
            Cost report{" "}
            <span className="fine">
              fiscal year {facility.financials.latest.fiscal_year}
              {facility.financials.latest.form ? ` · form ${facility.financials.latest.form}` : ""}
              {facility.financials.latest.report_status_label
                ? ` · ${facility.financials.latest.report_status_label.toLowerCase()}`
                : ""}
            </span>
          </h2>
          <p className="fine">
            What this hospital filed with Medicare. Every figure below names the worksheet, line
            and column it was read from, and every ratio the formula it was computed with — so a
            number can be checked against the filing rather than taken on trust.
          </p>
          <dl className="rows">
            {facility.financials.latest.measures
              .filter((m) => m.value !== null)
              .map((m) => (
                <div key={m.slug}>
                  <dt>
                    {m.label}
                    <span className="fine" style={{ display: "block" }}>{m.source}</span>
                  </dt>
                  <dd className="num">{financial(m.value, m.unit)}</dd>
                </div>
              ))}
            {facility.financials.latest.ratios
              .filter((r) => r.value !== null)
              .map((r) => (
                <div key={r.slug}>
                  <dt>
                    {r.label}
                    <span className="fine" style={{ display: "block" }}>{r.source}</span>
                  </dt>
                  <dd className="num">{financial(r.value, r.unit)}</dd>
                </div>
              ))}
          </dl>
          {(() => {
            // Counted, not listed. A hospital that filed revenue but left Worksheet S-3 blank is
            // common, and twenty rows of "Not filed" would bury the figures it did file - while
            // saying nothing at all would leave somebody wondering whether we simply lack them.
            const latest = facility.financials.latest;
            const blank =
              latest.measures.filter((m) => m.value === null).length +
              latest.ratios.filter((r) => r.value === null).length;
            return blank === 0 ? null : (
              <p className="fine" style={{ marginTop: 10 }}>
                {blank} further {blank === 1 ? "figure was" : "figures were"} not filed on this
                report and {blank === 1 ? "is" : "are"} left out rather than shown as zero. A
                ratio is blank whenever one of its inputs is missing.
              </p>
            );
          })()}
          <p className="fine" style={{ marginTop: 10 }}>
            Medicare cost reports are public record, filed annually by the hospital itself. They
            describe its whole business, not only its Medicare work — but the payer-mix lines are
            Medicare&apos;s own view, and &ldquo;as submitted&rdquo; means CMS has not yet settled
            the report.
          </p>
        </div>
      )}

      <h2 style={{ marginTop: 28 }}>People at this facility</h2>
      <p className="fine">
        Named in federal filings — the authorized official on the organization&apos;s NPI and the
        individuals CMS records as owners. None has an NPI of their own. Opening a number costs one
        reveal, and only the first time this month.
        {reveals && reveals.limit !== null
          ? ` ${reveals.remaining.toLocaleString("en-US")} of ${reveals.limit.toLocaleString("en-US")} reveals left.`
          : ""}
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Title</th>
              <th>Role</th>
              <th>Contact</th>
            </tr>
          </thead>
          <tbody>
            {facility.contacts.map((person) => (
              <tr key={person.id}>
                <td>
                  <Link href={`/app/contact/${person.id}`}>
                    <b>{person.name}</b>
                  </Link>
                  <span className="fine" style={{ display: "block" }}>
                    {person.source_label}
                  </span>
                </td>
                <td className="fine">{person.title ?? "—"}</td>
                <td className="fine">{person.role ?? "—"}</td>
                <td>
                  <ContactCell
                    id={person.id}
                    hasPhone={person.has_phone}
                    phone={person.phone}
                    suppressed={person.phone_suppressed}
                    returnTo={returnTo}
                    spent={spent}
                  />
                  <ReportedTags reported={reportedPeople.get(String(person.id)) ?? []} />
                  <ReportProblem
                    kind="org_contact"
                    id={String(person.id)}
                    returnTo={returnTo}
                    reported={reportedPeople.get(String(person.id)) ?? []}
                  />
                </td>
              </tr>
            ))}
            {facility.contacts.length === 0 && (
              <tr>
                <td colSpan={4} className="table-empty">
                  No named people are on file for this facility.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {facility.owners.length > 0 && (
        <>
          <h2 style={{ marginTop: 28 }}>Ownership on file with CMS</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Owner</th>
                  <th>Role</th>
                  <th>Flags</th>
                </tr>
              </thead>
              <tbody>
                {facility.owners.map((owner, index) => (
                  <tr key={`${owner.owner_name}-${owner.role}-${index}`}>
                    <td>
                      {owner.owner_name ?? "Not named"}
                      <span className="fine" style={{ display: "block" }}>
                        {owner.owner_type === "I" ? "Individual" : "Organization"}
                      </span>
                    </td>
                    <td className="fine">{owner.role}</td>
                    <td className="fine">
                      {[owner.private_equity && "Private equity", owner.reit && "REIT"]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}

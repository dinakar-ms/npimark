import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactCell, RevealNotice } from "@/components/ContactReveal";
import { ReportField, ReportNotice } from "@/components/ReportProblem";
import { getBilling, getPerson, getReportedFields } from "@/lib/session";

/**
 * One named person with no NPI - an authorized official, a CMS owner, a Form 990 officer, an SEC
 * insider - as a signed-in customer sees them.
 *
 * Name, title, role and organisation are the filing's own words and free to read. The number is
 * one reveal, the first time this month; the API only ever sends it once this organisation has
 * opened the person, so this page shows what it is given and nothing more.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const SOURCE_LABELS: Record<string, string> = {
  nppes_official: "NPPES authorized official",
  cms_owner: "CMS individual owner",
  irs_990: "Form 990 officer",
  sec_officer: "SEC officer or director",
};

const ROLE_LABELS: Record<string, string> = {
  executive: "Executive",
  finance: "Finance",
  compliance: "Compliance",
  operations: "Operations",
  clinical_leadership: "Clinical leadership",
  administration: "Administration",
  owner: "Owner",
  other: "Other",
};

export default async function ContactPage({ params, searchParams }: Props) {
  const { id } = await params;
  if (!/^\d{1,18}$/.test(id)) notFound();
  const query = await searchParams;
  const [person, billing, reported] = await Promise.all([
    getPerson(id),
    getBilling(),
    getReportedFields("org_contact", [id]),
  ]);
  if (!person) notFound();
  const mine = reported.get(id) ?? [];
  const returnTo = `/app/contact/${id}`;

  const reveals = billing?.limits?.reveals;
  const spent = reveals?.limit !== null && reveals?.remaining === 0;

  return (
    <main className="wrap app-main narrow">
      <nav className="crumbs fine" aria-label="Breadcrumb">
        <Link href="/app/find">Search</Link> / Contact
      </nav>
      <div className="eyebrow rule">{SOURCE_LABELS[person.source] ?? person.source}</div>
      <h1>{person.full_name}</h1>
      <p className="lede">
        {[person.title, person.organization_name].filter(Boolean).join(" at ") || "No title filed"}
      </p>

      <RevealNotice params={query} names={new Map([[id, person.full_name]])} />
      <ReportNotice params={query} />

      <div className="panel" style={{ marginTop: 22 }}>
        <dl className="rows">
          <div>
            <dt>Name</dt>
            <dd>
              {person.full_name}
              <ReportField kind="org_contact" id={id} field="name" returnTo={returnTo} reported={mine} />
            </dd>
          </div>
          <div>
            <dt>Title</dt>
            <dd>
              {person.title ?? "Not filed"}
              <ReportField kind="org_contact" id={id} field="title" returnTo={returnTo} reported={mine} />
            </dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>{ROLE_LABELS[person.role_group] ?? person.role_group}</dd>
          </div>
          {person.credential && (
            <div>
              <dt>Credentials</dt>
              <dd>{person.credential}</dd>
            </div>
          )}
          <div>
            <dt>Organization</dt>
            <dd>
              {person.organization_name ?? "Not filed"}
              {person.organization_npi && (
                <Link
                  href={`/app/search?q=${person.organization_npi}&type=organization`}
                  className="mono fine"
                  style={{ display: "block" }}
                >
                  NPI {person.organization_npi}
                </Link>
              )}
              <ReportField
                kind="org_contact"
                id={id}
                field="employment"
                returnTo={returnTo}
                reported={mine}
              />
            </dd>
          </div>
          <div>
            <dt>Where</dt>
            <dd>{[person.city, person.state].filter(Boolean).join(", ") || "Not filed"}</dd>
          </div>
          {person.source === "cms_owner" && person.facility_count > 1 && (
            <div>
              <dt>Facilities</dt>
              <dd className="num">Holds an interest in {person.facility_count.toLocaleString("en-US")}</dd>
            </div>
          )}
          <div>
            <dt>Phone</dt>
            <dd>
              <ContactCell
                id={person.id}
                hasPhone={person.has_phone}
                phone={person.phone}
                suppressed={person.phone_suppressed}
                returnTo={returnTo}
                spent={spent}
              />
              <ReportField
                kind="org_contact"
                id={id}
                field="phone"
                returnTo={returnTo}
                reported={mine}
              />
            </dd>
          </div>
        </dl>
      </div>
      <p className="fine" style={{ marginTop: 12 }}>
        Opening a number costs one reveal, and only the first time this month. Every person here is
        named in a public federal filing, with the title that filing gives them.
      </p>
    </main>
  );
}

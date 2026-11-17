import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ReportProblem, { ReportNotice, ReportedTags } from "@/components/ReportProblem";
import { ContactLines } from "@/components/ContactReveal";
import {
  getBilling,
  getContacts,
  getLists,
  getProviderDetail,
  getReportedFields,
  type ListRow,
  type ProviderDetail,
} from "@/lib/session";

/**
 * One provider, signed in: the record, how to reach them, and what to do next.
 *
 * Why this page exists
 * --------------------
 * A customer who clicked a name in their search results used to land on the *public* page - the
 * one written for an unsigned visitor and capped at the public record - or on the claims screen.
 * So the record they were paying for was the one place the product did not show them, and the
 * signed-in area had no page where a provider was a thing you could act on rather than a row you
 * had just scrolled past.
 *
 * Everything here comes from `GET /api/providers/{npi}` read as the customer, so the page shows
 * what *their* plan allows and nothing has to remember to hide anything: a field they may not see
 * is one the API does not return.
 *
 * What it deliberately does not do
 * --------------------------------
 * It does not reveal on arrival. A reveal is metered, and a page that spent one by being opened
 * would turn browsing into billing. The contact panel says whether something is held - which the
 * search row already says - and the button spends the reveal when somebody asks.
 *
 * It does not load the procedure and prescribing lines either. A busy surgeon has dozens and a
 * large group has hundreds; that screen is one click away and stays one click away, which is the
 * reasoning the claims page was written with and is still right.
 *
 * Forms and redirects, no client JavaScript, like the rest of the signed-in site.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Provider",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ npi: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const LIST_ERRORS: Record<string, string> = {
  "needs-name": "Give the new list a name.",
  "needs-list": "Choose a list, or type a name to make a new one.",
  conflict: "You already have a list with that name.",
  forbidden: "Your role cannot change lists. Ask an admin on your team.",
  failed: "That didn't work, and nothing was added. Try again.",
};

const REVEAL_ERRORS: Record<string, string> = {
  reveal_limit: "Your plan's reveals are used up for this period. Plan and usage has the balance.",
  not_found: "That NPI is not in the register.",
  suppressed: "This record is withheld at the provider's request, so there is nothing to open.",
  forbidden: "Your role cannot open contact details. Ask an admin on your team.",
  failed: "That didn't work, and nothing was charged. Try again.",
};

/** A line of an address, skipping the parts that were never filed. */
function address(a: NonNullable<ProviderDetail["practice_address"]>): string {
  return [a.line1, a.line2, [a.city, a.state].filter(Boolean).join(", "), a.postal_code]
    .filter(Boolean)
    .join(" · ");
}

export default async function ProviderPage({ params, searchParams }: Props) {
  const { npi } = await params;
  if (!/^\d{10}$/.test(npi)) notFound();
  const query = await searchParams;
  const one = (name: string): string =>
    Array.isArray(query[name]) ? String(query[name]?.[0] ?? "") : String(query[name] ?? "");

  const [provider, opened, billing, listsOrNull, reported] = await Promise.all([
    getProviderDetail(npi),
    // What this organisation has already opened for this NPI. Costs nothing extra and is what
    // makes a second visit free rather than a second charge.
    getContacts(npi),
    getBilling(),
    getLists(),
    getReportedFields("npi", [npi]),
  ]);

  if (provider === null) {
    return (
      <main className="wrap app-main">
        <div className="notice warn" role="alert">
          Nothing came back for NPI <span className="mono">{npi}</span>. Either it is not in the
          register, or the platform did not answer &mdash; try again in a moment. Nothing was
          counted either way. <Link href="/app/search">Back to search</Link>
        </div>
      </main>
    );
  }

  // Only a picker here, so a silence from the platform costs one control rather than a wrong
  // sentence. The lists page is where "we could not read them" is worth saying.
  const lists = listsOrNull ?? [];
  // An organisation reached through an older or shared link: this page asks after a surname, a
  // medical school and a state licence, and an organisation has none of them. Sent to the page
  // that knows what an organisation is, rather than shown a record full of blanks.
  if (provider.type === "organization") {
    redirect(`/app/organization/${npi}`);
  }

  const reveals = billing?.limits?.reveals;
  const outOfReveals = reveals?.limit !== null && reveals?.remaining === 0;
  const returnTo = `/app/provider/${npi}`;
  const taxonomies = provider.taxonomies ?? [];
  const licences = provider.state_licenses ?? [];
  const affiliations = provider.facility_affiliations ?? [];
  const exchanges = provider.hie_participation ?? [];
  const profile = provider.clinician_profile ?? null;
  const addedCount = Number.parseInt(one("added") || "0", 10) || 0;
  const listError = LIST_ERRORS[one("error")];
  const revealError = REVEAL_ERRORS[one("reveal_error")];
  const flagged = reported.get(npi) ?? [];

  return (
    <main className="wrap app-main">
      <nav className="crumbs" aria-label="Where you are">
        <Link href="/app/search">Providers</Link> <span aria-hidden="true">/</span> {provider.name}
      </nav>

      {/* The whole NPI withheld is its own state and is said first: the panels below would
          otherwise read as "we hold nothing about this person", which is a different claim. */}
      {provider.suppressed && (
        <div className="notice stop" role="alert">
          This record is withheld at the provider&rsquo;s request. It appears in no search, count,
          list or file, and there is nothing here to open or export.
        </div>
      )}
      {revealError && (
        <div className="notice stop" role="alert">
          {revealError}
        </div>
      )}
      {listError && (
        <div className="notice stop" role="alert">
          {listError}
        </div>
      )}
      {addedCount > 0 && <div className="notice ok">Added to your list.</div>}
      <ReportNotice params={query} />

      <header className="ps-head">
        <div className="ps-head-text">
          <div className="eyebrow rule">
            {provider.type === "individual" ? "Individual provider" : "Organization"}
          </div>
          <h1>
            {provider.name}
            {provider.credentials && <span className="tag">{provider.credentials}</span>}
          </h1>
          <p className="fine">
            <span className="mono">{provider.npi}</span>
            <span className={`tag ${provider.status === "active" ? "ok" : "warn"}`}>
              {provider.status}
            </span>
            {provider.primary_taxonomy && <> · {provider.primary_taxonomy.display}</>}
            {provider.employer_name && <> · {provider.employer_name}</>}
          </p>
          <ReportedTags reported={flagged} />
        </div>
      </header>

      {/* The two things to do with a provider, where they can be reached without scrolling. */}
      <div className="panel">
        <h2>Add to a list</h2>
        <form method="post" action="/api/app/lists" className="pickbar">
          <input type="hidden" name="action" value="add" />
          <input type="hidden" name="npi" value={npi} />
          <input type="hidden" name="return_to" value={returnTo} />
          <label htmlFor="list_id" className="sr-only">
            Which list
          </label>
          <select id="list_id" name="list_id" defaultValue="">
            {lists.length > 0 && <option value="">Choose a list…</option>}
            {lists.map((row: ListRow) => (
              <option key={row.id} value={row.id}>
                {row.name} ({row.member_count.toLocaleString("en-US")})
              </option>
            ))}
            <option value="new">New list…</option>
          </select>
          <label htmlFor="list_name" className="sr-only">
            Name for a new list
          </label>
          <input
            id="list_name"
            name="name"
            type="text"
            maxLength={120}
            placeholder={lists.length > 0 ? "…or name a new one" : "Name your first list"}
          />
          <button type="submit" className="btn primary">
            Add
          </button>
        </form>
      </div>

      <div className="panel">
        <h2>How to reach them</h2>
        {opened.rows.length > 0 ? (
          <ContactLines opened={opened} />
        ) : (
          <>
            {/* Honest about what is held without being the thing that hands it over. The same
                answer the search row gives, so opening this page tells somebody nothing new and
                costs them nothing. */}
            <p className="fine">
              {(provider.emails ?? []).length > 0 || (provider.file_phones ?? []).length > 0
                ? "We hold contact details for this provider."
                : "We hold no work email or filed phone for this provider."}
            </p>
            {((provider.emails ?? []).length > 0 || (provider.file_phones ?? []).length > 0) &&
              !provider.suppressed && (
                <form method="post" action="/api/app/reveal">
                  <input type="hidden" name="npi" value={npi} />
                  <input type="hidden" name="return_to" value={returnTo} />
                  <button type="submit" className="btn primary" disabled={outOfReveals}>
                    Reveal contact details
                  </button>
                  <span className="fine ps-cost">
                    {reveals?.limit === null
                      ? "1 reveal"
                      : `1 reveal · ${(reveals?.remaining ?? 0).toLocaleString("en-US")} left`}
                    . Opening the same NPI again this month is free.
                  </span>
                </form>
              )}
          </>
        )}
        {provider.phone && (
          <p className="fine">
            Practice phone <span className="mono">{provider.phone}</span> &mdash; the number filed
            on the practice record, which is public and costs no reveal.
          </p>
        )}
      </div>

      <div className="panel">
        <h2>Where they are</h2>
        {provider.practice_address ? (
          <p>{address(provider.practice_address)}</p>
        ) : (
          <p className="fine">No practice address is filed.</p>
        )}
        {provider.practice_address?.fax && (
          <p className="fine">
            Fax <span className="mono">{provider.practice_address.fax}</span>
          </p>
        )}
        {provider.organization && (
          <p className="fine">
            Billing organization:{" "}
            <Link href={`/app/organization/${provider.organization.npi}`}>
              {provider.organization.name ?? provider.organization.npi}
            </Link>
          </p>
        )}
      </div>

      {taxonomies.length > 0 && (
        <div className="panel">
          <h2>Specialties as filed</h2>
          <div className="ps-tw">
            <table>
              <thead>
                <tr>
                  <th>Specialty</th>
                  <th>Code</th>
                  <th>License on the taxonomy</th>
                </tr>
              </thead>
              <tbody>
                {taxonomies.map((tax) => (
                  <tr key={`${tax.sequence}-${tax.code ?? ""}`}>
                    <td>
                      {tax.display ?? tax.classification ?? "Not named"}
                      {tax.is_primary && <span className="tag ok">primary</span>}
                      {tax.specialization && (
                        <span className="ps-employer">{tax.specialization}</span>
                      )}
                    </td>
                    <td className="mono fine">{tax.code ?? "—"}</td>
                    <td className="fine">
                      {tax.license_number
                        ? `${tax.license_number}${tax.license_state ? ` (${tax.license_state})` : ""}`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="fine">
            As filed with NPPES by the provider. A taxonomy is what they registered under, which is
            not always what they practice.
          </p>
        </div>
      )}

      {profile && (
        <div className="panel">
          <h2>Training and practice</h2>
          <dl className="deflist">
            {profile.medical_school && (
              <>
                <dt>Medical school</dt>
                <dd>
                  {profile.medical_school}
                  {profile.graduation_year && <> · graduated {profile.graduation_year}</>}
                </dd>
              </>
            )}
            {profile.primary_specialty && (
              <>
                <dt>Specialty, per CMS</dt>
                <dd>
                  {profile.primary_specialty}
                  {profile.secondary_specialties && <> · also {profile.secondary_specialties}</>}
                </dd>
              </>
            )}
            {profile.group_count !== null && profile.group_count !== undefined && (
              <>
                <dt>Groups they bill under</dt>
                <dd>{profile.group_count.toLocaleString("en-US")}</dd>
              </>
            )}
            {profile.telehealth !== null && profile.telehealth !== undefined && (
              <>
                <dt>Telehealth</dt>
                <dd>{profile.telehealth ? "Offers it, per CMS" : "Not indicated"}</dd>
              </>
            )}
          </dl>
          <p className="fine">
            From CMS&rsquo;s National Downloadable File. Absent here means CMS has no row for this
            NPI, which is a fact about the file and not about the provider.
          </p>
        </div>
      )}

      {licences.length > 0 && (
        <div className="panel">
          <h2>State licenses</h2>
          <div className="ps-tw">
            <table>
              <thead>
                <tr>
                  <th>State</th>
                  <th>Type</th>
                  <th>Number</th>
                  <th>Status</th>
                  <th>Expires</th>
                </tr>
              </thead>
              <tbody>
                {licences.map((licence) => (
                  <tr key={`${licence.state}-${licence.license_number}`}>
                    <td className="mono">{licence.state}</td>
                    <td className="fine">{licence.occupation ?? licence.license_type}</td>
                    <td className="mono fine">{licence.license_number}</td>
                    <td className="fine">{licence.status}</td>
                    <td className="fine mono">{licence.expiry_date?.slice(0, 10) ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="fine">
            Linked on the issuing state and the license number, with the surname required to agree
            wherever the state registry names the licensee. A registry row that names nobody links
            on the number alone, and a number that fits more than one NPI is left unlinked rather
            than attached to a guess. There is no fuzzy name matching: a missed license costs less
            than a wrong one.
          </p>
        </div>
      )}

      {affiliations.length > 0 && (
        <div className="panel">
          <h2>Facilities they work with</h2>
          <ul className="fine">
            {affiliations.map((one) => (
              <li key={`${one.ccn}-${one.facility_type}`}>
                <Link href={`/app/facility/${one.ccn}`}>{one.name ?? one.ccn}</Link>{" "}
                <span className="fine">
                  {one.facility_type_label ?? one.facility_type} ·{" "}
                  <span className="mono">{one.ccn}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="fine">
            From CMS&rsquo;s Facility Affiliation file: where this clinician is listed as
            practicing, which is how an account rolls up to the system that buys.
          </p>
        </div>
      )}

      {exchanges.length > 0 && (
        <div className="panel">
          <h2>Health information exchanges</h2>
          <ul className="fine">
            {exchanges.map((one) => (
              <li key={one.hie_identifier}>
                {one.hie_name ?? one.hie_identifier}
                {one.via_name && <span className="fine"> · through {one.via_name}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="panel">
        <h2>What they bill and prescribe</h2>
        <p className="fine">
          The procedures billed to Medicare and the drugs prescribed under Part D, line by line. A
          busy clinician has dozens of lines and a large group has hundreds, so it is its own
          screen rather than a panel here &mdash; and reading it is included with your account.
        </p>
        <p>
          <Link href={`/app/provider/${npi}/claims`} className="btn">
            Open the claims detail
          </Link>
        </p>
      </div>

      <div className="panel">
        <h2>The record itself</h2>
        <dl className="deflist">
          <>
            <dt>NPI</dt>
            <dd className="mono">{provider.npi}</dd>
          </>
          {provider.enumeration_date && (
            <>
              <dt>Issued</dt>
              <dd className="mono">{provider.enumeration_date.slice(0, 10)}</dd>
            </>
          )}
          {provider.sole_proprietor !== null && provider.sole_proprietor !== undefined && (
            <>
              <dt>Sole proprietor</dt>
              <dd>{provider.sole_proprietor ? "Yes, as filed" : "No, as filed"}</dd>
            </>
          )}
          {provider.employer_domain && (
            <>
              <dt>Employer website</dt>
              <dd className="mono">{provider.employer_domain}</dd>
            </>
          )}
          {provider.updated_at && (
            <>
              <dt>Last refreshed</dt>
              <dd className="mono">{provider.updated_at.slice(0, 10)}</dd>
            </>
          )}
        </dl>
        <p className="fine">
          <Link href={`/npi/${npi}`}>The public page for this provider</Link> shows the public
          record only, and is what somebody without an account sees.
        </p>
        <ReportProblem kind="npi" id={npi} returnTo={returnTo} reported={flagged} />
      </div>
    </main>
  );
}

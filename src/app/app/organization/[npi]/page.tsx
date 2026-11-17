import type { Metadata } from "next";
import Link from "next/link";
import { WorkspaceDecisionNetwork } from "@/components/DecisionNetwork";
import { notFound } from "next/navigation";
import {
  getLists,
  getOrganization,
  organizationPeople,
  organizationProviders,
  type ListRow,
  type SearchRow,
} from "@/lib/session";

/**
 * One organisation, signed in: who signs for it, who bills under it, and what it runs.
 *
 * An organisation NPI used to land on the individual's record, which asks after a surname, a
 * medical school and a state licence - none of which an organisation has - and showed none of
 * what matters about one. The platform has answered `/api/organizations/{npi}` behind
 * `providers.view` all along, and this site had never called it.
 *
 * What it adds over the provider record, and why each is here rather than there:
 *
 *   the authorised official   the person NPPES holds responsible for the registration, which is
 *                             the named human behind an organisation that otherwise has none
 *   the clinician count       how many providers bill under it - the size of the account
 *   the EHR, with its source  an organisation is where this answer is worth having: it is the
 *                             site's system, not one clinician's preference
 *   other locations           an organisation files more than one, and they are the sites
 *
 * Tick boxes but no "add all": the link from an organisation to its clinicians is an internal
 * clause rather than a public filter, so there is no search to hand the "add everything this
 * matches" endpoint. Saying so is better than an "add all" that quietly adds one page.
 *
 * Forms and redirects, no client JavaScript, like the rest of the signed-in site.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Organization",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ npi: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const PAGE_SIZE = 50;

const LIST_ERRORS: Record<string, string> = {
  "nothing-chosen": "Tick at least one clinician first, then choose a list.",
  "needs-name": "Give the new list a name.",
  "needs-list": "Choose a list, or type a name to make a new one.",
  conflict: "You already have a list with that name.",
  forbidden: "Your role cannot change lists. Ask an admin on your team.",
  failed: "That didn't work, and nothing was added. Try again.",
};

/** What the registry filed but will not hand over, in the words the rest of the site uses. */
const SUPPRESSED_LABELS: Record<string, string> = {
  phone: "main phone",
  authorized_official_phone: "the authorized official's phone",
};

export default async function OrganizationPage({ params, searchParams }: Props) {
  const { npi } = await params;
  if (!/^\d{10}$/.test(npi)) notFound();
  const query = await searchParams;
  const one = (name: string): string =>
    Array.isArray(query[name]) ? String(query[name]?.[0] ?? "") : String(query[name] ?? "");

  const page = Math.max(1, Number.parseInt(one("page") || "1", 10) || 1);
  const leadershipPage = Math.max(1, Number.parseInt(one("leadership_page") || "1", 10) || 1);
  const [org, people, listsOrNull] = await Promise.all([
    getOrganization(npi),
    organizationProviders(npi, { page, page_size: PAGE_SIZE, status: "any" }),
    getLists(),
  ]);
  if (org === null) notFound();
  const leadership = org.network?.links.length ? await organizationPeople(npi, leadershipPage) : null;

  // Only a picker here, so a silence costs one control rather than a wrong sentence.
  const lists = listsOrNull ?? [];
  const rows = people?.items ?? [];
  const total = people?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const returnTo = `/app/organization/${npi}${page > 1 ? `?page=${page}` : ""}`;
  const addedCount = Number.parseInt(one("added") || "0", 10) || 0;
  const listError = LIST_ERRORS[one("error")];
  const official = org.authorized_official;
  const officialName = official
    ? [official.first_name, official.last_name].filter(Boolean).join(" ")
    : "";
  const withheld = org.suppressed_fields.map((f) => SUPPRESSED_LABELS[f] ?? f.replace(/_/g, " "));

  return (
    <main className="wrap app-main">
      <nav className="crumbs" aria-label="Where you are">
        <Link href="/app/search">Providers</Link> <span aria-hidden="true">/</span>{" "}
        {org.name ?? org.npi}
      </nav>

      {listError && (
        <div className="notice stop" role="alert">
          {listError}
        </div>
      )}
      {addedCount > 0 && (
        <div className="notice ok">
          {addedCount.toLocaleString("en-US")} clinician{addedCount === 1 ? "" : "s"} added to your
          list.
        </div>
      )}

      <header className="ps-head">
        <div className="ps-head-text">
          <div className="eyebrow rule">Organization</div>
          <h1>{org.name ?? `NPI ${org.npi}`}</h1>
          <p className="fine">
            <span className="mono">{org.npi}</span>
            <span className={`tag ${org.status === "active" ? "ok" : "warn"}`}>{org.status}</span>
            {[org.city, org.state].filter(Boolean).length > 0 && (
              <> · {[org.city, org.state].filter(Boolean).join(", ")}</>
            )}
            {org.provider_count > 0 && (
              <> · {org.provider_count.toLocaleString("en-US")} clinicians bill under it</>
            )}
          </p>
        </div>
      </header>
      <WorkspaceDecisionNetwork name={org.name || org.npi} network={org.network} owners={null}
        people={leadership ? leadership.items.map(person => ({ id:person.id,name:person.full_name,title:person.title,role:person.role_group })) : null}
        peopleTotal={leadership?.total} peoplePage={leadershipPage}
        pageHref={p => `/app/organization/${npi}?page=${page}&leadership_page=${p}#decision-network`} />

      {/* Named rather than rendered as a blank cell: a value we hold and will not hand over is a
          different thing from one nobody filed, and only one of them is worth asking us about. */}
      {withheld.length > 0 && (
        <div className="notice">
          Filed but withheld at the organization&rsquo;s request: {withheld.join(", ")}.
        </div>
      )}

      <div className="panel">
        <h2>Who to contact</h2>
        <dl className="deflist">
          {official && (officialName || official.title) && (
            <>
              <dt>Authorized official</dt>
              <dd>
                {officialName || "Name not filed"}
                {official.title && <span className="ps-employer">{official.title}</span>}
              </dd>
            </>
          )}
          {official?.phone && (
            <>
              <dt>Their phone</dt>
              <dd className="mono">{official.phone}</dd>
            </>
          )}
          {org.phone && (
            <>
              <dt>Main phone</dt>
              <dd className="mono">{org.phone}</dd>
            </>
          )}
          {org.domain && (
            <>
              <dt>Website</dt>
              <dd className="mono">{org.domain}</dd>
            </>
          )}
          {org.email_count > 0 && (
            <>
              <dt>Work emails held</dt>
              <dd>
                {org.email_count.toLocaleString("en-US")} across its clinicians, opened one at a
                time from the search
              </dd>
            </>
          )}
        </dl>
        <p className="fine">
          The authorized official is the person NPPES holds responsible for this registration. It
          is a filing role, not necessarily who buys &mdash; but on an organization that files no
          other name, it is the one named human on the record.
        </p>
      </div>

      {org.ehr_system && (
        <div className="panel">
          <h2>What they run</h2>
          <p>
            <b>{org.ehr_system}</b>
          </p>
          <p className="fine">
            Read off the Direct endpoints this organization publishes
            {org.ehr_source && <> ({org.ehr_source})</>}
            {org.ehr_confidence !== null && org.ehr_confidence !== undefined && (
              <> · confidence {Math.round(org.ehr_confidence * 100)}%</>
            )}
            . An organization is where this answer is worth having: it is the site&rsquo;s system
            rather than one clinician&rsquo;s preference.
          </p>
        </div>
      )}

      <div className="panel">
        <h2>Where they are</h2>
        {org.address_line || org.city ? (
          <p>
            {[org.address_line, [org.city, org.state].filter(Boolean).join(", "), org.postal_code]
              .filter(Boolean)
              .join(" · ")}
          </p>
        ) : (
          <p className="fine">No practice address is filed.</p>
        )}
        {org.other_locations.length > 0 && (
          <>
            <h3>Other filed locations</h3>
            <ul className="fine">
              {org.other_locations.map((a, i) => (
                <li key={`${a.line1 ?? ""}-${a.postal_code ?? ""}-${i}`}>
                  {[a.line1, a.line2, [a.city, a.state].filter(Boolean).join(", "), a.postal_code]
                    .filter(Boolean)
                    .join(" · ")}
                  {a.phone && <span className="mono"> · {a.phone}</span>}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {org.taxonomies.length > 0 && (
        <div className="panel">
          <h2>Specialties as filed</h2>
          <div className="ps-tw">
            <table>
              <thead>
                <tr>
                  <th>Specialty</th>
                  <th>Code</th>
                </tr>
              </thead>
              <tbody>
                {org.taxonomies.map((tax) => (
                  <tr key={`${tax.sequence}-${tax.code ?? ""}`}>
                    <td>
                      {tax.display ?? tax.classification ?? "Not named"}
                      {tax.is_primary && <span className="tag ok">primary</span>}
                      {tax.specialization && (
                        <span className="ps-employer">{tax.specialization}</span>
                      )}
                    </td>
                    <td className="mono fine">{tax.code ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {org.hie_participation.length > 0 && (
        <div className="panel">
          <h2>Health information exchanges</h2>
          <ul className="fine">
            {org.hie_participation.map((hie) => (
              <li key={hie.hie_identifier}>
                {hie.hie_name ?? hie.hie_identifier}
                {hie.via_name && <span className="fine"> · through {hie.via_name}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* The clinicians. The tick boxes belong to this form through the HTML form owner, the same
          arrangement the search results use and for the same reason: a second form around the
          table would swallow everything inside it. */}
      <form method="post" action="/api/app/lists" id="org-add">
        <input type="hidden" name="action" value="add" />
        <input type="hidden" name="return_to" value={returnTo} />
      </form>

      <div className="ps-rhead ps-pick">
        <span className="ps-n num">
          {people === null ? "—" : total.toLocaleString("en-US")}{" "}
          <span>clinician{total === 1 ? "" : "s"}</span>
        </span>
        <span className="ps-pick-acts">
          <label htmlFor="org-list" className="sr-only">
            Which list
          </label>
          <select id="org-list" name="list_id" form="org-add" defaultValue={lists[0]?.id ?? ""}>
            {lists.length > 0 && <option value="">Choose a list…</option>}
            {lists.map((row: ListRow) => (
              <option key={row.id} value={row.id}>
                {row.name} ({row.member_count.toLocaleString("en-US")})
              </option>
            ))}
            <option value="new">New list…</option>
          </select>
          <label htmlFor="org-list-name" className="sr-only">
            Name for a new list
          </label>
          <input
            id="org-list-name"
            name="name"
            type="text"
            maxLength={120}
            form="org-add"
            placeholder={lists.length > 0 ? "…or name a new one" : "Name your first list"}
          />
          <button type="submit" form="org-add" className="btn sm primary">
            Add ticked
          </button>
        </span>
      </div>

      {people === null ? (
        <div className="notice warn" role="alert">
          The clinicians under this organization could not be read just now. That is not the same
          as there being none &mdash; try again in a moment.
        </div>
      ) : (
        <div className="ps-tw">
          <table>
            <thead>
              <tr>
                <th>
                  <span className="sr-only">Choose</span>
                </th>
                <th>Clinician</th>
                <th>Specialty</th>
                <th>Where</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: SearchRow) => (
                <tr key={row.npi}>
                  <td>
                    <input
                      type="checkbox"
                      name="npi"
                      value={row.npi}
                      form="org-add"
                      aria-label={`Choose ${row.name}`}
                    />
                  </td>
                  <td className="ps-who">
                    <Link href={`/app/provider/${row.npi}`}>
                      <b>{row.name}</b>
                    </Link>
                    {row.credentials && <span className="tag">{row.credentials}</span>}
                    <span className="ps-npi mono">{row.npi}</span>
                  </td>
                  <td className="fine">{row.primary_taxonomy?.display ?? "—"}</td>
                  <td className="fine ps-where">
                    {[row.city, row.state].filter(Boolean).join(", ") || "Not filed"}
                  </td>
                  <td>
                    <span className={`tag ${row.status === "active" ? "ok" : "warn"}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="table-empty">
                    No clinicians are linked to this organization.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {people !== null && pages > 1 && (
        <div className="ps-rhead ps-rfoot">
          {page > 1 ? (
            <Link className="btn sm" href={`/app/organization/${npi}?page=${page - 1}`}>
              Previous
            </Link>
          ) : (
            <span />
          )}
          {page < pages && (
            <Link className="btn sm" href={`/app/organization/${npi}?page=${page + 1}`}>
              Next
            </Link>
          )}
          <span className="fine">
            page {page.toLocaleString("en-US")} of {pages.toLocaleString("en-US")}
          </span>
        </div>
      )}

      <p className="fine">
        <Link href={`/npi/${npi}`}>The public page for this organization</Link> shows the public
        record only. Everything above is what your plan allows.
      </p>
    </main>
  );
}

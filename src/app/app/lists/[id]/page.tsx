import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FormatAndPreset } from "@/components/ExportControls";
import { DEFAULT_FORMAT, DEFAULT_PRESET } from "@/lib/exportPresets";
import { getList, listProviders, type SearchRow } from "@/lib/session";

/**
 * One list: who is on it, and the three things to do with them.
 *
 * The providers are read through `/api/lists/{id}/providers`, which takes the same filters as the
 * provider search - so the box at the top narrows inside the list rather than searching past it,
 * and the rows are the rows a customer already knows.
 *
 * Two deliberate differences from the search screen. A list shows inactive providers: the platform
 * answers this endpoint with `status=any` because somebody who goes inactive should not vanish from
 * a list that was built around them without being told, so the status is shown per row instead.
 * And there is no Reveal button here - a reveal is metered and belongs to the search, and putting
 * it on a 500-row list page would be a way to spend an allowance by scrolling.
 *
 * Forms and redirects, no client JavaScript, like the rest of the signed-in site.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "List",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const PAGE_SIZE = 50;
const UUID = /^[0-9a-f-]{36}$/i;

const ERRORS: Record<string, string> = {
  "nothing-chosen": "Tick at least one provider first.",
  not_found: "That list no longer exists.",
  forbidden: "Your role cannot change lists. Ask an admin on your team.",
  failed: "That didn't work, and nothing was changed. Try again.",
};

export default async function ListDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const query = await searchParams;
  const one = (name: string): string =>
    Array.isArray(query[name]) ? String(query[name]?.[0] ?? "") : String(query[name] ?? "");

  const list = await getList(id);
  if (!list) notFound();

  const q = one("q").slice(0, 200);
  const page = Math.max(1, Number.parseInt(one("page") || "1", 10) || 1);
  const results = await listProviders(id, { q, page, page_size: PAGE_SIZE });
  const rows = results?.items ?? [];
  const total = results?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const error = ERRORS[one("error")];
  const removed = Number.parseInt(one("removed") || "0", 10) || 0;
  const added = Number.parseInt(one("added") || "0", 10) || 0;

  // Where a form on this page sends the browser back to, search box and page included.
  const here = new URLSearchParams();
  if (q) here.set("q", q);
  if (page > 1) here.set("page", String(page));
  const returnTo = `/app/lists/${id}${here.toString() ? `?${here}` : ""}`;

  return (
    <>
      <nav className="crumbs" aria-label="Where you are">
        <Link href="/app/lists">Lists</Link> <span aria-hidden="true">/</span> {list.name}
      </nav>

      <header className="ps-head">
        <div className="ps-head-text">
          <h1>{list.name}</h1>
          {list.description && <p className="lede">{list.description}</p>}
          <p className="fine">
            {list.member_count.toLocaleString("en-US")} provider
            {list.member_count === 1 ? "" : "s"} · started{" "}
            <span className="mono">{list.created_at.slice(0, 10)}</span>
            {list.created_by && <> by {list.created_by.name ?? list.created_by.email}</>}
          </p>
        </div>
      </header>

      {error && (
        <div className="notice" role="alert">
          {error}
        </div>
      )}
      {removed > 0 && (
        <div className="notice">
          {removed.toLocaleString("en-US")} provider{removed === 1 ? "" : "s"} taken off this list.
          The records themselves were not touched.
        </div>
      )}
      {added > 0 && (
        <div className="notice">
          {added.toLocaleString("en-US")} provider{added === 1 ? "" : "s"} added.
        </div>
      )}

      {/* The three things to do with a list. Export is the one that exists today; the other two
          name where the list is used rather than pretending to be features of their own. */}
      <div className="panel">
        <h2>Use this list</h2>
        <form method="post" action="/api/app/export" className="form">
          {/* The whole list, not the page being viewed: `list_id` is the filter, and the platform
              scopes it to this organisation before it reaches the query. */}
          <input type="hidden" name="list_id" value={id} />
          <input type="hidden" name="status" value="any" />
          <input type="hidden" name="return_to" value={returnTo} />
          <FormatAndPreset idPrefix="list" preset={DEFAULT_PRESET} format={DEFAULT_FORMAT} />
          <button type="submit" className="btn primary">
            Export this list
          </button>
          <p className="fine">
            {list.member_count.toLocaleString("en-US")} row
            {list.member_count === 1 ? "" : "s"} against your plan&apos;s export allowance.
          </p>
        </form>
        <p className="fine">
          To search everyone <i>except</i> this list — so nobody is contacted twice — open{" "}
          <Link href={`/app/search?exclude_list_id=${id}`}>Providers</Link> with it already left
          out.
        </p>
        <p className="fine">
          To reach them: <Link href={`/app/campaigns?list_id=${id}`}>build a campaign</Link>, which
          counts how many of this list carry a work email or a phone before you commit to sending
          anything.
        </p>
      </div>

      <div className="panel">
        <form method="get" action={`/app/lists/${id}`} className="searchbar">
          <label htmlFor="list-q" className="sr-only">
            Search inside this list
          </label>
          <input
            id="list-q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Name or NPI, inside this list"
          />
          <button type="submit" className="btn">
            Search
          </button>
          {q && (
            <Link href={`/app/lists/${id}`} className="btn sm">
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* The removal form owns the tick boxes in the table below through the `form` attribute, so
          the boxes can sit in the rows without a form nested inside the table. */}
      <form method="post" action="/api/app/lists" id="list-remove">
        <input type="hidden" name="action" value="remove" />
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="return_to" value={returnTo} />
      </form>

      <div className="ps-rhead">
        <span className="ps-n num">
          {results === null ? "—" : total.toLocaleString("en-US")} <span>shown</span>
        </span>
        {q && <span className="fine">matching &ldquo;{q}&rdquo; inside this list</span>}
        <button type="submit" form="list-remove" className="btn sm">
          Remove ticked
        </button>
      </div>

      {/* "The platform did not answer" and "this list is empty" are different sentences, and only
          one of them is about the customer's data. Without this the table rendered its empty state
          on a failed request and told somebody their list was empty when it is not. */}
      {results === null ? (
        <div className="notice warn" role="alert">
          The platform did not answer, so the providers on this list are not shown. Nothing was
          changed &mdash; try again in a moment. The list still has{" "}
          {list.member_count.toLocaleString("en-US")} record
          {list.member_count === 1 ? "" : "s"} on it.
        </div>
      ) : (
      <div className="ps-tw">
        <table>
          <thead>
            <tr>
              <th>
                <span className="sr-only">Choose</span>
              </th>
              <th>Provider</th>
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
                    form="list-remove"
                    aria-label={`Choose ${row.name}`}
                  />
                </td>
                {/* One line, like the search row this is the same row as. The name is the link
                    to the record; the public page is still reachable from there. */}
                <td className="ps-who">
                  <Link
                    href={
                      row.type === "organization"
                        ? `/app/organization/${row.npi}`
                        : `/app/provider/${row.npi}`
                    }
                  >
                    <b>{row.name}</b>
                  </Link>
                  {row.credentials && <span className="tag">{row.credentials}</span>}
                  <span className="ps-npi mono">{row.npi}</span>
                </td>
                <td className="fine">{row.primary_taxonomy?.display ?? "—"}</td>
                <td className="fine ps-where">
                  {[row.city, row.state].filter(Boolean).join(", ") || "Not filed"}
                  {row.employer_name && (
                    <span className="ps-aside-clip" title={row.employer_name}>
                      {row.employer_name}
                    </span>
                  )}
                </td>
                {/* Shown per row because this page deliberately keeps inactive providers: a list
                    is a set somebody chose, and somebody going inactive is news about them rather
                    than a reason to drop them silently. */}
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
                  {q
                    ? "Nothing on this list matches that. Clear the search to see all of it."
                    : "This list is empty. Add providers from the Providers search, where every row has a tick box."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      )}

      {results !== null && pages > 1 && (
        <div className="ps-rhead ps-rfoot">
          {page > 1 ? (
            <Link className="btn sm" href={`/app/lists/${id}?${here}&page=${page - 1}`}>
              Previous
            </Link>
          ) : (
            <span />
          )}
          {page < pages && (
            <Link className="btn sm" href={`/app/lists/${id}?${here}&page=${page + 1}`}>
              Next
            </Link>
          )}
          <span className="fine">
            page {page.toLocaleString("en-US")} of {pages.toLocaleString("en-US")}
          </span>
        </div>
      )}
    </>
  );
}

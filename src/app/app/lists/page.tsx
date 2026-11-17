import type { Metadata } from "next";
import Link from "next/link";
import { getLists, type ListRow } from "@/lib/session";

/**
 * The lists this organisation keeps.
 *
 * A list is the thing every other feature wants a name for: the audience of a campaign, the set
 * an export is drawn from, the people already contacted and therefore to leave out of the next
 * search. The platform has held them since before this site existed - `provider_lists`, and
 * `lists.manage` inside the customer ceiling - so nothing here is a new permission; the screens
 * were simply never built, and a customer who ticked eight rows on a search had nowhere to put
 * them.
 *
 * Forms and redirects, no client JavaScript, like the rest of the signed-in site.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lists",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const ERRORS: Record<string, string> = {
  "needs-name": "Give the list a name.",
  conflict: "You already have a list with that name. Choose another name.",
  not_found: "That list no longer exists.",
  forbidden: "Your role cannot change lists. Ask an admin on your team.",
  validation_error: "That name was not accepted, so nothing was saved.",
  subscription_inactive: "This organization's subscription is not active, so nothing was saved.",
  failed: "That didn't work, and nothing was changed. Try again.",
};

function when(stamp: string): string {
  return stamp.slice(0, 10);
}

export default async function ListsPage({ searchParams }: Props) {
  const params = await searchParams;
  const one = (name: string): string =>
    Array.isArray(params[name]) ? String(params[name]?.[0] ?? "") : String(params[name] ?? "");
  const error = ERRORS[one("error")];
  const deleted = one("deleted") === "1";
  const lists = await getLists();
  const held = lists === null ? 0 : lists.reduce((sum, row) => sum + row.member_count, 0);

  return (
    <>
      <header className="ps-head">
        <div className="ps-head-text">
          <h1>Lists</h1>
          <p className="lede">
            A set of providers you chose, kept by name. Build one from a search, export it, or
            leave it out of the next search so nobody is contacted twice.
          </p>
        </div>
      </header>

      {error && (
        <div className="notice" role="alert">
          {error}
        </div>
      )}
      {deleted && <div className="notice">That list was deleted. The providers on it were not.</div>}

      <div className="panel">
        <details className="exp">
          <summary className="exp-label">New list</summary>
          <div className="exp-group">
            <form method="post" action="/api/app/lists" className="form">
              <input type="hidden" name="action" value="create" />
              <input type="hidden" name="return_to" value="/app/lists" />
              <div className="field">
                <label htmlFor="new-name">Name</label>
                <input
                  id="new-name"
                  name="name"
                  type="text"
                  maxLength={120}
                  required
                  placeholder="Cardiology · Texas · Q4"
                />
              </div>
              <div className="field">
                <label htmlFor="new-description">What it is for (optional)</label>
                <input
                  id="new-description"
                  name="description"
                  type="text"
                  maxLength={500}
                  placeholder="Target accounts for the autumn campaign"
                />
              </div>
              <button type="submit" className="btn primary">
                Create list
              </button>
              <p className="fine">
                An empty list is fine — add providers to it from the Providers search, where every
                row has a tick box.
              </p>
            </form>
          </div>
        </details>
      </div>

      {lists === null ? (
        <div className="notice warn" role="alert">
          The platform did not answer, so your lists are not shown. Nothing was changed &mdash; try
          again in a moment. This is not the same as having none.
        </div>
      ) : lists.length === 0 ? (
        <div className="panel">
          <h2>You have no lists yet</h2>
          <p className="fine">
            The quickest way to a first one: run a search, tick the rows you want, and choose{" "}
            <b>Add to list</b> — you can name a new list at the same moment.
          </p>
          <p>
            <Link href="/app/search" className="btn primary">
              Search providers
            </Link>
          </p>
        </div>
      ) : (
        <>
          <div className="ps-rhead">
            <span className="ps-n num">
              {lists.length.toLocaleString("en-US")} <span>list{lists.length === 1 ? "" : "s"}</span>
            </span>
            <span className="fine">
              {held.toLocaleString("en-US")} record{held === 1 ? "" : "s"} across them
            </span>
          </div>
          <div className="ps-tw">
            <table>
              <thead>
                <tr>
                  <th>List</th>
                  <th>Records</th>
                  <th>Added by</th>
                  <th>Last change</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {lists.map((row: ListRow) => (
                  <tr key={row.id}>
                    <td className="ps-who">
                      <Link href={`/app/lists/${row.id}`}>
                        <b>{row.name}</b>
                      </Link>
                      {row.description && <span className="ps-employer">{row.description}</span>}
                    </td>
                    <td className="num">{row.member_count.toLocaleString("en-US")}</td>
                    <td className="fine">{row.created_by?.name ?? row.created_by?.email ?? "—"}</td>
                    <td className="fine mono">{when(row.updated_at)}</td>
                    <td className="actions">
                      <Link href={`/app/lists/${row.id}`} className="btn sm">
                        Open
                      </Link>
                      {/* Deleting a list deletes the list, never a provider record. The confirm
                          step is the page it lands on, not a dialog: there is no JavaScript here
                          and a browser-native confirm is not available to us. */}
                      <form method="post" action="/api/app/lists">
                        <input type="hidden" name="action" value="delete" />
                        <input type="hidden" name="id" value={row.id} />
                        <input type="hidden" name="return_to" value="/app/lists" />
                        <button type="submit" className="btn sm">
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

import Link from "next/link";
import type { PublicProvider } from "@/lib/api";

/**
 * A page of providers as an unsigned visitor sees it: the public record, plus a locked cell
 * where a signed-in customer would find contact details. The lock is honest - it says
 * whether something is there - and it is the whole of what a scraper can learn.
 */
export function ProviderTable({ rows }: { rows: PublicProvider[] }) {
  if (rows.length === 0) {
    return (
      <div className="panel np-empty">
        <span className="eyebrow">Try a wider search</span>
        <h2>No providers match these filters</h2>
        <p className="fine">Remove a city or specialty, check the spelling, or start with a state on its own.</p>
        <Link href="/search" className="btn">Start a new search</Link>
      </div>
    );
  }
  return (
    <div className="table-wrap np-provider-table" role="region" aria-label="Provider results" tabIndex={0}>
      <table className="data">
        <caption className="np-table-caption">Public provider records · select a name to view the profile</caption>
        <thead>
          <tr>
            <th>Provider</th>
            <th>NPI</th>
            <th>Specialty</th>
            <th>Practice location</th>
            <th>Status</th>
            <th>Contact</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.npi}>
              <td>
                <Link href={`/npi/${row.npi}`}>{row.name}</Link>
                {row.credentials && (
                  <div className="fine" style={{ fontSize: "0.8rem" }}>
                    {row.credentials}
                  </div>
                )}
                {row.employer_name && (
                  <div className="fine" style={{ fontSize: "0.8rem" }}>
                    {row.employer_name}
                  </div>
                )}
              </td>
              <td className="mono num nowrap-cell">{row.npi}</td>
              <td>
                {row.primary_taxonomy?.display ?? "—"}
                {/* Why this row is in a filtered list whose specialty it does not show. An NPI
                    files as many taxonomies as it practises, and the filter matches any of them,
                    so without this line the page reads as a filter that does not work. */}
                {row.matched_taxonomy && (
                  <div className="fine" style={{ fontSize: "0.8rem" }}>
                    Matched: {row.matched_taxonomy.display}
                  </div>
                )}
              </td>
              <td>
                {[row.city, row.state].filter(Boolean).join(", ") || "—"}
                {row.postal_code && (
                  <span className="mono fine" style={{ marginLeft: 6, fontSize: "0.8rem" }}>
                    {row.postal_code.slice(0, 5)}
                  </span>
                )}
              </td>
              <td>
                <span className={`tag ${row.status === "active" ? "ok" : "warn"}`}>
                  {row.status}
                </span>
              </td>
              <td>
                {row.has_email || row.has_home_contact ? (
                  <Link href="/sign-in" className="locked" title="Sign in to reveal">
                    {row.has_email && row.has_home_contact
                      ? "email · home"
                      : row.has_email
                        ? "email"
                        : "home"} · sign in
                  </Link>
                ) : (
                  <span className="fine">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

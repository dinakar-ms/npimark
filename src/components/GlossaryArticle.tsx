import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { taxonomyList, type TaxonomyListDetail } from "@/lib/api";
import { AUDIENCES } from "@/lib/audiences";
import { DIRECTORY_SPECIALTIES, METROS, specialtyPath, type Metro } from "@/lib/geo";
import {
  GLOSSARY_FAMILIES,
  METRO_LABELS,
  glossaryForAudience,
  glossaryLinkable,
  glossaryPath,
  relatedEntries,
  type GlossaryEntry,
} from "@/lib/glossary";
import { fmt, listPath, refreshedOn, share } from "@/lib/lists";
import { siteUrl, stateName } from "@/lib/site";

/**
 * One glossary page: what a profession is, then what we hold on it.
 *
 * The order is deliberate. Somebody arriving from "what is a CRNA" wants the answer, not a price,
 * so the explanation comes first and every number is below it. The explanation is written and
 * lives in `lib/glossary.ts`; this file decides only how it is laid out and how the counts beside
 * it are read.
 *
 * Counts, and the three states they can be in
 * -------------------------------------------
 * `glossaryCounts` reads one list from the platform and reports which of three things happened,
 * because the right page differs for each:
 *
 *   ok          the list is published: print the figures, the states, and a link to the list page.
 *   none        the platform answered, and there is no such published list. For a specialty entry
 *               that is a 404 (the route does it): a glossary page always has rows behind it. For a
 *               credential - MD covers every specialty there is - it is simply the normal case.
 *   unreadable  the platform could not be reached. The page renders without a single figure and
 *               says so in one line, rather than printing zeros that read as "we have none".
 *
 * Which is also why no figure on this page is written down anywhere in the repo: a count is read
 * live or the sentence that would have carried it is not printed.
 *
 * The links to other terms, and why they need the catalogue
 * --------------------------------------------------------
 * Two blocks here link other glossary pages: "closely related", and the rest of this profession's
 * audience. Either can name a specialty whose list the platform does not publish, and that page is
 * a 404 - the route's own second gate. So `published` comes in from the route, holding the same
 * taxonomy slugs the hub and the sitemap filter on, and both blocks go through `glossaryLinkable`.
 * Null means the catalogue could not be read, and then neither block links anything: a page about
 * one term stays a page about that term, rather than becoming a set of guesses about which of its
 * neighbours still exist.
 */

export type GlossaryCounts =
  | { state: "ok"; list: TaxonomyListDetail }
  | { state: "none" }
  | { state: "unreadable" };

/** One cached read of the entry's list. Never throws: the page decides what to do with each state. */
export async function glossaryCounts(entry: GlossaryEntry): Promise<GlossaryCounts> {
  if (!entry.list) return { state: "none" };
  try {
    const list = await taxonomyList(entry.list);
    return list ? { state: "ok", list } : { state: "none" };
  } catch {
    // A 404 came back as null above, so anything thrown here is the platform being unreachable -
    // no key yet, a network failure, a rate limit - and not an answer about this list.
    return { state: "unreadable" };
  }
}

/** One big metro per state, first six states in the directory's own order. */
function metros(): Metro[] {
  const seen = new Set<string>();
  const out: Metro[] = [];
  for (const metro of METROS) {
    if (seen.has(metro.state)) continue;
    seen.add(metro.state);
    out.push(metro);
    if (out.length === 6) break;
  }
  return out;
}

function Figures({ list }: { list: TaxonomyListDetail }) {
  const c = list.counts;
  return (
    <div className="stats">
      <div className="stat">
        <span className="value num">{fmt(c.total)}</span>
        <span className="label">on the public record</span>
      </div>
      <div className="stat">
        <span className="value num">{fmt(c.with_trusted_email)}</span>
        <span className="label">with a confirmed work email</span>
      </div>
      <div className="stat">
        <span className="value num">{fmt(c.with_phone)}</span>
        <span className="label">with a practice phone</span>
      </div>
      <div className="stat">
        <span className="value num">{list.states.length}</span>
        <span className="label">
          {list.states.length === 1 ? "state with a list of its own" : "states with a list of their own"}
        </span>
      </div>
    </div>
  );
}

function TopStates({ list }: { list: TaxonomyListDetail }) {
  const rows = list.by_state.slice(0, 8);
  if (rows.length === 0) return null;
  return (
    <div className="table-wrap" style={{ marginTop: 22 }}>
      <table>
        <thead>
          <tr>
            <th>State</th>
            <th>On record</th>
            <th>With work email</th>
            <th>With practice phone</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.state}>
              <td>
                {row.published ? (
                  <Link href={listPath(list.slug, row.state)}>{stateName(row.state) ?? row.state}</Link>
                ) : (
                  (stateName(row.state) ?? row.state)
                )}
              </td>
              <td className="num">{fmt(row.counts.total)}</td>
              <td className="num">
                {fmt(row.counts.with_email)}{" "}
                <span className="fine">{share(row.counts.with_email, row.counts.total)}</span>
              </td>
              <td className="num">{fmt(row.counts.with_phone)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function GlossaryArticle({
  entry,
  counts,
  published,
}: {
  entry: GlossaryEntry;
  counts: GlossaryCounts;
  /** The taxonomy slugs the platform publishes, or null when the catalogue could not be read. */
  published: ReadonlySet<string> | null;
}) {
  const here = glossaryPath(entry.term);
  const family = GLOSSARY_FAMILIES.find((f) => f.key === entry.family);
  const related = glossaryLinkable(relatedEntries(entry), published);
  const audience = AUDIENCES.find((a) => a.slug === entry.audience);
  const list = counts.state === "ok" ? counts.list : null;
  const refreshed = refreshedOn(list?.refreshed_at);
  // Metro links only where a page for this exact population exists, and only under the plural the
  // table gives it. Both conditions, or the page links to somebody else's page under our name.
  const classification = entry.classification;
  const plural = METRO_LABELS[entry.term];
  const places =
    classification && plural && DIRECTORY_SPECIALTIES.includes(classification) ? metros() : [];
  // Everything else in this profession's family, so a hub visit is never needed to keep reading -
  // and, like `related`, only the ones whose pages resolve.
  const siblings = entry.audience
    ? glossaryLinkable(glossaryForAudience(entry.audience), published).filter(
        (other) => other.term !== entry.term && !related.some((r) => r.term === other.term),
      )
    : [];

  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "DefinedTerm",
              "@id": siteUrl(`${here}#term`),
              name: entry.label,
              alternateName: entry.title,
              description: entry.lede,
              url: siteUrl(here),
              inDefinedTermSet: {
                "@type": "DefinedTermSet",
                "@id": siteUrl("/glossary#set"),
                name: "Healthcare specialty and credential glossary",
                url: siteUrl("/glossary"),
              },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: siteUrl("/") },
                { "@type": "ListItem", position: 2, name: "Glossary", item: siteUrl("/glossary") },
                { "@type": "ListItem", position: 3, name: entry.label, item: siteUrl(here) },
              ],
            },
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
              <Link href={glossaryPath()}>Glossary</Link>
            </li>
            <li aria-current="page">{entry.label}</li>
          </ol>
          <div className="eyebrow rule">
            {family?.name ?? "Glossary"}
            {refreshed ? ` · counts refreshed ${refreshed}` : ""}
          </div>
          <h1 style={{ fontSize: "clamp(1.7rem, 3.6vw, 2.5rem)" }}>{entry.title}</h1>
          <p className="lede">{entry.lede}</p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap prose">
          <h2>{entry.kind === "credential" ? "What the letters mean" : "In plain English"}</h2>
          {/* In the order they are written: position is the only key there is, and a stable one -
              the paragraphs of an entry never reorder. */}
          {entry.body.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
          {entry.caveat && (
            <p className="fine">
              <b>A shorter entry, on purpose.</b> {entry.caveat}
            </p>
          )}

          {entry.route && (
            <>
              <h2>Training and credentials</h2>
              <p>{entry.route}</p>
            </>
          )}

          {entry.letters && entry.letters.length > 0 && (
            <div className="table-wrap" style={{ marginTop: 14 }}>
              <table>
                <thead>
                  <tr>
                    <th>Letters</th>
                    <th>What they mean</th>
                  </tr>
                </thead>
                <tbody>
                  {entry.letters.map((row) => (
                    <tr key={row.letters}>
                      <td>
                        <b>{row.letters}</b>
                      </td>
                      <td className="fine">{row.means}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {entry.settings && (
            <>
              <h2>Where they practice</h2>
              <p>{entry.settings}</p>
            </>
          )}
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow rule">What we hold</div>
            <h2>{list ? `${list.label} on the public record` : "What we hold on them"}</h2>
          </div>

          {list ? (
            <>
              <Figures list={list} />
              <p className="fine" style={{ marginTop: 14 }}>
                Counted from what providers file about themselves, with suppression applied before
                anything is counted{refreshed ? `, refreshed ${refreshed}` : ""}. Names, specialties and
                practice locations are public; work email and phone are for signed-in customers.
              </p>
              <TopStates list={list} />
              <div className="hints" style={{ justifyContent: "flex-start", marginTop: 20 }}>
                <span>Go on:</span>
                <Link href={listPath(list.slug)}>The {list.label.toLowerCase()} list</Link>
                <Link href="/lists">All lists by specialty</Link>
                <Link href="/data">What a record carries</Link>
              </div>
            </>
          ) : (
            <p className="lede">
              {counts.state === "unreadable"
                ? "The live counts are not readable at the moment, so this page is not printing any."
                : "These letters span more than one specialty, so there is no single list behind them."}{" "}
              <Link href="/lists">Browse the lists</Link> for counts by specialty and state, each
              refreshed nightly, or <Link href="/data">see what a record carries</Link>.
            </p>
          )}
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow rule">Where to go next</div>
            <h2>Closely related, and where to find them.</h2>
          </div>
          <div className="grid pairs" style={{ alignItems: "start" }}>
            {related.length > 0 && (
              <div className="panel">
                <h3>Closely related</h3>
                <ul className="ticks" style={{ marginTop: 10 }}>
                  {related.map((other) => (
                    <li key={other.term}>
                      <Link href={glossaryPath(other.term)}>{other.label}</Link>{" "}
                      <span className="fine">{other.blurb}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="panel">
              <h3>Find them</h3>
              <ul className="ticks" style={{ marginTop: 10 }}>
                {list && (
                  <li>
                    <Link href={listPath(list.slug)}>{list.label} list</Link>{" "}
                    <span className="fine">counts by state, the fields a record carries, a sample record.</span>
                  </li>
                )}
                {audience && (
                  <li>
                    <Link href={`/${audience.slug}`}>{audience.label}</Link>{" "}
                    <span className="fine">{audience.note}</span>
                  </li>
                )}
                {classification &&
                  places.map((metro) => (
                    <li key={`${metro.city}-${metro.state}`}>
                      <Link href={specialtyPath(classification, metro)}>
                        {plural} in {metro.city}, {metro.state}
                      </Link>
                    </li>
                  ))}
                {(entry.also ?? []).map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {siblings.length > 0 && (
            <div className="hints" style={{ justifyContent: "flex-start", marginTop: 24 }}>
              <span>Also in the glossary:</span>
              {siblings.slice(0, 8).map((other) => (
                <Link key={other.term} href={glossaryPath(other.term)}>
                  {other.label}
                </Link>
              ))}
            </div>
          )}

          <div className="cta" style={{ marginTop: 32 }}>
            <h2>Need the list, not the definition?</h2>
            <p className="lede">
              An account on any plan builds this population with your own filters and shows what each record
              carries before anything is bought.
            </p>
            <div className="actions" style={{ marginTop: 16 }}>
              <Link className="btn primary lg" href="/sign-up">
                Get a free sample
              </Link>
              <Link className="btn lg" href={glossaryPath()}>
                Back to the glossary
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { searchEverything, type OmniGroup, type OmniItem } from "@/lib/session";
import FindFilters from "./FindFilters";
import styles from "./FindFilters.module.css";

/**
 * One box across everything a customer may search: providers, organisations, facilities and the
 * named people at them who have no NPI.
 *
 * It asks the API's own `/api/search`, the same one the internal application uses, with the
 * customer's session. The API decides which groups a customer organisation is asked at all, so
 * this page draws what it is sent: a group it has no link for is a group it never receives.
 * Results never carry a phone or an email - those are opened one person at a time, metered, on
 * the facility, person and provider pages this links to.
 *
 * The API returns the top matches in each group, not a full count of the database - counting
 * every "contains" match across 9.8 million providers per keystroke is exactly the query the one
 * box refuses to run. The count says how many it found in that sample, and "see all" goes to the
 * page that can page through the rest where there is one.
 *
 * On the layout
 * -------------
 * This was four unordered lists of blue links with a dot between the name and the subtitle, which
 * is what a search result looked like before anybody made one worth using. A person scanning it
 * could tell what a row was called and nothing else, so every row cost a click to evaluate.
 *
 * What a row can say is bounded by what the API sends - title, subtitle, badges and the row's own
 * identifier - and no more than that is invented here. What changed is that all of it is now
 * visible at once and in the same place on every row: the kind as a coloured initial, the name,
 * the identifier in mono beneath it, the badges ranged right. The four kinds are told apart by
 * colour rather than only by a heading, because the eye finds a colour before it reads a word.
 *
 * A row also says whether we hold a usable work email and a usable practice phone, which is the
 * difference between two results - somebody chooses which to open without spending a reveal on
 * either. They are flags and never values, suppression is applied before the flag is set, and a
 * row we hold nothing for says so rather than saying nothing.
 *
 * There is no equivalent for a home address or a cell phone, deliberately. Those are contract-only
 * and the provider search is careful never to mark which rows have them, "or every search would
 * publish for free what the reveal is for". A flag here would do exactly that, to every signed-in
 * customer including those whose plan could never open one.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search everything",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * How each kind is drawn: the letter in the badge, and the colour family.
 *
 * Four groups that look identical are four groups somebody has to read the heading of. A hospital
 * and a person are different things and the page should say so before the words do.
 */
const KIND: Record<string, { initial: string; tone: string; one: string }> = {
  providers: { initial: "P", tone: "find-provider", one: "provider" },
  organizations: { initial: "O", tone: "find-org", one: "organization" },
  facilities: { initial: "F", tone: "find-facility", one: "facility" },
  people: { initial: "C", tone: "find-person", one: "person" },
};

/** Where a row goes on this site. Null for a row this site has no page for. */
function linkFor(group: string, item: OmniItem): string | null {
  const ref = item.ref ?? "";
  switch (group) {
    case "providers":
      return /^\d{10}$/.test(ref) ? `/npi/${ref}` : null;
    case "organizations":
      return /^\d{10}$/.test(ref) ? `/app/search?q=${ref}&type=organization` : null;
    case "facilities":
      return ref ? `/app/facility/${encodeURIComponent(ref)}` : null;
    case "people":
      return /^\d+$/.test(ref) ? `/app/contact/${ref}` : null;
    default:
      return null;
  }
}

/** "See all" for a group, where this site has a page that can list the rest. */
function seeAll(group: string, q: string): string | null {
  switch (group) {
    case "providers":
      return `/app/search?q=${encodeURIComponent(q)}&type=individual`;
    case "organizations":
      return `/app/search?q=${encodeURIComponent(q)}&type=organization`;
    default:
      return null;
  }
}

/** What the identifier under a name actually is, so a number is never unexplained. */
function refLabel(group: string): string {
  if (group === "facilities") return "CCN";
  if (group === "people") return "Contact";
  return "NPI";
}

function Group({ group, q }: { group: OmniGroup; q: string }) {
  const rows = group.items
    .map((item) => ({ item, href: linkFor(group.group, item) }))
    .filter((row): row is { item: OmniItem; href: string } => row.href !== null);
  if (rows.length === 0) return null;
  const more = seeAll(group.group, q);
  const kind = KIND[group.group] ?? { initial: "?", tone: "find-other", one: "result" };
  const sampled = group.count > group.items.length;

  return (
    <section className="find-group">
      <div className="find-group-head">
        <span className={`find-kind ${kind.tone}`} aria-hidden>
          {kind.initial}
        </span>
        <h2>{group.label}</h2>
        <span className="find-count">{group.count.toLocaleString("en-US")}</span>
        {sampled && (
          <span className="fine">
            showing the top {group.items.length} — the count is what this sample found, not the
            database
          </span>
        )}
        {more && (
          <Link href={more} className="btn sm find-seeall">
            See all {group.count.toLocaleString("en-US")}
          </Link>
        )}
      </div>

      <ul className="find-rows">
        {rows.map(({ item, href }) => (
          <li key={href}>
            <Link href={href} className="find-row">
              <span className={`find-kind ${kind.tone}`} aria-hidden>
                {kind.initial}
              </span>
              <span className="find-main">
                <span className="find-title">{item.title}</span>
                {item.subtitle && <span className="find-sub">{item.subtitle}</span>}
              </span>
              {item.ref && (
                <span className="find-ref mono">
                  <span className="find-ref-label">{refLabel(group.group)}</span>
                  {item.ref}
                </span>
              )}
              {(item.has_email !== undefined && item.has_email !== null) ||
              (item.has_phone !== undefined && item.has_phone !== null) ? (
                <span className="find-held" aria-label="What we hold">
                  <span className={`find-held-one ${item.has_email ? "yes" : "no"}`}>Email</span>
                  <span className={`find-held-one ${item.has_phone ? "yes" : "no"}`}>Phone</span>
                </span>
              ) : null}
              {item.badges.length > 0 && (
                <span className="find-badges">
                  {item.badges.map((badge) => (
                    <span key={badge} className="tag">
                      {badge}
                    </span>
                  ))}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** What to try, when nothing has been typed. One example of each shape the box accepts. */
const EXAMPLES: { label: string; q: string; what: string }[] = [
  { label: "Mercy Hospital", q: "Mercy Hospital", what: "a name" },
  { label: "1234567893", q: "1234567893", what: "an NPI" },
  { label: "450023", q: "450023", what: "a CMS Certification Number" },
  { label: "Reyes", q: "Reyes", what: "a surname" },
];

export default async function FindPage({ searchParams }: Props) {
  const params = await searchParams;
  const raw = params.q;
  const q = ((Array.isArray(raw) ? raw[0] : raw) ?? "").trim().slice(0, 200);
  const requestedKind = Array.isArray(params.kind) ? params.kind[0] : params.kind;
  const kind = requestedKind && Object.hasOwn(KIND, requestedKind) ? requestedKind : "";
  const result = q ? await searchEverything(q) : null;
  const drawn = (result?.groups ?? []).filter((g) =>
    (!kind || g.group === kind) && g.items.some((item) => linkFor(g.group, item) !== null),
  );
  const found = drawn.reduce((sum, g) => sum + g.count, 0);

  return (
    <main className="wrap app-main find">
      <header className="find-head">
        <div className="eyebrow rule">Search everything</div>
        <h1>Providers, organizations, facilities and the people who run them.</h1>
        <p className="find-lede">
          A name, an NPI or a CMS Certification Number. Contact details are never in these results —
          you open them one at a time, and only the first time this month costs a reveal.
        </p>
      </header>

      <form method="get" action="/app/find">
        <div className={styles.category}><label htmlFor="find-kind">Search category</label>
        <select id="find-kind" name="kind" defaultValue={kind}>
          <option value="">Everything</option>
          <option value="providers">Individual providers</option>
          <option value="organizations">Organizations with an NPI</option>
          <option value="facilities">Facilities</option>
          <option value="people">Nonclinical contacts</option>
        </select>
        </div>
        <div className="find-box">
        <label htmlFor="q" className="sr-only">
          Search providers, organizations, facilities and people
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          maxLength={200}
          required
          autoFocus={!q}
          placeholder="Mercy Hospital · 1234567893 · 450023 · a chief executive's name"
        />
        <button type="submit" className="btn primary">
          Search
        </button>
        </div>
        <p className="fine">Search by name or ID, then show the selected category from the top matches. To search by location or specialty, use the provider filters below.</p>
      </form>

      {!q && (
        <div className="find-examples">
          <span className="find-examples-lead">Try</span>
          {EXAMPLES.map((example) => (
            <Link key={example.q} href={`/app/find?${new URLSearchParams({ q: example.q, ...(kind ? { kind } : {}) })}`}>
              {example.label}
              <span className="fine"> — {example.what}</span>
            </Link>
          ))}
        </div>
      )}

      <FindFilters q={q} />

      {q && result === null && (
        <div className="notice warn find-notice">
          The platform did not answer. Try again in a moment.
        </div>
      )}

      {result && (
        <>
          {drawn.length > 0 && (
            // The shape of the answer before any of it is read: which kinds matched and how many.
            <div className="find-summary">
              <b className="num">{found.toLocaleString("en-US")}</b>
              <span className="fine">in matching samples across</span>
              {drawn.map((g) => (
                <a key={g.group} href={`#find-${g.group}`} className="find-chip">
                  <span className={`find-kind ${(KIND[g.group]?.tone ?? "find-other")}`} aria-hidden>
                    {KIND[g.group]?.initial ?? "?"}
                  </span>
                  {g.label}
                  <b>{g.count.toLocaleString("en-US")}</b>
                </a>
              ))}
            </div>
          )}

          {result.notes.map((note) => (
            <p key={note} className="fine find-note">
              {note}
            </p>
          ))}
          {result.timed_out.length > 0 && (
            <p className="fine find-note">
              {result.timed_out.join(", ")} did not answer in time; the rest is below.
            </p>
          )}

          {drawn.map((group) => (
            <div key={group.group} id={`find-${group.group}`}>
              <Group group={group} q={q} />
            </div>
          ))}

          {drawn.length === 0 && (
            <div className="notice find-notice">
              No top matches in {kind ? "this category" : "these categories"}. Try part of a name, at least three letters,
              or broaden your search category. Provider filters search the full provider directory.
            </div>
          )}
        </>
      )}
    </main>
  );
}

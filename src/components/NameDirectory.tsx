import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { withDirectoryFallback, withDirectoryMetadata } from "@/components/DirectoryFallback";
import { directoryNode, type DirectoryKind, type DirectoryNode } from "@/lib/api";
import { siteUrl, stateName } from "@/lib/site";

/**
 * The A-Z of providers and organisations: a tree of name prefixes.
 *
 * Nine million names cannot be page numbers - the last page of S would be millions of rows deep
 * for the platform and thousands of links deep for a crawler. So a page is a prefix. A prefix
 * with few enough names under it lists them, linking each to its provider page; a longer one
 * lists the prefixes one letter longer, with how many names each holds. Any name is a handful of
 * clicks from the top, and no page reads more than its own slice of the registry.
 *
 * A prefix page exists only where the tree leads to it: its parent must be a branch that lists
 * it. Otherwise "SMI" under a small "SM" would be a second copy of part of "SM", and a hand-typed
 * prefix with nothing under it would be an empty page. Both are 404s.
 */

export const PAGE_SIZE = 200;

export const KINDS: Record<DirectoryKind, { title: string; noun: string; letters: string[] }> = {
  providers: {
    title: "Providers",
    noun: "providers",
    letters: [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"],
  },
  organizations: {
    title: "Organizations",
    noun: "organizations",
    letters: [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"],
  },
};

export function kindFromParam(value: string): DirectoryKind | null {
  return value === "providers" || value === "organizations" ? value : null;
}

/** `SMITH J` <-> `smith-j`. Names hold only letters, digits and single spaces, so it is 1:1. */
export function prefixSlug(prefix: string): string {
  return prefix.toLowerCase().replace(/ /g, "-");
}

export function prefixFromSlug(slug: string): string | null {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 60) return null;
  return slug.toUpperCase().replace(/-/g, " ");
}

export function nodePath(kind: DirectoryKind, prefix: string, page = 1): string {
  const base = `/directory/${kind}/${prefixSlug(prefix)}`;
  return page > 1 ? `${base}/${page}` : base;
}

/** "SMITH J" read as a person would: "Smith J". */
function shown(prefix: string): string {
  return prefix.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase());
}

/** Every ancestor of a prefix the tree passes through: S, SM, SMI, SMIT, SMITH for SMITH J. */
function ancestors(prefix: string): string[] {
  const out: string[] = [];
  for (let i = 1; i < prefix.length; i++) {
    const head = prefix.slice(0, i);
    if (!head.endsWith(" ")) out.push(head);
  }
  return out;
}

function parentOf(prefix: string): string | null {
  if (prefix.length <= 1) return null;
  return prefix.slice(0, -1).trimEnd();
}

async function resolveNode(kindParam: string, slug: string, page: number) {
  const kind = kindFromParam(kindParam);
  const prefix = prefixFromSlug(slug);
  if (!kind || !prefix || !Number.isInteger(page) || page < 1) return null;
  const parent = parentOf(prefix);
  const [node, above] = await Promise.all([
    directoryNode(kind, prefix, page, PAGE_SIZE),
    parent ? directoryNode(kind, parent, 1, PAGE_SIZE) : Promise.resolve(null),
  ]);
  if (!node) return null;
  if (parent && (!above || above.leaf || !above.children.some((c) => c.prefix === prefix))) {
    return null;
  }
  if (node.items.length === 0 && node.children.length === 0) return null;
  return { kind, prefix, node };
}

function heading(kind: DirectoryKind, prefix: string): string {
  return `${KINDS[kind].title} A–Z: ${shown(prefix)}`;
}

async function loadNodeMetadata(kindParam: string, slug: string, page = 1): Promise<Metadata> {
  const resolved = await resolveNode(kindParam, slug, page);
  if (!resolved) return { title: "Not found", robots: { index: false } };
  const { kind, prefix, node } = resolved;
  const noun = KINDS[kind].noun;
  return {
    title: page > 1 ? `${heading(kind, prefix)} · page ${page}` : heading(kind, prefix),
    description: `${node.total.toLocaleString("en-US")} active ${noun} whose names begin with "${shown(
      prefix,
    )}". Name, NPI, specialty and location for each, with a link to the full record.`,
    alternates: { canonical: nodePath(kind, prefix, page) },
  };
}

function Pager({ kind, node }: { kind: DirectoryKind; node: DirectoryNode }) {
  const pages = Math.ceil(node.items_total / node.page_size);
  if (pages <= 1) return null;
  return (
    <div className="hints" style={{ justifyContent: "flex-start", marginTop: 18 }}>
      <span>Pages:</span>
      {Array.from({ length: pages }, (_, i) => i + 1).map((n) =>
        n === node.page ? (
          <b key={n}>{n}</b>
        ) : (
          <Link key={n} href={nodePath(kind, node.prefix, n)}>
            {n}
          </Link>
        ),
      )}
    </div>
  );
}

async function loadNodePage({
  kindParam,
  slug,
  page = 1,
}: {
  kindParam: string;
  slug: string;
  page?: number;
}) {
  const resolved = await resolveNode(kindParam, slug, page);
  if (!resolved) notFound();
  const { kind, prefix, node } = resolved;
  const meta = KINDS[kind];
  const path = nodePath(kind, prefix, page);
  const trail = ancestors(prefix).map((p) => ({ name: shown(p), href: nodePath(kind, p) }));
  const crumbs = [
    { name: "Directory", href: "/directory" },
    { name: meta.title, href: `/directory/${kind}` },
    ...trail,
  ];

  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "CollectionPage",
              "@id": siteUrl(`${path}#page`),
              name: heading(kind, prefix),
              url: siteUrl(path),
            },
            ...(node.items.length > 0
              ? [
                  {
                    "@type": "ItemList",
                    numberOfItems: node.items.length,
                    itemListElement: node.items.map((item, i) => ({
                      "@type": "ListItem",
                      position: (node.page - 1) * node.page_size + i + 1,
                      url: siteUrl(`/npi/${item.npi}`),
                      name: item.name,
                    })),
                  },
                ]
              : []),
            {
              "@type": "BreadcrumbList",
              itemListElement: [...crumbs, { name: shown(prefix), href: path }].map((c, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: c.name,
                item: siteUrl(c.href),
              })),
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
            {crumbs.map((c) => (
              <li key={c.href}>
                <Link href={c.href}>{c.name}</Link>
              </li>
            ))}
            <li aria-current="page">{shown(prefix)}</li>
          </ol>
          <div className="eyebrow rule">
            {node.total.toLocaleString("en-US")} active {meta.noun}
            {page > 1 ? ` · page ${page}` : ""}
          </div>
          <h1 style={{ fontSize: "clamp(1.7rem, 3.6vw, 2.5rem)" }}>{heading(kind, prefix)}</h1>
          <p className="lede">
            {node.leaf
              ? `Every active ${meta.noun.replace(/s$/, "")} whose name begins with "${shown(
                  prefix,
                )}", in alphabetical order. Each links to the full public record.`
              : `${node.total.toLocaleString("en-US")} active ${meta.noun} have names beginning with "${shown(
                  prefix,
                )}". Narrow it down by the next letter.`}
          </p>

          {node.children.length > 0 && page === 1 && (
            <ul
              className="ticks"
              style={{
                marginTop: 22,
                display: "grid",
                gap: "6px 20px",
                gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
              }}
            >
              {node.children.map((c) => (
                <li key={c.prefix}>
                  <Link href={nodePath(kind, c.prefix)}>{shown(c.prefix)}</Link>{" "}
                  <span className="fine num">{c.count.toLocaleString("en-US")}</span>
                </li>
              ))}
            </ul>
          )}

          {node.items.length > 0 && (
            <>
              {!node.leaf && (
                <h2 style={{ marginTop: 32 }}>Named exactly &ldquo;{shown(prefix)}&rdquo;</h2>
              )}
              <div className="table-wrap" style={{ marginTop: 20 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Specialty</th>
                      <th>Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {node.items.map((item) => (
                      <tr key={item.npi}>
                        <td>
                          <Link href={`/npi/${item.npi}`}>
                            <b>{item.name}</b>
                          </Link>
                          <span className="fine mono" style={{ display: "block" }}>
                            NPI {item.npi}
                            {item.credentials ? ` · ${item.credentials}` : ""}
                          </span>
                        </td>
                        <td className="fine">{item.specialty ?? "—"}</td>
                        <td className="fine">
                          {[item.city, stateName(item.state) ?? item.state]
                            .filter(Boolean)
                            .join(", ") || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pager kind={kind} node={node} />
            </>
          )}
        </div>
      </section>
    </main>
  );
}

/** The letters of one kind, with how many names each holds. Letters with none are left out. */
export async function lettersOf(kind: DirectoryKind) {
  const nodes = await Promise.all(
    KINDS[kind].letters.map(async (letter) => ({
      letter,
      node: await directoryNode(kind, letter, 1, PAGE_SIZE),
    })),
  );
  return nodes.filter((n): n is { letter: string; node: DirectoryNode } => n.node !== null);
}

// Wrapped here, not only in the page, and that distinction is the whole bug this fixes.
//
// `withDirectoryFallback` is a try/catch around an async function. A page whose body *awaits* its
// own data - `/npi/[npi]`, `/facility/[slug]` - is fully covered by wrapping the page, because the
// throw happens inside the try. These pages do not: they return `<NodePage .../>` and the fetch
// happens while React renders that child, after the wrapped function has already returned its
// element successfully. So the page-level wrapper caught nothing and
// `/directory/providers/<prefix>` went on answering HTTP 500 through two releases that were each
// meant to end exactly that.
//
// `FacilityDirectory.tsx` had it right from the start, which is why six facility trees recovered
// without anybody touching them. Same shape here.
export const NodePage = withDirectoryFallback(loadNodePage);
export const nodeMetadata = withDirectoryMetadata(loadNodeMetadata);

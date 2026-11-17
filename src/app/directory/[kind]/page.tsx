import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { KINDS, kindFromParam, lettersOf, nodePath } from "@/components/NameDirectory";
import { breadcrumb, websiteRef } from "@/lib/schema";
import { siteUrl } from "@/lib/site";
import { withDirectoryFallback, withDirectoryMetadata } from "@/components/DirectoryFallback";

/**
 * The top of one A-Z: every letter that has names under it, with how many. A letter with none is
 * left out rather than linked to a 404. Cached for a day, and the letter pages read the very same
 * cached calls.
 */
// Request-time, and not 86,400 seconds. It was a day, which is right for a provider record and
// wrong for the page that renders when the record cannot be read: the recovery state below would
// have been stored as this route's output and served for a day after the platform recovered. The
// `no-store` line for this tree in `next.config.ts` is the other half of the same decision - one
// stops Next caching the outage, the other stops a shared cache doing it.
//
// What it costs: these URLs no longer come out of the full route cache. Small, because the traffic
// on them is overwhelmingly enumeration of distinct ids that never hit a cache anyway (measured
// 19 Oct 2026: 23,006 distinct `/npi/<id>` requests in one hour), and worth paying rather than
// telling a crawler for a day that a page it has indexed is now noindex.
export const revalidate = 0;

type Props = { params: Promise<{ kind: string }> };

async function kindMetadata({ params }: Props): Promise<Metadata> {
  const kind = kindFromParam((await params).kind);
  if (!kind) return { title: "Not found", robots: { index: false } };
  const meta = KINDS[kind];
  return {
    title: `${meta.title} A–Z`,
    description: `Every active US healthcare ${meta.noun.replace(/s$/, "")} by name, A to Z, each linked to its public record: NPI, specialty and practice location.`,
    alternates: { canonical: `/directory/${kind}` },
  };
}

async function KindPage({ params }: Props) {
  const kind = kindFromParam((await params).kind);
  if (!kind) notFound();
  const meta = KINDS[kind];
  const letters = await lettersOf(kind);
  if (letters.length === 0) notFound();
  const total = letters.reduce((sum, l) => sum + l.node.total, 0);
  const path = `/directory/${kind}`;

  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "CollectionPage",
              "@id": siteUrl(`${path}#page`),
              name: `${meta.title} A–Z`,
              url: siteUrl(path),
              isPartOf: websiteRef(),
            },
            // The trail the crumbs above show, Home included. See lib/schema.ts.
            breadcrumb([
              { name: "Directory", href: "/directory" },
              { name: `${meta.title} A–Z`, href: path },
            ]),
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
              <Link href="/directory">Directory</Link>
            </li>
            <li aria-current="page">{meta.title} A–Z</li>
          </ol>
          <div className="eyebrow rule">
            {total.toLocaleString("en-US")} active {meta.noun} · refreshed weekly
          </div>
          <h1 style={{ fontSize: "clamp(1.7rem, 3.6vw, 2.5rem)" }}>{meta.title} A–Z</h1>
          <p className="lede">
            Every active {meta.noun.replace(/s$/, "")} with an NPI, by name. Choose a letter, then
            narrow down; each name links to its record with specialty and practice location.
          </p>
          <div className="table-wrap" style={{ marginTop: 26 }}>
            <table>
              <thead>
                <tr>
                  <th>Names beginning</th>
                  <th>{meta.title}</th>
                </tr>
              </thead>
              <tbody>
                {letters.map(({ letter, node }) => (
                  <tr key={letter}>
                    <td>
                      <Link href={nodePath(kind, letter)}>
                        <b>{letter}</b>
                      </Link>
                    </td>
                    <td className="num">{node.total.toLocaleString("en-US")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="hints" style={{ justifyContent: "flex-start", marginTop: 24 }}>
            <span>Also:</span>
            {kind === "providers" ? (
              <Link href="/directory/organizations">Organizations A–Z</Link>
            ) : (
              <Link href="/directory/providers">Providers A–Z</Link>
            )}
            <Link href="/search">Search by name, specialty or place</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

// A refused read is not a broken page, and it is not an absence either. The same wrapper the
// specialty pages use: Next's own redirect and notFound control flow is rethrown, anything else
// renders the recovery state with working links and noindex. Measured 19 Oct 2026, after the row
// allowance ran out: KindPage was one of the families still answering HTTP 500.
export default withDirectoryFallback(KindPage);
export const generateMetadata = withDirectoryMetadata(kindMetadata);

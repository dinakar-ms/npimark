import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GlossaryArticle, glossaryCounts } from "@/components/GlossaryArticle";
import { listCatalogue } from "@/lib/api";
import { glossaryEntry, glossaryPath } from "@/lib/glossary";
import { socialCard } from "@/lib/site";

/**
 * One glossary term: `/glossary/crna`, `/glossary/physiatrist`... one page per profession and per
 * set of credential letters.
 *
 * Two gates, and both matter:
 *
 * 1. A term this glossary does not explain is a 404. The copy is the page, so there is nothing to
 *    improvise for a URL somebody invents.
 * 2. A specialty whose list the platform does not publish is also a 404. That is what keeps the
 *    family honest: every specialty page has a list with real records behind it, on the same floor
 *    the list pages use. Credential letters are exempt, because MD is worth a page whether or not
 *    one list happens to correspond to it.
 *
 * When the platform cannot be reached at all, neither gate fires and the page renders its
 * explanation with no figures on it - which is the right outcome for a reference page and the
 * reason this is not `generateStaticParams`'d into the build, where there is no API to call.
 * Cached for a day, like the list pages.
 *
 * The catalogue is read beside the entry's own list because the article links other terms, and the
 * second gate above applies to those pages too: a "closely related" specialty whose list is not
 * published is a link to a 404. The published taxonomy slugs are what the hub and the sitemap
 * predict that gate with, so they are what is passed down - one more cached read a day, and the
 * same answer as everywhere else rather than a second rule.
 */

export const revalidate = 86_400;

type Props = { params: Promise<{ term: string }> };

async function resolve(term: string) {
  const entry = glossaryEntry(term);
  if (!entry) return null;
  const [counts, catalogue] = await Promise.all([
    glossaryCounts(entry),
    listCatalogue().catch(() => null),
  ]);
  if (entry.kind === "specialty" && counts.state === "none") return null;
  // Null when the catalogue could not be read, and then the article links no other term at all -
  // see `glossaryLinkable`.
  const published = catalogue ? new Set(catalogue.taxonomies.map((list) => list.slug)) : null;
  return { entry, counts, published };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { term } = await params;
  const resolved = await resolve(term);
  if (!resolved) return { title: "Not found", robots: { index: false } };
  const { entry } = resolved;
  const path = glossaryPath(entry.term);
  return {
    title: entry.title,
    description: entry.description,
    alternates: { canonical: path },
    openGraph: socialCard(path, entry.title, entry.description),
  };
}

export default async function GlossaryTermPage({ params }: Props) {
  const { term } = await params;
  const resolved = await resolve(term);
  if (!resolved) notFound();
  return (
    <GlossaryArticle
      entry={resolved.entry}
      counts={resolved.counts}
      published={resolved.published}
    />
  );
}

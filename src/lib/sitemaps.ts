/**
 * How the sitemaps are split. One place, because three files need the same answer: the facility
 * sitemaps themselves, the sitemap index that lists them, and nothing else may guess.
 *
 *   /sitemap-index.xml          the index robots.txt points at
 *   /sitemap.xml                site pages, directory hubs, specialty-by-metro, facility
 *                               directory pages by kind, state and town
 *   /facility/sitemap/<n>.xml   facility profiles, `FACILITY_CHUNK` a file
 *   /lists/sitemap/<n>.xml      list pages (taxonomy and facility type, national and by state)
 *                               and health-system pages, `LIST_CHUNK` a file
 *
 * Google takes 50,000 URLs a sitemap. A facility chunk is 10,000 - one API call each - so the
 * files stay small and each is one read of the platform. Provider pages are not listed: nine
 * million URLs is a crawl budget question, and the A-Z directory already reaches every one of
 * them within a few links.
 *
 * On `lastmod`
 * ------------
 * A `lastmod` is a promise, and a sitemap that promises every URL changed today is a sitemap a
 * crawler learns to ignore - which costs us the one thing the file is for. So a URL here carries
 * a date only where the platform gives one: the day it last recomputed the numbers the page is
 * made of. Where there is no such date the field is left out, which the sitemap protocol allows
 * and which says "we do not know" instead of guessing.
 */

import "server-only";
import { facilityIndex, healthSystemSlugs, listCatalogue } from "@/lib/api";
import { listPath, systemPath } from "@/lib/lists";

/** A URL for a sitemap: a path, and the day the data behind it was last recomputed if known. */
export type SitemapEntry = { path: string; lastModified?: string };

/** `YYYY-MM-DD` from whatever the API returned, or undefined when it returned nothing. */
function day(value: string | null | undefined): string | undefined {
  return value ? value.slice(0, 10) : undefined;
}

export const FACILITY_CHUNK = 10_000;

/** Facility sitemaps to publish. When the API cannot be reached, a guess that covers today's
 * volume, so a sitemap build never fails for want of a count. */
export async function facilitySitemapCount(): Promise<number> {
  try {
    const page = await facilityIndex(1, 1);
    return Math.max(1, Math.ceil(page.total / FACILITY_CHUNK));
  } catch {
    return 12;
  }
}

/** Under Google's 50,000 with room to grow; today's list pages fit in one file. */
export const LIST_CHUNK = 40_000;

/**
 * Every list and health-system page, in a stable order: two API calls. Only what clears the floor
 * is returned by the platform, so every URL here is a page with substance. An API failure yields
 * no URLs rather than a failed sitemap.
 *
 * A list page carries the refresh date of the nightly summary it is built from - the whole page is
 * those counts, so that date is the page's date - and none at all when the platform did not report
 * one.
 *
 * The systems come from the health-system endpoint the `/systems` pages themselves read, which
 * leaves out systems folded into another one and systems no longer on file. So a slug that only
 * answers a permanent redirect can never reach a sitemap, which is the whole reason to enumerate
 * them from the same place the pages are built from. That endpoint reports no refresh date, so a
 * system URL carries no `lastmod` rather than borrowing one from somewhere else.
 */
export async function listSitemapPaths(): Promise<SitemapEntry[]> {
  const [catalogue, systems] = await Promise.all([
    listCatalogue().catch(() => null),
    healthSystemSlugs().catch(() => [] as string[]),
  ]);
  const lists = day(catalogue?.refreshed_at);
  const paths: SitemapEntry[] = [];
  for (const list of [...(catalogue?.facility_types ?? []), ...(catalogue?.taxonomies ?? [])]) {
    paths.push({ path: listPath(list.slug), lastModified: lists });
    for (const state of list.states) {
      paths.push({ path: listPath(list.slug, state), lastModified: lists });
    }
  }
  for (const slug of systems) paths.push({ path: systemPath(slug) });
  return paths;
}

/**
 * The refresh date the site sitemap needs for its data-driven hub, `/lists` - the same cached call
 * the hub itself makes, so asking for it here costs the platform nothing. Never throws: a hub
 * whose date cannot be read is listed without one.
 *
 * `/systems` is not here. It is built from the health-system endpoint, which publishes no refresh
 * date, and a `lastmod` is a promise: the hub is listed without one rather than carrying the
 * unrelated chain summary's date.
 */
export async function hubRefreshed(): Promise<{ lists?: string }> {
  const catalogue = await listCatalogue().catch(() => null);
  return { lists: day(catalogue?.refreshed_at) };
}

export async function listSitemapCount(): Promise<number> {
  // Counted at build, where the API cannot be reached: fall back to an upper bound, as the facility
  // count does. A sitemap id past the data answers an empty sitemap, which is harmless.
  try {
    return Math.max(1, Math.ceil((await listSitemapPaths()).length / LIST_CHUNK));
  } catch {
    return 3;
  }
}

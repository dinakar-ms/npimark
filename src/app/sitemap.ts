import { connection } from "next/server";
import type { MetadataRoute } from "next";
import { facilityPlaces, listCatalogue } from "@/lib/api";
import { AUDIENCES } from "@/lib/audiences";
import { FACILITY_KINDS, MIN_CITY, kindPath } from "@/lib/facilities";
import { directoryCombinations, specialtyPath } from "@/lib/geo";
import { GLOSSARY, glossaryPath, glossaryTermIsListed } from "@/lib/glossary";
import { HELP_PAGES, helpPath } from "@/lib/help";
import { ROLE_PAGES, roleIndex, rolePath } from "@/lib/roles";
import { siteUrl, stateName } from "@/lib/site";
import { isDraft } from "@/lib/draft";
import { hubRefreshed } from "@/lib/sitemaps";

/**
 * The site sitemap: the pages of the site, the directory hubs, specialty-by-metro, the glossary,
 * and the facility directory by kind, state and town, and the leadership role pages - every one a
 * page with rows behind it. Facility profiles and list pages have their own split sitemaps
 * (`app/facility/sitemap.ts`, `app/lists/sitemap.ts`), and `/sitemap-index.xml` lists them all;
 * see `lib/sitemaps.ts` for the layout.
 *
 * The A-Z lists its hubs and letters only. Below a letter the tree is a few thousand prefix
 * pages whose shape moves with every weekly load, and crawlers reach them from the letter pages
 * in a few links; listing them would mean walking the whole tree to write this file.
 *
 * Nothing here claims a `lastmod` it cannot stand behind. Every URL used to carry the moment the
 * file was generated, which said "all of this changed today" on every regeneration - the fastest
 * way to teach a crawler that our dates mean nothing. Now a date appears only where the platform
 * reports one: the leadership pages carry the day their counts were recomputed, the two
 * data-driven hubs carry their summary's refresh date, and everything else - the pages whose
 * content is in this repository, the A-Z, the facility directory, specialty-by-metro - carries
 * none, because no per-page date exists to read. See `lib/sitemaps.ts`.
 */
// Rendered when first requested, not at build: the build has no API to call (the image is built
// where the API is not reachable), and a page baked without its data would serve that for a day.
// The API responses inside stay cached for a day by `call()` in lib/api.ts.

type Entry = MetadataRoute.Sitemap[number];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  /** A URL. `lastModified` is passed only by the families that have a real date to give. */
  const entry = (
    path: string,
    priority: number,
    changeFrequency: Entry["changeFrequency"],
    lastModified?: string,
  ): Entry | null =>
    // A page still printing an internal note is not submitted. `lib/draft.ts` holds the list and
    // the same signal sets the page's own `noindex`, so the sitemap and the page cannot disagree.
    // The drop lives here rather than at each call site because a call site can forget.
    isDraft(path)
      ? null
      : {
          url: siteUrl(path),
          ...(lastModified ? { lastModified } : {}),
          changeFrequency,
          priority,
        };

  /** Drops the nulls `entry` returns for draft pages. */
  const listed = (entries: readonly (Entry | null)[]): Entry[] =>
    entries.filter((e): e is Entry => e !== null);

  // The refresh date of the hub that is entirely made of platform counts. Never throws.
  // `/systems` is built from the health-system endpoint, which publishes no refresh date, so it
  // is listed without a `lastmod` rather than with a borrowed one.
  const hubs = await hubRefreshed();

  const directory = directoryCombinations().map(({ specialty, metro }) =>
    entry(specialtyPath(specialty, metro), 0.7, "weekly"),
  );

  const letters = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
  const aToZ = (["providers", "organizations"] as const).flatMap((kind) => [
    entry(`/directory/${kind}`, 0.7, "weekly"),
    ...letters.map((letter) => entry(`/directory/${kind}/${letter.toLowerCase()}`, 0.5, "weekly")),
  ]);

  // One call a kind for every town in the country. A kind the API cannot answer for today keeps
  // its index page and loses its state and town pages until the next regeneration, rather than
  // failing the whole sitemap.
  const facilities = (
    await Promise.all(
      FACILITY_KINDS.map(async (kind) => {
        const index = entry(kindPath(kind), 0.8, "monthly");
        try {
          const towns = (await facilityPlaces(kind.type, { by: "city" })).filter((p) =>
            stateName(p.state),
          );
          const states = [...new Set(towns.map((p) => p.state))];
          return [
            index,
            ...states.map((state) => entry(kindPath(kind, state), 0.7, "monthly")),
            ...towns
              .filter((p) => p.city && p.count >= MIN_CITY)
              .map((p) => entry(kindPath(kind, p.state, p.city ?? ""), 0.6, "monthly")),
          ];
        } catch {
          return [index];
        }
      }),
    )
  ).flat();

  // The glossary. Sixty-odd pages fit here rather than in a sitemap of their own - the split files
  // exist for the families that run to tens of thousands. Which terms may be listed is
  // `glossaryTermIsListed`, the same rule the hub links by: one question, one answer, and the
  // catalogue below is the authoritative list for both.
  const published = await listCatalogue()
    .then((catalogue) => new Set(catalogue.taxonomies.map((list) => list.slug)))
    .catch(() => null);
  const glossary = [
    entry(glossaryPath(), 0.8, "monthly"),
    ...GLOSSARY.filter((term) => glossaryTermIsListed(term, published)).map((term) =>
      entry(glossaryPath(term.term), 0.7, "monthly"),
    ),
  ];

  // The leadership role pages, from the one call that builds them: exactly the combinations the
  // API publishes above its floor, so every URL here is a page and none is a 404. If the API
  // cannot answer today they drop out until the next regeneration.
  let leadership: (Entry | null)[] = [];
  try {
    const index = await roleIndex();
    // Every leadership page is a view of these counts, so the day the platform recomputed them is
    // the day the page could have changed. Absent when the platform did not report one.
    const on = index.refreshedAt ?? undefined;
    const pages: (Entry | null)[] = [];
    for (const role of ROLE_PAGES) {
      const kinds = FACILITY_KINDS.filter((kind) => index.get(role.key, kind.type));
      if (kinds.length === 0) continue;
      pages.push(entry(rolePath(role), 0.7, "weekly", on));
      for (const kind of kinds) {
        pages.push(entry(rolePath(role, kind), 0.7, "weekly", on));
        for (const cell of index.cells) {
          if (
            cell.role === role.key &&
            cell.facility_type === kind.type &&
            cell.state &&
            stateName(cell.state)
          ) {
            pages.push(entry(rolePath(role, kind, cell.state), 0.6, "weekly", on));
          }
        }
      }
    }
    if (pages.length > 0) leadership = [entry("/leadership", 0.8, "weekly", on), ...pages];
  } catch {
    leadership = [];
  }

  return listed([
    entry("/", 1, "weekly"),
    entry("/search", 0.9, "weekly"),
    // Every audience landing page, from the one list they are all built from, so a page added
    // there cannot be a page missing from here.
    ...AUDIENCES.map((audience) => entry(`/${audience.slug}`, 0.9, "weekly")),
    entry("/intent-data", 0.9, "weekly"),
    entry("/ehr-data", 0.9, "weekly"),
    entry("/idn-data", 0.7, "monthly"),
    entry("/pbm-data", 0.6, "monthly"),
    entry("/mcp", 0.6, "monthly"),
    entry("/mobile-app", 0.6, "monthly"),
    entry("/data", 0.8, "monthly"),
    // The measured bounce rate. Monthly because the measurement behind it is monthly, and
    // it is the page a buyer searching for "healthcare email list bounce rate" should land
    // on rather than a competitor's adjective.
    entry("/data/deliverability", 0.8, "monthly"),
    // The field reference. Its content is in this repository, so it has no refresh date to give.
    entry("/fields", 0.8, "monthly"),
    // The help hub and its pages, from the list the pages themselves are registered in.
    entry("/help", 0.8, "monthly"),
    ...HELP_PAGES.map((page) => entry(helpPath(page.slug), 0.6, "monthly")),
    entry("/tour", 0.5, "monthly"),
    entry("/bulk-data", 0.7, "monthly"),
    entry("/pricing", 0.7, "monthly"),
    entry("/docs/api", 0.6, "monthly"),
    // The company pages. They change when the company does, which is not weekly.
    entry("/why-npi-mark", 0.7, "monthly"),
    entry("/about", 0.6, "monthly"),
    entry("/security", 0.6, "monthly"),
    // Listed so that searching for our status finds our own page rather than a forum thread.
    // No `lastmod`: the page is about right now, and a date on it would be read as staleness.
    entry("/status", 0.5, "daily"),
    entry("/contact", 0.5, "monthly"),
    entry("/terms", 0.3, "monthly"),
    entry("/privacy", 0.3, "monthly"),
    entry("/privacy-choices", 0.4, "monthly"),
    entry("/remove-my-information", 0.4, "monthly"),
    // The form only. Its results live at a token, expire, and are disallowed in robots.txt.
    entry("/test-your-list", 0.9, "monthly"),
    entry("/report-a-problem", 0.4, "monthly"),
    entry("/directory", 0.8, "weekly"),
    // These two hubs are nothing but platform counts, so their summary's refresh date is theirs.
    entry("/lists", 0.9, "weekly", hubs.lists),
    entry("/systems", 0.8, "weekly"),
    ...glossary,
    ...aToZ,
    ...facilities,
    ...leadership,
    ...directory,
  ]);
}

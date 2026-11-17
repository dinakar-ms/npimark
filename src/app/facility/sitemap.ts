import { connection } from "next/server";
import type { MetadataRoute } from "next";
import { facilityIndex } from "@/lib/api";
import { facilityPath } from "@/lib/facilities";
import { siteUrl } from "@/lib/site";
import { FACILITY_CHUNK, facilitySitemapCount } from "@/lib/sitemaps";

/**
 * Facility profiles, `FACILITY_CHUNK` to a file: `/facility/sitemap/<n>.xml`. Each file is one
 * API call over the facilities in CCN order. Listed in `/sitemap-index.xml`.
 */
// Rendered when first requested, not at build: the build has no API to call (the image is built
// where the API is not reachable), and a page baked without its data would serve that for a day.
// The API responses inside stay cached for a day by `call()` in lib/api.ts.

export async function generateSitemaps() {
  const count = await facilitySitemapCount();
  return Array.from({ length: count }, (_, id) => ({ id }));
}

export default async function sitemap(props: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  await connection();
  const id = Number(await props.id);
  // Shape *and* magnitude. `connection()` above means an id outside `generateSitemaps()` is
  // rendered on demand rather than 404'd, and each distinct id is a cache key of its own - so
  // without an upper bound a visitor can walk `/facility/sitemap/<any number>.xml` and turn
  // each one into a fresh call on the site's shared API key. `Number.isInteger` is also true of
  // `1e21`, which reaches the API as the string "1e+21" rather than a page number. The bound is
  // what makes the page number one we chose instead of one they did.
  if (!Number.isSafeInteger(id) || id < 0 || id >= (await facilitySitemapCount())) return [];
  // Deliberately not caught. The whole content of this file is that one call, so a swallowed
  // failure does not degrade the file - it replaces it with a different claim. On 19 October 2026
  // all twelve of these chunks answered 200 with zero URLs while the site's row allowance was
  // exhausted, and `/sitemap-index.xml` went on advertising all twelve: we spent a morning telling
  // Google we hold no facility profiles at all. A 500 here says "ask again", which is true and
  // which a crawler already knows how to handle. An empty 200 says "they are gone", which is not.
  //
  // The mixed sitemap in `../sitemap.ts` keeps its own catches on purpose: one family failing there
  // must not drop the six thousand URLs the other families contributed. Here there is no other
  // family.
  const page = await facilityIndex(id + 1, FACILITY_CHUNK);
  return page.items.map((f) => ({
    url: siteUrl(facilityPath(f)),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
}

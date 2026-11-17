import { connection } from "next/server";
import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { LIST_CHUNK, listSitemapCount, listSitemapPaths } from "@/lib/sitemaps";

/**
 * List and health-system pages, `LIST_CHUNK` to a file: `/lists/sitemap/<n>.xml`. Built from the
 * list catalogue and the health-system list - only pages at or above their floors, and only systems
 * still on file and not folded into another, so a slug that merely redirects is never listed.
 * Listed in `/sitemap-index.xml`.
 */
// Rendered when first requested, not at build: the build has no API to call (the image is built
// where the API is not reachable), and a page baked without its data would serve that for a day.
// The API responses inside stay cached for a day by `call()` in lib/api.ts.

export async function generateSitemaps() {
  const count = await listSitemapCount();
  return Array.from({ length: count }, (_, id) => ({ id }));
}

export default async function sitemap(props: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  await connection();
  const id = Number(await props.id);
  if (!Number.isInteger(id) || id < 0) return [];
  const paths = await listSitemapPaths();
  // `lastModified` is the day the platform last recomputed the counts the page is made of, and is
  // absent when it did not report one - never today's date. See the note in lib/sitemaps.ts.
  return paths.slice(id * LIST_CHUNK, (id + 1) * LIST_CHUNK).map(({ path, lastModified }) => ({
    url: siteUrl(path),
    ...(lastModified ? { lastModified } : {}),
    changeFrequency: "weekly" as const,
    priority: path.split("/").length > 3 ? 0.6 : 0.7,
  }));
}

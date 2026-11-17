import { connection } from "next/server";
import { siteUrl } from "@/lib/site";
import { facilitySitemapCount, listSitemapCount } from "@/lib/sitemaps";

/**
 * The sitemap index robots.txt points at: the site sitemap, every facility sitemap and every
 * list sitemap. Next
 * writes the individual sitemaps; it does not write an index for split ones, so this does.
 */

function escape(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function GET(): Promise<Response> {
  // The real file counts, read when asked - at build there is no API to count from.
  await connection();
  const [count, lists] = await Promise.all([facilitySitemapCount(), listSitemapCount()]);
  const urls = [
    siteUrl("/sitemap.xml"),
    ...Array.from({ length: count }, (_, id) => siteUrl(`/facility/sitemap/${id}.xml`)),
    ...Array.from({ length: lists }, (_, id) => siteUrl(`/lists/sitemap/${id}.xml`)),
  ];
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((url) => `  <sitemap><loc>${escape(url)}</loc></sitemap>`),
    "</sitemapindex>",
    "",
  ].join("\n");
  return new Response(body, { headers: { "content-type": "application/xml; charset=utf-8" } });
}

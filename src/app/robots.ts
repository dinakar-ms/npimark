import { connection } from "next/server";
import type { MetadataRoute } from "next";

/**
 * Indexing is off unless somebody turns it on.
 *
 * A preview build carries the same pages as production, and a crawler cannot tell them apart.
 * Getting the preview host indexed would spend the domain's first impression on a URL nobody
 * intends to keep, so `SITE_INDEXABLE=true` is an explicit decision made once, at launch, on
 * the host that is meant to be found.
 *
 * Even then, the signed-in app, the auth pages and the API routes are never for crawlers.
 *
 * Read when asked, not when built - `connection()`, the same marker the sitemaps carry. Both of
 * the settings below live in the container's environment (`infra/site.env`, the deploy's `.env`)
 * and neither exists in the image build, which happens in CI. A robots.txt decided at build time
 * would say "Disallow: /" for the life of the image, and turning the switch on at the host would
 * change nothing: the one file that governs whether the site can be found would be the one file
 * the switch could not reach. It is one small text response per request, and it is the difference
 * between a switch and a decoration.
 */
const PRIVATE_PATHS = [
          "/app",
          "/app/",
          "/api/",
          "/launch-control",
          // The container liveness probe. Nothing to index, and a crawler fetching it tells us
          // nothing about whether the process is alive.
          "/healthz",
          "/sign-in",
          "/sign-up",
          "/forgot",
          "/search?",
          // Every page reached by a one-time link in an email. A crawler that fetches one
          // spends somebody's token, and a URL carrying a live token has no business in an
          // index. The forms these confirm are indexable; the confirmations are not. They
          // live in one list so the next token page joins them here.
          "/remove-my-information/confirm",
          "/report-a-problem/confirm",
          // A saved coverage report. The form at `/test-your-list` is indexable and is meant to
          // be found; a result belongs to whoever ran the list, is about one anonymous segment,
          // and expires - so the pages under it are for the person holding the link.
          "/test-your-list/",
          // These carry one as well, which is why they are noindex on the page too: an
          // invitation can be used once, an unsubscribe link belongs to one mailbox, and a
          // verification or reset link is spent the first time it is fetched.
          "/invite/",
          "/email-preferences",
          "/verify-email",
          "/reset-password",
        ];

export default async function robots(): Promise<MetadataRoute.Robots> {
  await connection();
  const indexable = process.env.SITE_INDEXABLE === "true";
  if (!indexable) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  const base = (process.env.SITE_BASE_URL ?? "").replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
      {
        // Crawlers that walk the provider profiles need a pace, and these ask politely.
        //
        // On 21 October ClaudeBot alone fetched 3,859 pages in one log window - 64% of all
        // traffic to the site - almost entirely /npi/*, with AhrefsBot and Googlebot behind
        // it. 88% of requests were declared bots and 27 of 5,986 were assets, so this is
        // crawling rather than browsing. Nothing was hostile: robots.txt said "Allow: /" with
        // no pace at all, and they took us at our word. Each of those pages is rendered server
        // side against the provider API, and at that rate the renders reached 60-125 seconds
        // and the site returned 502 to real visitors.
        //
        // Crawl-delay is honoured by ClaudeBot, AhrefsBot and Bingbot, and ignored by
        // Googlebot - which is fine, because Google's own share was 289 requests and was never
        // the problem. Google's rate is set in Search Console, not here.
        //
        // Listed per agent rather than on "*" because a delay on the wildcard also slows the
        // crawlers we want: a feed reader or a link checker fetching one page should not wait.
        userAgent: ["ClaudeBot", "AhrefsBot", "SemrushBot", "MJ12bot", "DotBot", "Bytespider", "GPTBot", "CCBot", "PetalBot", "Amazonbot"],
        allow: "/",
        crawlDelay: 10,
        disallow: PRIVATE_PATHS,
      },
    ],
    // The index lists the site sitemap and every facility sitemap (see lib/sitemaps.ts).
    sitemap: base ? `${base}/sitemap-index.xml` : undefined,
  };
}

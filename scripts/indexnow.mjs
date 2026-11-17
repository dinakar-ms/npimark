#!/usr/bin/env node
/**
 * Announce this site's fixed pages and its sitemaps to IndexNow.
 *
 * Run deliberately, once per release - `infra/deploy/deploy.sh` calls it inside the site
 * container after the new version is up and answering - never on a request. Submitting on a
 * request would mean a page view could spend the quota, and a crawler could spend it in bulk.
 *
 *   node scripts/indexnow.mjs            submit
 *   node scripts/indexnow.mjs --dry-run  print exactly what would be submitted, send nothing
 *   node scripts/indexnow.mjs --origin http://127.0.0.1:3000
 *
 * What it submits, and why not more:
 *
 *   - Every page of the site whose URL is written in the code rather than in the data: the home
 *     page, the audience landing pages, the directory and list hubs, the facility family index
 *     pages, the help pages, the API reference, the legal pages. These are the pages a release
 *     can actually have changed, and there are a few dozen of them.
 *   - The sitemap index and every sitemap in it. An engine that takes a sitemap URL re-reads that
 *     file and picks the changed URLs out of it itself, which is the only honest way to say "some
 *     of nine million provider pages moved" without naming nine million URLs.
 *
 * It deliberately does not submit the millions of data-driven URLs. IndexNow is a hint, not a
 * queue: a host that submits its whole sitemap as URLs every release is a host whose hints stop
 * being read, and we would be claiming a change we have not established for each one.
 *
 * It never fails a deploy. Every problem - no key, indexing off, no sitemap, a 500 from the
 * endpoint - is one log line and exit 0.
 */

const ENDPOINT = "https://api.indexnow.org/indexnow";
/** What the endpoint takes in one request; mirrored from src/lib/indexnow.ts. */
const MAX_URLS = 10_000;
/** The protocol's own rule for a key; mirrored from src/lib/indexnow.ts. */
const KEY_SHAPE = /^[A-Za-z0-9-]{8,128}$/;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const originArg = (() => {
  const at = args.indexOf("--origin");
  return at >= 0 ? args[at + 1] : undefined;
})();

function log(message) {
  process.stdout.write(`indexnow: ${message}\n`);
}

/** Every `<loc>` in a sitemap or sitemap index, in the order the file lists them. */
function locations(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) =>
    loc.trim().replace(/&amp;/g, "&"),
  );
}

/**
 * Whether a path is one of the site's own pages rather than a page that exists because a row
 * does. A fixed page is at the root, or under /help, or one of the two A-Z hubs, or the API
 * reference - everything deeper than that is a state, a town, a name prefix or a list.
 */
function isFixedPage(path) {
  if (path === "/" || /^\/[^/]+$/.test(path)) return true;
  if (path === "/docs/api") return true;
  if (path.startsWith("/help/")) return true;
  return path === "/directory/providers" || path === "/directory/organizations";
}

async function read(url) {
  const response = await fetch(url, { headers: { Accept: "application/xml" } });
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  return await response.text();
}

async function submit(host, key, keyLocation, urlList) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host, key, keyLocation, urlList }),
  });
  // 200 accepted, 202 accepted but the key is still being validated. Anything else is worth
  // reading: 403 is a key file that does not match, 422 a URL that is not on this host.
  const detail = response.ok ? "" : ` ${(await response.text()).slice(0, 200).trim()}`;
  log(`${urlList.length} URL(s) -> ${response.status} ${response.statusText}${detail}`);
}

async function main() {
  if (process.env.SITE_INDEXABLE !== "true") {
    log("SITE_INDEXABLE is not true; this host is not meant to be found. Nothing submitted.");
    return;
  }

  const key = (process.env.INDEXNOW_KEY ?? "").trim();
  if (!KEY_SHAPE.test(key)) {
    log(
      key
        ? "INDEXNOW_KEY is not 8-128 characters of letters, digits and dashes. Nothing submitted."
        : "INDEXNOW_KEY is not set, so IndexNow is off. Nothing submitted.",
    );
    return;
  }

  const base = (process.env.SITE_BASE_URL ?? "").trim().replace(/\/$/, "");
  let site;
  try {
    site = new URL(base);
  } catch {
    log("SITE_BASE_URL is not an absolute URL. Nothing submitted.");
    return;
  }

  // Where to read the sitemaps from. Inside the container that is the site's own port: the public
  // hostname resolves to the edge, which this container may not be able to reach, and asking
  // ourselves is both faster and exactly the bytes a crawler would get.
  const origin = (originArg ?? process.env.INDEXNOW_ORIGIN ?? `http://127.0.0.1:${process.env.PORT ?? 3000}`)
    .replace(/\/$/, "");

  const index = await read(`${origin}/sitemap-index.xml`);
  const sitemaps = locations(index);
  if (sitemaps.length === 0) throw new Error("the sitemap index listed no sitemaps");

  // The site sitemap is the first entry and the only one with the fixed pages in it.
  const siteSitemap = sitemaps.find((url) => url.endsWith("/sitemap.xml")) ?? sitemaps[0];
  const fixed = locations(await read(siteSitemap.replace(base, origin))).filter((url) => {
    try {
      const parsed = new URL(url);
      return parsed.origin === site.origin && isFixedPage(parsed.pathname);
    } catch {
      return false;
    }
  });

  const urls = [...new Set([`${base}/`, ...fixed, `${base}/sitemap-index.xml`, ...sitemaps])].filter(
    (url) => url.startsWith(`${site.origin}/`),
  );

  log(
    `${fixed.length} fixed page(s) and ${sitemaps.length} sitemap(s) from ${origin}; ` +
      `${urls.length} URL(s) to submit as ${site.host}`,
  );
  if (dryRun) {
    for (const url of urls) process.stdout.write(`  ${url}\n`);
    log("--dry-run: nothing submitted.");
    return;
  }

  const keyLocation = `${base}/${key}.txt`;
  for (let at = 0; at < urls.length; at += MAX_URLS) {
    await submit(site.host, key, keyLocation, urls.slice(at, at + MAX_URLS));
  }
}

// A release is never failed by this. The engines will crawl on their own schedule if a hint is
// lost; a deploy that rolls back because a third party answered 500 is the worse outcome.
try {
  await main();
} catch (error) {
  log(`not submitted: ${error instanceof Error ? error.message : String(error)}`);
}

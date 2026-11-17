#!/usr/bin/env node
/**
 * Every public page is either cacheable at the edge or listed here with a reason.
 *
 * `next.config.ts` decides which paths get `s-maxage`, and it got this wrong twice in one day.
 * First every public page answered `private, no-store`, because thirty of them call
 * `connection()` to render at request time and Next then marks the response uncacheable - 101 of
 * the page routes, which nobody noticed until the Cloudflare rule went in and cached almost
 * nothing. Then the fix named the landings and missed their children: `source: "/:path(hospitals|
 * nursing-homes|...)"` matches one segment, so `/hospitals` was cached and `/hospitals/tx/dallas`
 * was not. Measured against the live sitemap on 2026-10-06, that second mistake left 5,491 of
 * 6,258 URLs uncached - the whole long tail, which is the whole point.
 *
 * Neither mistake could fail a test, because both produced a correct page. The only signal was a
 * response header on production, and the only way anyone saw it was going and looking.
 *
 * So: this script walks the page routes on disk, reads the two lists out of `next.config.ts`, and
 * requires every public route to be covered by one of them or named in NEVER below. A new page
 * cannot be added silently uncacheable, and - the direction that actually matters - a page that is
 * addressed to one recipient cannot be added silently cacheable, because a shared cache would
 * hand their page to the next visitor.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = dirname(dirname(fileURLToPath(import.meta.url)));
const APP = join(SITE, "src", "app");

/**
 * Public routes that must never carry a shared-cache header, and why. A route matches if it is
 * this path or sits under it.
 *
 * The test is not "does it look private" but "could two visitors be served different bytes" -
 * which is why the forms are here even though none of them renders a token today.
 */
const NEVER = {
  "products/clinician-intelligence": "development preview is noindex; do not retain a launch-status draft at the edge",
  "connect": "account-specific OAuth consent and authorization parameters; never shared-cache",
  "bulk-data": "quote form prefilled from a visitor query; never shared-cache",
  leadership: "live directory recovery must not be shared-cached",
  "hospitals": "live data or recovery output must never be shared-cached",
  "nursing-homes": "live data or recovery output must never be shared-cached",
  "hospices": "live data or recovery output must never be shared-cached",
  "home-health-agencies": "live data or recovery output must never be shared-cached",
  "dialysis-centers": "live data or recovery output must never be shared-cached",
  "systems": "live data or recovery output must never be shared-cached",

  // The launch console: it shows live launch state and is only for an authorised
  // operator, so two visitors can never be served the same bytes.
  "launch-control":
    "authenticated operator controls and live launch state; never shared-cache",
  // The four families that answer a refused read with a recovery page rather than a 500. The
  // reason is the recovery page, not the error: it carries `noindex`, and cached for an hour it
  // would tell every crawler to drop a page we want indexed. Each also sets `revalidate = 0`
  // against Next's own route cache; the two halves belong together.
  specialty: "request-time directory recovery must not be retained by shared caches",
  npi: "request-time directory recovery must not be retained by shared caches",
  facility: "request-time directory recovery must not be retained by shared caches",
  directory: "request-time directory recovery must not be retained by shared caches",
  app: "the signed-in product; the origin sends private, no-store and this file never contradicts it",
  "sign-in": "sign-in state and the bot check",
  "sign-up": "sign-in state and the bot check",
  forgot: "sign-in state and the bot check",
  "reset-password": "carries a reset token",
  "verify-email": "carries a verification token",
  invite: "carries an invitation token",
  "email-preferences": "addressed to one recipient; a shared cache would hand their page to the next visitor",
  "test-your-list": "a result addressed to one recipient by token, and the form that mints it",
  search: "answers a query string, and a crawler can mint unlimited variants of it",
  contact: "a public form; no server-rendered token today, and nobody will remember this file the day one is added",
  "remove-my-information": "a public form, as above",
  "report-a-problem": "a public form, as above",
  status: "says whether the platform is up; a cached status page is a lie",
};

/** Pull a `const NAME = [ "a", "b" ];` list out of the config as text. */
function listFromConfig(source, name) {
  const match = source.match(new RegExp(`const ${name} = \\[([\\s\\S]*?)\\n {4}\\];`));
  if (!match) {
    console.error(
      `cache-headers: could not find \`const ${name}\` in next.config.ts.\n\n` +
        "This script reads those two lists as text. If the config was restructured, teach this\n" +
        "script the new shape - do not delete the check, because the mistake it catches does not\n" +
        "show up anywhere else until somebody reads a response header on production.",
    );
    process.exit(1);
  }
  return [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

/** Every page route under src/app, as a list of segments. */
function routes(dir, trail = [], out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      // A `_name` folder is excluded from routing altogether, so a page.tsx inside one is not a
      // route and must not be reported as an uncovered one.
      if (name.startsWith("_")) continue;
      // A route group `(name)` and a parallel-route slot `@name` do not appear in the URL.
      const hidden = name.startsWith("(") || name.startsWith("@");
      routes(path, hidden ? trail : [...trail, name], out);
    } else if (name === "page.tsx") {
      out.push({ segments: trail, file: relative(SITE, path).split(sep).join("/") });
    }
  }
  return out;
}

const config = readFileSync(join(SITE, "next.config.ts"), "utf8");
const leaves = new Set(listFromConfig(config, "LEAF_PAGES"));
const trees = new Set(listFromConfig(config, "TREES"));

// A list cannot be in both: a tree already covers its own landing, and naming it as a leaf too
// would mean two rules claim one path.
const both = [...leaves].filter((p) => trees.has(p));
if (both.length > 0) {
  console.error(`cache-headers: ${both.join(", ")} appear in both LEAF_PAGES and TREES.`);
  console.error("A tree's `:path*` already matches its landing, so the leaf entry is dead weight.");
  process.exit(1);
}

// Nothing may be cached that NEVER forbids. This is the direction that leaks data.
const forbidden = [...leaves, ...trees].filter((p) => p in NEVER ||
  (trees.has(p) && Object.keys(NEVER).some(path => path.startsWith(p + "/"))));
if (forbidden.length > 0) {
  console.error("cache-headers: these are cached by next.config.ts and forbidden here:\n");
  for (const p of forbidden) console.error(`  /${p}  - ${NEVER[p]}`);
  process.exit(1);
}

const uncovered = [];
for (const { segments, file } of routes(APP)) {
  if (segments.length === 0) continue; // the home page, prerendered and cached by the edge rule
  const [first] = segments;
  if (Object.keys(NEVER).some(path => segments.join("/") === path || segments.join("/").startsWith(path + "/"))) continue;
  if (trees.has(first)) continue;
  if (segments.length === 1 && leaves.has(first)) continue;
  uncovered.push({ path: "/" + segments.join("/"), file });
}

if (uncovered.length > 0) {
  console.error(
    `cache-headers: ${uncovered.length} public page route${uncovered.length === 1 ? "" : "s"} ` +
      "neither cached nor explained:\n",
  );
  for (const { path, file } of uncovered) console.error(`  ${path.padEnd(44)} ${file}`);
  console.error(
    "\nEach one needs a decision, not a default:\n" +
      "  * the same bytes for every visitor  -> add its tree to TREES in next.config.ts\n" +
      "    (use the tree, not the landing: `/:path(name)` does not match `/name/tx/dallas`)\n" +
      "  * a form, a token, or per-visitor    -> add it to NEVER in this script, with the reason",
  );
  process.exit(1);
}

console.log(
  `cache-headers: ${leaves.size} leaf pages and ${trees.size} trees cached, ` +
    `${Object.keys(NEVER).length} paths deliberately not.`,
);

/**
 * Every page that can render the recovery state, and what caches it.
 *
 * Four families answer a refused read with `DirectoryUnavailable` instead of an HTTP 500. That is
 * better for a visitor and it introduces a fault the 500 did not have: the recovery page carries
 * `noindex`, so anything that stores it goes on telling crawlers to drop a page we want indexed
 * after the platform has recovered. Two caches will do that, and each needs its own answer -
 * `export const revalidate = 0` for Next's route cache, `private, no-store` for shared caches.
 *
 * **The first version of this test only looked for `withDirectoryFallback(` inside page files, and
 * that was the wrong question.** Six trees - hospitals, nursing homes, hospices, home health,
 * dialysis centres and leadership, nineteen pages, roughly four and a half thousand of the
 * sitemap's six thousand URLs - render the same recovery page through `FacilityDirectory.tsx` and
 * `RoleDirectory.tsx`, where the wrapper is applied to the *component*. The guard reported four
 * trees and a clean pass while the largest instance of the fault sat outside what it looked at.
 * Measured on production: `/hospitals/tx` and `/nursing-homes/tx/dallas` both served
 * `noindex` + "Directory data is temporarily unavailable" with `s-maxage=3600`.
 *
 * So this follows the components too, and every affected tree must have an answer: either it is
 * uncached, or it is listed below with a reason somebody wrote down. A decision, not a default.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const SITE = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SRC = join(SITE, "src");
const APP = join(SRC, "app");

/**
 * Trees that may cache a recovery page, and why that is the better trade for them.
 *
 * Not a silence list. Each of these is a judgement that caching is worth more than the exposure,
 * and the exposure is real: during an outage the edge serves a cached `noindex` on these URLs for
 * up to `s-maxage`, which is an hour. The reasoning is that these six are the cached SEO surface
 * with genuine repeat traffic, where the four uncached families are enumerated by bots one id at a
 * time and get almost no cache value anyway - so the same change costs these trees something and
 * costs those nothing. The lever for these is **how long an outage lasts**, which is what the
 * `public_directory` and `row_allowance` checks are for.
 *
 * Changing one of these to uncached is a legitimate decision; delete its line and add the tree to
 * the no-store list in `next.config.ts` and `scripts/cache-headers.mjs`.
 */
const ACCEPTED_CACHED_RECOVERY = {};

function walk(dir, match, found = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, match, found);
    else if (match(entry)) found.push(full);
  }
  return found;
}

/**
 * Component exports wrapped in the fallback, so a page that imports one renders the recovery state
 * without mentioning the wrapper. Only `src/components/` - a page's own
 * `export const generateMetadata = withDirectoryMetadata(...)` is the direct case, not this one.
 */
function wrappedComponents() {
  const names = new Set();
  for (const file of walk(join(SRC, "components"), (e) => /\.tsx?$/.test(e))) {
    const source = readFileSync(file, "utf8");
    for (const m of source.matchAll(
      /export const (\w+) = withDirectory(?:Fallback|Metadata)\(/g,
    )) {
      if (m[1] !== "generateMetadata") names.add(m[1]);
    }
  }
  return names;
}

/** Every page that can render the recovery state, with how it gets there. */
function recoveryPages() {
  const components = wrappedComponents();
  const byImport = new RegExp(
    `import\\s*\\{[^}]*\\b(${[...components].join("|")})\\b[^}]*\\}`,
    "s",
  );
  const pages = [];
  for (const file of walk(APP, (e) => e === "page.tsx")) {
    const source = readFileSync(file, "utf8");
    const direct = source.includes("withDirectoryFallback(");
    const viaComponent = components.size > 0 && byImport.test(source);
    if (!direct && !viaComponent) continue;
    const rel = relative(APP, file).split(sep).join("/");
    pages.push({ page: rel, tree: rel.split("/")[0], how: direct ? "direct" : "component", file });
  }
  return pages;
}

/** The trees `next.config.ts` sends `private, no-store`. */
function noStoreTrees() {
  const config = readFileSync(join(SITE, "next.config.ts"), "utf8");
  const block = config.match(
    /\[([^\]]*)\]\.map\(\(tree\) => \(\{\s*source: `\/\$\{tree\}\/:path\*`,\s*headers: \[\{ key: "Cache-Control", value: "private, no-store" \}\]/,
  );
  assert.ok(
    block,
    "next.config.ts no longer maps a list of trees to `private, no-store`. If that rule was " +
      "rewritten, update this test - it is the only thing holding the halves together.",
  );
  return [...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

test("the scan finds the component-wrapped pages, not just the direct ones", () => {
  // The assertion that would have caught this test's own first version. If the component scan ever
  // silently finds nothing again, every tree below passes for the wrong reason.
  const pages = recoveryPages();
  assert.ok(pages.length > 0, "no page can render the recovery state; this test measures nothing.");
  const viaComponent = pages.filter((p) => p.how === "component");
  assert.ok(
    viaComponent.length > 0,
    "no page was found to render the recovery state through a wrapped component, but " +
      "FacilityDirectory.tsx and RoleDirectory.tsx apply the wrapper to components. The scan is " +
      "broken, which is exactly how the first version of this file passed while six trees were " +
      "serving a cached noindex.",
  );
});

test("an uncached recovery tree also opts out of Next's route cache", () => {
  const noStore = noStoreTrees();
  for (const { page, tree, file } of recoveryPages()) {
    if (!noStore.includes(tree)) continue;
    const source = readFileSync(file, "utf8");
    const match = source.match(/export const revalidate\s*=\s*([0-9_]+)/);
    assert.ok(match, `${page} is in an uncached tree and sets no revalidate; set it to 0.`);
    assert.equal(
      Number(match[1].replace(/_/g, "")),
      0,
      `${page} is sent no-store but caches its own output for ${match[1]} seconds. Both caches ` +
        "have to be answered or the recovery page survives in the one that was left.",
    );
  }
});

test("every recovery tree is either uncached or an accepted exception", () => {
  const noStore = noStoreTrees();
  const trees = [...new Set(recoveryPages().map((p) => p.tree))].sort();
  for (const tree of trees) {
    if (noStore.includes(tree)) continue;
    const reason = ACCEPTED_CACHED_RECOVERY[tree];
    assert.ok(
      reason && reason.length > 20,
      `/${tree}/* can render the recovery page and is cached, with no reason written down. ` +
        "During an outage the edge serves a noindex page on those URLs for up to an hour. Either " +
        "add the tree to the no-store list in next.config.ts and scripts/cache-headers.mjs, or " +
        "add it to ACCEPTED_CACHED_RECOVERY here with a sentence saying why caching wins.",
    );
  }
});

test("the accepted exceptions are all still recovery trees", () => {
  // Stops the list outliving what it describes: a tree that no longer renders the recovery page
  // does not need an exception, and leaving it here would make the next reader think it does.
  const trees = new Set(recoveryPages().map((p) => p.tree));
  for (const tree of Object.keys(ACCEPTED_CACHED_RECOVERY)) {
    assert.ok(
      trees.has(tree),
      `/${tree}/* is listed as an accepted cached-recovery tree but no page in it can render the ` +
        "recovery state any more. Remove the line.",
    );
  }
});

test("a tree sent no-store is not also sent the public cache header", () => {
  const config = readFileSync(join(SITE, "next.config.ts"), "utf8");
  const trees = config.match(/const TREES = \[([\s\S]*?)\n    \];/);
  assert.ok(trees, "next.config.ts no longer has a TREES list.");
  const cached = [...trees[1].matchAll(/^\s*"([^"]+)",/gm)].map((m) => m[1]);
  for (const tree of noStoreTrees()) {
    assert.equal(
      cached.includes(tree),
      false,
      `/${tree}/* is in TREES (public cache) and in the no-store list. One path, two ` +
        "Cache-Control rules, and which applies depends on their order in the returned array.",
    );
  }
});

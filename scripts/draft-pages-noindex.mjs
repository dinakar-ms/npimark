/**
 * The guard that keeps an unfinished page out of the search index.
 *
 * Why it is a test and not a promise
 * ----------------------------------
 * Two mechanisms deliberately print internal notes into a page. `OwnerNotes` renders
 * `[OWNER: ...]` wherever a company fact in `content/company.ts` is still a question, and
 * `LegalDocument` renders counsel's `[LAWYER: ...]` notes while `LEGAL_PAGES_APPROVED` is off.
 * Both are right: an unanswered question should be impossible to ignore.
 *
 * Neither was ever stopped from being indexed. Measured on production on 11 Oct 2026, before
 * `lib/draft.ts` existed: `/about` carried 10 owner notes, `/security` 6, `/contact` 6,
 * `/privacy` 30 counsel notes and `/terms` 20. Seventy-two internal notes on five pages that
 * robots.txt allowed, that carried no X-Robots-Tag, and that sat in the sitemap. One told any
 * reader which states we had applied to as a data broker and that none had been granted yet.
 *
 * Nobody did anything wrong; there was simply nothing connecting "this page is printing a
 * question" to "this page should not be found". This is that connection, and it is a guard
 * rather than a convention because the failure is silent: the page looks correct to whoever
 * opens it, and the only symptom is a search result weeks later that nobody is watching for.
 *
 * The rule
 * --------
 * A page that imports `OwnerNotes` or `LegalDocument` must spread `draftRobots("<its own route>")`
 * into its metadata, and that route must be registered in `DRAFT_PAGES` in `lib/draft.ts`. Four
 * things are checked, because each can be wrong on its own:
 *
 *   1. the call is there at all;
 *   2. the route it passes is the route the file actually serves — `draftRobots("/about")` sitting
 *      in `security/page.tsx` would read the wrong page's questions and index this one the moment
 *      *about's* were answered;
 *   3. the route is in the table, which is what `app/sitemap.ts` reads to decide what to submit.
 *      A page can be noindexed and still be in the sitemap; then we are asking a crawler to fetch
 *      something we immediately tell it to drop;
 *   4. the other direction — a route in the table with no page behind it, which silently drops a
 *      URL from the sitemap for a reason nobody would think to look for;
 *   5. and that the page's own draft banner is driven from the same entry. `/about` once passed
 *      five facts to `DraftNotice` while its prose asked a sixth question, so the banner
 *      undercounted the page. A banner built from its own literal list is a third list of the
 *      same thing, and three lists drift.
 *
 * `lib/draft` reads the same signal the page already uses to decide whether to print a note, so a
 * page cannot print one and be indexed at the same time, and it re-indexes itself the moment the
 * last question is answered.
 *
 * Runs with `npm run lint` and with `npm test`. No dependencies: node only.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const local = (relative) =>
  new URL(relative, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

const ROOT = local("../src/app/");
const DRAFT_MODULE = local("../src/lib/draft.ts");

/** Importing one of these means the page can render an internal note. */
const PRINTS_NOTES = ["@/components/OwnerNotes", "@/components/LegalDocument"];

/**
 * The routes registered in `DRAFT_PAGES`, read out of the source.
 *
 * Read rather than imported because that module pulls in `next` and the alias-resolved content
 * tree, and this script runs under bare node with neither. The table is a literal, so reading it
 * is honest; if its shape ever stops being one, this throws rather than quietly matching nothing.
 */
function registeredRoutes() {
  const source = readFileSync(DRAFT_MODULE, "utf8");
  const opened = source.indexOf("export const DRAFT_PAGES");
  const closed = source.indexOf("\n};", opened);
  if (opened === -1 || closed === -1) {
    throw new Error("draft-pages-noindex: cannot read DRAFT_PAGES out of src/lib/draft.ts");
  }
  const routes = new Set(
    [...source.slice(opened, closed).matchAll(/"(\/[^"]*)":/g)].map((match) => match[1]),
  );
  if (routes.size === 0) {
    throw new Error("draft-pages-noindex: DRAFT_PAGES parsed as empty, which cannot be right");
  }
  return routes;
}

function pages(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) out.push(...pages(path));
    else if (entry === "page.tsx") out.push(path);
  }
  return out;
}

function exists(path) {
  try {
    statSync(path);
    return true;
  } catch {
    return false;
  }
}

const routes = registeredRoutes();
const faults = [];
let guarded = 0;

for (const path of pages(ROOT)) {
  const source = readFileSync(path, "utf8");
  const prints = PRINTS_NOTES.filter((name) => source.includes(name));
  if (/className=["\']lawyer-note/.test(source)) {
    faults.push(`${path} renders internal counsel notes publicly`);
  }
  if (prints.length === 0) continue;
  guarded += 1;

  const route = "/" + path.slice(ROOT.length).replace(/\\/g, "/").replace(/\/?page\.tsx$/, "");
  const call = /\.\.\.draftRobots\(\s*"([^"]*)"\s*\)/.exec(source);

  if (!call) {
    faults.push(
      `${route} renders ${prints.join(" and ")} but does not spread ...draftRobots("${route}")` +
        " into its metadata",
    );
  } else if (call[1] !== route) {
    faults.push(
      `${route} passes draftRobots("${call[1]}") — a page must pass its own route, "${route}"`,
    );
  } else if (!routes.has(route)) {
    faults.push(`${route} calls draftRobots but is not registered in DRAFT_PAGES in lib/draft.ts`);
  }

  // The banner has to come from the same entry, not from a list written out again here.
  if (source.includes("<DraftNotice")) {
    // Whitespace-normalised and compared literally: a template-literal regex here lost its
    // escapes silently (`\s` is just `s` in a template literal) and passed everything.
    const flat = source.replace(/\s+/g, " ");
    if (!flat.includes(`<DraftNotice {...draftOf("${route}")}`)) {
      faults.push(
        `${route} builds its DraftNotice from its own list — write ` +
          `<DraftNotice {...draftOf("${route}")} /> so the banner, the robots meta and the ` +
          "sitemap count the same questions",
      );
    }
  }
}

for (const route of routes) {
  if (!exists(join(ROOT, ...route.slice(1).split("/"), "page.tsx"))) {
    faults.push(`DRAFT_PAGES lists ${route}, but there is no page at that route to be a draft`);
  }
}

if (faults.length > 0) {
  console.error("draft-pages-noindex: a page can print an internal note and still be found.\n");
  for (const fault of faults) console.error(`  ${fault}`);
  console.error(
    '\nEach such page spreads `...draftRobots("<its own route>")` into its metadata, and that' +
      "\nroute is registered in DRAFT_PAGES with the facts the page renders. See src/lib/draft.ts.",
  );
  process.exit(1);
}

console.log(
  `draft-pages-noindex: ${guarded} pages can print an internal note; while they do, each refuses ` +
    `indexing and all ${routes.size} drop out of the sitemap.`,
);

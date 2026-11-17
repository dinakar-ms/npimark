// Run with `npm test` (node --test; Node strips the types from the imported .ts files).
//
// The glossary is 60-odd pages of hand-written copy, and the things that break silently on a page
// like that are metadata lengths, a related term that points at nothing, and an audience link to a
// page that does not exist. All three are checkable, so they are checked here rather than found by
// a crawler.
import assert from "node:assert/strict";
import { test } from "node:test";
import { AUDIENCES } from "./audiences.ts";
import { DIRECTORY_SPECIALTIES } from "./geo.ts";
import {
  GLOSSARY,
  GLOSSARY_FAMILIES,
  METRO_LABELS,
  glossaryEntry,
  glossaryForList,
  glossaryLinkable,
  glossaryTermIsListed,
  relatedEntries,
} from "./glossary.ts";

/** The layout's title template is `%s · NPI Mark`, so a title has 60 less that suffix to live in. */
const TITLE_MAX = 60 - " · NPI Mark".length;

test("terms are unique, lower-case slugs", () => {
  const seen = new Set();
  for (const entry of GLOSSARY) {
    assert.match(entry.term, /^[a-z0-9]+(-[a-z0-9]+)*$/, entry.term);
    assert.equal(seen.has(entry.term), false, `duplicate term ${entry.term}`);
    seen.add(entry.term);
  }
});

test("titles fit a search result with the site suffix", () => {
  const seen = new Set();
  for (const entry of GLOSSARY) {
    assert.ok(entry.title.length <= TITLE_MAX, `${entry.term}: title is ${entry.title.length} characters`);
    assert.equal(seen.has(entry.title), false, `duplicate title ${entry.title}`);
    seen.add(entry.title);
  }
});

test("descriptions are 70 to 160 characters", () => {
  for (const entry of GLOSSARY) {
    const n = entry.description.length;
    assert.ok(n >= 70 && n <= 160, `${entry.term}: description is ${n} characters`);
  }
});

// A page that is only a count is worthless, so the floor on explanation is a test rather than an
// intention. A specialty entry is two to four real paragraphs; a credential entry answers the
// letters and hands over, so it is allowed to be shorter - but not a stub.
test("every entry carries real explanation", () => {
  for (const entry of GLOSSARY) {
    assert.ok(entry.body.length >= 2 && entry.body.length <= 4, `${entry.term}: ${entry.body.length} paragraphs`);
    for (const paragraph of entry.body) {
      assert.ok(paragraph.length >= 110, `${entry.term}: a paragraph is only ${paragraph.length} characters`);
    }
    const written = entry.body.join(" ").length;
    const floor = entry.kind === "specialty" ? 650 : 400;
    assert.ok(written >= floor, `${entry.term}: only ${written} characters of explanation`);
    assert.ok(entry.lede.length >= 60, `${entry.term}: lede is too short to be an answer`);
  }
});

test("a specialty entry has the rows and the cross-links it promises", () => {
  for (const entry of GLOSSARY.filter((e) => e.kind === "specialty")) {
    assert.ok(entry.list, `${entry.term}: a specialty page needs a list slug to count from`);
    assert.ok(entry.classification, `${entry.term}: needs the classification, for the metro pages`);
    assert.ok(entry.route, `${entry.term}: needs a training route`);
    assert.ok(entry.settings, `${entry.term}: needs where they practise`);
  }
});

test("related terms resolve, and nothing relates to itself", () => {
  for (const entry of GLOSSARY) {
    for (const term of entry.related ?? []) {
      assert.notEqual(term, entry.term, `${entry.term} relates to itself`);
      assert.ok(glossaryEntry(term), `${entry.term} relates to unknown term ${term}`);
    }
    assert.equal(relatedEntries(entry).length, (entry.related ?? []).length);
  }
});

test("every audience named is an audience page that exists", () => {
  const slugs = new Set(AUDIENCES.map((a) => a.slug));
  for (const entry of GLOSSARY) {
    if (entry.audience) assert.ok(slugs.has(entry.audience), `${entry.term}: no audience page ${entry.audience}`);
  }
});

test("every family has entries, and every entry has a family", () => {
  const keys = new Set(GLOSSARY_FAMILIES.map((f) => f.key));
  for (const entry of GLOSSARY) assert.ok(keys.has(entry.family), `${entry.term}: unknown family ${entry.family}`);
  for (const family of GLOSSARY_FAMILIES) {
    assert.ok(
      GLOSSARY.some((entry) => entry.family === family.key),
      `family ${family.key} has no entries and would print an empty heading`,
    );
  }
});

test("a list slug resolves to the profession's entry, not to a credential", () => {
  assert.equal(glossaryForList("dentists")?.term, "dentists");
  assert.equal(glossaryForList("physical-therapists")?.term, "physical-therapists");
  assert.equal(glossaryForList("nothing-like-this"), null);
});

// A metro link is only offered for a population the directory actually publishes a page for, so
// every row here has to name a real term whose classification is in that wave.
test("metro labels name real entries with published metro pages", () => {
  for (const [term, plural] of Object.entries(METRO_LABELS)) {
    const entry = glossaryEntry(term);
    assert.ok(entry, `METRO_LABELS names unknown term ${term}`);
    assert.ok(plural.length > 0, `${term}: empty plural`);
    assert.ok(
      DIRECTORY_SPECIALTIES.includes(entry.classification),
      `${term}: ${entry.classification} has no specialty-by-metro pages`,
    );
  }
});

test("credential entries are addressed by the letters people type", () => {
  for (const letters of ["md", "do", "np", "pa-c", "crna", "dds", "dmd", "dpm", "pharmd", "lcsw", "pt", "ot", "dc", "od"]) {
    const entry = glossaryEntry(letters);
    assert.ok(entry, `no entry for ${letters}`);
    assert.equal(entry.kind, "credential", `${letters} should be a credential entry`);
  }
});

test("only a specialty whose list the platform publishes may be linked", () => {
  // The hub and the sitemap ask this one question; `app/glossary/[term]/page.tsx` 404s on the same
  // answer. A specialty entry linked from the hub whose list is below the floor was the bug.
  const specialty = GLOSSARY.find((entry) => entry.kind === "specialty" && entry.list);
  assert.ok(specialty, "there is at least one specialty entry with a list");
  assert.equal(glossaryTermIsListed(specialty, new Set([specialty.list])), true);
  assert.equal(glossaryTermIsListed(specialty, new Set()), false);

  // Credential letters are exempt: MD is worth a page whether or not a list matches it.
  const credential = GLOSSARY.find((entry) => entry.kind === "credential");
  assert.ok(credential);
  assert.equal(glossaryTermIsListed(credential, new Set()), true);

  // An unreadable catalogue filters nothing, because the route's gate does not fire either.
  for (const entry of GLOSSARY) assert.equal(glossaryTermIsListed(entry, null), true);
});

test("an aside links only what resolves, and nothing when the catalog is unreadable", () => {
  // `glossaryLinkable` is what the audience pages and the article's own "closely related" and
  // "also in the glossary" blocks filter through. Same rule as the hub, opposite fallback: those
  // blocks are asides, so an unreadable catalogue costs a few links rather than risking a 404.
  const specialty = GLOSSARY.find((entry) => entry.kind === "specialty" && entry.list);
  const credential = GLOSSARY.find((entry) => entry.kind === "credential");
  assert.ok(specialty && credential);
  const both = [specialty, credential];

  assert.deepEqual(glossaryLinkable(both, new Set([specialty.list])), both);
  // The platform answered and publishes nothing: the specialty page 404s, the credential does not.
  assert.deepEqual(glossaryLinkable(both, new Set()), [credential]);
  // The catalogue could not be read at all.
  assert.deepEqual(glossaryLinkable(both, null), []);
  assert.deepEqual(glossaryLinkable([], new Set([specialty.list])), []);
});

test("a specialty entry with no list at all is never linked", () => {
  // `glossaryCounts` reports `none` for an entry with no list, which the route 404s. The hub must
  // reach the same conclusion from the catalogue alone.
  const orphan = { term: "invented", kind: "specialty", list: undefined };
  assert.equal(glossaryTermIsListed(orphan, new Set(["anything"])), false);
});

// Run with `npm test` (node --test; Node strips the types from the imported .ts file).
//
// The case that matters most here is the rename: the screen's field is `system` and the platform's
// filter is `idn`, so this module reads both spellings. If it read only `system`, the export form
// would post `idn` - its own output - and the route would find nothing, and a search narrowed to
// one health system would export every system there is.
import assert from "node:assert/strict";
import { test } from "node:test";
import { affiliationFilters, PAYER_EMPLOYERS } from "./affiliations.ts";

function readers(values) {
  const read = (name) => {
    const value = values[name];
    return Array.isArray(value) ? value[0] : value;
  };
  const readAll = (name) => {
    const value = values[name];
    return value === undefined ? [] : Array.isArray(value) ? value : [value];
  };
  return [read, readAll];
}

function filters(values) {
  return affiliationFilters(...readers(values));
}

test("a health system is named by its slug, under the platform's own filter name", () => {
  assert.deepEqual(filters({ system: "ascension-health" }), { idn: ["ascension-health"] });
  // Repeatable: two systems is a wider search, not the last one typed.
  assert.deepEqual(filters({ system: ["ascension-health", "hca-healthcare"] }).idn, [
    "ascension-health",
    "hca-healthcare",
  ]);
  // The screen's name and the platform's name both read, so the object round-trips through the
  // export form. This is the whole reason the rename lives in one place.
  assert.deepEqual(filters({ idn: ["ascension-health"] }), { idn: ["ascension-health"] });
  const once = filters({ system: ["hca-healthcare"] });
  assert.deepEqual(filters(once), once);
  // One system named twice, once under each spelling, is one system.
  assert.deepEqual(filters({ system: "hca-healthcare", idn: "hca-healthcare" }).idn, [
    "hca-healthcare",
  ]);
});

test("a value that is not a slug is never sent", () => {
  // An id is the one that matters: the platform reads digits alone as `idn_systems.id`, so a
  // digits-only value would be searched on as somebody else's row number. It refuses an id it
  // cannot find, and this keeps one from being sent at all.
  for (const bad of ["4212", "0", "", " ", "-leading", "Ascension Health", "hca_healthcare",
                     "hca.healthcare", "a".repeat(161), "../etc", "SELECT 1"]) {
    assert.deepEqual(filters({ system: bad }), {}, `system=${bad}`);
  }
  // Case and stray spaces are forgiven, as they are everywhere else a value comes from a URL.
  assert.equal(filters({ system: " Ascension-Health " }).idn[0], "ascension-health");
  // `any` is the platform's wildcard - in some health system, no matter which.
  assert.deepEqual(filters({ system: "any" }).idn, ["any"]);
});

test("the payer audience is one of four words", () => {
  for (const value of PAYER_EMPLOYERS) {
    assert.equal(filters({ payer_employer: value }).payer_employer, value);
  }
  for (const bad of ["", "insurer", "PBM", "health plan", "true"]) {
    assert.equal(filters({ payer_employer: bad }).payer_employer, undefined, bad);
  }
});

test("HIE membership is true or false, and nothing else", () => {
  assert.equal(filters({ has_hie: "true" }).has_hie, "true");
  // "false" is a filter and not the absence of one: "not in an exchange" is a search somebody
  // means, and dropping it would answer with everybody.
  assert.equal(filters({ has_hie: "false" }).has_hie, "false");
  for (const bad of ["", "1", "yes", "TRUE", "maybe"]) {
    assert.equal(filters({ has_hie: bad }).has_hie, undefined, bad);
  }
});

test("an empty search sends nothing", () => {
  assert.deepEqual(filters({}), {});
});

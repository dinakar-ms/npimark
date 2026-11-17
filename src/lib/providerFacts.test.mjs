// Run with `npm test` (node --test; Node strips the types from the imported .ts files).
//
// Five filters the platform has always accepted and the customer's screen never offered. Every
// case here is a way one of them gets refused, because a 422 arrives as an empty page and an empty
// page reads as "nothing matched" when it means "bad input".
import assert from "node:assert/strict";
import { test } from "node:test";
import { HEALTH_CENTERS, SHORTAGE_AREAS, providerFacts } from "./providerFacts.ts";

const one = (values) => (name) => values[name];
const all = (values) => (name) => {
  const v = values[name];
  return v === undefined ? [] : Array.isArray(v) ? v : [v];
};
const facts = (values) => providerFacts(one(values), all(values));

test("a year range passes through as years", () => {
  assert.deepEqual(facts({ enumerated_from: "2015", enumerated_to: "2020" }),
                   { enumerated_from: "2015", enumerated_to: "2020" });
});

test("anything that is not a four-digit year is no filter", () => {
  for (const bad of ["", "  ", "15", "20200", "two thousand", "2015-01-01", "abcd"]) {
    assert.deepEqual(facts({ enumerated_from: bad }), {}, `from=${bad}`);
  }
});

test("a year before the first NPI is a typo, not a filter", () => {
  // NPPES began issuing in 2005; 1999 is somebody mistyping, and answering it as a real bound
  // would silently widen the search to everything.
  assert.deepEqual(facts({ enumerated_from: "1999" }), {});
  assert.deepEqual(facts({ enumerated_from: "2005" }), { enumerated_from: "2005" });
});

test("a backwards range keeps the half that reads as an intention", () => {
  // 2020 then 2019 is almost certainly "issued since 2020". Dropping the upper bound answers that;
  // refusing both answers an empty page, and sending both answers nothing at all.
  assert.deepEqual(facts({ enumerated_from: "2020", enumerated_to: "2019" }),
                   { enumerated_from: "2020" });
  // Equal is a real one-year window, not a mistake.
  assert.deepEqual(facts({ enumerated_from: "2020", enumerated_to: "2020" }),
                   { enumerated_from: "2020", enumerated_to: "2020" });
});

test("an upper bound alone is still a filter", () => {
  assert.deepEqual(facts({ enumerated_to: "2010" }), { enumerated_to: "2010" });
});

test("the star rating is 1 to 5, whole or half", () => {
  for (const good of ["1", "3", "5", "4.5", "2.0"]) {
    assert.equal(facts({ min_star_rating: good }).min_star_rating, good, good);
  }
  // The platform declares ge=1, le=5, so these are 422s rather than empty results.
  for (const bad of ["0", "6", "-1", "5.5", "4.7", "", "five", "3.25"]) {
    assert.equal(facts({ min_star_rating: bad }).min_star_rating, undefined, bad);
  }
});

test("the billing group is a trimmed prefix, capped", () => {
  assert.equal(facts({ group_name: "  Austin Family Medicine " }).group_name,
               "Austin Family Medicine");
  assert.equal(facts({ group_name: "x".repeat(400) }).group_name.length, 255);
  assert.equal(facts({ group_name: "   " }).group_name, undefined);
});

test("both HRSA filters take only the values the platform knows", () => {
  for (const v of SHORTAGE_AREAS) {
    assert.deepEqual(facts({ shortage_area: v }).shortage_area, [v]);
  }
  for (const v of HEALTH_CENTERS) {
    assert.deepEqual(facts({ health_center: v }).health_center, [v]);
  }
  // Outside the enum the platform refuses the request rather than ignoring the term.
  for (const bad of ["", "rural", "FQHC", "primary care", "look-alike"]) {
    assert.equal(facts({ shortage_area: bad }).shortage_area, undefined, bad);
    assert.equal(facts({ health_center: bad }).health_center, undefined, bad);
  }
});

test("they are repeatable, de-duplicated, and one bad value does not lose the good ones", () => {
  assert.deepEqual(facts({ shortage_area: ["dental", "rural", "dental", "primary_care"] })
                     .shortage_area, ["dental", "primary_care"]);
  assert.deepEqual(facts({ health_center: ["fqhc", "nope"] }).health_center, ["fqhc"]);
  // Nothing usable is no filter, not an empty one: `shortage_area=[]` would be a key present with
  // nothing in it.
  assert.equal(facts({ shortage_area: ["nope", "also nope"] }).shortage_area, undefined);
});

test("nothing is ever sent in a shape the platform refuses, whatever arrives", () => {
  const junk = ["", " ", "0", "6", "1999", "20205", "any", "rural", "x".repeat(300)];
  for (const a of junk) {
    for (const b of junk) {
      const f = facts({ enumerated_from: a, enumerated_to: b, min_star_rating: a,
                        group_name: b, shortage_area: a, health_center: b });
      if (f.enumerated_from) assert.match(f.enumerated_from, /^\d{4}$/);
      if (f.enumerated_to) {
        assert.match(f.enumerated_to, /^\d{4}$/);
        if (f.enumerated_from) {
          assert.ok(Number(f.enumerated_to) >= Number(f.enumerated_from), "range is backwards");
        }
      }
      if (f.min_star_rating) {
        const n = Number(f.min_star_rating);
        assert.ok(n >= 1 && n <= 5, `stars ${f.min_star_rating}`);
      }
      if (f.group_name) assert.ok(f.group_name.length <= 255 && f.group_name.trim() !== "");
      for (const v of f.shortage_area ?? []) assert.ok(SHORTAGE_AREAS.includes(v));
      for (const v of f.health_center ?? []) assert.ok(HEALTH_CENTERS.includes(v));
    }
  }
});

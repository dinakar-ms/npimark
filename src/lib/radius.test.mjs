// Run with `npm test` (node --test; Node strips the types from the imported .ts files).
//
// Radius search is two filters the platform only accepts together, so every way of getting it wrong
// is silent: send one without the other and the API answers 422, which the search page renders as an
// empty result — "nothing matched" when it means "bad input". The cases below are therefore mostly
// about what is *refused* and what is *substituted*, not about the happy path.
//
// The worst outcome is not an error. It is a search that silently becomes national: a customer who
// typed a ZIP, got the whole country back, and had no reason to doubt any row in it.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_RADIUS_MILES,
  MAX_RADIUS_MILES,
  RADIUS_CHOICES,
  radiusFilter,
  radiusInUse,
} from "./radius.ts";

test("a ZIP and a radius become the pair the platform accepts", () => {
  assert.deepEqual(radiusFilter("78701", "50"), { near_zip: "78701", radius_miles: 50 });
});

test("a ZIP with no radius gets the default rather than losing the ZIP", () => {
  // Dropping it would turn a local search into a national one, which is the failure a customer is
  // least likely to notice: more rows, every one believable, none of them near them.
  assert.deepEqual(radiusFilter("78701", undefined), {
    near_zip: "78701",
    radius_miles: DEFAULT_RADIUS_MILES,
  });
  assert.deepEqual(radiusFilter("78701", ""), {
    near_zip: "78701",
    radius_miles: DEFAULT_RADIUS_MILES,
  });
});

test("a radius with no ZIP is dropped, because there is no center to measure from", () => {
  assert.deepEqual(radiusFilter(undefined, "50"), {});
  assert.deepEqual(radiusFilter("", "50"), {});
});

test("a part-typed ZIP is not a location", () => {
  // `787` is somebody mid-keystroke. The platform would accept a 3-digit prefix on `postal_code`,
  // but this is a centre for a distance test, and there is no centre of "787".
  for (const zip of ["787", "7870", "787011", "abcde", "78 701"]) {
    assert.deepEqual(radiusFilter(zip, "25"), {}, `${zip} should not be a center`);
  }
});

test("a radius outside the platform's range is clamped, not dropped", () => {
  // The intent is unambiguous - 400 means "as wide as you do" - and dropping it would widen the
  // search to the whole country instead of narrowing it to the widest allowed.
  assert.equal(radiusFilter("78701", "400").radius_miles, MAX_RADIUS_MILES);
  assert.equal(radiusFilter("78701", "0").radius_miles, 1);
});

test("only a plain whole number is read as a radius", () => {
  // This case found a real bug. `Number.parseInt("2.5.1")` is 2, so a typo silently became a
  // two-mile radius - a search narrowed to nothing, which is far harder to spot than one that
  // errors. Anything not plainly a whole number now gets the default instead.
  for (const miles of ["soon", "25 miles", "2.5.1", "1e3", "-5", " "]) {
    assert.equal(
      radiusFilter("78701", miles).radius_miles,
      DEFAULT_RADIUS_MILES,
      `${miles} should fall back rather than be half-read`,
    );
  }
});

test("every choice offered on the form is one the platform accepts", () => {
  // A select whose options the API would refuse is a 422 the customer cannot avoid.
  for (const miles of RADIUS_CHOICES) {
    assert.ok(miles >= 1 && miles <= MAX_RADIUS_MILES, `${miles} is outside 1..${MAX_RADIUS_MILES}`);
    assert.equal(radiusFilter("78701", String(miles)).radius_miles, miles);
  }
  assert.ok(RADIUS_CHOICES.includes(DEFAULT_RADIUS_MILES), "the default must be offerable");
});

test("the pair is never half-sent", () => {
  // The invariant the whole module exists for: either both keys or neither, whatever comes in.
  for (const zip of [undefined, "", "787", "78701"]) {
    for (const miles of [undefined, "", "0", "25", "9999", "soon"]) {
      const keys = Object.keys(radiusFilter(zip, miles)).sort();
      assert.ok(
        keys.length === 0 || (keys.length === 2 && keys[0] === "near_zip"),
        `radiusFilter(${zip}, ${miles}) produced ${JSON.stringify(keys)}`,
      );
    }
  }
});

test("the form knows when to start open", () => {
  assert.equal(radiusInUse(radiusFilter("78701", "25")), true);
  assert.equal(radiusInUse(radiusFilter("", "")), false);
});

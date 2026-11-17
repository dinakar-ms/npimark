// Run with `npm test` (node --test; Node strips the types from the imported .ts files).
//
// The accuracy page is the one page on this site where a formatting bug is a false claim. Every
// figure on it comes from a measurement that has not happened yet, so the state that will be live
// on the day it ships is the state where everything is absent - and "absent" has to survive all the
// way to the screen without becoming a zero, an empty string, or an "approximately".
//
// So these are the rules the page depends on, checked here because they are pure and because a test
// that needed an API key would not be run:
//
// * absent is absent, and never 0,
// * a rate is published to the precision a sample of six hundred actually has,
// * an unreachable API renders exactly like an unmeasured rate, with no method invented to fill the
//   gap - a page that described a design it could not read would be the same class of mistake as
//   one that printed a rate it had not measured.
import assert from "node:assert/strict";
import { test } from "node:test";
import { margin, measuredOn, nothing, percent, tierLabel } from "./deliverability.ts";

test("an absent rate is absent, not zero", () => {
  assert.equal(percent(null), null);
  // And a real zero is still a zero: "we checked, and none of them were deliverable" is a
  // measurement, and it must not be hidden just because it is bad news.
  assert.equal(percent(0), "0%");
});

test("a rate is published to the precision the sample size gives it", () => {
  // Whole percents. One decimal on six hundred draws is a claim the interval does not support.
  assert.equal(percent(91.4), "91%");
  assert.equal(percent(91.6), "92%");
  assert.equal(percent(100), "100%");
});

test("the margin of error is absent rather than zero when nothing was measured", () => {
  assert.equal(margin(null), null);
  // A stratum measured end to end is a census, and its interval really is zero points.
  assert.equal(margin(0), "±0.0 points");
  assert.equal(margin(2.7), "±2.7 points");
});

test("a measurement date is the day, or nothing at all", () => {
  assert.equal(measuredOn("2026-09-24T18:04:00Z"), "September 24, 2026");
  assert.equal(measuredOn(null), null);
  assert.equal(measuredOn(undefined), null);
  // A date the platform could not give, or gave badly, is no date - never today's.
  assert.equal(measuredOn("not a date"), null);
});

test("with nothing published there is no figure and no invented method", () => {
  const empty = nothing();
  assert.equal(empty.measured, false);
  assert.equal(empty.latest, null);
  // The method is null rather than a sensible-looking default: the page must not describe a
  // design it has not read.
  assert.equal(empty.method, null);
  assert.deepEqual(empty.history, []);
  // Nothing in the empty state is a number, which is what stops a zero reaching the screen.
  assert.equal(
    Object.values(empty).some((value) => typeof value === "number"),
    false,
  );
});

test("a tier keeps its own name even if the platform adds one", () => {
  assert.equal(tierLabel("trusted"), "Trusted");
  // An unknown tier is shown as it came rather than dropped: a stratum missing from the table
  // would be a published figure with a piece quietly missing from it.
  assert.equal(tierLabel("provisional"), "provisional");
});

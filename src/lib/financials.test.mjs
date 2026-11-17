import { test } from "node:test";
import assert from "node:assert/strict";
import { financial } from "./financials.ts";

test("a figure nobody filed is never shown as a zero", () => {
  // The rule the whole module exists for. A hospital that left Worksheet S-3 blank has not
  // reported no inpatient days, and one that did not file its expenses has not reported a 0%
  // margin. Both arrive as null and must stay distinguishable from a real zero.
  for (const unit of ["usd", "pct", "ratio", "days", "discharges", "beds"]) {
    assert.equal(financial(null, unit), "Not filed", unit);
    assert.equal(financial(undefined, unit), "Not filed", unit);
  }

  // A genuine zero is a filed figure and must survive as one.
  assert.equal(financial(0, "usd"), "$0");
  assert.equal(financial(0, "pct"), "0.0%");
  assert.equal(financial(0, "days"), "0");
});

test("each unit is formatted the way its filing reads", () => {
  assert.equal(financial(3181552, "usd"), "$3,181,552");
  assert.equal(financial(-781989, "usd"), "-$781,989");
  // `pct` is already a percentage: 5.2 means 5.2%, not 520%.
  assert.equal(financial(5.2, "pct"), "5.2%");
  assert.equal(financial(-41.0666, "pct"), "-41.1%");
  assert.equal(financial(1.5, "ratio"), "1.50");
  assert.equal(financial(9706, "days"), "9,706");
  assert.equal(financial(9705, "discharges"), "9,705");
});

test("an unrecognised unit still prints the number rather than dropping it", () => {
  // Units come from the API's vocabulary and it may add one. A figure the page cannot label is
  // better shown plainly than hidden, and far better than crashing the facility page.
  assert.equal(financial(1234.5, "fte"), "1,234.5");
  assert.equal(financial(42, "something-new"), "42");
});

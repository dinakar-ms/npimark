// Run with `npm test` (node --test; Node strips the types from the imported .ts files).
//
// One rule carries all of these: a customer must be able to see every allowance they are charged
// against, and must not be shown a row of zeros for an allowance they do not have. `residence_rows`
// is both cases in one metric - bulk home address and cell is metered separately, and most plans
// carry none of it.
import assert from "node:assert/strict";
import { test } from "node:test";
import { METRICS, usageRows } from "./usageMetrics.ts";

/** `LimitFigures`, as the API sends them. */
const figure = (limit, used) => ({ limit, used, remaining: limit === null ? 0 : limit - used });

const keys = (rows) => rows.map((row) => row.key);

test("every metric the API reports gets a row, in the order the list gives", () => {
  const limits = {};
  for (const metric of METRICS) limits[metric.key] = figure(100, 1);
  assert.deepEqual(keys(usageRows(limits)), METRICS.map((m) => m.key));
});

test("a metric the API did not mention is left out, not rendered as zero", () => {
  // A row of zeros reads as "we have spent nothing", which is a worse answer than no row.
  assert.deepEqual(keys(usageRows({ reveals: figure(50, 3) })), ["reveals"]);
});

test("bulk home address and cell is metered, so it is listed", () => {
  // The whole point of the metric: a customer charged for it can see what it cost.
  assert.ok(
    METRICS.some((m) => m.key === "residence_rows"),
    "residence_rows is charged on exports and appends and must be visible",
  );
});

test("an allowance the plan does not carry is not advertised as a row of zeros", () => {
  const rows = usageRows({ append_rows: figure(1000, 0), residence_rows: figure(0, 0) });
  assert.deepEqual(keys(rows), ["append_rows"]);
});

test("but it appears the moment the plan carries it", () => {
  assert.deepEqual(keys(usageRows({ residence_rows: figure(5000, 0) })), ["residence_rows"]);
  // Null is unlimited, which is very much carried - and the case a `!limit` check gets wrong.
  assert.deepEqual(keys(usageRows({ residence_rows: figure(null, 0) })), ["residence_rows"]);
});

test("and it appears when something has been spent, whatever the limit now says", () => {
  // A plan changed mid-month, or an allowance set back to zero, must not hide what was charged.
  assert.deepEqual(keys(usageRows({ residence_rows: figure(0, 240) })), ["residence_rows"]);
});

test("an ordinary metric at zero still gets its row", () => {
  // `whenIncluded` is opt-in. "Export rows: 0 of 0" is a plan detail somebody needs to read, and
  // hiding every zero would hide the free plan's own limits.
  assert.deepEqual(keys(usageRows({ export_rows: figure(0, 0) })), ["export_rows"]);
});

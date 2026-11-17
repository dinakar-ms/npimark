// Run with `npm test` (node --test; Node strips the types from the imported .ts file).
//
// The rule these cases hold: an amount is a number the platform accepts, and a year only travels
// with an amount beside it. Both failures are silent - a shape the platform refuses arrives as an
// empty page and reads as "nobody matched", and a year sent alone is a filter that appears to
// narrow a search and does not.
import assert from "node:assert/strict";
import { test } from "node:test";
import { FIRST_PAYMENT_YEAR, newestPublishedYear, paymentFilters } from "./payments.ts";

/** One reader over a plain object, the way the screen and the export route both read. */
function reader(values) {
  return (name) => values[name];
}

function filters(values, now) {
  return paymentFilters(reader(values), {}, now);
}

/** The screen's side: the years the platform says it holds. */
function withYears(values, years) {
  return paymentFilters(reader(values), { years });
}

test("a floor, a ceiling, and both together", () => {
  assert.deepEqual(filters({ min_payment_amount: "5000" }), { min_payment_amount: "5000" });
  assert.deepEqual(filters({ payment_amount_below: "100" }), { payment_amount_below: "100" });
  // Not a contradiction: "paid something, but not a fortune" is a band, and the platform reads it
  // as one. A module that dropped one of them would answer a question nobody asked.
  assert.deepEqual(filters({ min_payment_amount: "100", payment_amount_below: "5000" }), {
    min_payment_amount: "100",
    payment_amount_below: "5000",
  });
  // Cents are allowed, because Open Payments is filed to the cent.
  assert.equal(filters({ min_payment_amount: "10.50" }).min_payment_amount, "10.50");
});

test("anything that is not an amount the platform takes is dropped", () => {
  for (const bad of ["", " ", "-5", "1e6", "5,000", "$5000", ".5", "5.", "5.123", "lots"]) {
    assert.deepEqual(filters({ min_payment_amount: bad }), {}, `min_payment_amount=${bad}`);
    assert.deepEqual(filters({ payment_amount_below: bad }), {}, `payment_amount_below=${bad}`);
  }
  // `ge=0` on the platform, and zero is a real answer: "paid anything at all".
  assert.equal(filters({ min_payment_amount: "0" }).min_payment_amount, "0");
});

test("a year is only sent with an amount beside it", () => {
  // The platform accepts a lone `payment_year` and narrows nothing by it, which is worse than
  // refusing it: the screen would show a year filter that does nothing.
  assert.deepEqual(filters({ payment_year: "2023" }), {});
  assert.deepEqual(filters({ min_payment_amount: "5000", payment_year: "2023" }), {
    min_payment_amount: "5000",
    payment_year: "2023",
  });
  // And with the ceiling too, which is the twin it scopes just as much.
  assert.equal(
    filters({ payment_amount_below: "10", payment_year: "2023" }).payment_year,
    "2023",
  );
});

test("the year has to be one Open Payments could have", () => {
  const now = new Date("2026-09-30T00:00:00Z");
  const amount = { min_payment_amount: "1000" };
  // 2013 is the first program year. 2012 is a typo, not a filter.
  assert.equal(filters({ ...amount, payment_year: String(FIRST_PAYMENT_YEAR) }, now).payment_year,
               String(FIRST_PAYMENT_YEAR));
  assert.equal(filters({ ...amount, payment_year: "2012" }, now).payment_year, undefined);
  // CMS publishes a program year in the middle of the following one, so 2025 is the newest with
  // data in September 2026. 2026 is accepted - one year of slack, so a URL for a year that has
  // just landed is not refused - and 2027 is not.
  assert.equal(newestPublishedYear(now), 2025);
  assert.equal(filters({ ...amount, payment_year: "2025" }, now).payment_year, "2025");
  assert.equal(filters({ ...amount, payment_year: "2026" }, now).payment_year, "2026");
  assert.equal(filters({ ...amount, payment_year: "2027" }, now).payment_year, undefined);
  for (const bad of ["20255", "99", "two thousand", " 2025 x"]) {
    assert.equal(filters({ ...amount, payment_year: bad }, now).payment_year, undefined, bad);
  }
  // Surrounding whitespace is forgiven, as it is everywhere else a value is read from a URL.
  assert.equal(filters({ ...amount, payment_year: " 2025 " }, now).payment_year, "2025");
});

test("the year is checked against the years the platform holds, when they are known", () => {
  // The platform refuses a program year it loaded nothing into, so a year from the calendar
  // rather than from the data is a refused search - which arrives as an empty page and reads as
  // "nobody was paid that much". The screen has the list; this is it being used.
  const amount = { min_payment_amount: "1000" };
  assert.equal(withYears({ ...amount, payment_year: "2024" }, [2024, 2023]).payment_year, "2024");
  assert.equal(withYears({ ...amount, payment_year: "2023" }, [2024, 2023]).payment_year, "2023");
  // Calendar-valid and not held: dropped. This is the case the old calendar check let through.
  assert.equal(withYears({ ...amount, payment_year: "2022" }, [2024, 2023]).payment_year, undefined);
  // Open Payments not loaded at all: no year is sendable, and the screen hides the field.
  assert.equal(withYears({ ...amount, payment_year: "2024" }, []).payment_year, undefined);
  // The amounts are untouched either way - it is the year that is in question.
  assert.equal(withYears({ ...amount, payment_year: "2022" }, [2024]).min_payment_amount, "1000");
});

test("without a list the calendar still applies, which is the export route's case", () => {
  // The route is handed a value that came from the screen's own hidden field, already checked
  // against the real list, and it must not fetch one of its own: a year that slipped through
  // narrows the file rather than widening it.
  const now = new Date("2026-09-30T00:00:00Z");
  assert.equal(filters({ min_payment_amount: "1000", payment_year: "2025" }, now).payment_year,
               "2025");
  assert.equal(filters({ min_payment_amount: "1000", payment_year: "2027" }, now).payment_year,
               undefined);
});

test("the output goes back in and comes out the same", () => {
  // The property the export depends on: the form renders this object as hidden fields and the
  // route reads it back through this same function.
  const once = filters({
    min_payment_amount: "100",
    payment_amount_below: "5000",
    payment_year: "2024",
  });
  assert.deepEqual(filters(once), once);
});

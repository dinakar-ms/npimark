// Run with `npm test` (node --test; Node strips the types from the imported .ts files).
//
// Two filter families the help page already promised and the screen did not offer. Every case here
// is about a rule that would otherwise turn a typo into an empty page - and an empty page reads as
// "nothing matched" when it means "bad input", which is the one failure mode a search screen must
// not have.
//
// The `false` cases matter as much as the `true` ones. "The ones we hold no email for" is a real
// question, and a bare truthiness check drops it and answers the opposite.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EMAIL_TRUST,
  REACH_FLAGS,
  placeFilter,
  postalCodes,
  reachFilter,
  streetNeedsAnchor,
} from "./placeFilters.ts";

/** A `params`-like reader over a plain object, matching what the page passes in. */
const reader = (values) => (name) => values[name];

test("one ZIP, several ZIPs, and SCF prefixes all survive", () => {
  assert.equal(postalCodes("78701"), "78701");
  assert.equal(postalCodes("78701, 10001"), "78701,10001");
  assert.equal(postalCodes("787"), "787", "a 3-digit SCF prefix is a real filter");
});

test("one bad entry does not refuse the whole list", () => {
  // The platform would 422 the entire search over a single malformed ZIP, and the customer would see
  // an empty page for nine good ones. Dropping the bad entry keeps the search they asked for.
  assert.equal(postalCodes("78701, nope, 10001"), "78701,10001");
  assert.equal(postalCodes("7870, 1"), "", "nothing usable is no filter, not a broken one");
});

test("the same place twice is one place", () => {
  assert.equal(postalCodes("78701, 78701"), "78701");
});

test("city and ZIP pass through, trimmed and capped", () => {
  const filter = placeFilter("  Austin  ", "78701", undefined, false);
  assert.deepEqual(filter, { city: "Austin", postal_code: "78701" });
  assert.equal(placeFilter("x".repeat(500), undefined, undefined, false).city.length, 120);
});

test("a street alone is dropped, because the platform refuses it", () => {
  // Its own description: "Needs a ZIP, city or radius." Sent alone it is a 422, which arrives as an
  // empty page. Dropping the one term that would refuse the search is the kinder failure.
  assert.deepEqual(placeFilter(undefined, undefined, "43 New Scotland Ave", false), {});
  assert.ok(streetNeedsAnchor("43 New Scotland Ave", "", "", false), "and the page can say why");
});

test("a street anchored by a city, a ZIP, or a radius is kept", () => {
  assert.equal(placeFilter("Albany", undefined, "43 New Scotland Ave", false).street, "43 New Scotland Ave");
  assert.equal(placeFilter(undefined, "12208", "43 New Scotland Ave", false).street, "43 New Scotland Ave");
  // The radius counts as an anchor, which is why this function has to be told about it.
  assert.equal(placeFilter(undefined, undefined, "43 New Scotland Ave", true).street, "43 New Scotland Ave");
  for (const anchored of [
    streetNeedsAnchor("43 New Scotland Ave", "Albany", "", false),
    streetNeedsAnchor("43 New Scotland Ave", "", "12208", false),
    streetNeedsAnchor("43 New Scotland Ave", "", "", true),
  ]) {
    assert.equal(anchored, false, "an anchored street needs no explanation");
  }
});

test("a street anchored only by an unusable ZIP is still unanchored", () => {
  // The subtle one: "787xx" is not a ZIP this passes on, so it cannot anchor a street either. If
  // these two disagreed, the page would keep a street the request then had nothing to hold it with.
  assert.deepEqual(placeFilter(undefined, "787xx", "43 New Scotland Ave", false), {});
  assert.ok(streetNeedsAnchor("43 New Scotland Ave", "", "787xx", false));
});

test("both states of every reachability flag are filters", () => {
  for (const flag of REACH_FLAGS) {
    assert.deepEqual(reachFilter(reader({ [flag]: "true" })), { [flag]: "true" });
    // The one a truthiness check gets wrong. "No email" is a question somebody asks on purpose.
    assert.deepEqual(reachFilter(reader({ [flag]: "false" })), { [flag]: "false" });
  }
});

test("anything that is not true or false is no filter at all", () => {
  for (const value of ["", "  ", "yes", "1", "0", "null", undefined]) {
    assert.deepEqual(reachFilter(reader({ has_email: value })), {}, `has_email=${value}`);
  }
});

test("the trust tier is only ever one the platform knows", () => {
  for (const tier of EMAIL_TRUST) {
    assert.deepEqual(reachFilter(reader({ email_trust: tier })), { email_trust: tier });
  }
  // Outside the enum the platform refuses the request rather than ignoring the term, so a
  // hand-edited URL must fall back to no filter and not to an empty page.
  for (const bad of ["Trusted", "high", "anything", ""]) {
    assert.deepEqual(reachFilter(reader({ email_trust: bad })), {}, `email_trust=${bad}`);
  }
  // Surrounding whitespace is forgiven rather than refused: "any " from a hand-edited URL means
  // "any", and the enum check runs on the trimmed value. Asserted so the leniency is deliberate -
  // this case started out expecting a refusal and the implementation was the one that was right.
  assert.deepEqual(reachFilter(reader({ email_trust: " any " })), { email_trust: "any" });
});

test("the flags and the tier combine without interfering", () => {
  assert.deepEqual(
    reachFilter(reader({ has_email: "true", has_phone: "false", email_trust: "trusted" })),
    { has_email: "true", has_phone: "false", email_trust: "trusted" },
  );
});

test("no filter is ever half-sent, for any combination", () => {
  // The invariant behind all of it: whatever arrives, every key present is one the platform accepts
  // with a value it accepts. Nothing is passed on in a shape that would earn a 422.
  const cities = [undefined, "", "Austin", "x".repeat(300)];
  const zips = [undefined, "", "78701", "787", "nope", "78701,nope"];
  const streets = [undefined, "", "43 New Scotland Ave"];
  for (const city of cities) {
    for (const zip of zips) {
      for (const street of streets) {
        for (const radius of [true, false]) {
          const filter = placeFilter(city, zip, street, radius);
          for (const [key, value] of Object.entries(filter)) {
            assert.ok(["city", "postal_code", "street"].includes(key), `unexpected key ${key}`);
            assert.ok(typeof value === "string" && value !== "", `${key} is empty`);
          }
          if (filter.street !== undefined) {
            assert.ok(
              filter.city !== undefined || filter.postal_code !== undefined || radius,
              "a street was sent with nothing to anchor it",
            );
          }
        }
      }
    }
  }
});

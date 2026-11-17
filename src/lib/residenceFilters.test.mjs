// Run with `npm test` (node --test; Node strips the types from the imported .ts files).
//
// The four Residence Match filters. The platform has accepted these from a contract customer since
// 28 Sep and the customer's screen never offered them, so every case here is about a filter that
// existed and could not be reached.
//
// The `false` cases matter as much as the `true` ones: "the ones we hold no home address for" is a
// real question, and a truthiness check drops it and answers the opposite one.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  HOME_RELATIONS,
  RESIDENCE_FLAGS,
  asksForResidence,
  homeStates,
  residenceFilter,
} from "./residenceFilters.ts";

const reader = (values) => (name) => values[name];

test("both states of both flags are filters", () => {
  for (const flag of RESIDENCE_FLAGS) {
    assert.deepEqual(residenceFilter(reader({ [flag]: "true" })), { [flag]: "true" });
    // The one a truthiness check gets wrong.
    assert.deepEqual(residenceFilter(reader({ [flag]: "false" })), { [flag]: "false" });
  }
});

test("anything that is not true or false is no filter at all", () => {
  for (const value of ["", "  ", "yes", "1", "0", "null", undefined]) {
    assert.deepEqual(
      residenceFilter(reader({ has_home_address: value })),
      {},
      `has_home_address=${value}`,
    );
  }
});

test("home states are two letters, upper-cased, repeatable", () => {
  assert.deepEqual(homeStates("tx"), ["TX"]);
  assert.deepEqual(homeStates("TX, ny"), ["TX", "NY"]);
  // Repeatable on the platform, so an array - `searchAsUser` appends each under the same name.
  assert.deepEqual(residenceFilter(reader({ home_state: "tx,ny" })).home_state, ["TX", "NY"]);
});

test("one bad state does not refuse the whole list", () => {
  // The platform would 422 the entire search over a single malformed entry, and the customer would
  // see an empty page for the nine good ones.
  assert.deepEqual(homeStates("TX, Texas, NY"), ["TX", "NY"]);
  assert.deepEqual(homeStates("Texas"), [], "nothing usable is no filter, not a broken one");
});

test("the same state twice is one state", () => {
  assert.deepEqual(homeStates("TX, tx , TX"), ["TX"]);
});

test("a state list of nothing usable sends no home_state at all", () => {
  // Not an empty array: `home_state=[]` would be a key present with nothing in it, and the point of
  // dropping a bad value is to leave the filter off rather than to send an empty one.
  assert.equal(residenceFilter(reader({ home_state: "Texas" })).home_state, undefined);
});

test("the relation is only ever one the platform knows", () => {
  for (const relation of HOME_RELATIONS) {
    assert.deepEqual(residenceFilter(reader({ practice_home_relation: relation })), {
      practice_home_relation: relation,
    });
  }
  for (const bad of ["same-zip", "SAME_ZIP", "elsewhere", ""]) {
    assert.deepEqual(
      residenceFilter(reader({ practice_home_relation: bad })),
      {},
      `practice_home_relation=${bad}`,
    );
  }
});

test("the four combine without interfering", () => {
  assert.deepEqual(
    residenceFilter(
      reader({
        has_home_address: "true",
        has_cell_phone: "false",
        home_state: "tx",
        practice_home_relation: "same_state",
      }),
    ),
    {
      has_home_address: "true",
      has_cell_phone: "false",
      home_state: ["TX"],
      practice_home_relation: "same_state",
    },
  );
});

test("asking for none of them is recognisable as asking for none", () => {
  // This is what lets the page tell "your plan does not carry these" apart from an ordinary
  // failure, instead of showing "the platform did not answer" for the customer's own plan.
  assert.equal(asksForResidence(reader({})), false);
  assert.equal(asksForResidence(reader({ has_home_address: "" })), false);
  assert.equal(asksForResidence(reader({ home_state: "Texas" })), false, "nothing usable is not asking");
  assert.equal(asksForResidence(reader({ has_home_address: "false" })), true, "false is asking");
  assert.equal(asksForResidence(reader({ home_state: "TX" })), true);
});

test("no filter is ever half-sent, for any combination", () => {
  // The invariant: whatever arrives, every key present is one the platform accepts with a value it
  // accepts. Nothing is passed on in a shape that would earn a 422.
  const values = [undefined, "", "  ", "true", "false", "yes", "TX", "tx,ny", "Texas", "same_zip", "SAME_ZIP"];
  for (const a of values) {
    for (const b of values) {
      const filter = residenceFilter(
        reader({ has_home_address: a, has_cell_phone: b, home_state: a, practice_home_relation: b }),
      );
      for (const [key, value] of Object.entries(filter)) {
        if (key === "home_state") {
          assert.ok(Array.isArray(value) && value.length > 0, "home_state is a non-empty array");
          for (const one of value) assert.match(one, /^[A-Z]{2}$/);
        } else if (key === "practice_home_relation") {
          assert.ok(HOME_RELATIONS.includes(value), `bad relation ${value}`);
        } else {
          assert.ok(RESIDENCE_FLAGS.includes(key), `unexpected key ${key}`);
          assert.ok(value === "true" || value === "false", `${key}=${value}`);
        }
      }
    }
  }
});

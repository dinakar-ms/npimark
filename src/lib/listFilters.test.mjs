// Run with `npm test` (node --test; Node strips the types from the imported .ts files).
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  MAX_LISTS,
  MAX_VALUES,
  excluding,
  listFilters,
} from "./listFilters.ts";

const ID = "3f1c9d2a-5b7e-4a61-9c48-2d6e8f0a1b33";
const OTHER = "9a8b7c6d-5e4f-4321-8765-0a1b2c3d4e5f";

const of = (params) => {
  const url = new URLSearchParams(params);
  return listFilters(
    (name) => url.get(name) ?? undefined,
    (name) => url.getAll(name),
  );
};

test("a list id that is not a UUID is dropped, not sent", () => {
  // The platform's refusal for this one is "That isn't a list id. Choose a list from the Lists
  // page" - and it refuses the whole search, so a hand-edited URL would turn every result into
  // that sentence. Dropped here instead.
  assert.deepEqual(of([["list_id", "42"]]), {});
  assert.deepEqual(of([["exclude_list_id", "not-a-list"]]), {});
  assert.deepEqual(of([["list_id", ID]]), { list_id: ID });
});

test("the useful filter: everyone except the people on two lists", () => {
  const out = of([
    ["exclude_list_id", ID],
    ["exclude_list_id", OTHER],
  ]);
  assert.deepEqual(out.exclude_list_id, [ID, OTHER]);
  assert.equal(excluding(out), 1);
});

test("one list is subtracted once however many times it is named", () => {
  const out = of([
    ["exclude_list_id", ID],
    ["exclude_list_id", ID],
  ]);
  assert.deepEqual(out.exclude_list_id, [ID]);
});

test("lists to subtract are capped, because they travel in the URL", () => {
  const many = Array.from({ length: MAX_LISTS + 5 }, (_, i) =>
    `3f1c9d2a-5b7e-4a61-9c48-2d6e8f0a${String(1000 + i).padStart(4, "0")}`,
  ).map((id) => ["exclude_list_id", id]);
  assert.equal(of(many).exclude_list_id.length, MAX_LISTS);
});

test("a pasted column of NPIs to leave out works like the one that includes them", () => {
  const out = of([["exclude_npi_list", "NPI\n1234567893\n1003000126\nnot-an-npi\n"]]);
  assert.deepEqual(out.exclude_npi, ["1234567893", "1003000126"]);
});

test("the excluded NPIs round-trip, which the export depends on", () => {
  // The screen's control is `exclude_npi_list`; what comes out is `exclude_npi`. The export form
  // renders the output as hidden fields and the route reads it back through this same function,
  // so what comes out has to be something that can go back in.
  const first = of([["exclude_npi_list", "1234567893,1003000126"]]);
  const again = listFilters(
    () => undefined,
    (name) => (name === "exclude_npi" ? first.exclude_npi : []),
  );
  assert.deepEqual(again.exclude_npi, first.exclude_npi);
});

test("a state typed in lower case still excludes that state", () => {
  // Rather than silently narrowing nothing, which is what sending `tx` to a filter that matches
  // on `TX` would do.
  assert.deepEqual(of([["exclude_state", "tx"]]).exclude_state, ["TX"]);
  assert.deepEqual(of([["exclude_state", "Texas"]]), {});
});

test("a ZIP+4 is not a ZIP, and is dropped", () => {
  assert.deepEqual(of([["exclude_postal_code", "78701-1234"]]), {});
  assert.deepEqual(of([["exclude_postal_code", "78701"]]).exclude_postal_code, ["78701"]);
});

test("an employer domain is lower-cased, and a bare word is not a domain", () => {
  assert.deepEqual(of([["exclude_employer_domain", "Example.COM"]]).exclude_employer_domain, [
    "example.com",
  ]);
  assert.deepEqual(of([["exclude_employer_domain", "example"]]), {});
});

test("every negative filter is capped at the same ceiling", () => {
  const twenty = Array.from({ length: MAX_VALUES + 5 }, (_, i) => ["exclude_city", `City ${i}`]);
  assert.equal(of(twenty).exclude_city.length, MAX_VALUES);
});

test("nothing excluded means no exclusion parameters at all", () => {
  // Not an empty array per filter: the platform treats an absent list and an empty one the same,
  // but the export form renders what is here as hidden fields, and an empty field would make the
  // file's filter set disagree with the search's.
  assert.deepEqual(of([["exclude_state", ""], ["exclude_city", "   "]]), {});
  assert.equal(excluding({}), 0);
});

test("an excluded credential is a code, not a sentence", () => {
  const out = of([
    ["exclude_credential", "md"],
    ["exclude_credential", "a very long thing that is not a credential"],
  ]);
  assert.deepEqual(out.exclude_credential, ["MD"]);
});

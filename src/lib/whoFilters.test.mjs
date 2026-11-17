// Run with `npm test` (node --test; Node strips the types from the imported .ts files).
import assert from "node:assert/strict";
import { test } from "node:test";

import { MAX_NPIS, npiList, whoFilters } from "./whoFilters.ts";

const of = (params) => {
  const url = new URLSearchParams(params);
  return whoFilters(
    (name) => url.get(name) ?? undefined,
    (name) => url.getAll(name),
  );
};

test("a pasted spreadsheet column becomes a list of NPIs", () => {
  // What somebody actually does: copy a column, header and all. Rejecting the whole filter over
  // the word "NPI" would be absurd, so anything that is not ten digits is simply dropped.
  const pasted = "NPI\n1234567893\n1003000126\n\nnot-an-npi\n1234567893\n";
  assert.deepEqual(npiList(pasted), ["1234567893", "1003000126"]);
});

test("commas, spaces, semicolons and newlines all separate", () => {
  assert.deepEqual(npiList("1234567893, 1003000126;1003000134 1003000142"), [
    "1234567893",
    "1003000126",
    "1003000134",
    "1003000142",
  ]);
});

test("the list is capped, because it travels in the URL", () => {
  // Not a platform limit: every filter here goes in the query string so a search can be shared
  // and paged, and a browser gives up somewhere past a few thousand characters.
  const many = Array.from({ length: MAX_NPIS + 50 }, (_, i) =>
    String(1000000000 + i),
  ).join(",");
  assert.equal(npiList(many).length, MAX_NPIS);
});

test("credentials are a list, uppercased, and anything odd is dropped", () => {
  const out = of([
    ["credential", "md"],
    ["credential", "NP"],
    ["credential", "a very long thing that is not a credential"],
  ]);
  // Emitted under `credential`, which is the name the platform accepts on the wire. It was
  // `credentials_any` - the name of a field on the platform's internal dataclass - and under that
  // name the search silently ignored the filter and an export would have refused the whole file.
  assert.deepEqual(out.credential, ["MD", "NP"]);
  assert.equal(out.credentials_any, undefined);
});

test("a bed count brings the facility flag with it", () => {
  // Beds are a fact about the certified facility behind the NPI. Sent alone the platform takes it
  // and returns the same rows, which looks like a filter that does nothing.
  const out = of([["min_beds", "300"]]);
  assert.equal(out.min_beds, "300");
  assert.equal(out.has_facility, "true");
});

test("an explicit facility answer is not overwritten by the bed count", () => {
  const out = of([
    ["min_beds", "300"],
    ["has_facility", "false"],
  ]);
  assert.equal(out.has_facility, "false");
});

test("a bed count that is not a number is dropped rather than sent", () => {
  // The platform answers a bad shape with a 422, and this screen renders that as an empty result -
  // which reads as "nobody matched" when it means "that was not a number".
  for (const bad of ["lots", "-5", "0", "99999", "12.5"]) {
    assert.deepEqual(of([["min_beds", bad]]), {}, `min_beds=${bad}`);
  }
});

test("names are trimmed, capped, and absent when empty", () => {
  assert.deepEqual(of([["last_name", "  Reyes  "]]), { last_name: "Reyes" });
  assert.deepEqual(of([["first_name", "   "]]), {});
  assert.equal(of([["organization_name", "x".repeat(400)]]).organization_name.length, 120);
});

test("the output round-trips, which the export depends on", () => {
  // The export form renders this object as hidden fields and the route reads it back through this
  // same function, so what comes out has to be something that can go back in. The NPI list is the
  // one that could have broken: the screen's field is `npi_list` and what goes out is `npi`.
  const first = of([["npi_list", "1234567893, 1003000126"]]);
  const again = whoFilters(
    () => undefined,
    (name) => (name === "npi" ? first.npi : []),
  );
  assert.deepEqual(again.npi, first.npi);
  // And never under the platform's internal field name, which the request layer does not accept.
  assert.equal(first.npis, undefined);
});

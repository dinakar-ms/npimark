// Run with `npm test` (node --test; Node strips the types from the imported .ts files).
//
// The export form and the "add all" form both render `searchFilters`' *output* as hidden fields
// under its own key names, and the route on the other side reads those fields back through
// `searchFilters` again. So every key the function emits has to be a key it also reads.
//
// It is not enough for the guard in backend/tests/test_site_search_filters.py to pass. That one
// asks "is every field on the form read by the one list?", which catches a filter the screen
// offers and the file drops. This asks the opposite question - "is every filter the file carries
// one the route can read back?" - and a key that fails it is a filter the screen counted, the
// form carried, and the route silently discarded on the way to the platform.
import assert from "node:assert/strict";
import { test } from "node:test";

import { searchFilters } from "./searchFilters.ts";

/** Read a URLSearchParams through `searchFilters`, the way the screen does. */
const fromUrl = (pairs) => {
  const url = new URLSearchParams(pairs);
  return searchFilters(
    (name) => url.get(name) ?? undefined,
    (name) => url.getAll(name),
  );
};

/**
 * Read an *output* object back, the way the export route does: the form rendered one hidden field
 * per value under the output's own key, so the route sees those names and nothing else.
 */
const fromOutput = (filters) => {
  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    for (const each of Array.isArray(value) ? value : [value]) form.append(key, String(each));
  }
  return searchFilters(
    (name) => form.get(name) ?? undefined,
    (name) => form.getAll(name),
  );
};

/**
 * Every control on the search form, with a value the normalisers accept.
 *
 * The screen's own spellings, because that is what a browser sends. Grouped only for reading.
 */
const EVERY_FIELD = [
  // who
  ["q", "reyes"],
  ["type", "individual"],
  ["credential", "MD"],
  ["credential", "NP"],
  ["first_name", "Maria"],
  ["last_name", "Reyes"],
  ["organization_name", "Seton"],
  ["npi_list", "1234567893, 1003000126"],
  ["has_facility", "true"],
  ["min_beds", "200"],
  // where
  ["state", "TX"],
  ["classification", "Internal Medicine"],
  ["city", "AUSTIN"],
  ["postal_code", "78701"],
  // reach
  ["has_email", "true"],
  ["email_trust", "trusted"],
  ["has_phone", "true"],
  ["has_address", "true"],
  ["has_domain", "true"],
  // the record
  ["ehr_system", "Epic"],
  ["enumerated_from", "2010"],
  ["enumerated_to", "2020"],
  ["min_star_rating", "3"],
  ["group_name", "Austin Clinic"],
  ["shortage_area", "any"],
  ["health_center", "any"],
  ["opted_out", "false"],
  ["excluded", "false"],
  ["revoked", "false"],
  // employer
  ["payer_employer", "any"],
  ["has_hie", "true"],
  // bills
  ["hcpcs_code", "27447"],
  ["min_hcpcs_services", "20"],
  ["drug", "METFORMIN"],
  ["min_drug_claims", "15"],
  ["min_medicare_beneficiaries", "50"],
  ["min_partd_claims", "25"],
  ["min_mips_score", "60"],
  // payments
  ["min_payment_amount", "5000"],
  ["payment_amount_below", "50000"],
  // leave out
  ["exclude_list_id", "3f1c9d2a-5b7e-4a61-9c48-2d6e8f0a1b33"],
  ["exclude_npi_list", "1003000134"],
  ["exclude_state", "CA"],
  ["exclude_city", "FRESNO"],
  ["exclude_postal_code", "93701"],
  ["exclude_taxonomy_classification", "Pediatrics"],
  ["exclude_credential", "DO"],
  ["exclude_ehr_system", "Cerner"],
  ["exclude_employer_domain", "example.com"],
  ["exclude_facility_type", "hospital"],
  // membership
  ["list_id", "9a8b7c6d-5e4f-4321-8765-0a1b2c3d4e5f"],
];

test("every filter the form carries survives being read back", () => {
  const once = fromUrl(EVERY_FIELD);
  const twice = fromOutput(once);

  const lost = Object.keys(once).filter((key) => {
    const a = JSON.stringify(once[key]);
    const b = JSON.stringify(twice[key]);
    return a !== b;
  });

  assert.deepEqual(
    lost,
    [],
    "these filters do not round-trip, so the export form carries them and the export route " +
      `drops them: ${lost.join(", ")}`,
  );
});

test("a second pass changes nothing, which is what the route depends on", () => {
  // The route reads the form once. If a third reading differed from the second, the function
  // would not be idempotent and the file would depend on how many times it had been parsed.
  const once = fromUrl(EVERY_FIELD);
  const twice = fromOutput(once);
  assert.deepEqual(fromOutput(twice), twice);
});

test("the test itself exercises something, not an empty object", () => {
  // A round-trip test over no filters passes and proves nothing. This is the guard on the guard.
  const once = fromUrl(EVERY_FIELD);
  assert.ok(
    Object.keys(once).length >= 40,
    `only ${Object.keys(once).length} filters came through; EVERY_FIELD has stopped matching ` +
      "the form's spellings",
  );
});

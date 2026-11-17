// Run with `npm test` (node --test; Node strips the types from the imported .ts files).
//
// One rule behind every case: **exporting from a search exports that search.** The export route's
// own words - "A filter the screen counted and the file ignored would make the 'this would use N
// rows' line beside the button a lie."
//
// It was a lie for twelve filters. The screen grew city, ZIP, street, a radius, four reachability
// flags, a trust tier, an EHR system and a status, and the export form carried none of them, so a
// search narrowed to Austin exported the whole of Texas and billed `export_rows` for every extra
// row. These cases are what stops that coming back: the screen and the route read the same list
// here, so a filter reaches the search, the form and the file together or reaches none of them.
import assert from "node:assert/strict";
import { test } from "node:test";
import { formReader, searchFilters } from "./searchFilters.ts";

/** The screen's side: one value per name, plus repeatables as arrays. */
function urlReader(values) {
  const read = (name) => {
    const value = values[name];
    return Array.isArray(value) ? value[0] : value;
  };
  const readAll = (name) => {
    const value = values[name];
    return value === undefined ? [] : Array.isArray(value) ? value : [value];
  };
  return [read, readAll];
}

/** The route's side: the same values, through a real FormData. */
function formValues(values) {
  const form = new FormData();
  for (const [name, value] of Object.entries(values)) {
    if (value === undefined) continue;
    for (const one of Array.isArray(value) ? value : [value]) form.append(name, one);
  }
  return formReader(form);
}

/** What both sides make of the same search. */
function both(values, options) {
  const [read, readAll] = urlReader(values);
  const [formRead, formReadAll] = formValues(values);
  return [
    searchFilters(read, readAll, options),
    searchFilters(formRead, formReadAll, options),
  ];
}

test("the screen and the export route read a search identically", () => {
  // The whole point of one module. Every filter the screen offers, at once, and the two answers must
  // be the same object - a difference here is a file that is not the search somebody counted.
  const search = {
    q: "cardiology",
    state: "TX",
    classification: "Internal Medicine",
    type: "individual",
    ehr_system: "Epic",
    status: "any",
    city: "Austin",
    postal_code: "78701",
    street: "43 New Scotland Ave",
    near_zip: "78701",
    radius_miles: "25",
    has_email: "true",
    has_phone: "false",
    email_trust: "trusted",
    has_home_address: "true",
    home_state: ["tx", "nm"],
    practice_home_relation: "same_state",
    opted_out: "false",
    min_partd_claims: "100",
    hcpcs_code: ["99213", "99214"],
    min_hcpcs_services: "25",
    drug: ["ATORVASTATIN"],
    min_drug_claims: "10",
  };
  const [fromScreen, fromRoute] = both(search);
  assert.deepEqual(fromScreen, fromRoute);
  // And it really did carry everything, rather than agreeing on a small set.
  assert.deepEqual(
    Object.keys(fromScreen).sort(),
    [
      "city", "drug", "ehr_system", "email_trust", "has_email", "has_home_address", "has_phone",
      "hcpcs_code", "home_state", "min_drug_claims", "min_hcpcs_services", "min_partd_claims",
      "near_zip", "opted_out", "postal_code", "practice_home_relation", "q", "radius_miles",
      "state", "status", "street", "taxonomy_classification", "type",
    ],
    "a filter the screen sends and the route drops is the bug this module exists to prevent",
  );
});

test("the twelve the export used to drop are carried", () => {
  // Named one by one, because this is the regression: each of these was on the screen and absent
  // from the file. `has_email=false` is in the list on purpose - the old route carried `has_email`
  // only when it was "true", so "the ones we hold no email for" exported as "all of them".
  const [filters] = both({
    city: "Austin",
    postal_code: "78701",
    street: "43 New Scotland Ave",
    near_zip: "78701",
    radius_miles: "10",
    email_trust: "probable",
    has_email: "false",
    has_phone: "true",
    has_address: "true",
    has_domain: "false",
    ehr_system: "Cerner",
    status: "inactive",
  });
  for (const name of [
    "city", "postal_code", "street", "near_zip", "radius_miles", "email_trust", "has_email",
    "has_phone", "has_address", "has_domain", "ehr_system", "status",
  ]) {
    assert.ok(name in filters, `${name} is missing - the file would not be the search`);
  }
  assert.equal(filters.has_email, "false", "'we hold none' is a filter, not an absence of one");
  assert.equal(filters.status, "inactive");
});

test("status is always sent, and an unrecognised one narrows rather than widens", () => {
  // A search that quietly included deactivated providers would put dead NPIs in somebody's file
  // without them choosing it, so the fallback is the narrow answer.
  assert.equal(both({})[0].status, "active");
  for (const asked of ["", "  ", "ACTIVE", "everything"]) {
    assert.equal(both({ status: asked })[0].status, "active", `status=${asked}`);
  }
  for (const asked of ["active", "inactive", "any"]) {
    assert.equal(both({ status: asked })[0].status, asked);
  }
  // Surrounding whitespace is forgiven rather than refused, as it is for `email_trust`: "any " from
  // a hand-edited URL means "any", and the check runs on the trimmed value. Asserted so the leniency
  // is deliberate - this case expected a refusal first and the implementation was the one right.
  assert.equal(both({ status: " any " })[0].status, "any");
});

test("the screen's field name becomes the platform's filter name", () => {
  // `classification` on the form, `taxonomy_classification` on the platform. The rename lives in one
  // place so neither side has to remember it - and so the route cannot forget it, which is how a
  // specialty-filtered search would have exported every specialty.
  const [filters] = both({ classification: "Pediatrics" });
  assert.equal(filters.taxonomy_classification, "Pediatrics");
  assert.ok(!("classification" in filters));
});

test("a street with nothing to anchor it is dropped, on both sides", () => {
  // The platform refuses it - "Needs a ZIP, city or radius" - and a 422 arrives as an empty page.
  const [fromScreen, fromRoute] = both({ street: "43 New Scotland Ave" });
  assert.ok(!("street" in fromScreen));
  assert.deepEqual(fromScreen, fromRoute);
  // A radius is an anchor, which is why the radius has to be settled first.
  assert.equal(
    both({ street: "43 New Scotland Ave", near_zip: "78701", radius_miles: "10" })[0].street,
    "43 New Scotland Ave",
  );
});

test("a half-given radius is no radius, so it cannot anchor a street either", () => {
  // `radiusFilter` returns both parts or neither; if these disagreed the street would be kept with
  // nothing to hold it and the search would be refused.
  const [filters] = both({ near_zip: "78701", street: "43 New Scotland Ave" });
  assert.equal(filters.near_zip, "78701", "a ZIP alone still anchors as a ZIP... via postal_code?");
  assert.ok("street" in filters, "the near_zip radius default anchors it");
});

test("nothing is ever sent in a shape the platform refuses", () => {
  // The invariant. Junk in every field at once, and what comes out is still only valid filters.
  const junk = {
    q: "x".repeat(500),
    state: " ",
    ehr_system: "NotAnEhr",
    status: "banana",
    postal_code: "nope",
    near_zip: "7870",
    radius_miles: "2.5.1",
    has_email: "yes",
    email_trust: "high",
    has_home_address: "1",
    home_state: ["Texas"],
    practice_home_relation: "SAME_ZIP",
    opted_out: "maybe",
    min_mips_score: "101",
    min_partd_claims: "-4",
    hcpcs_code: ["this is not a code"],
    min_hcpcs_services: "many",
    drug: [""],
    min_drug_claims: "lots",
  };
  const [fromScreen, fromRoute] = both(junk, { ehrSystems: ["Epic", "Cerner"] });
  assert.deepEqual(fromScreen, fromRoute);
  // `q` is kept but capped; `status` falls back; everything else was unusable and is simply absent.
  assert.deepEqual(Object.keys(fromScreen).sort(), ["q", "status"]);
  assert.equal(fromScreen.q.length, 200);
  assert.equal(fromScreen.status, "active");
});

test("an EHR system is checked against the list when the caller has one", () => {
  // Exact match on the platform's side, so a misspelling returns nothing and reads as "no providers
  // run that". The screen has the list; the route is handed an already-checked value.
  assert.equal(both({ ehr_system: "Epic" }, { ehrSystems: ["Epic"] })[0].ehr_system, "Epic");
  assert.ok(!("ehr_system" in both({ ehr_system: "Epicc" }, { ehrSystems: ["Epic"] })[0]));
  // Without a list it passes through: the route's value came from the screen's own hidden field.
  assert.equal(both({ ehr_system: "Epicc" })[0].ehr_system, "Epicc");
});

test("a floor without anything to be a floor of is dropped", () => {
  // The platform refuses `min_hcpcs_services` with no code, and that 422 reads as "nothing matched".
  const [filters] = both({ min_hcpcs_services: "25", min_drug_claims: "10" });
  assert.ok(!("min_hcpcs_services" in filters));
  assert.ok(!("min_drug_claims" in filters));
});

test("repeatable filters survive as lists, not as a joined string", () => {
  // `set` instead of `append` would keep only the last value and silently narrow a search somebody
  // thought they had widened.
  const [filters] = both({ hcpcs_code: ["99213", "99214"], home_state: ["tx", "ny"] });
  assert.deepEqual(filters.hcpcs_code, ["99213", "99214"]);
  assert.deepEqual(filters.home_state, ["TX", "NY"]);
});

test("an empty search sends only the status it always sends", () => {
  assert.deepEqual(both({})[0], { status: "active" });
});

test("the five public-record filters reach the file too", () => {
  // They are in the one list, so the export form renders them and the route reads them back -
  // which is the whole point of that list. A filter on the screen and absent from the file is the
  // bug this module exists to prevent, and these were the newest chance to reintroduce it.
  const [screen, route] = both({
    enumerated_from: "2015", enumerated_to: "2020", min_star_rating: "4.5",
    group_name: "Austin Family", shortage_area: ["dental", "primary_care"],
    health_center: "fqhc",
  });
  assert.deepEqual(screen, route);
  assert.equal(screen.enumerated_from, "2015");
  assert.equal(screen.enumerated_to, "2020");
  assert.equal(screen.min_star_rating, "4.5");
  assert.equal(screen.group_name, "Austin Family");
  assert.deepEqual(screen.shortage_area, ["dental", "primary_care"]);
  assert.deepEqual(screen.health_center, ["fqhc"]);
});

test("the six on the two new panels reach the file too", () => {
  // Industry payments and the three affiliations. In the one list, so the export form renders them
  // and the route reads them back - and the health system is the interesting one: the screen's
  // field is `system` and the platform's filter is `idn`, the second rename in this module. A
  // route that read only `system` would find nothing, because what the form posts is the output.
  const [screen, route] = both({
    min_payment_amount: "100",
    payment_amount_below: "5000",
    payment_year: "2024",
    system: ["ascension-health", "hca-healthcare"],
    payer_employer: "pbm",
    has_hie: "true",
  });
  assert.deepEqual(screen, route);
  assert.equal(screen.min_payment_amount, "100");
  assert.equal(screen.payment_amount_below, "5000");
  assert.equal(screen.payment_year, "2024");
  assert.deepEqual(screen.idn, ["ascension-health", "hca-healthcare"]);
  assert.equal(screen.payer_employer, "pbm");
  assert.equal(screen.has_hie, "true");
  assert.ok(!("system" in screen), "the platform's name is the one that is sent");
  // And the round trip, which is what the rename would break: the form posts `idn`, the route
  // reads it back, and the second pass has to be the same search.
  assert.deepEqual(both(screen)[0], screen);
  assert.deepEqual(both(screen)[1], screen);
});

test("a payment year with no amount beside it is not a filter", () => {
  // The platform accepts a lone `payment_year` and narrows nothing by it, which is worse than
  // refusing it: the screen would offer a year that does nothing and the file would agree.
  const [filters] = both({ payment_year: "2024" });
  assert.deepEqual(filters, { status: "active" });
});

test("a health system is never named to the platform by an internal id", () => {
  // `idn_systems.id` is an internal field and a filter value ends up in a URL the customer can
  // see, bookmark and share. Digits alone are what the platform reads as an id, so they are the
  // one shape this must not pass on.
  for (const bad of ["4212", "0", "Ascension Health", "hca_healthcare"]) {
    assert.ok(!("idn" in both({ system: bad })[0]), `system=${bad}`);
  }
  assert.deepEqual(both({ system: "any" })[0].idn, ["any"]);
});

test("the output goes back in and comes out the same", () => {
  // The property the export depends on. The form renders this object as its hidden fields and the
  // route reads it back through this same function, so a filter whose output name differs from its
  // input name would survive the screen and vanish on the way to the file. That is what
  // `taxonomy_classification` would have done - the form would have posted the platform's name and
  // the route would have looked for `classification` and found nothing.
  const search = {
    q: "cardiology",
    state: "TX",
    classification: "Internal Medicine",
    type: "individual",
    status: "any",
    city: "Austin",
    postal_code: "78701",
    street: "43 New Scotland Ave",
    near_zip: "78701",
    radius_miles: "25",
    has_email: "false",
    email_trust: "trusted",
    has_home_address: "true",
    home_state: ["tx", "nm"],
    practice_home_relation: "same_state",
    opted_out: "false",
    min_partd_claims: "100",
    hcpcs_code: ["99213"],
    min_hcpcs_services: "25",
    drug: ["ATORVASTATIN"],
    min_drug_claims: "10",
  };
  const once = both(search)[0];
  const [twiceFromScreen, twiceFromRoute] = both(once);
  assert.deepEqual(twiceFromScreen, once, "a second pass must not change or lose a filter");
  assert.deepEqual(twiceFromRoute, once, "and the route must read back exactly what the form posts");
});

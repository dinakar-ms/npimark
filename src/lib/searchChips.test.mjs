import assert from "node:assert/strict";
import { test } from "node:test";

import { searchChips } from "./searchChips.ts";

const chips = (query) => searchChips(new URLSearchParams(query));
const texts = (query) => chips(query).map((chip) => [chip.lead, chip.text].filter(Boolean).join(" "));

test("a search with no filters has nothing to say", () => {
  assert.deepEqual(chips(""), []);
  // Paging and the reveal round-trip are on the URL and are not filters: a chip offering to
  // remove `revealed` would offer to throw away what somebody has already paid for.
  assert.deepEqual(chips("page=3&revealed=9900000014&hcpcs_q=knee"), []);
});

test("the radius is one chip, and removing it drops both halves", () => {
  // The platform refuses a ZIP without miles and miles without a ZIP, so half a radius is a
  // refused search - which arrives as an empty page and reads as "nothing matched".
  const [chip] = chips("near_zip=78701&radius_miles=25");
  assert.equal(chip.lead, "Within");
  assert.equal(chip.text, "25 miles of 78701");
  assert.deepEqual(chip.remove, ["near_zip", "radius_miles"]);
});

test("the NPI year span is one chip, whichever end was set", () => {
  assert.deepEqual(texts("enumerated_from=2005&enumerated_to=2015"), ["NPI issued 2005–2015"]);
  assert.deepEqual(texts("enumerated_from=2005"), ["NPI issued 2005 onwards"]);
  assert.deepEqual(texts("enumerated_to=2015"), ["NPI issued up to 2015"]);
  // Either end removes the whole span: the chip describes the span, so it has to undo the span.
  assert.deepEqual(chips("enumerated_to=2015")[0].remove, ["enumerated_from", "enumerated_to"]);
});

test("one of several ticked codes comes off on its own", () => {
  const found = chips("hcpcs_code=27447&hcpcs_code=27130&drug=APIXABAN");
  assert.deepEqual(
    found.map((chip) => chip.remove),
    [
      [["hcpcs_code", "27447"]],
      [["hcpcs_code", "27130"]],
      [["drug", "APIXABAN"]],
    ],
  );
});

test("a repeatable asked as one question is one chip", () => {
  // "TX, NM" is one patch, not two searches, so it is one thing to undo.
  const [chip] = chips("home_state=TX&home_state=NM");
  assert.equal(chip.text, "TX, NM");
  assert.deepEqual(chip.remove, ["home_state"]);
});

test("a tri-state filter is said in the words the control uses", () => {
  // Never "has_email true". A chip reading `false` looks like a mistake somebody should undo,
  // when "we hold none" is a filter they chose on purpose.
  assert.deepEqual(texts("has_email=true"), ["Work email we hold one"]);
  assert.deepEqual(texts("has_email=false"), ["Work email we hold none"]);
  assert.deepEqual(texts("opted_out=true"), ["Medicare opted out"]);
  assert.deepEqual(texts("has_hie=false"), ["Information exchange not one we know of"]);
});

test("money and counts are readable, and a star rating says what it means", () => {
  assert.deepEqual(texts("min_payment_amount=5000"), ["Paid at least $5,000"]);
  assert.deepEqual(texts("min_medicare_beneficiaries=1500"), [
    "Medicare patients, at least 1,500",
  ]);
  assert.deepEqual(texts("min_star_rating=4"), ["Star rating 4 and above"]);
  assert.deepEqual(texts("status=any"), ["Status active and deactivated"]);
});

test("`any` is a value, not an absence", () => {
  // `shortage_area=any` means "in any shortage area on file", which is a real narrowing. Reading
  // it as no filter would hide it, and hiding a filter is this module's whole reason to exist.
  assert.deepEqual(texts("shortage_area=any"), ["Shortage area any on file"]);
});

test("a filter nothing has wording for still gets a chip", () => {
  // The failure this guards against is silence: a filter added to the screen and not here would
  // otherwise narrow the search invisibly. An awkward label is not a defect; an absent one is.
  assert.deepEqual(texts("min_widget_count=4"), ["min widget count 4"]);
});

test("chips are in the order the screen's groups are in", () => {
  // Not URL order: the chip row is read left to right against a rail laid out top to bottom, and
  // a row whose order changes with how somebody typed is a row nobody can scan.
  assert.deepEqual(texts("min_payment_amount=5000&state=TX&q=reyes"), [
    "Matching reyes",
    "State TX",
    "Paid at least $5,000",
  ]);
});

test("a specialty speaks for itself", () => {
  assert.deepEqual(texts("classification=Orthopaedic Surgery"), ["Orthopaedic Surgery"]);
});

// Run with `npm test` (node --test; Node strips the types from the imported .ts file).
//
// These are not tests of a shape. They are the two claims the offer catalogue must never make,
// and one it must never flatten - written down here because structured data is the only thing on
// the site no human proofreads before a search engine believes it.
import assert from "node:assert/strict";
import { test } from "node:test";
import { offerNodes } from "./offers.ts";
import { PLANS } from "./plans.ts";

const URL = "https://example.test/pricing";
const nodes = offerNodes(PLANS, URL);
const serialised = JSON.stringify(nodes);

test("every priced plan becomes exactly one offer", () => {
  const priced = PLANS.filter((plan) => plan.priceCents !== null);
  assert.equal(nodes.length, priced.length);
  assert.deepEqual(
    nodes.map((node) => node.name),
    priced.map((plan) => plan.name),
  );
});

test("a floor price is a minPrice, never a price", () => {
  // "from $1,500" is a floor. Published as `price` it becomes a quote we have not given.
  for (const plan of PLANS.filter((p) => p.from)) {
    const node = nodes.find((n) => n.name === plan.name);
    assert.ok(node, `${plan.name} is missing from the catalog`);
    assert.equal(node.price, undefined, `${plan.name} published a flat price for a floor`);
    assert.equal(node.priceSpecification.minPrice, Math.round(plan.priceCents / 100));
  }
  assert.ok(
    PLANS.some((plan) => plan.from),
    "no plan has a floor price any more - this test is now vacuous, check the catalog by hand",
  );
});

test("a fixed price is a price, and it is the one the page prints", () => {
  for (const plan of PLANS.filter((p) => !p.from && p.priceCents !== null)) {
    const node = nodes.find((n) => n.name === plan.name);
    assert.equal(node.price, Math.round(plan.priceCents / 100));
    assert.equal(node.priceSpecification, undefined);
  }
});

test("the catalog never claims a tier is available to buy", () => {
  // There is no checkout on this site; every paid tier is a conversation and an invoice. An
  // availability claim would be false in the format least likely to be noticed.
  for (const word of ["availability", "InStock", "OnlineOnly", "seller", "acceptedPaymentMethod"]) {
    assert.ok(!serialised.includes(word), `the offer catalog claimed ${word}`);
  }
});

test("the catalog names no source", () => {
  // The house rule: say the kind of thing a field is, never where it came from. An offer
  // catalogue is exactly where somebody would look for sourcing.
  for (const word of ["NPPES", "CMS", "Lantern", "CHPL", "CarePrecise", "registry", "crawl"]) {
    assert.ok(
      !serialised.toLowerCase().includes(word.toLowerCase()),
      `the offer catalog named ${word}`,
    );
  }
});

test("a plan with no list price is left out rather than published at nought", () => {
  const unpriced = { ...PLANS[0], code: "quote", name: "Quote", priceCents: null };
  const withUnpriced = offerNodes([...PLANS, unpriced], URL);
  assert.equal(withUnpriced.length, nodes.length);
  assert.ok(!withUnpriced.some((n) => n.name === "Quote"));
});

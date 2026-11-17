/**
 * The offer catalogue, as structured data.
 *
 * Why this is a module and not six lines inside `/pricing`
 * -------------------------------------------------------
 * Structured data is the one thing on the site that no human proofreads. A sentence that
 * overclaims gets caught by somebody reading the page; a JSON-LD node that overclaims is read
 * only by search engines and answer engines, and it is read as fact. So the two rules this
 * catalogue must never break are enforced by `offers.test.mjs` rather than by remembering:
 *
 * **No availability claim.** There is no checkout on this site - every paid tier is a
 * conversation and an invoice (`NO_CHECKOUT` in lib/plans). `"availability": "InStock"` on a
 * tier nobody can buy online is false, and false in the format least likely to be noticed.
 *
 * **No source named.** An offer catalogue is exactly where a competitor looks for one, and the
 * house rule is that the site says the kind of thing a field is and never where it came from.
 *
 * A third rule is about honesty rather than secrecy: a tier whose price is a floor - "from
 * $1,500" - is a `priceSpecification` with `minPrice`, never a `price`. Flattening it to a price
 * publishes a quote nobody has given.
 */

import { type Plan } from "./plans.ts";

/** A schema.org Offer, as much of one as we can say truthfully. */
export type OfferNode = {
  "@type": "Offer";
  name: string;
  description: string;
  url: string;
  priceCurrency: "USD";
  price?: number;
  priceSpecification?: {
    "@type": "PriceSpecification";
    priceCurrency: "USD";
    minPrice: number;
    valueAddedTaxIncluded: false;
  };
};

/** Whole dollars. `plans.ts` holds cents because that is what the platform bills in. */
function dollarsOf(plan: Plan): number {
  return Math.round((plan.priceCents ?? 0) / 100);
}

/**
 * One Offer per plan, in the order the page shows them.
 *
 * A plan with no list price at all (`priceCents === null`, "On request") is left out rather than
 * published at nought - a free tier and a tier we have not priced are different things, and
 * zero would say the second was the first.
 */
export function offerNodes(plans: readonly Plan[], url: string): OfferNode[] {
  return plans
    .filter((plan) => plan.priceCents !== null)
    .map((plan) => {
      const base = {
        "@type": "Offer" as const,
        name: plan.name,
        description: plan.tagline,
        url,
        priceCurrency: "USD" as const,
      };
      return plan.from
        ? {
            ...base,
            priceSpecification: {
              "@type": "PriceSpecification" as const,
              priceCurrency: "USD" as const,
              minPrice: dollarsOf(plan),
              valueAddedTaxIncluded: false as const,
            },
          }
        : { ...base, price: dollarsOf(plan) };
    });
}

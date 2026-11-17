/**
 * Reach: how far into a provider record a plan lets you go.
 *
 * Why this file exists
 * --------------------
 * The pricing page used to read as a volume ladder - four tiers metered in rows, then a fifth at a
 * higher price. A buyer who compares `scale` and `contact` in `plans.ts` finds **identical**
 * volumes: same rows, same daily cap, same reveals, same API calls, same seats, same alerts. The
 * only difference between $999 and from $1,500 is `premiumContacts`.
 *
 * So volume is not what separates the plans at the top, and saying it is makes the price look
 * arbitrary. What separates them is **how deep into the record you may go**, and that is a ladder
 * of three bands rather than a list of five prices:
 *
 *   1. the public record   - what NPPES already publishes. Searchable here, free, no account.
 *   2. the verified work email - the part we do the work on. Metered, per provider, per month.
 *   3. home address and cell phone - personal. Under a signed agreement, never online.
 *
 * That order is also the honest order: public first, then what we found, then what is personal and
 * fenced. The site's structure should say so without a paragraph explaining it, which is the whole
 * reason this is a module the pages render rather than prose somebody retypes.
 *
 * What must never be said here
 * ----------------------------
 * - Never add a band for a field we do not actually meter. The bands exist because `plans.ts`
 *   models them: `reveals` is band 2 and `premiumContacts` is band 3. A third thing invented to
 *   balance the layout would read exactly like a priced one.
 * - Never describe band 1 as something we provide. It is public record; what we provide is that it
 *   is current, searchable and joined up.
 * - Never imply band 3 can be bought. It needs a signed agreement with a stated permissible use.
 * - Never put a band-2 or band-3 value into HTML, JSON-LD or a sitemap for a visitor who has not
 *   been metered for it. A held field is *absent from the response*, never rendered and hidden -
 *   a blurred email in the markup is a free email.
 */

import { type Plan, count } from "@/lib/plans";

export type BandKey = "public" | "verified" | "personal";

export type Band = {
  key: BandKey;
  /** What a reader calls this band. */
  name: string;
  /** One line: what is in it. */
  what: string;
  /**
   * What we stand behind about this band - never where it came from.
   *
   * House rule, and it is a commercial one rather than a stylistic one: the site says the *kind*
   * of thing a field is and what we guarantee about it, and never the source, the supplier or the
   * method. A buyer who can read our sourcing off the pricing page can go and buy it directly.
   * "Refreshed weekly" and "checked for deliverability" are promises; "found by crawling the
   * practice website" is a recipe. Only the first belongs here.
   */
  provenance: string;
  /** The fields, in the order a record shows them. */
  fields: readonly string[];
  /** How this band is paid for, in the fewest words that are still true. */
  gate: string;
  /** Two words for the corner of a record. `gate` is a sentence and overflows there. */
  tag: string;
};

export const BANDS: readonly Band[] = [
  {
    key: "public",
    name: "The public record",
    what: "Who the provider is, and where they practice.",
    provenance:
      "Public record, kept current rather than collected once. Refreshed weekly.",
    fields: ["NPI", "Name and credential", "Specialty", "Practice address", "Practice phone"],
    gate: "Free. No account, and no limit on searching it.",
    tag: "Free",
  },
  {
    key: "verified",
    name: "Work email access",
    what: "Available work email addresses for the providers on your list.",
    provenance:
      "Review the available verification status and check date. Availability does not guarantee delivery.",
    fields: ["Work email", "Deliverability grade", "When it was last checked"],
    gate: "Included up to your plan allowance. A work email unlock is recorded as a reveal in your account.",
    tag: "Plan allowance",
  },
  {
    key: "personal",
    name: "Home address and cell phone",
    what: "Additional contact details where available, subject to contract and permitted use.",
    provenance:
      "Licensed, matched to the person rather than to the practice, and released only for a " +
      "use stated in writing.",
    fields: ["Home address", "Cell phone"],
    gate: "Under a signed agreement with a stated permissible use. Not sold online.",
    tag: "Under contract",
  },
];

export const BAND_BY_KEY: Readonly<Record<BandKey, Band>> = Object.fromEntries(
  BANDS.map((band) => [band.key, band]),
) as Record<BandKey, Band>;

/** Whether a plan opens a band at all. Band 1 is open to everyone, signed in or not. */
export function opensBand(plan: Plan, band: BandKey): boolean {
  if (band === "public") return true;
  if (band === "verified") return plan.reveals > 0;
  return plan.premiumContacts;
}

/**
 * What a plan's allowance is in that band, as a phrase a plan card can print. Band 1 has no
 * allowance because there is nothing to meter; band 3 has no number because it is a contract term
 * rather than a monthly count.
 */
export function allowanceIn(plan: Plan, band: BandKey): string | null {
  if (band === "public") return null;
  if (band === "verified") return `${count(plan.reveals)} a month`;
  return plan.premiumContacts ? "Under contract" : null;
}

/** The deepest band a plan reaches. What a plan card leads with. */
export function deepestBand(plan: Plan): Band {
  if (plan.premiumContacts) return BAND_BY_KEY.personal;
  if (plan.reveals > 0) return BAND_BY_KEY.verified;
  return BAND_BY_KEY.public;
}

/**
 * The sentence that replaces "monthly, cancel any time" at the top of the pricing page. Built from
 * the plans rather than typed, so it cannot drift from the table underneath it: if someone later
 * gives `contact` more rows than `scale`, this stops claiming the volumes match.
 */
export function ladderLede(plans: readonly Plan[]): string {
  const top = plans.find((p) => p.premiumContacts);
  const below = [...plans]
    .filter((p) => !p.premiumContacts && p.priceCents !== null && p.priceCents > 0)
    .sort((a, b) => (b.priceCents ?? 0) - (a.priceCents ?? 0))[0];
  const sameVolume =
    top !== undefined &&
    below !== undefined &&
    top.rows === below.rows &&
    top.reveals === below.reveals &&
    top.apiCalls === below.apiCalls &&
    top.seats === below.seats;
  if (!sameVolume || top === undefined || below === undefined) {
    return (
      "Search public provider profiles for free. Compare the work email allowance, data access, and team size included in each plan."
    );
  }
  return (
    `Search public provider profiles for free. Paid plans add work email access and larger data allowances. ` +
    `${top.name} adds premium contact access under contract, with the same data record, work email, API call, and seat allowances as ${below.name}.`
  );
}

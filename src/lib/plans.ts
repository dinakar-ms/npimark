/**
 * The plans, their prices and their limits. One place, because a limit typed into prose is a limit
 * that will be wrong by November.
 *
 * Why a module rather than a page
 * -------------------------------
 * Before this file the free plan's numbers were typed out three times - on `/pricing`, on
 * `/sign-up` and in the terms - and the three had already drifted: the pricing page said "25 work
 * email reveals", the terms said "25 reveals", and sign-up mentioned neither the API calls, the
 * seats nor the alerts. Every one of them is a sentence a prospect can quote back during a contract
 * argument, so there is one set of figures here and the pages render it.
 *
 * These figures are the same ones migration `0135_plan_prices` seeds into the `plans` table, which
 * is what the platform actually enforces. That is the pairing to keep: this file is what the public
 * pages *say*, the plan row is what refuses, and the signed-in app never reads this file at all -
 * it reads the allowance from `/api/billing`, so what a customer is shown about their own account
 * always comes from the row rather than from marketing copy.
 *
 * What must never be said here
 * ----------------------------
 * - Never a figure the owner has not approved. A number invented to fill a column reads exactly
 *   like a priced one once it is on the page.
 * - Never imply the contract tier is self-serve. It needs a signed agreement with a stated
 *   permissible use, and no amount of card details can produce one.
 * - Never imply a paid plan can be bought online today. Nothing is charged anywhere on this site;
 *   every paid tier is a conversation and an invoice.
 */

/**
 * Introductory, and the owner will revise them. Said plainly rather than in a footnote: a price
 * somebody plans a budget around and then finds changed is worse than a price marked as early.
 */
export const INTRODUCTORY =
  "These are introductory prices and may change before general availability. A price you are " +
  "quoted in writing is the price you pay for the term of that quote.";

/** Beyond the allowance the meter keeps going rather than stopping the work. */
export const OVERAGE =
  "Over your monthly allowance, further rows are $10 per 1,000 rows rather than a refusal, " +
  "billed on your next invoice.";

/** The daily cap rule. The numbers themselves are on each plan, because they differ. */
export const DAILY_CAP_RULE =
  "Every paid plan also has a daily cap of roughly a tenth of the month, so one afternoon " +
  "cannot spend the month. A daily cap resets at midnight UTC; your month is not spent.";

/** The annual discount. */
export const ANNUAL = "Pay for a year up front and two months are free.";

/** Nothing on this site takes a payment. Every paid tier is a conversation. */
export const NO_CHECKOUT =
  "There is no checkout on this site yet. Tell us which plan you want and we will set it up and " +
  "invoice you; card billing comes later.";

/** What the contract tier requires, and what it is not. */
export const CONTRACT_ONLY =
  "Provider home address and cell phone are sold only under a signed agreement that states your " +
  "permissible use. That tier is not available online and cannot be bought with a card.";

export type Plan = {
  /** The `plans.code` the platform enforces this tier under. */
  code: string;
  name: string;
  /** Monthly price in cents, matching `plans.price_cents`. Null on a tier with no list price. */
  priceCents: number | null;
  /** True where the price is a floor rather than the price - "from $1,500". */
  from?: boolean;
  /** What sits under the price: the commitment, in the fewest words that are still true. */
  period: string;
  tagline: string;
  /** Rows a month: exports, API rows and appended rows all come off this. */
  rows: number;
  /** Rows a day, roughly a tenth of the month. Null on the free plan, which has no daily cap. */
  dailyRows: number | null;
  /** Work email reveals a month, counted per provider rather than per request. */
  reveals: number;
  /** `/v1` calls a month. */
  apiCalls: number;
  seats: number;
  alerts: number;
  /** Whether the Append tool accepts the customer's own file on this tier. */
  append: boolean;
  /** Whether provider home address and cell phone are included - contract only, wherever true. */
  premiumContacts: boolean;
  /** What the customer commits to. */
  commitment: string;
  /** The recommended tier, ringed on the pricing page. One of them, or the ring means nothing. */
  featured?: boolean;
};

export const PLANS: readonly Plan[] = [
  {
    code: "free",
    name: "Free",
    priceCents: 0,
    period: "no card, no end date",
    tagline: "See the data with your own searches.",
    rows: 250,
    dailyRows: null,
    reveals: 25,
    apiCalls: 500,
    seats: 3,
    alerts: 3,
    append: false,
    premiumContacts: false,
    commitment: "None. It does not expire and there is nothing to cancel.",
  },
  {
    code: "starter",
    name: "Starter",
    priceCents: 9_900,
    period: "per month",
    tagline: "One person working a list at a time.",
    rows: 5_000,
    dailyRows: 500,
    reveals: 250,
    apiCalls: 10_000,
    seats: 3,
    alerts: 10,
    append: false,
    premiumContacts: false,
    commitment: "Monthly. Cancel any time.",
  },
  {
    code: "professional",
    name: "Professional",
    priceCents: 39_900,
    period: "per month",
    tagline: "For one team working lists every week.",
    rows: 25_000,
    dailyRows: 2_500,
    reveals: 1_500,
    apiCalls: 50_000,
    seats: 5,
    alerts: 25,
    append: true,
    premiumContacts: false,
    commitment: "Monthly. Cancel any time.",
    featured: true,
  },
  {
    code: "scale",
    name: "Scale",
    priceCents: 99_900,
    period: "per month",
    tagline: "Volume for a whole team, and room in the API.",
    rows: 100_000,
    dailyRows: 10_000,
    reveals: 6_000,
    apiCalls: 250_000,
    seats: 10,
    alerts: 100,
    append: true,
    premiumContacts: false,
    commitment: "Monthly. Cancel any time.",
  },
  {
    code: "contact",
    name: "Contact",
    priceCents: 150_000,
    from: true,
    period: "per month, annual agreement",
    tagline: "Adds provider home address and cell phone, under contract.",
    rows: 100_000,
    dailyRows: 10_000,
    reveals: 6_000,
    apiCalls: 250_000,
    seats: 10,
    alerts: 100,
    append: true,
    premiumContacts: true,
    commitment: "Annual agreement with a stated permissible use. Not sold online.",
  },
];

/** The plan a stranger who signs up lands on. Looked up rather than assumed to be first. */
export const FREE_PLAN: Plan = PLANS.find((plan) => plan.code === "free") ?? PLANS[0];

/** The cheapest list price on the site, for the pages that say "from". */
export const CHEAPEST_PAID: Plan =
  PLANS.filter((plan) => (plan.priceCents ?? 0) > 0).sort(
    (a, b) => (a.priceCents ?? 0) - (b.priceCents ?? 0),
  )[0] ?? PLANS[1];

/** A whole-dollar price. Every price on the site is whole dollars, and cents would read as noise. */
export function dollars(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}

/** What goes in the big type on a plan card: `Free`, `$99`, `from $1,500`. */
export function priceLabel(plan: Plan): string {
  if (plan.priceCents === null) return "On request";
  if (plan.priceCents === 0) return "Free";
  return plan.from ? `from ${dollars(plan.priceCents)}` : dollars(plan.priceCents);
}

/** A grouped figure: `25,000`. Shared so no page formats a number its own way. */
export function count(value: number): string {
  return value.toLocaleString("en-US");
}

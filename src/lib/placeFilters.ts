/**
 * Where they practise, and how reachable they are — two filter families the help page already
 * describes and the customer's own search screen did not offer.
 *
 * `/help/search-and-filters` lists "State, city, ZIP, street, or a radius in miles around a ZIP"
 * under where they practise, and "whether a work email exists, the trust tier it has to clear,
 * whether the employer has a website domain" under how reachable they are. Only state and the
 * radius were on the signed-in screen — and `has_email` was on the *public* form, so an anonymous
 * visitor could filter on it and a paying customer could not.
 *
 * Why these need a module rather than four lines in the page
 * ---------------------------------------------------------
 * Each of them has a rule that turns a typo into an empty page, and an empty page reads as "nothing
 * matched" when it means "bad input" — the mistake every other filter on that page is shape-checked
 * to avoid.
 *
 * * **street is refused without a ZIP, city or radius.** The platform says so in the parameter's own
 *   description, because a street name alone would scan the country. Sent alone it is a 422.
 * * **postal_code takes several, comma-separated**, and each must be a 5-digit ZIP or a 3-digit SCF
 *   prefix. One bad entry in a list of ten would refuse the whole search.
 * * **email_trust is an enum**, so anything outside it is refused rather than ignored.
 * * The tri-state flags are `true`, `false` or absent. `"false"` is a filter and `""` is not, which
 *   is a distinction a bare truthiness check gets wrong — and getting it wrong here silently drops
 *   the customer's "no, I want the ones *without* an email" and answers a different question.
 */

/** What the platform accepts for `email_trust`. Mirrors `EmailTrustFilter` in provider_query.py. */
export const EMAIL_TRUST = ["trusted", "probable", "any"] as const;
export type EmailTrust = (typeof EMAIL_TRUST)[number];

/** The tri-state flags this module normalises, all `bool | None` on the platform. */
export const REACH_FLAGS = ["has_email", "has_domain", "has_phone", "has_address"] as const;
export type ReachFlag = (typeof REACH_FLAGS)[number];

const ZIP_OR_SCF = /^(\d{5}|\d{3})$/;
const CITY_MAX = 120;
const STREET_MAX = 120;

/**
 * ZIPs, cleaned. Several are allowed, comma-separated; anything that is not a 5-digit ZIP or a
 * 3-digit prefix is dropped rather than sent, because one bad entry refuses the whole search.
 *
 * Returns the cleaned, comma-joined list, or "" for nothing usable.
 */
export function postalCodes(raw: string | undefined): string {
  const good = (raw ?? "")
    .split(",")
    .map((one) => one.trim())
    .filter((one) => ZIP_OR_SCF.test(one));
  // Duplicates are dropped too: "78701, 78701" is one place, and the platform would count it twice
  // in nothing but the URL's length.
  return [...new Set(good)].join(",");
}

export type PlaceFilter = {
  city?: string;
  postal_code?: string;
  street?: string;
};

/**
 * City, ZIP and street, with the platform's own dependency respected.
 *
 * `hasRadius` says whether a radius filter is already in play (see `lib/radius.ts`), because that
 * satisfies the street rule just as a city or a ZIP does. Street is dropped — not the whole filter
 * set — when nothing anchors it: the customer still gets the search they asked for, minus the one
 * term that would have refused it.
 */
export function placeFilter(
  city: string | undefined,
  postal: string | undefined,
  street: string | undefined,
  hasRadius: boolean,
): PlaceFilter {
  const out: PlaceFilter = {};
  const cleanCity = (city ?? "").trim().slice(0, CITY_MAX);
  const cleanZips = postalCodes(postal);
  const cleanStreet = (street ?? "").trim().slice(0, STREET_MAX);

  if (cleanCity) out.city = cleanCity;
  if (cleanZips) out.postal_code = cleanZips;
  // The platform's rule, in its own words: "Needs a ZIP, city or radius." Sending it alone is a 422,
  // which arrives here as an empty result and reads as an answer.
  if (cleanStreet && (cleanCity || cleanZips || hasRadius)) out.street = cleanStreet;
  return out;
}

/** Whether a street was typed but had nothing to anchor it, so the page can say why it was ignored. */
export function streetNeedsAnchor(
  street: string | undefined,
  city: string | undefined,
  postal: string | undefined,
  hasRadius: boolean,
): boolean {
  const typed = (street ?? "").trim() !== "";
  const anchored = (city ?? "").trim() !== "" || postalCodes(postal) !== "" || hasRadius;
  return typed && !anchored;
}

export type ReachFilter = Partial<Record<ReachFlag, "true" | "false">> & {
  email_trust?: EmailTrust;
};

/**
 * The reachability flags and the trust tier.
 *
 * Only `"true"` and `"false"` are passed on. Anything else - absent, blank, or something nobody
 * meant to type - is no filter at all, which is what "Any" on the form means. `"false"` is
 * deliberately a filter: "the ones we have no email for" is a real question, and treating it as
 * falsy would silently answer the opposite one.
 */
export function reachFilter(
  params: (name: string) => string | undefined,
): ReachFilter {
  const out: ReachFilter = {};
  for (const flag of REACH_FLAGS) {
    const value = (params(flag) ?? "").trim();
    if (value === "true" || value === "false") out[flag] = value;
  }
  const trust = (params("email_trust") ?? "").trim();
  if ((EMAIL_TRUST as readonly string[]).includes(trust)) out.email_trust = trust as EmailTrust;
  return out;
}

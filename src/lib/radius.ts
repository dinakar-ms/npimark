/**
 * "Within N miles of a ZIP", turned into the pair of filters the platform accepts — or nothing.
 *
 * The platform has had radius search all along: `near_zip` and `radius_miles` on provider search,
 * a real haversine test against ZIP centroids rather than a prefix match on the ZIP column. It was
 * never on the customer's own search screen, so the one filter a territory-based sales team reaches
 * for first was the one filter they could not use.
 *
 * Why this is a function and not four lines in the page
 * ----------------------------------------------------
 * The two values are only ever valid together. The API refuses each without the other:
 *
 *   near_zip without radius_miles  ->  422, "Add a radius in miles (1-250)..."
 *   radius_miles without near_zip  ->  422, "Add the 5-digit ZIP to search around..."
 *
 * and a 422 reaches the search page as an empty result, which reads as "nothing matched" when it
 * means "bad input" — the mistake every other filter on that page is already shape-checked to
 * avoid. So the rule lives in one testable place instead of being re-derived next to the others.
 *
 * What it decides
 * ---------------
 * * A ZIP that is not five digits is not a location, so the whole pair is dropped. Someone typing
 *   `787` has not yet finished, and searching the entire country for them is not a kindness.
 * * A ZIP with no radius gets {@link DEFAULT_RADIUS_MILES}, which is what the platform's own
 *   parameter description says the UI sends. Dropping the ZIP instead would silently widen a
 *   search to the whole country, and a wider answer is the one a customer is least likely to
 *   notice is wrong.
 * * A radius with no ZIP is dropped, because there is no centre to measure from. Nothing is
 *   assumed on the customer's behalf about *where*.
 * * A radius outside 1..{@link MAX_RADIUS_MILES} is clamped rather than dropped, because the
 *   intent is unambiguous — somebody asking for 400 miles wants "as wide as you do" — whereas a
 *   dropped radius would quietly become a national search.
 * * A radius that is not plainly a whole number gets the default. Not `parseInt` alone: it reads
 *   leading digits and discards the rest, so "2.5.1" would mean two miles. A typo that narrows a
 *   search to nothing is harder to notice than one that does nothing at all.
 */

/** Mirrors `MAX_RADIUS_MILES` in `app/api/provider_query.py`. */
export const MAX_RADIUS_MILES = 250;

/** Mirrors `DEFAULT_RADIUS_MILES`: what the platform documents the UI as sending. */
export const DEFAULT_RADIUS_MILES = 25;

/** The choices offered on the form. Every one is inside the platform's range. */
export const RADIUS_CHOICES = [5, 10, 25, 50, 100, MAX_RADIUS_MILES] as const;

const ZIP5 = /^\d{5}$/;
const WHOLE = /^\d+$/;

export type RadiusFilter = { near_zip: string; radius_miles: number } | Record<string, never>;

/**
 * The pair, or an empty object to spread into a filter set and add nothing.
 *
 * Both arguments are whatever arrived in the query string, so both may be absent, blank, or
 * something nobody meant to type.
 */
export function radiusFilter(zip: string | undefined, miles: string | undefined): RadiusFilter {
  const near = (zip ?? "").trim();
  if (!ZIP5.test(near)) return {};

  // Whole digits only, deliberately not `parseInt` on its own. `parseInt` reads leading digits and
  // ignores the rest, so "2.5.1" would have become a **2 mile** radius - a search narrowed to almost
  // nothing by a typo, which is worse than either refusing it or widening it. Anything this cannot
  // read unambiguously gets the documented default instead.
  const asked = WHOLE.test((miles ?? "").trim()) ? Number((miles ?? "").trim()) : NaN;
  if (!Number.isFinite(asked)) return { near_zip: near, radius_miles: DEFAULT_RADIUS_MILES };
  return { near_zip: near, radius_miles: Math.min(Math.max(asked, 1), MAX_RADIUS_MILES) };
}

/** Whether the radius row on the form should start open: it is in use. */
export function radiusInUse(filter: RadiusFilter): boolean {
  return "near_zip" in filter;
}

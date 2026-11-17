/**
 * «Test it on your own list»: the shape of a coverage report, and how the page words it.
 *
 * Why the site holds no arithmetic of its own
 * -------------------------------------------
 * Every number on the result page is computed by the platform's append engine and arrives here
 * already counted (`backend/app/list_test.py`). This module holds the type, the fetch, and the two
 * things the page has to decide for itself: how to say "n of N" in words, and where a named field
 * lives in the published field reference. Nothing here derives a figure, sums a column or fills a
 * gap - a page that recomputed even one of these could disagree with the file a buyer is about to
 * be sent, which is the one failure that would make the whole tool worthless.
 *
 * The field reference is where a reader goes next
 * ----------------------------------------------
 * Each row arrives with a `key` that is an anchor in the published field reference, and `fieldHref`
 * turns it into a link so a reader who does not know what "billing group" is can go and read the
 * entry. The words printed are the ones the platform sent, which are taken from that same reference
 * (`backend/app/list_test.py`) - with one deliberate difference: a row that measures several fields
 * at once says what it actually measured. "City, state and ZIP together" is not the reference's
 * entry for `city` and must not be labelled as if it were, and "more than one practice location" is
 * not the same statement as "practice locations". So the link points at the reference and the label
 * describes the count, which is the only arrangement where neither of them lies.
 */

import { ALL_FIELDS } from "@/lib/fields";
import { apiGetWithToken, type ApiResult } from "@/lib/session";

/** Where the report lives, and what its result pages hang off. */
export const LIST_TEST_PATH = "/test-your-list";

/** One counted line: a field, and how many of the submitted identifiers carry it. */
export type Bar = {
  /** The field's anchor in the published field reference. */
  key: string;
  label: string;
  detail: string;
  count: number;
};

export type Bucket = { key: string; label: string; count: number };

export type ListTestReport = {
  token: string;
  created_at: string;
  expires_at: string;
  /** Ten-digit runs found in what was sent, before validation and de-duplication. */
  submitted: number;
  rejected: number;
  duplicates: number;
  /** For an uploaded file, the header the identifiers were read from. */
  column: string | null;
  /** Distinct valid identifiers measured: the denominator every count is out of. */
  listed: number;
  held: number;
  held_active: number;
  held_inactive: number;
  /** Not in our data - never held, or suppressed. One bucket, deliberately. */
  not_held: number;
  individuals: number;
  organizations: number;
  asked: Bar[];
  extra: Bar[];
  /** Facts some of the list carries. A zero is good news, so these are never drawn as gaps. */
  flags: Bucket[];
  email: { any: number; tiers: Bar[] };
  /** How long ago each held record was last confirmed. Out of `held`, not out of `listed`. */
  confirmed: Bucket[];
  /** What we do not hold for this list at all, by name. */
  gaps: { key: string; label: string }[];
};

/** The saved report behind a token, or the API's own refusal so the page can word it. */
export async function readListTest(token: string): Promise<ApiResult<ListTestReport>> {
  return apiGetWithToken<ListTestReport>(`/api/list-test/${encodeURIComponent(token)}`);
}

/** A link into the field reference, or null when the key is not one it publishes. */
export function fieldHref(key: string): string | null {
  return ALL_FIELDS.some((field) => field.key === key) ? `/fields#${key}` : null;
}

/**
 * "37 of 100" - never a bare percentage.
 *
 * A percentage on its own is how a coverage figure gets misread: 37% of an unstated denominator
 * reads as a promise about any list, and a reader who multiplies it by their own 4,000 rows has
 * been misled by arithmetic we handed them. The count and the denominator travel together, and the
 * share is offered afterwards as a reading of them rather than instead of them.
 */
export function ofList(count: number, listed: number): string {
  return `${count.toLocaleString()} of ${listed.toLocaleString()}`;
}

/** The share, for the bar's width and for the sentence after the count. Never shown alone. */
export function share(count: number, listed: number): number {
  return listed > 0 ? Math.round((count / listed) * 100) : 0;
}

/** A date in the one form the rest of the site writes them. */
export function onDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

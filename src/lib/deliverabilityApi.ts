/**
 * The one call this feature makes to the platform.
 *
 * Split from `lib/deliverability.ts` so the types and the formatting can be tested without a server:
 * this module is `server-only` and reaches the API, that one is arithmetic on what comes back. The
 * split is not ceremony - the rule being tested there is "an absent figure renders as absent", and a
 * test that needed an API key to check it would not be run.
 */

import "server-only";
import { apiFetch } from "@/lib/api";
import { type Deliverability, nothing } from "@/lib/deliverability";

/**
 * The measurement, or `nothing()`. Never throws.
 *
 * Cached for an hour rather than the site's usual day: a run lands once a month, but when one does
 * the number on the page is the reason somebody is reading it, and an hour is short enough that
 * nobody is quoting a figure the platform has already replaced.
 */
export async function deliverability(): Promise<Deliverability> {
  try {
    const response = await apiFetch("/deliverability", { revalidate: 3_600 });
    if (!response.ok) return nothing();
    const body = (await response.json()) as Deliverability;
    return {
      measured: Boolean(body.measured),
      method: body.method ?? null,
      latest: body.latest ?? null,
      history: body.history ?? [],
    };
  } catch {
    // Unreachable API, no key, bad JSON. The page says nothing has been published rather than
    // showing a figure it could not read.
    return nothing();
  }
}

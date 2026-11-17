/**
 * How many searches one visitor may run, before anything is asked of the API.
 *
 * The public search page caps a visitor at two pages, so a single query yields fifty rows. That
 * stops the obvious scrape and not the patient one: a crawler varies the filters - fifty states,
 * then specialties within each - and takes fifty rows a time for as long as it likes. The cap
 * limits the depth of one query; this limits how many queries.
 *
 * **Why here and not in the API.** Every public search reaches the API from the site container
 * under one key, so an API-side limit per key or per source address would throttle the whole site
 * rather than one visitor, and a limit per *visitor* would need the site to forward an address the
 * API then has to decide whether to trust. The site already knows who is asking, is a single
 * process, and can refuse before spending an API call at all. The API keeps its own per-key
 * metering, which is a different job.
 *
 * **What it does not do.** A botnet, or anything with a pool of addresses, is unaffected - this
 * counts one address at a time. It raises the cost of the cheapest scrape from "free" to "needs
 * infrastructure", and that is the whole claim. Signed-in customers are metered by plan and never
 * reach this.
 *
 * Fails open by design. With no address to count - which happens only when the container is
 * reached directly rather than through the public edge, i.e. from the host or the internal
 * network - nothing is limited. Counting every unknown visitor as one shared bucket would close
 * public search for everybody the first time the header went missing, and that is a worse failure
 * than not limiting a path the internet cannot reach.
 */

/** A burst: enough for somebody refining a search quickly, far below a crawler's pace. */
export const PER_MINUTE = 20;
/** Sustained: no person runs 120 distinct searches in an hour; a crawler does it in two minutes. */
export const PER_HOUR = 120;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

/** When each address searched, newest last. One process, so this is the whole picture. */
const seen = new Map<string, number[]>();

/**
 * Drop anything older than the longest window.
 *
 * Called on every check rather than on a timer: a timer in a server component is a handle nobody
 * owns, and at this volume the walk is cheaper than the bookkeeping to avoid it. The map holds one
 * entry per address that searched in the last hour.
 */
function prune(now: number): void {
  for (const [address, times] of seen) {
    const live = times.filter((at) => now - at < HOUR);
    if (live.length === 0) seen.delete(address);
    else seen.set(address, live);
  }
}

export type LimitVerdict =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number; window: "minute" | "hour" };

/**
 * Whether this address may run another search, counting it if so.
 *
 * `address` is the visitor's, as the public edge resolved it - never a header the visitor wrote.
 * `null` means we do not know, and an unknown visitor is not counted or refused.
 */
export function allowSearch(address: string | null, now = Date.now()): LimitVerdict {
  if (!address) return { allowed: true };
  prune(now);

  const times = seen.get(address) ?? [];
  const inMinute = times.filter((at) => now - at < MINUTE);
  if (inMinute.length >= PER_MINUTE) {
    // How long until the oldest of them falls out of the window, which is when one is free again.
    const wait = Math.ceil((MINUTE - (now - inMinute[0])) / 1000);
    return { allowed: false, retryAfterSeconds: Math.max(1, wait), window: "minute" };
  }
  if (times.length >= PER_HOUR) {
    const wait = Math.ceil((HOUR - (now - times[0])) / 1000);
    return { allowed: false, retryAfterSeconds: Math.max(1, wait), window: "hour" };
  }

  seen.set(address, [...times, now]);
  return { allowed: true };
}

/** For tests. Nothing in the app clears the counters - they age out. */
export function resetSearchLimit(): void {
  seen.clear();
}

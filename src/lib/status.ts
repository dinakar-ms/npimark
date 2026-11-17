/**
 * Reading the platform's own status, for `/status`, and the words the page prints.
 *
 * The one rule that matters here: **nothing in this file throws, and nothing waits long.** The
 * status page is read hardest at the exact moment the thing it reports on is not answering, so a
 * page whose render depended on that answer would go blank, 500 or hang on the one day anybody
 * needed it. Hence a hard timeout, no cache at all - a cached "operating normally" served through
 * an outage is the worst thing this page could do - and `null` for every failure alike:
 * unreachable, slow, refusing, misconfigured, or answering something this file does not recognise.
 *
 * `null` is not an absence of information. It is the page's third state: *we could not get an
 * answer*, which during an outage is the true and useful thing to say and is rendered as such. The
 * page's honesty depends on the caller treating `null` as "we do not know" rather than as "fine".
 *
 * Why the page survives an outage at all
 * --------------------------------------
 * The site and the platform are separate upstreams in `infra/Caddyfile.public` - `site:3000` and
 * `api:8000`. The API container, the worker, or Postgres can all be down with the site still
 * serving, and that is every outage this page is for. What it cannot cover is the site itself, the
 * host or the edge being gone: then nobody reaches this page at all, and no page served off the
 * same machine could have said otherwise. So the page says that in as many words, and prints a
 * route that does not run on our hardware.
 *
 * No `server-only` guard, unlike `lib/api.ts` and `lib/session.ts`
 * ---------------------------------------------------------------
 * Those two hold a credential - an API key, a session cookie - and the guard is what keeps one out
 * of a browser bundle. `/api/status` takes no key, no session and no parameters, so there is
 * nothing here to leak and nothing to protect. Leaving the guard off is what lets `status.test.mjs`
 * import this file and check the promise above: every failure shape returns null rather than
 * throwing.
 */

/** How long the platform gets to answer before the page stops waiting for it. */
const TIMEOUT_MS = 2_500;

export const SERVICE_STATES = ["operating", "degraded", "down", "unknown"] as const;
export type ServiceState = (typeof SERVICE_STATES)[number];

export type StatusService = {
  key: string;
  name: string;
  /** What this row covers, in a customer's words. Written by the platform, not by this file. */
  what: string;
  state: ServiceState;
  /** When this state began, to the minute. */
  since: string | null;
  /** When the row was last fully well. Only sent while it is not. */
  last_operating_at: string | null;
};

export type PlatformStatus = {
  state: ServiceState;
  checked_at: string | null;
  services: StatusService[];
};

function isState(value: unknown): value is ServiceState {
  return typeof value === "string" && (SERVICE_STATES as readonly string[]).includes(value);
}

function isoOrNull(value: unknown): string | null {
  return typeof value === "string" && !Number.isNaN(new Date(value).getTime()) ? value : null;
}

/**
 * A body that is the right shape, or null.
 *
 * Strict on purpose. Something other than the platform can answer on that address - a proxy's
 * error page, a captive portal, an edge that is up while the API behind it is not - and a page
 * that rendered four blank rows off a half-understood body would look like a working status page
 * saying nothing is wrong. An unrecognised answer is not a status.
 */
export function parseStatus(body: unknown): PlatformStatus | null {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return null;
  const raw = body as Record<string, unknown>;
  if (!isState(raw.state) || !Array.isArray(raw.services) || raw.services.length === 0) return null;

  const services: StatusService[] = [];
  for (const entry of raw.services) {
    if (typeof entry !== "object" || entry === null) return null;
    const service = entry as Record<string, unknown>;
    if (
      typeof service.key !== "string" ||
      typeof service.name !== "string" ||
      typeof service.what !== "string" ||
      !isState(service.state)
    ) {
      return null;
    }
    services.push({
      key: service.key,
      name: service.name,
      what: service.what,
      state: service.state,
      since: isoOrNull(service.since),
      last_operating_at: isoOrNull(service.last_operating_at),
    });
  }

  return { state: raw.state, checked_at: isoOrNull(raw.checked_at), services };
}

/**
 * What the platform says about itself, or `null` when this site could not get an answer.
 *
 * Every failure is the same answer on purpose. "It refused", "it timed out" and "it is not
 * configured" are three facts for us and one fact for a customer: we could not tell them. Naming
 * which hop failed is exactly the reconnaissance this whole feature exists to avoid, and it
 * belongs in our logs rather than on a page anybody may load.
 */
export async function platformStatus(): Promise<PlatformStatus | null> {
  const base = (process.env.NPI_API_BASE_URL ?? "").replace(/\/$/, "");
  // Deliberately not the throw `lib/api.ts` uses for a missing base URL: a misconfigured
  // environment must degrade this page to "we cannot say", never break it.
  if (!base) return null;
  try {
    const response = await fetch(`${base}/api/status`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return null;
    return parseStatus(await response.json());
  } catch {
    return null;
  }
}

/**
 * The four words a customer reads, and the chip each one wears.
 *
 * `unknown` is not folded into a degraded-looking chip: a monitor that has not reported is not the
 * same as a service that is unwell, and the plain chip is what stops the page claiming either.
 */
export const STATE_WORDS: Record<ServiceState, { label: string; tag: string }> = {
  operating: { label: "Operating normally", tag: "tag ok" },
  degraded: { label: "Degraded", tag: "tag warn" },
  down: { label: "Not working", tag: "tag stop" },
  unknown: { label: "Not confirmed", tag: "tag" },
};

/** `September 24, 2026 at 17:04 UTC`, or null. UTC, spelled out: a status page has one clock. */
export function momentInUtc(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return null;
  const day = when.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const time = when.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
  return `${day} at ${time} UTC`;
}

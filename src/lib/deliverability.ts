/**
 * The measured bounce rate, read from the platform rather than held here.
 *
 * Why this is its own module and not a figure in `lib/claims.ts`
 * -------------------------------------------------------------
 * `claims.ts` holds numbers measured once and typed in, with the date they were measured on beside
 * them - which is the honest way to publish a count that takes half a minute to compute. This is
 * not that. A bounce rate is a *series*: one run is a measurement and twelve of them are a track
 * record, and the track record is the part worth having. A number typed into this file would be
 * another claim, and the whole point of the exercise is that it is checkable.
 *
 * So the page reads `/v1/deliverability` and prints what comes back. If nothing comes back, or
 * nothing has been measured yet, the page says so in words. There is no default, no placeholder
 * and no "approximately" - see `nothing()` below, which is what the page renders when the API
 * cannot be reached, and which is indistinguishable from "we have not measured this yet" on
 * purpose. Both are honest; a number would not be.
 *
 * Every rate here can be null and null means absent. Never 0, which would read as "nothing we
 * hold is deliverable".
 *
 * Types and formatting only, with no imports at all. `lib/deliverabilityApi.ts` is the half that
 * talks to the platform and is server-only; this half is pure so `deliverability.test.mjs` can pin
 * the one rule the page depends on - that an absent figure renders as absent - without a server, a
 * key or a network.
 */

/** One trust tier of one run. `population` is what that tier held when the sample was drawn. */
export type TierRate = {
  tier: string;
  population: number;
  sampled: number;
  deliverable_rate: number | null;
  undeliverable_rate: number | null;
  /** Neither a yes nor a no: a domain that accepts all mail, a mailbox the check could not
   *  resolve. Published as its own figure rather than split between the other two. */
  undetermined_rate: number | null;
  /** Half-width of the 95% interval on `deliverable_rate`, in percentage points. */
  margin_points: number | null;
};

/** One measurement. Nothing here names a supplier and nothing here is an address. */
export type Run = {
  id: number;
  measured_at: string;
  /** The string the sample was drawn with, published so the run can be repeated. */
  seed: string;
  population: number;
  sampled: number;
  per_tier_target: number;
  deliverable_rate: number | null;
  undeliverable_rate: number | null;
  margin_points: number | null;
  tiers: TierRate[];
};

/** The design, which is publishable whether or not a run has happened yet. */
export type Method = {
  per_tier: number;
  confidence: number;
  tiers: string[];
  /** What a deliverable address is not. Written in the platform and printed verbatim, so the
   *  sentence that makes the rest of the page credible cannot drift between the two. */
  limits: string;
};

export type Deliverability = {
  measured: boolean;
  method: Method | null;
  latest: Run | null;
  history: Run[];
};

/**
 * What the page renders when there is nothing to render: no run, or no answer from the API.
 *
 * `method` is null rather than a guessed default. A page that printed "we sample 600 an arm" while
 * unable to reach the platform would be describing a design it had not read, which is the same
 * class of mistake as printing a rate it had not measured.
 */
export function nothing(): Deliverability {
  return { measured: false, method: null, latest: null, history: [] };
}

/** A whole percentage, or null. One decimal on a sample of 600 is precision we do not have. */
export function percent(rate: number | null): string | null {
  return rate === null ? null : `${Math.round(rate)}%`;
}

/** `+/- 2.7 points`, or null. Kept to one decimal, which is the resolution the interval has. */
export function margin(points: number | null): string | null {
  if (points === null) return null;
  return `±${points.toFixed(1)} points`;
}

/** `24 September 2026`, or null. The day, because a bounce rate is not an hourly figure. */
export function measuredOn(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return null;
  return when.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

/** What each tier means to somebody choosing one, in the order the platform publishes them. */
export const TIER_LABELS: Record<string, string> = {
  trusted: "Trusted",
  probable: "Probable",
  doubtful: "Doubtful",
  rejected: "Rejected",
};

export function tierLabel(tier: string): string {
  return TIER_LABELS[tier] ?? tier;
}

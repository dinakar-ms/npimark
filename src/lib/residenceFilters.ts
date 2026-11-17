/**
 * Filtering on where a provider *lives*: the four Residence Match filters.
 *
 * The platform has accepted these from a contract customer since 28 Sep - the same plan door the
 * reveal uses, rather than the `consumer.view` permission no customer can ever hold - and the
 * customer's own search screen never offered them. So the capability existed and nothing could
 * reach it, which is the state this module ends.
 *
 * Two rules, and the second is the one that matters
 * ------------------------------------------------
 * 1. **Nothing is sent in a shape the platform refuses.** `home_state` is two letters, repeatable;
 *    `practice_home_relation` is an enum; the two flags are `true`, `false` or absent. A stray
 *    value would be a 422, which arrives as an empty page and reads as "nothing matched" when it
 *    means "bad input" - the failure mode every other filter on that screen is shape-checked to
 *    avoid.
 * 2. **`false` is a filter and `""` is not.** "The ones we hold no home address for" is a real
 *    question somebody asks on purpose, and a bare truthiness check drops it and answers the
 *    opposite one.
 *
 * Whether the customer may use these at all is not this module's decision: the platform refuses
 * out loud, and the screen only offers the fields to a plan that carries them.
 */

/** What the platform accepts for `practice_home_relation`. Mirrors `HomeRelation`. */
export const HOME_RELATIONS = ["same_zip", "same_state", "different_state"] as const;
export type HomeRelation = (typeof HOME_RELATIONS)[number];

/** The tri-state Residence Match flags. Not `has_cell`, which is a practice number from a contact
 *  file and a different question - the platform's own parameter says so. */
export const RESIDENCE_FLAGS = ["has_home_address", "has_cell_phone"] as const;
export type ResidenceFlag = (typeof RESIDENCE_FLAGS)[number];

/** Every URL parameter this module reads, so a caller can ask "did they request any of these?" */
export const RESIDENCE_PARAMS = [...RESIDENCE_FLAGS, "home_state", "practice_home_relation"];

const STATE = /^[A-Za-z]{2}$/;

export type ResidenceFilter = Partial<Record<ResidenceFlag, "true" | "false">> & {
  home_state?: string[];
  practice_home_relation?: HomeRelation;
};

/**
 * The states a provider may live in: two letters each, repeatable, upper-cased.
 *
 * Accepts a comma-separated list because that is what one text field can give, and returns an
 * array because the platform's filter is repeatable - `searchAsUser` appends each value under the
 * same name. A bad entry is dropped rather than sent, so one typo does not refuse a list of ten.
 */
export function homeStates(raw: string | undefined): string[] {
  const good = (raw ?? "")
    .split(",")
    .map((one) => one.trim().toUpperCase())
    .filter((one) => STATE.test(one));
  return [...new Set(good)];
}

/** The four filters, normalised. `read` is the page's parameter reader. */
export function residenceFilter(read: (name: string) => string | undefined): ResidenceFilter {
  const out: ResidenceFilter = {};
  for (const flag of RESIDENCE_FLAGS) {
    const value = (read(flag) ?? "").trim();
    // `"false"` is deliberately kept: see rule 2 above.
    if (value === "true" || value === "false") out[flag] = value;
  }
  const states = homeStates(read("home_state"));
  if (states.length > 0) out.home_state = states;
  const relation = (read("practice_home_relation") ?? "").trim();
  if ((HOME_RELATIONS as readonly string[]).includes(relation)) {
    out.practice_home_relation = relation as HomeRelation;
  }
  return out;
}

/**
 * Whether the URL asks for any of these, whatever the plan allows.
 *
 * The page needs this to explain itself. A customer whose plan does not carry these filters has no
 * fields to tick, but a hand-edited or shared URL can still carry one - and the platform refuses
 * the whole search rather than quietly dropping the term, which is the right call and arrives as an
 * empty page. Knowing the request asked for them is what lets the page say so instead of showing
 * "the platform did not answer", which blames us for the customer's own plan.
 */
export function asksForResidence(read: (name: string) => string | undefined): boolean {
  return Object.keys(residenceFilter(read)).length > 0;
}

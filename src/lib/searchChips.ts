/**
 * What a search is narrowed by, said back as chips the customer can take off one at a time.
 *
 * Why this exists
 * ---------------
 * The search screen offers forty controls across eight collapsed groups. Collapsed is the only way
 * forty controls fit, but it means a filter set once is a filter nobody can see: somebody narrows
 * to "star rating 4 and above" in the morning, forgets, and spends the afternoon believing there
 * are nine hundred orthopaedic surgeons in Texas. The count on screen is never wrong and always
 * unexplained.
 *
 * So every active filter is listed above the results, and every one of them can be removed with a
 * single link. That is also why this is a module rather than markup: the chip row and the groups
 * have to agree about what is on, and a chip that could not be removed would be worse than no chip
 * at all.
 *
 * No client JavaScript
 * --------------------
 * A chip's remove control is a link to the same search with that parameter dropped - the same shape
 * the rest of this screen uses. The URL is the state, which is what makes a search shareable, and
 * removing a filter by hand in the address bar and by clicking a chip are the same operation.
 *
 * Nothing here decides whether a filter is *valid*. `lib/searchFilters.ts` has already normalised
 * everything these chips describe, so a value that arrives here was accepted by the one list - and
 * a filter this module has no wording for still gets a chip, labelled from its own name, because a
 * filter nobody can see is the defect and an awkward label is not.
 */

/** A chip: a kicker, what it says, and what to drop from the URL to undo it. */
export type SearchChip = {
  /** The part that is not the value - "Within", "Paid at least". Omitted when the value speaks. */
  lead?: string;
  /** What the chip reads as. */
  text: string;
  /**
   * The parameters this chip owns. A bare name drops every value it has; a `[name, value]` pair
   * drops that one value, which is how one of three ticked procedure codes comes off on its own.
   */
  remove: Array<string | [string, string]>;
};

/** On the URL but not a filter: paging, the reveal round-trip, and the three lookup boxes. */
const NOT_A_FILTER = new Set([
  "page",
  "revealed",
  "free",
  "reveal_error",
  "hcpcs_q",
  "drug_q",
  "system_q",
  "error",
  "queued",
]);

/**
 * The order the chips are read in, which is the order the groups are laid out in: who, where, how
 * to reach, where they live, the record, who they work for, what they bill, what they were paid.
 * A name not in here still gets a chip - at the end, labelled from its own spelling.
 */
const ORDER = [
  "q",
  "classification",
  "type",
  "state",
  "status",
  "city",
  "postal_code",
  "near_zip",
  "street",
  "has_email",
  "email_trust",
  "has_phone",
  "has_address",
  "has_domain",
  "has_home_address",
  "has_cell_phone",
  "home_state",
  "practice_home_relation",
  "enumerated_from",
  "min_star_rating",
  "group_name",
  "shortage_area",
  "health_center",
  "ehr_system",
  "opted_out",
  "excluded",
  "revoked",
  "system",
  "payer_employer",
  "has_hie",
  "hcpcs_code",
  "min_hcpcs_services",
  "drug",
  "min_drug_claims",
  "min_medicare_beneficiaries",
  "min_partd_claims",
  "min_mips_score",
  "min_payment_amount",
  "payment_amount_below",
  "payment_year",
];

/** The kicker for each filter. No entry means the value is self-explanatory - a specialty is. */
const LEAD: Record<string, string> = {
  q: "Matching",
  // Both of these were renamed on 2026-10-03 to the names the platform accepts (`credential`,
  // `npi`), so they arrive here under those keys and need wording like every other filter -
  // without it a chip read "npi 1234567893, 1003000126".
  credential: "Credential",
  npi: "NPI",
  first_name: "First name",
  last_name: "Surname",
  organization_name: "Organization",
  has_facility: "Certified facility",
  min_beds: "Beds, at least",
  // The negatives. Each reads as what it does to the search ("Not in TX"), because a chip's whole
  // job is to be a sentence somebody can check at a glance - and "Exclude state: TX" beside
  // "State: NM" is two spellings of the same idea, which is how a reader loses track of which way
  // round a filter points.
  list_id: "On list",
  exclude_list_id: "Not on list",
  exclude_npi: "Not these NPIs",
  exclude_state: "Not in",
  exclude_city: "Not in",
  exclude_postal_code: "Not in ZIP",
  exclude_taxonomy_classification: "Not",
  exclude_credential: "Not",
  exclude_ehr_system: "Does not run",
  exclude_employer_domain: "Not at",
  exclude_facility_type: "Not",
  type: "Type",
  state: "State",
  status: "Status",
  city: "City",
  postal_code: "ZIP",
  street: "Street",
  has_email: "Work email",
  email_trust: "Email trust",
  has_phone: "Practice phone",
  has_address: "Postal address",
  has_domain: "Employer website",
  has_home_address: "Home address",
  has_cell_phone: "Cell phone",
  home_state: "Lives in",
  practice_home_relation: "Home vs practice",
  min_star_rating: "Star rating",
  group_name: "Billing group",
  shortage_area: "Shortage area",
  health_center: "Health center",
  ehr_system: "Runs",
  opted_out: "Medicare",
  excluded: "Exclusion list",
  revoked: "Medicare enrollment",
  system: "Health system",
  payer_employer: "Employer",
  has_hie: "Information exchange",
  hcpcs_code: "Procedure",
  min_hcpcs_services: "Services, at least",
  drug: "Drug",
  min_drug_claims: "Claims, at least",
  min_medicare_beneficiaries: "Medicare patients, at least",
  min_partd_claims: "Part D claims, at least",
  min_mips_score: "MIPS score, at least",
  min_payment_amount: "Paid at least",
  payment_amount_below: "Paid under",
  payment_year: "Program year",
};

/**
 * The tri-state filters, as [what `true` means, what `false` means].
 *
 * Said in the words the control uses rather than as "true": "we hold none" is a filter somebody
 * chose on purpose, and a chip reading `Work email false` would look like a mistake to undo.
 */
const EITHER_OR: Record<string, [string, string]> = {
  has_email: ["we hold one", "we hold none"],
  has_phone: ["we hold one", "we hold none"],
  has_address: ["we hold one", "we hold none"],
  has_domain: ["we hold a domain", "we hold none"],
  has_home_address: ["we hold one", "we hold none"],
  has_cell_phone: ["we hold one", "we hold none"],
  has_hie: ["a member", "not one we know of"],
  opted_out: ["opted out", "still in Medicare"],
  excluded: ["excluded", "not excluded"],
  revoked: ["revoked", "not revoked"],
};

const STATUS_WORDS: Record<string, string> = {
  active: "active only",
  inactive: "deactivated only",
  any: "active and deactivated",
};

const RELATION_WORDS: Record<string, string> = {
  same_zip: "same ZIP as practice",
  same_state: "same state as practice",
  different_state: "a different state",
};

const MONEY = new Set(["min_payment_amount", "payment_amount_below"]);
const COUNTS = new Set([
  "min_hcpcs_services",
  "min_drug_claims",
  "min_medicare_beneficiaries",
  "min_partd_claims",
]);

/** `5000` as `$5,000`, `1600` as `1,600`, and anything unrecognised exactly as it arrived. */
function say(name: string, value: string, named: Named = {}): string {
  // A list is named by a UUID in the URL and by its name on the screen. A chip reading
  // "Not on list 3f1c9d2a-5b7e-..." tells a reader nothing they can act on, so the caller - which
  // is the only thing that knows what the organisation calls its lists - supplies the words. An id
  // with no name is one the customer cannot see any more, and says so rather than showing the id.
  if (name === "list_id" || name === "exclude_list_id") {
    return named[value] ?? "a list you no longer have";
  }
  if (name === "status") return STATUS_WORDS[value] ?? value;
  if (name === "practice_home_relation") return RELATION_WORDS[value] ?? value;
  if (name === "min_star_rating") return `${value} and above`;
  const pair = EITHER_OR[name];
  if (pair) return value === "true" ? pair[0] : value === "false" ? pair[1] : value;
  const number = Number(value);
  if (MONEY.has(name) && Number.isFinite(number)) {
    return `$${number.toLocaleString("en-US")}`;
  }
  if (COUNTS.has(name) && Number.isFinite(number)) return number.toLocaleString("en-US");
  // `any` is a real value for several of these - a shortage area, a health system, a payer - and
  // it means "any of them on file", which is not the same as no filter.
  if (value === "any") return "any on file";
  return value.replace(/_/g, " ");
}

/** A name nothing has wording for, as words: `min_widget_count` reads "min widget count". */
function fromName(name: string): string {
  return name.replace(/_/g, " ");
}

/**
 * Every filter on this search, in reading order, each with what to drop to undo it.
 *
 * `params` is the screen's own spelling of the search - the parameters its links and forms carry -
 * so a chip's removal is the same URL with one thing taken out, and nothing has to translate.
 */
/** What an id in the URL is called on the screen: `{ "<uuid>": "Cardiology - Texas" }`. */
export type Named = Record<string, string>;

export function searchChips(params: URLSearchParams, named: Named = {}): SearchChip[] {
  const chips: SearchChip[] = [];
  // `radius_miles` never arrives on its own - a radius is both halves or neither - so it is left
  // to `near_zip`. The NPI year span is not like that: either end can be set alone, so it is
  // whichever end comes first that makes the chip, and it marks the other as done.
  const done = new Set<string>([...NOT_A_FILTER, "radius_miles"]);
  const present = [...new Set(params.keys())];
  const names = [...ORDER.filter((name) => present.includes(name)), ...present];

  for (const name of names) {
    if (done.has(name)) continue;
    done.add(name);
    const values = params.getAll(name).filter((value) => value !== "");
    if (values.length === 0) continue;

    // Within N miles of a ZIP is one filter with two parameters, and removing half of it would
    // leave the platform refusing the search - the pair is only ever sent together.
    if (name === "near_zip") {
      const miles = params.get("radius_miles");
      chips.push({
        lead: "Within",
        text: miles ? `${miles} miles of ${values[0]}` : `${values[0]}`,
        remove: ["near_zip", "radius_miles"],
      });
      continue;
    }
    // A span reads as a span. Either end can be set on its own, and then it says so.
    if (name === "enumerated_from" || name === "enumerated_to") {
      const from = params.get("enumerated_from");
      const to = params.get("enumerated_to");
      chips.push({
        lead: "NPI issued",
        text: from && to ? `${from}–${to}` : from ? `${from} onwards` : `up to ${to}`,
        remove: ["enumerated_from", "enumerated_to"],
      });
      done.add("enumerated_from");
      done.add("enumerated_to");
      continue;
    }
    // Several ticked codes, drugs or health systems: one chip each, because dropping one of three
    // is the thing somebody wants and dropping all three is not.
    if (
      name === "hcpcs_code" ||
      name === "drug" ||
      name === "system" ||
      name === "exclude_list_id"
    ) {
      for (const value of values) {
        chips.push({ lead: LEAD[name], text: say(name, value, named), remove: [[name, value]] });
      }
      continue;
    }
    // Repeatable but asked as one question - "TX, NM" is one patch - so one chip for the lot.
    chips.push({
      lead: LEAD[name] ?? (name === "classification" ? undefined : fromName(name)),
      text: values.map((value) => say(name, value, named)).join(", "),
      remove: [name],
    });
  }

  return chips;
}

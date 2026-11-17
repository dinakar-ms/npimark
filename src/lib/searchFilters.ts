/**
 * One list of search filters, read the same way by the screen, the export form and the export route.
 *
 * Why this exists
 * ---------------
 * Exporting from a search is meant to export *that* search. The export route says so itself: "A
 * filter the screen counted and the file ignored would make the 'this would use N rows' line beside
 * the button a lie." It was a lie. The screen grew city, ZIP, street, a radius, four reachability
 * flags, an email trust tier, an EHR system and a status filter, and the export form carried none of
 * them - it carried `q`, `state`, `classification`, `type`, the Medicare filters, the procedure and
 * drug codes, and `has_email` but only when it was `"true"`.
 *
 * So a search narrowed to Austin with trusted emails exported the whole of Texas: a file that was
 * not what anybody asked for, and `export_rows` billed for every extra row in it. The estimate
 * beside the button was right about the search and wrong about the file.
 *
 * Three copies of a filter list is three chances to say a different thing, which is exactly what
 * happened. There is one copy now. A filter added here reaches the search, the form and the file
 * together, or it reaches none of them.
 *
 * What this does *not* decide
 * ---------------------------
 * Whether the caller may use a filter. The platform answers that - it refuses the residence filters
 * out loud rather than dropping them - and a second opinion here is how two answers drift apart.
 * This module only makes sure nothing is sent in a shape the platform refuses, because a 422 arrives
 * as an empty page and reads as "nothing matched" when it means "bad input".
 */

import { affiliationFilters } from "./affiliations.ts";
import { paymentFilters } from "./payments.ts";
import { placeFilter, reachFilter } from "./placeFilters.ts";
import { radiusFilter, radiusInUse } from "./radius.ts";
import { providerFacts } from "./providerFacts.ts";
import { residenceFilter } from "./residenceFilters.ts";
import { whoFilters } from "./whoFilters.ts";
import { listFilters } from "./listFilters.ts";

/** Read one value for a name: a URL parameter on the screen, a form field in the route. */
export type Read = (name: string) => string | undefined;
/** Read every value for a repeatable name - `hcpcs_code`, `drug`, `home_state`. */
export type ReadAll = (name: string) => string[];

/** What the platform accepts for `status`. Anything else narrows to `active` rather than widening. */
export const STATUSES = ["active", "inactive", "any"] as const;

/** The Medicare tri-state flags, in the shapes the platform takes. */
const MEDICARE_FLAGS = ["opted_out", "excluded", "revoked"] as const;
/** Each floor and the shape it has to hold. Only the MIPS score takes a fraction, and caps at 100. */
const MEDICARE_FLOORS: [name: string, shape: RegExp][] = [
  ["min_medicare_beneficiaries", /^\d{1,9}$/],
  ["min_partd_claims", /^\d{1,9}$/],
  ["min_mips_score", /^\d{1,3}(\.\d{1,2})?$/],
];

const CODE_SHAPE = /^[A-Za-z0-9]{1,5}$/;
const COUNT = /^\d{1,9}$/;

/** The form field names this module reads, so a form can be built without listing them twice. */
export const CLAIMS_PARAMS = ["hcpcs_code", "drug", "min_hcpcs_services", "min_drug_claims"];

export type SearchFilters = Record<string, string | string[]>;

export type SearchFilterOptions = {
  /**
   * The EHR systems the platform has actually identified, when the caller has them.
   *
   * `ehr_system` is an **exact** match on the platform's side, so a name it has never heard of
   * returns nothing - and an empty result reads as "no providers run that" when it means "that is
   * not how it is spelled". The screen has the list and checks against it. The export route does
   * not, and must not fetch one to find out: the value it receives came from the screen's own
   * hidden field, already checked, and a bad one narrows the file rather than widening it.
   */
  ehrSystems?: readonly string[];
  /**
   * The Open Payments program years the platform holds, when the caller has them.
   *
   * Same arrangement as `ehrSystems`, and for a sharper reason: the platform *refuses* a program
   * year it holds nothing for, so a year from the calendar rather than from the data is a refused
   * search - an empty page that reads as "nobody was paid that much".
   */
  paymentYears?: readonly number[];
};

/**
 * Every filter the search screen offers, normalised, under the names the platform's search uses.
 *
 * Paging is not a filter and is not here: the screen adds `page` and `page_size`, and an export has
 * neither.
 */
export function searchFilters(
  read: Read,
  readAll: ReadAll,
  options: SearchFilterOptions = {},
): SearchFilters {
  const out: SearchFilters = {};
  const put = (name: string, value: string | string[] | undefined) => {
    if (value === undefined) return;
    if (Array.isArray(value)) {
      if (value.length > 0) out[name] = value;
    } else if (value !== "") {
      out[name] = value;
    }
  };

  put("q", (read("q") ?? "").trim().slice(0, 200));
  put("state", (read("state") ?? "").trim());
  // The screen's field is `classification`; the platform's filter is `taxonomy_classification`. The
  // rename lives here so neither side has to remember it, and *both* spellings are read so the
  // output round-trips: the export form renders this object as its hidden fields and the route reads
  // it back through this same function, so what comes out has to be something that can go back in.
  put(
    "taxonomy_classification",
    (read("classification") || read("taxonomy_classification") || "").trim(),
  );
  put("type", (read("type") ?? "").trim());

  const ehr = (read("ehr_system") ?? "").trim().slice(0, 120);
  // Checked against the list when the caller has one; passed through when they do not. See
  // `SearchFilterOptions.ehrSystems` for why that is safe.
  if (ehr && (options.ehrSystems === undefined || options.ehrSystems.includes(ehr))) {
    put("ehr_system", ehr);
  }

  // "Active only, unless you ask otherwise" is what the help page has always said. Sent always
  // rather than only when it differs from the platform's default: the two agreeing today is not a
  // reason to let them drift apart tomorrow. Anything unrecognised narrows to `active`, so a
  // hand-edited URL cannot quietly put deactivated NPIs in somebody's file.
  const asked = (read("status") ?? "").trim();
  out.status = (STATUSES as readonly string[]).includes(asked) ? asked : "active";

  // A radius is either both of its parts or neither, and it has to be settled before the street:
  // the platform refuses a street with nothing to anchor it.
  const radius = radiusFilter(read("near_zip"), read("radius_miles"));
  const anchored = radiusInUse(radius);
  for (const [name, value] of Object.entries(radius)) put(name, String(value));
  for (const [name, value] of Object.entries(
    placeFilter(read("city"), read("postal_code"), read("street"), anchored),
  )) {
    put(name, value);
  }
  for (const [name, value] of Object.entries(reachFilter(read))) put(name, value);
  for (const [name, value] of Object.entries(
    // `home_state` is repeatable, so it arrives as several values; the normaliser takes a
    // comma-separated list and hands back the array the platform wants.
    residenceFilter((name) => (name === "home_state" ? readAll(name).join(",") : read(name))),
  )) {
    put(name, value);
  }

  // Who the provider is, and which facility sits behind the NPI: credential, name parts, a pasted
  // list of NPIs, and the facility's size. Public record, shape-checked, and seven filters the
  // platform has always accepted that this screen did not offer until 2026-10-03.
  for (const [name, value] of Object.entries(whoFilters(read, readAll))) put(name, value);

  // Saved lists, and the ten ways to say "not these". The membership filter is what makes an
  // export of a list possible at all, and `exclude_list_id` is the one somebody actually reaches
  // for: everyone except the people already contacted.
  for (const [name, value] of Object.entries(listFilters(read, readAll))) put(name, value);

  // When the NPI was issued, the star rating, the billing group, and the two HRSA programmes.
  // Public record, so no plan or permission gates them - they only need their shapes checked.
  for (const [name, value] of Object.entries(providerFacts(read, readAll))) put(name, value);

  // What industry paid them, from CMS's Open Payments file. The year is dropped unless an amount
  // is beside it: a year alone narrows nothing, and a parameter that does nothing is one somebody
  // will believe in.
  for (const [name, value] of Object.entries(
    paymentFilters(read, { years: options.paymentYears }),
  )) {
    put(name, value);
  }

  // Who they work for: a health system (named by its public slug, never by an internal id), a
  // health plan or PBM, a health information exchange.
  for (const [name, value] of Object.entries(affiliationFilters(read, readAll))) put(name, value);

  for (const flag of MEDICARE_FLAGS) {
    const value = (read(flag) ?? "").trim();
    if (value === "true" || value === "false") put(flag, value);
  }
  for (const [name, shape] of MEDICARE_FLOORS) {
    const value = (read(name) ?? "").trim();
    if (shape.test(value) && !(name === "min_mips_score" && Number(value) > 100)) put(name, value);
  }

  // A floor only means something with something to be a floor of, and the platform refuses one
  // alone - which would be a 422, read as "nothing matched".
  const codes = readAll("hcpcs_code")
    .map((one) => one.trim())
    .filter((one) => CODE_SHAPE.test(one));
  if (codes.length > 0) {
    put("hcpcs_code", codes);
    const floor = (read("min_hcpcs_services") ?? "").trim();
    if (COUNT.test(floor)) put("min_hcpcs_services", floor);
  }
  const drugs = readAll("drug")
    .map((one) => one.trim().slice(0, 255))
    .filter((one) => one !== "");
  if (drugs.length > 0) {
    put("drug", drugs);
    const floor = (read("min_drug_claims") ?? "").trim();
    if (COUNT.test(floor)) put("min_drug_claims", floor);
  }

  return out;
}

/** A reader pair over `FormData`, for the export route. */
export function formReader(form: FormData): [Read, ReadAll] {
  return [
    (name) => {
      const value = form.get(name);
      return value === null ? undefined : String(value);
    },
    (name) => form.getAll(name).map((value) => String(value)),
  ];
}

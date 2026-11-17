import type { Read, ReadAll } from "./searchFilters.ts";
import { npiList } from "./whoFilters.ts";

/**
 * Lists, and the ten ways to say "not these".
 *
 * Two features that share a module because they share a shape: both are filters the platform has
 * always accepted and the customer screen never offered, and the most useful one is both at once -
 * `exclude_list_id`, "everyone except the people I have already contacted".
 *
 *   list_id                           only providers on this saved list
 *   exclude_list_id                   leave out everyone on these lists
 *   exclude_npi                       leave out these NPIs, pasted
 *   exclude_state / city / postal_code        leave out places
 *   exclude_taxonomy_classification    leave out specialties
 *   exclude_credential                 leave out credentials
 *   exclude_ehr_system                 leave out an EHR
 *   exclude_employer_domain            leave out an employer
 *   exclude_facility_type              leave out a kind of facility
 *
 * Nineteen other `exclude_*` filters exist on the platform and are deliberately not here. Two of
 * them - `exclude_aco` and `exclude_org_segment` - are the pair already ruled internal, and the
 * rest are the negatives of filters this screen does not offer in the positive either (the Open
 * Payments ids, the org layers, the IDN and shortage-area codes). A negative with no positive
 * beside it is a filter nobody can discover, which is the complaint this work exists to answer,
 * not an instance of it.
 *
 * Everything is shape-checked before it leaves. The platform answers a bad shape with a 422 and
 * the screen renders that as an empty result - which reads as "nobody matched" when it means
 * "that was not a state". A list id is the sharpest case: the platform's own refusal says
 * "That isn't a list id. Choose a list from the Lists page", and a malformed one would turn a
 * whole search into that sentence.
 */

export type ListFilters = Record<string, string | string[]>;

/** A list id is a UUID. Anything else is dropped rather than sent. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATE = /^[A-Za-z]{2}$/;
const ZIP = /^\d{5}$/;
const CREDENTIAL = /^[A-Z.]{1,12}$/;
/** A hostname, lowercased: at least one dot and nothing that needs escaping. */
const DOMAIN = /^[a-z0-9][a-z0-9.-]{0,252}\.[a-z]{2,24}$/;
const TEXT_MAX = 120;

/**
 * How many values one negative filter may carry.
 *
 * A URL limit, like `MAX_NPIS`: every filter on this screen travels in the query string so a
 * search can be shared and paged. Twenty states is more than anyone excludes by hand, and the
 * customer who wants to exclude forty thousand providers wants `exclude_list_id`, which is one
 * value however large the list behind it is - the reason that filter is the useful one.
 */
export const MAX_VALUES = 20;
/** Lists to subtract at once. More than this and the right answer is one combined list. */
export const MAX_LISTS = 10;
/** NPIs to subtract by paste. The same URL ceiling the include side uses. */
export const MAX_EXCLUDED_NPIS = 500;

function many(
  values: string[],
  shape: RegExp | null,
  { cap = MAX_VALUES, upper = false } = {},
): string[] {
  const seen = new Set<string>();
  for (const raw of values) {
    const value = upper ? raw.trim().toUpperCase() : raw.trim().slice(0, TEXT_MAX);
    if (value === "") continue;
    if (shape && !shape.test(value)) continue;
    seen.add(value);
    if (seen.size >= cap) break;
  }
  return [...seen];
}

/**
 * The membership filter and the ten negatives, under the names the platform's search uses.
 *
 * `exclude_npi` reads two fields for the same reason `whoFilters` reads two for `npis`: the
 * screen's control is a textarea called `exclude_npi_list` and what comes back out is
 * `exclude_npi`, which the export form renders as its own hidden fields and the export route
 * reads back through this same function. The object has to round-trip or the file stops being
 * the search that was counted.
 */
export function listFilters(read: Read, readAll: ReadAll): ListFilters {
  const out: ListFilters = {};

  // Membership. One list, not many: "on list A and also on list B" is an intersection nobody has
  // asked for, and the platform's own filter is singular.
  const on = (read("list_id") ?? "").trim();
  if (UUID.test(on)) out.list_id = on;

  const without = many(readAll("exclude_list_id"), UUID, { cap: MAX_LISTS });
  if (without.length > 0) out.exclude_list_id = without;

  const npis = [
    ...npiList(read("exclude_npi_list") ?? ""),
    ...readAll("exclude_npi").filter((one) => /^\d{10}$/.test(one.trim())).map((one) => one.trim()),
  ];
  const everyNpi = [...new Set(npis)].slice(0, MAX_EXCLUDED_NPIS);
  if (everyNpi.length > 0) out.exclude_npi = everyNpi;

  // A state code is upper-cased before it is checked, so a hand-typed `tx` works rather than
  // silently narrowing nothing.
  const states = many(readAll("exclude_state"), STATE, { upper: true });
  if (states.length > 0) out.exclude_state = states;

  const cities = many(readAll("exclude_city"), null);
  if (cities.length > 0) out.exclude_city = cities;

  const zips = many(readAll("exclude_postal_code"), ZIP);
  if (zips.length > 0) out.exclude_postal_code = zips;

  const specialties = many(readAll("exclude_taxonomy_classification"), null);
  if (specialties.length > 0) out.exclude_taxonomy_classification = specialties;

  const credentials = many(readAll("exclude_credential"), CREDENTIAL, { upper: true });
  if (credentials.length > 0) out.exclude_credential = credentials;

  const ehrs = many(readAll("exclude_ehr_system"), null);
  if (ehrs.length > 0) out.exclude_ehr_system = ehrs;

  // Lower-cased first: an employer domain is a hostname, and `Example.COM` is the same one.
  const domains = many(
    readAll("exclude_employer_domain").map((one) => one.trim().toLowerCase()),
    DOMAIN,
  );
  if (domains.length > 0) out.exclude_employer_domain = domains;

  const facilities = many(readAll("exclude_facility_type"), null);
  if (facilities.length > 0) out.exclude_facility_type = facilities;

  return out;
}

/** Whether a search is subtracting anything - what the rail's group label says out loud. */
export function excluding(filters: ListFilters): number {
  return Object.keys(filters).filter((name) => name.startsWith("exclude_")).length;
}

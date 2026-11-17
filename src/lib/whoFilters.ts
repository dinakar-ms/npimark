import type { Read, ReadAll } from "./searchFilters.ts";

/**
 * Who the provider is, and which facility they sit behind - seven filters the platform has always
 * accepted and the customer screen has never offered.
 *
 * The owner's objection was that a customer cannot tell what we provide. Measured on 2026-10-03,
 * the platform's provider search accepts 115 filters and this screen reached about 40. These are
 * the ones that are public record, need no reference data a customer could not be given, and
 * cannot be sent in a shape the platform refuses:
 *
 *   credentials     a curated code (MD, DO, NP), matched against the filed credential's tokens
 *   first_name      part of a first name
 *   last_name       part of a surname
 *   organization_name  part of an organisation's name
 *   npis            a list of NPIs, pasted
 *   has_facility    whether the NPI reaches a CMS-certified facility at all
 *   min_beds        how large that facility is
 *
 * Everything here is shape-checked before it leaves, because the platform answers a bad shape with
 * a 422 and this screen renders that as an empty result - which reads as "nobody matched" when it
 * means "that was not a number". The same rule the rest of `searchFilters` follows.
 */

export type WhoFilters = Record<string, string | string[]>;

/** Ten digits, which is what an NPI is. Anything else is dropped rather than sent. */
const NPI = /^\d{10}$/;
/** Generous: a name fragment, not a name. Capped so a pasted paragraph cannot become a filter. */
const NAME_MAX = 120;
/**
 * How many NPIs one search may name.
 *
 * Not a platform limit - a URL one. Every filter on this screen travels in the query string so a
 * search can be shared and paged, and a browser gives up somewhere past a few thousand characters.
 * 500 NPIs is about 5,500 characters and still works; a customer with more than that wants the
 * Append tool, which takes a file.
 */
export const MAX_NPIS = 500;

/** Beds are a whole number and a facility has fewer than ten thousand of them. */
const BEDS = /^\d{1,4}$/;

function text(value: string | undefined): string {
  return (value ?? "").trim().slice(0, NAME_MAX);
}

/**
 * The NPIs a customer pasted, in whatever shape they pasted them.
 *
 * Commas, spaces, tabs and newlines all separate, because the three things somebody actually does
 * are paste a column out of a spreadsheet, paste a comma-separated list, and type a few by hand.
 * Anything that is not ten digits is dropped silently rather than refused: a pasted column usually
 * carries a header row, and rejecting the whole filter over the word "NPI" would be absurd.
 */
export function npiList(raw: string | undefined): string[] {
  const seen = new Set<string>();
  for (const part of (raw ?? "").split(/[\s,;]+/)) {
    const value = part.trim();
    if (NPI.test(value) && !seen.has(value)) seen.add(value);
    if (seen.size >= MAX_NPIS) break;
  }
  return [...seen];
}

/**
 * The filters above, normalised, under the names the platform's search uses.
 *
 * `credential` rather than `credentials`: the repeatable one takes a list and matches any of them,
 * which is the question somebody actually asks ("nurse practitioners or physician assistants"),
 * while `credentials` is a contains-match against the filed string.
 */
export function whoFilters(read: Read, readAll: ReadAll): WhoFilters {
  const out: WhoFilters = {};

  // Emitted as `credential`, which is the name the platform accepts on the wire - a repeatable
  // query parameter on `GET /api/providers`, and a key in `FILTER_KEYS` for the JSON `filters` an
  // export or a campaign posts.
  //
  // It was `credentials_any` for most of a day and that was wrong twice over. `credentials_any`
  // is the name of a *field on the platform's internal dataclass*, never a wire name: the request
  // parameter is `credential`, and `compile_search` is what maps the one to the other. So the
  // search sent `?credentials_any=MD`, FastAPI ignored a parameter it does not declare, and the
  // filter quietly did nothing; while an export posted `{"credentials_any": [...]}` into
  // `filters_from_mapping`, which validates against `FILTER_KEYS` and would have refused the whole
  // file with "Unknown filter".
  //
  // The lesson is in the guard that now enforces it: what this module emits is the platform's
  // request vocabulary, not its internal one, and nothing on this side can tell the two apart by
  // looking. See `test_site_filter_names_are_the_platforms` in
  // backend/tests/test_site_search_filters.py.
  const credentials = readAll("credential")
    .map((one) => one.trim().toUpperCase())
    .filter((one) => /^[A-Z.]{1,12}$/.test(one));
  if (credentials.length > 0) out.credential = [...new Set(credentials)];

  const first = text(read("first_name"));
  if (first) out.first_name = first;
  const last = text(read("last_name"));
  if (last) out.last_name = last;
  const organization = text(read("organization_name"));
  if (organization) out.organization_name = organization;

  // Emitted as `npi`, the repeatable request parameter. `npis` - what this emitted until the
  // guard caught it - is the field on the platform's dataclass, and the parameter that fills it
  // is declared `npi_filter` with `alias="npi"` so it can sit beside an `{npi}` path parameter.
  // The same mistake as `credentials_any`, and the same two invisible failures: ignored as a
  // query parameter, refused as an export's filter.
  //
  // Two spellings are read so the object round-trips: the screen's textarea is `npi_list`, and
  // the export form renders the output as hidden `npi` fields that the export route reads back
  // through this same function.
  const pasted = npiList(read("npi_list") ?? "");
  const already = readAll("npi").filter((one) => NPI.test(one.trim())).map((one) => one.trim());
  const all = [...new Set([...pasted, ...already])].slice(0, MAX_NPIS);
  if (all.length > 0) out.npi = all;

  const facility = (read("has_facility") ?? "").trim();
  if (facility === "true" || facility === "false") out.has_facility = facility;

  const beds = (read("min_beds") ?? "").trim();
  // A bed count means nothing without a facility behind the NPI, and the platform would take it
  // alone and quietly return the same rows. Sent only with the flag that makes it mean something.
  if (BEDS.test(beds) && Number(beds) > 0) {
    out.min_beds = beds;
    if (out.has_facility === undefined) out.has_facility = "true";
  }

  return out;
}

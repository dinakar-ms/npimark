import type { Metadata } from "next";
import Link from "next/link";
import ListDestinationPicker from "@/components/ListDestinationPicker";
import ReportProblem, { ReportNotice, ReportedTags } from "@/components/ReportProblem";
import { headroom } from "@/components/Balance";
import { ContactLines } from "@/components/ContactReveal";
import { CrmNote, ExportCost, FormatAndPreset } from "@/components/ExportControls";
import { DEFAULT_FORMAT, DEFAULT_PRESET } from "@/lib/exportPresets";
import {
  EMAIL_TRUST,
  placeFilter,
  reachFilter,
  streetNeedsAnchor,
} from "@/lib/placeFilters";
import { RADIUS_CHOICES, radiusFilter, radiusInUse } from "@/lib/radius";
import { PAYER_EMPLOYERS, affiliationFilters } from "@/lib/affiliations";
import { paymentFilters } from "@/lib/payments";
import { HEALTH_CENTERS, SHORTAGE_AREAS, providerFacts } from "@/lib/providerFacts";
import { HOME_RELATIONS, asksForResidence, residenceFilter } from "@/lib/residenceFilters";
import { MAX_EXCLUDED_NPIS, listFilters } from "@/lib/listFilters";
import { MAX_NPIS, whoFilters } from "@/lib/whoFilters";
import { searchFilters } from "@/lib/searchFilters";
import { selectionQuery } from "@/lib/selectionQuery";
import { type Sort, readSort, sortHref } from "@/lib/searchSort";
import { type SearchChip, searchChips } from "@/lib/searchChips";
import {
  ALERT_EVENT_LABELS,
  type DrugOption,
  getBilling,
  getLists,
  getSavedSearches,
  type ListRow,
  savedSearchHref,
  type SavedSearchRow,
  getContacts,
  getReportedFields,
  findDrugs,
  findHealthSystems,
  findProcedures,
  type HealthSystemOption,
  type OpenedContacts,
  type ProcedureOption,
  searchAsUser,
  type SearchRow,
  getCredentials,
  getEhrSystems,
  getPaymentYears,
} from "@/lib/session";
import { WHY_EMPTY, YEAR } from "@/lib/claims";
import { CLASSIFICATIONS, US_STATES, salesHref } from "@/lib/site";

/**
 * Search as a customer, with the reveal button that makes the contact data worth paying for.
 *
 * Forms and redirects, no client JavaScript. A reveal posts to a route handler, the handler
 * spends the allowance, and the browser comes back to this page with the provider named in
 * `revealed` - at which point the values are read back for free, because the charge already
 * happened. That also means a refresh cannot re-charge, and the back button cannot lose what
 * was paid for.
 *
 * The search runs with the customer's session rather than this site's key, so the rows are what
 * *their* plan allows. A row they may not see is a row the API does not return, instead of one
 * this page has to remember to hide.
 */

export const dynamic = "force-dynamic";

/** What went wrong putting rows on a list. Said in the words of the decision, not the endpoint's. */
/** What went wrong keeping or forgetting a search. */
const SAVED_ERRORS: Record<string, string> = {
  "needs-name": "Give the search a name.",
  "nothing-to-save": "Narrow the search first \u2014 there is nothing to keep yet.",
  conflict: "You already have a saved search with that name. Choose another name.",
  not_found: "That saved search no longer exists.",
  validation_error:
    "The platform refused one of those filters, so nothing was saved. That is worth telling an admin: it means this screen offered a filter the platform does not accept.",
  forbidden: "Your role cannot keep searches. Ask an admin on your team.",
  failed: "That didn't work, and nothing was saved. Try again.",
};

const LIST_ERRORS: Record<string, string> = {
  "nothing-chosen": "Tick at least one row first, then choose a list.",
  "needs-list-for-all": "Choose an existing list before adding a whole search to it.",
  "needs-a-narrower-search":
    "Narrow the search first. With no filters on it, “everyone” is the whole register.",
  "needs-name": "Give the new list a name.",
  "needs-list": "Choose a list, or type a name to make a new one.",
  conflict: "You already have a list with that name. Choose another name, or pick it from the list.",
  not_found: "That list no longer exists.",
  forbidden: "Your role cannot change lists. Ask an admin on your team.",
  validation_error: "None of those providers could be added, so nothing was saved.",
  subscription_inactive: "This organization's subscription is not active, so nothing was saved.",
  failed: "That didn't work, and nothing was added. Try again.",
};

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const PAGE_SIZE = 25;

const REVEAL_ERRORS: Record<string, string> = {
  quota_exceeded:
    "This month's reveals are spent, and nothing was counted. Providers you have already opened stay available, and the allowance goes back up at the start of next month — Plan and usage says when, and how to have more before then.",
  subscription_inactive: "This organization's subscription is not active, so nothing was opened.",
  reveal_rate_limited:
    "That's faster than new contacts can be opened. Wait a minute and try again — providers you have already opened stay available, and nothing was counted.",
  reveals_locked:
    "Opening new contacts is paused for your organization while we review how quickly they were being opened. Providers you have already opened stay available; write to us to have it reviewed.",
  forbidden: "Your role cannot open contact details. Ask an owner or admin on your team.",
  email_unverified:
    "Confirm your email address first — the link is in the message we sent when you signed up. Nothing was counted.",
  not_found: "That provider is no longer in the register. Nothing was counted.",
  "bad-npi": "That was not a valid NPI, so nothing was opened.",
  signed_out: "Your session expired. Sign in again and nothing will have been counted.",
  failed: "That didn't work, and nothing was counted. Try again.",
};

/** Yes/no Medicare signals, each a filter the provider search already runs on an index. */
const MEDICARE_FLAGS = ["opted_out", "excluded", "revoked"] as const;
/** "At least" Medicare volumes and scores, likewise indexed. */
const MEDICARE_FLOORS = [
  "min_medicare_beneficiaries",
  "min_partd_claims",
  "min_mips_score",
] as const;

const FLAG_LABELS: Record<(typeof MEDICARE_FLAGS)[number], [string, string, string]> = {
  opted_out: ["Opted out of Medicare", "Opted out", "Still in Medicare"],
  excluded: ["Federal exclusion list", "Excluded", "Not excluded"],
  revoked: ["Medicare enrollment revoked", "Revoked", "Not revoked"],
};

const FLOOR_LABELS: Record<(typeof MEDICARE_FLOORS)[number], [string, string]> = {
  min_medicare_beneficiaries: ["Medicare patients, at least", "e.g. 500"],
  min_partd_claims: ["Part D claims, at least", "e.g. 1000"],
  min_mips_score: ["MIPS score, at least (0–100)", "e.g. 80"],
};

/**
 * The search form's id, carried by every control in the filter rail as `form="provider-search"`.
 *
 * The rail sits beside the results, and the results hold forms of their own - a reveal, a report -
 * so the search cannot be a `<form>` wrapped round both without nesting forms, which is invalid and
 * breaks submission in every browser. HTML's answer is the form owner: a control anywhere on the
 * page belongs to the form whose id it names. So the rail is laid out where it reads best and still
 * submits as one search, and Enter in any of its boxes runs the search.
 */
const FORM = "provider-search";

/**
 * Which filters live in which rail group.
 *
 * Only for the count badge and for deciding whether a group opens itself - the controls are
 * rendered in place, group by group, so this list does not decide what appears anywhere. A filter
 * missing from it is a count that is one low, which is why the groups are also what the chip row is
 * ordered by: the row above the results says what is on, whatever the badges say.
 */
const GROUPS = {
  who: ["type"],
  where: ["city", "postal_code", "street", "near_zip"],
  reach: ["has_email", "email_trust", "has_phone", "has_address", "has_domain"],
  home: ["has_home_address", "has_cell_phone", "home_state", "practice_home_relation"],
  record: [
    "enumerated_from",
    "min_star_rating",
    "group_name",
    "shortage_area",
    "health_center",
    "ehr_system",
    "opted_out",
    "excluded",
    "revoked",
  ],
  employer: ["system", "payer_employer", "has_hie"],
  bills: [
    "hcpcs_code",
    "min_hcpcs_services",
    "drug",
    "min_drug_claims",
    "min_medicare_beneficiaries",
    "min_partd_claims",
    "min_mips_score",
  ],
  payments: ["min_payment_amount", "payment_amount_below", "payment_year"],
  // The negatives, in their own group. Apart from the positives deliberately: "not in Texas" is a
  // different thought from "in New Mexico", and a reader who meets the two in one list loses track
  // of which way round a filter points.
  exclude: [
    "list_id",
    "exclude_list_id",
    "exclude_npi",
    "exclude_state",
    "exclude_city",
    "exclude_postal_code",
    "exclude_taxonomy_classification",
    "exclude_credential",
    "exclude_ehr_system",
    "exclude_employer_domain",
    "exclude_facility_type",
  ],
} as const;

function one(params: Record<string, string | string[] | undefined>, key: string): string {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/** Every value for a repeatable parameter - `hcpcs_code=27447&hcpcs_code=27130`. */
function many(params: Record<string, string | string[] | undefined>, key: string): string[] {
  const value = params[key];
  if (value === undefined) return [];
  return (Array.isArray(value) ? value : [value]).filter((v) => v !== "");
}

/**
 * The procedure and drug filters, which are the only ones here a customer cannot type from
 * memory.
 *
 * Why a picker rather than a code box: nobody knows that a total knee replacement is 27447 or
 * that Eliquis is filed under APIXABAN, and a filter that requires the code is a filter only we
 * can use. So the customer types a name, the server looks it up, and the matches come back as
 * checkboxes to tick. It works with no client JavaScript at all - the same rule the rest of this
 * page follows - because the lookup happens on the way to rendering the form, not in the browser.
 *
 * Codes already chosen stay chosen while a new search is typed: they travel in the URL as
 * `hcpcs_code` / `drug`, the search runs on them, and the form re-renders them as ticked boxes.
 */
const CODE_SHAPE = /^[A-Za-z0-9]{1,5}$/;


/** Home address and cell phone: the premium, contract-only kinds from Residence Match. */
/**
 * One group of filters in the rail: a heading that opens and closes, and a badge saying how many of
 * its filters are on.
 *
 * `<details>` rather than a toggle, so this works with no client JavaScript - the rule the whole
 * screen follows. A group opens itself when something in it is set, because a filter hidden behind
 * a closed heading is a filter somebody set last week and is now mystified by.
 */
function Group({
  title,
  count,
  holds,
  open = false,
  children,
}: {
  title: string;
  count: number;
  /**
   * What this group contains, in the customer's words, shown while it is closed.
   *
   * The owner's objection to this screen was that nobody can tell what we offer. Eight closed
   * headings answer "where would I look" and not "is it there at all" - somebody who does not know
   * we filter on a star rating has no reason to open The record, and a name alone will not tell
   * them. This is the list of what is inside, which is the cheapest possible answer.
   *
   * It is deliberately not a "find a filter" box, which is what the admin rail has. That needs
   * client JavaScript to narrow a list as you type, and this screen runs none - a search box here
   * would be a round trip to the server to be told which groups to open, which is worse than
   * simply saying what is in them.
   */
  holds: string;
  open?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className="ps-group" open={open || count > 0}>
      <summary>
        <span className="ps-group-name">{title}</span>
        {count > 0 && (
          <span className="ps-count" aria-label={`${count} set`}>
            {count}
          </span>
        )}
        <span className="ps-group-holds">{holds}</span>
      </summary>
      <div className="ps-group-body">{children}</div>
    </details>
  );
}

/** The header of a column that can be ordered: a link that toggles, and says which way it is. */
function SortHeader({
  field,
  label,
  current,
  here,
}: {
  field: string;
  label: string;
  current: Sort;
  here: string;
}) {
  const active = current.field === field;
  // The `<th>` is rendered here rather than around this, because `aria-sort` is only defined on
  // a column header - on the link inside it the attribute is ignored and the column announces no
  // ordering at all. The header holds the state; the link only changes it.
  return (
    <th aria-sort={active ? (current.descending ? "descending" : "ascending") : "none"}>
      <a href={sortHref(here, current, field)} className="ps-sort">
        {label}
        <span aria-hidden="true">{active ? (current.descending ? " ↓" : " ↑") : ""}</span>
      </a>
    </th>
  );
}

/** The pasted NPIs, back in the box, one per line. `whoFilters` types its values loosely. */
function npiLines(value: string | string[] | undefined): string {
  if (value === undefined) return "";
  return (Array.isArray(value) ? value : [value]).join(String.fromCharCode(10));
}

export default async function AppSearchPage({ searchParams }: Props) {
  const selection = selectionQuery(await searchParams);
  if (!selection.ok) return (
    <section>
      <h1>We could not read this selection</h1>
      <p>No search was run. Return to your selection and open a new review link with valid, ten-digit NPIs.</p>
      <Link href="/app/search">Start a new search</Link>
    </section>
  );
  const params = selection.params;
  const q = one(params, "q");
  const sort = readSort(one(params, "sort"));
  const state = one(params, "state");
  const classification = one(params, "classification");
  const type = one(params, "type");
  // Either both filters or neither: the platform refuses each without the other, and a 422 reaches
  // this page as an empty result that reads as "nothing matched". See lib/radius.ts.
  const radius = radiusFilter(one(params, "near_zip"), one(params, "radius_miles"));
  // Fetched before the search rather than beside it, because the filter can only be validated
  // against the list. `ehr_system` is an **exact** match on the platform's side, so a name it has
  // never heard of returns nothing - and an empty result reads as "no providers run that" when it
  // means "that is not how it is spelled". One cached reference call is the price of not shipping
  // that ambiguity; the options come from the data, so the select can only offer real answers and
  // only a hand-edited URL can be wrong. That falls back to no filter, never to an empty page.
  // Both are lists the filter can only be checked against, so both are fetched before the search
  // rather than beside it. `payment_year` is the sharper of the two: the platform refuses a
  // program year it holds nothing for, and CMS publishes one in the middle of the following year,
  // so the calendar is not a safe guess at which years exist.
  const [ehrSystems, paymentYears, credentials] = await Promise.all([
    getEhrSystems(),
    getPaymentYears(),
    // A list rather than a text box, for the same reason as the EHR systems: the filter matches
    // curated codes, so a typed "M.D." finds nothing and an empty page reads as an answer.
    getCredentials(),
  ]);
  const askedCity = one(params, "city");
  const askedZip = one(params, "postal_code");
  const askedStreet = one(params, "street");
  // A street needs a ZIP, a city or a radius to anchor it - the platform refuses it alone - so the
  // radius has to be decided first. See lib/placeFilters.ts.
  const place = placeFilter(askedCity, askedZip, askedStreet, radiusInUse(radius));
  const strayStreet = streetNeedsAnchor(askedStreet, askedCity, askedZip, radiusInUse(radius));
  const reach = reachFilter((name) => one(params, name));
  // Where they live, and whether we hold it. Open to a contract customer through the same plan door
  // the reveal uses; the platform has accepted these since 28 Sep and this screen has never offered
  // them, so the capability existed with nothing able to reach it.
  //
  // `askedResidence` is separate because the platform refuses the *whole search* rather than
  // dropping the term - the right call, since silently ignoring `has_home_address=true` would hand
  // somebody every provider and let them believe each one had a home address on file. The fields
  // below are only rendered for a plan that carries them, but a shared or hand-edited URL can still
  // carry one, and knowing that is what lets the page explain itself instead of reporting that the
  // platform did not answer.
  const who = whoFilters((name) => one(params, name), (name) => many(params, name));
  // The negatives, read back from the URL the same way, so each control can re-render with what
  // was chosen. The lists themselves are loaded further down - `exclude` only holds their ids.
  const exclude = listFilters((name) => one(params, name), (name) => many(params, name));
  const asList = (value: string | string[] | undefined): string[] =>
    Array.isArray(value) ? value : value ? [value] : [];
  const facts = providerFacts((name) => one(params, name), (name) => many(params, name));
  // What industry paid them, and who they work for. Both shown back *normalised*, so a value the
  // shape check dropped does not sit in the box looking accepted.
  const payments = paymentFilters((name) => one(params, name), { years: paymentYears });
  const affils = affiliationFilters((name) => one(params, name), (name) => many(params, name));
  // The systems already chosen, and whatever was typed to find more of them - the same
  // search-then-tick shape the procedure and drug pickers use, because a system is matched exactly
  // and a name that is almost right would read as "nobody works there".
  const systems = affils.idn ?? [];
  const systemQuery = one(params, "system_q").slice(0, 200);
  const residence = residenceFilter((name) => one(params, name));
  const askedResidence = asksForResidence((name) => one(params, name));
  // "Active only, unless you ask otherwise" is what the help page has always said; this is the
  // asking. Anything but the three the platform accepts falls back to `active`, so a hand-edited
  // URL narrows rather than widens - a search that quietly included deactivated providers would
  // put dead NPIs in somebody's file without them choosing it.
  const askedStatus = one(params, "status");
  const status = ["active", "inactive", "any"].includes(askedStatus) ? askedStatus : "active";
  const askedEhr = one(params, "ehr_system");
  const ehrSystem = ehrSystems.some((option) => option.ehr_system === askedEhr) ? askedEhr : "";
  const page = Math.max(1, Number.parseInt(one(params, "page") || "1", 10) || 1);
  const revealed = (one(params, "revealed") || "")
    .split(",")
    .filter((value) => /^\d{10}$/.test(value));
  const freeAgain = one(params, "free");
  const revealError = one(params, "reveal_error");
  // The outcome of the Add to list form, which redirected back here.
  const addedCount = Number.parseInt(one(params, "added") || "0", 10) || 0;
  const addedList = one(params, "list");
  const alreadyCount = Number.parseInt(one(params, "already") || "0", 10) || 0;
  const kept = one(params, "kept");
  const forgot = one(params, "forgot") === "1";
  const savedError = SAVED_ERRORS[one(params, "saved_error")];
  const cappedAt = Number.parseInt(one(params, "capped") || "0", 10) || 0;
  const listError = one(params, "list_error") || (addedCount === 0 ? one(params, "error") : "");
  // The Medicare filters, passed through only in the shapes the API accepts: a stray value would
  // be a 422 and an empty page, which reads as "nothing matched" when it means "bad input".
  const medicare: Record<string, string> = {};
  for (const key of MEDICARE_FLAGS) {
    const value = one(params, key);
    if (value === "true" || value === "false") medicare[key] = value;
  }
  for (const key of MEDICARE_FLOORS) {
    const value = one(params, key);
    // Counts are whole numbers to the API; only the MIPS score takes a fraction, up to 100.
    const shape = key === "min_mips_score" ? /^\d{1,3}(\.\d{1,2})?$/ : /^\d{1,9}$/;
    if (shape.test(value) && !(key === "min_mips_score" && Number(value) > 100)) {
      medicare[key] = value;
    }
  }

  // Chosen codes and drug names, and whatever the customer typed to find more of them. A code is
  // shape-checked here so a pasted sentence cannot become a filter the API refuses with a 422 -
  // which would read as "nothing matched" when it means "bad input".
  const codes = many(params, "hcpcs_code").filter((c) => CODE_SHAPE.test(c));
  const drugs = many(params, "drug").map((d) => d.slice(0, 255));
  const procedureQuery = one(params, "hcpcs_q").slice(0, 120);
  const drugQuery = one(params, "drug_q").slice(0, 120);
  const minServices = /^\d{1,9}$/.test(one(params, "min_hcpcs_services"))
    ? one(params, "min_hcpcs_services")
    : "";
  const minClaims = /^\d{1,9}$/.test(one(params, "min_drug_claims"))
    ? one(params, "min_drug_claims")
    : "";
  const claimsOpen =
    codes.length > 0 ||
    drugs.length > 0 ||
    procedureQuery !== "" ||
    drugQuery !== "" ||
    minServices !== "" ||
    minClaims !== "";

  // Every filter this search runs, in one object, built by the same module the export form and the
  // export route read it back with. The export used to assemble its own list and carried twelve
  // fewer filters than the screen, so a search narrowed to Austin exported the whole of Texas - and
  // `export_rows` was billed for every extra row. One list, one answer. See lib/searchFilters.ts.
  const filters = searchFilters(
    (name) => one(params, name),
    (name) => many(params, name),
    { ehrSystems: ehrSystems.map((option) => option.ehr_system), paymentYears },
  );

  const [results, billing, listsOrNull, savedOrNull, procedureMatches, drugMatches, systemMatches] =
    await Promise.all([
    searchAsUser({
      ...filters,
      // Paging is not a filter, which is why it is not in there: an export has neither. Nor is
      // the ordering: the same rows in a different order are the same export.
      page,
      page_size: PAGE_SIZE,
      sort: sort.descending ? `-${sort.field}` : sort.field,
    }),
    getBilling(),
    // The lists this organisation keeps, so the bar below the results can offer them by name. One
    // call for the page whatever the result count is, and an empty answer is not an error: a
    // customer with no lists is offered the one field that makes their first one.
    getLists(),
    // The searches this organisation has kept. One call, and an empty answer is not an error.
    getSavedSearches(),
    // The lookups run only when something was typed, and the chosen values are asked for by name
    // as well so a ticked box can be labelled with what it actually is rather than with its code.
    procedureQuery ? findProcedures(procedureQuery) : Promise.resolve<ProcedureOption[]>([]),
    drugQuery ? findDrugs(drugQuery) : Promise.resolve<DrugOption[]>([]),
      systemQuery ? findHealthSystems(systemQuery) : Promise.resolve<HealthSystemOption[]>([]),
    ]);

  // Only the providers opened in this session's URL are fetched, so the page costs one call per
  // reveal the customer actually made rather than one per row on screen.
  const contacts = new Map<string, OpenedContacts>(
    await Promise.all(
      revealed.map(async (npi) => [npi, await getContacts(npi)] as const),
    ),
  );

  const reveals = billing?.limits?.reveals;
  const exportRows = billing?.limits?.export_rows;
  const rows: SearchRow[] = results?.items ?? [];
  // What this organisation has already reported about the providers on this page: one call for the
  // page, so a field they have told us about comes back marked rather than offered again.
  const reported = await getReportedFields(
    "npi",
    rows.map((row) => row.npi),
  );
  const total = results?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  // Every link on this page - page 2, a reveal's way back, a chip's removal - is this search
  // again, so it is built from `filters`: the one list, the same object the search just ran with.
  //
  // It used to be a hand-written subset, and it was missing eighteen filters: all six under The
  // record, all three under Who they work for, all three Industry payments and all four under Home
  // address and cell. Clicking Next on a search narrowed to one health system gave page 2 of a
  // national one, and every row on it was believable. The pattern is the export bug again - a
  // second list of filter names that agreed with the first until somebody added a filter - which is
  // why this one is derived rather than written.
  //
  // `searchFilters` is built to round-trip: it reads `classification` as well as the platform's
  // `taxonomy_classification`, so its output goes back into a URL unchanged. The rename is undone
  // anyway, because the form on this screen spells it `classification` and page 2 has to re-render
  // the form with the specialty still selected.
  const here = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    // `status` is in `filters` always, deliberately - the platform and the screen agreeing today is
    // no reason to let them drift. In a URL the default is noise, so only a narrowing is carried.
    if (key === "status" && value === "active") continue;
    const name = key === "taxonomy_classification" ? "classification" : key;
    // Appended rather than set: page 2 of a two-code search is still a two-code search.
    for (const each of Array.isArray(value) ? value : [value]) here.append(name, each);
  }
  if (revealed.length > 0) here.set("revealed", revealed.join(","));
  // The ordering travels with the search. Without this, page 2 of a list sorted by city arrives
  // back in name order - the links below are built from `here`, and so is the return address a
  // reveal comes back to.
  if (sort.field !== "name" || sort.descending) {
    here.set("sort", sort.descending ? `-${sort.field}` : sort.field);
  }
  const returnTo = `/app/search?${here}${page > 1 ? `&page=${page}` : ""}`;
  // What this search is narrowed by, in the words the controls use, each with what to drop to undo
  // it. Forty controls only fit in collapsed groups, and a collapsed group is a filter nobody can
  // see - so what is on is listed above the results whether its group is open or not.
  // Kept searches, and whether we actually read them: the panel's empty state is a sentence about
  // what somebody has done, so it must not be printed over a failed request.
  const saved = savedOrNull ?? [];

  // This screen only needs the lists for a picker and for the chip names, so a silence from the
  // platform is the same as having none here: one fewer control, rather than a wrong sentence.
  // The lists page is where the difference is worth saying out loud.
  const lists = listsOrNull ?? [];

  // Which list the picker shows. After an add the URL names it, so the next click goes to the same
  // list rather than resetting to "Choose a list..." - and it is what the "Add all" form sends,
  // since a select can only belong to one form.
  const pickedList = lists.some((row) => row.id === addedList) ? addedList : (lists[0]?.id ?? "");

  // The chips are built from the URL, which spells a list as a UUID. The names come from the
  // lists just loaded, so a chip reads "Not on list · Contacted in September".
  const chips = searchChips(
    here,
    Object.fromEntries(lists.map((row) => [row.id, row.name])),
  );
  /** The parameter a chip belongs to, which is also the group it is counted against. */
  const chipOwner = (chip: SearchChip) =>
    typeof chip.remove[0] === "string" ? chip.remove[0] : chip.remove[0][0];
  /** How many of this group's filters are on. A radius counts once, not twice. */
  const used = (names: readonly string[]) =>
    chips.filter((chip) => names.includes(chipOwner(chip))).length;
  /** This search with one chip's parameters taken out. Dropping a filter starts again at page 1. */
  const without = (chip: SearchChip) => {
    const next = new URLSearchParams(here);
    for (const one of chip.remove) {
      if (typeof one === "string") {
        next.delete(one);
      } else {
        // One value of a repeatable - one of three ticked codes - so the others are put back.
        const kept = next.getAll(one[0]).filter((value) => value !== one[1]);
        next.delete(one[0]);
        for (const value of kept) next.append(one[0], value);
      }
    }
    return `/app/search?${next}`;
  };
  // Refused before it starts rather than half-way through: the button is off when this search is
  // larger than what is left, for the month or for today, and the line under it says which.
  const budget = headroom(exportRows);
  const overBudget = total === 0 || (budget !== null && total > budget);

  return (
    <main className="wrap app-main ps">
      <header className="ps-head">
        <div className="ps-head-text">
          <div className="eyebrow rule">Providers</div>
          <h1>Find a provider, then open them.</h1>
          <p className="ps-sub">
            Opening a provider costs one reveal, and only the first time — coming back to the same
            record this month is free.
            {billing?.premium_contacts &&
              ` On your plan, a reveal that hands over a home address or cell phone counts as ${
                billing.premium_reveal_units ?? 2
              }.`}
          </p>
        </div>
        {reveals && (
          <div className="ps-allowance">
            <b className="num">
              {reveals.limit === null
                ? reveals.used.toLocaleString("en-US")
                : `${reveals.used.toLocaleString("en-US")} / ${reveals.limit.toLocaleString("en-US")}`}
            </b>
            <span className="fine">reveals used this month</span>
            {reveals.limit !== null && (
              <div className="meter" aria-hidden="true">
                <i
                  style={{
                    width: `${Math.min(100, Math.round((reveals.used / Math.max(1, reveals.limit)) * 100))}%`,
                  }}
                />
              </div>
            )}
            {reveals.limit !== null && reveals.remaining === 0 && (
              <span className="fine">
                None left, which is why the Reveal buttons are not available. Providers you have
                already opened stay open. <Link href="/app/billing">Plan and usage</Link> says when
                the allowance goes back up.
              </span>
            )}
          </div>
        )}
      </header>

      {revealError && (
        <div className="notice stop" role="alert">
          {REVEAL_ERRORS[revealError] ?? REVEAL_ERRORS.failed}
        </div>
      )}
      {freeAgain && !revealError && (
        <div className="notice ok">
          You had already opened NPI {freeAgain} this month, so that was free.
        </div>
      )}
      <ReportNotice params={params} />
      {/* What became of the rows that were ticked. The count is what was sent rather than what was
          new: the platform returns the list's new total, so claiming "8 added" when six were
          already on it would be wrong, and the list's own total is on the list page. */}
      {(addedCount > 0 || alreadyCount > 0) && (
        <div className="notice ok">
          {addedCount.toLocaleString("en-US")} provider{addedCount === 1 ? "" : "s"} added to{" "}
          {addedList ? <Link href={`/app/lists/${addedList}`}>the list</Link> : "the list"}.
          {/* Said rather than folded into the total: "added 2,455" when 1,200 were already there
              is the answer to a question nobody asked, and the difference is the one a campaign
              is planned on. */}
          {alreadyCount > 0 && (
            <>
              {" "}
              {alreadyCount.toLocaleString("en-US")} of the matches {alreadyCount === 1 ? "was" : "were"}{" "}
              already on it.
            </>
          )}
          {cappedAt > 0 && (
            <>
              {" "}
              <b>
                That search matches more than {cappedAt.toLocaleString("en-US")}, which is the most
                one go adds.
              </b>{" "}
              Narrow it and add the rest.
            </>
          )}
        </div>
      )}
      {listError && (
        <div className="notice stop" role="alert">
          {LIST_ERRORS[listError] ?? LIST_ERRORS.failed}
        </div>
      )}
      {kept && <div className="notice ok">Kept this search as &ldquo;{kept}&rdquo;.</div>}
      {forgot && <div className="notice">That saved search was forgotten.</div>}
      {savedError && (
        <div className="notice stop" role="alert">
          {savedError}
        </div>
      )}

      {/* Searches kept by name. Above the form rather than below the results, because the point of
          one is to start from it: somebody arriving at this screen with a search in mind wants it
          before they touch a filter, not after they have rebuilt it.

          An alert is deliberately a different thing and the panel says so. An alert is a standing
          watch over four filters on a schedule; this is "run that again", with every filter the
          screen carries. Conflating them is how somebody ends up with eleven alerts they never
          wanted mail about. */}
      {(saved.length > 0 || results !== null) && (
        <details className="exp" open={saved.length > 0 && results === null}>
          <summary className="exp-label">
            Saved searches{saved.length > 0 && <span className="tag">{saved.length}</span>}
          </summary>
          <div className="exp-group">
            {savedOrNull === null ? (
              <p className="fine">
                Your kept searches could not be read just now &mdash; that is not the same as
                having none. Try again in a moment.
              </p>
            ) : saved.length === 0 ? (
              <p className="fine">
                None yet. Narrow a search and keep it, and it will be here to run again.
              </p>
            ) : (
              <ul className="exp-list">
                {saved.map((row: SavedSearchRow) => (
                  <li key={row.id} className="ps-saved">
                    <Link href={savedSearchHref(row)}>{row.name}</Link>
                    <span className="fine">
                      {Object.keys(row.params).filter((key) => key !== "status").length} filter
                      {Object.keys(row.params).filter((key) => key !== "status").length === 1
                        ? ""
                        : "s"}{" "}
                      · kept <span className="mono">{row.created_at.slice(0, 10)}</span>
                    </span>
                    <form method="post" action="/api/app/saved-searches">
                      <input type="hidden" name="action" value="delete" />
                      <input type="hidden" name="id" value={row.id} />
                      <input type="hidden" name="return_to" value={returnTo} />
                      <button type="submit" className="btn sm">
                        Forget
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
            {/* Keeping the current one. The filters travel as hidden fields built from the one
                list, exactly as the export form builds them, so what is kept is the search that
                ran rather than whatever the controls happen to hold. */}
            {results !== null && (
              <form method="post" action="/api/app/saved-searches" className="pickbar">
                <input type="hidden" name="return_to" value={returnTo} />
                {Object.entries(filters).flatMap(([name, value]) =>
                  (Array.isArray(value) ? value : [value]).map((each, index) => (
                    <input
                      key={`s-${name}-${index}`}
                      type="hidden"
                      name={name}
                      value={String(each)}
                    />
                  )),
                )}
                <label htmlFor="keep-name" className="sr-only">
                  Name for this search
                </label>
                <input
                  id="keep-name"
                  name="name"
                  type="text"
                  maxLength={120}
                  placeholder="Name this search to run it again"
                />
                <button type="submit" className="btn sm primary">
                  Keep this search
                </button>
              </form>
            )}
            <p className="fine">
              A saved search is &ldquo;run that again&rdquo;, with every filter this screen
              carries. An <Link href="/app/alerts">alert</Link> is a different thing: a standing
              watch, on a schedule, over four of them.
            </p>
          </div>
        </details>
      )}

      {/* The four questions almost every search starts with, always visible. Everything else is in
          the rail below, grouped and closed until it is used - forty controls in one flat form was
          the screen this replaces, and nobody could find the two they wanted in it.

          This form owns the rail's controls too, by id (`FORM`): the rail cannot be inside it,
          because the results beside it hold forms of their own. */}
      <form id={FORM} className="ps-query" method="get" action="/app/search">
        <div className="field ps-grow">
          <label htmlFor="q">Name, organization or NPI</label>
          <input id="q" name="q" type="search" defaultValue={q} maxLength={200}
                 placeholder="e.g. Reyes, or 1234567893" />
        </div>
        <div className="field ps-wide">
          <label htmlFor="classification">Specialty</label>
          <select id="classification" name="classification" defaultValue={classification}>
            <option value="">Any specialty</option>
            {CLASSIFICATIONS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="state">State</label>
          <select id="state" name="state" defaultValue={state}>
            <option value="">Any state</option>
            {US_STATES.map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </div>
        {/* Active only unless you ask otherwise - which the help page has described all along.
            Deactivated NPIs are real records that belong in a compliance check and not in a
            mailing, so the default stays `active` and asking is deliberate. */}
        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={status}>
            <option value="active">Active only</option>
            <option value="inactive">Deactivated only</option>
            <option value="any">Active and deactivated</option>
          </select>
        </div>
        <button type="submit" className="btn primary ps-go">
          Search
        </button>
      </form>

      {/* What this search is narrowed by, and one click to undo any of it. The count was never
          wrong and never explained: a star rating set in the morning is still narrowing the
          afternoon's search, from inside a group that closed itself behind it. */}
      {chips.length > 0 && (
        <div className="ps-chips">
          <span className="ps-chips-lead">Narrowed by</span>
          {chips.map((chip) => (
            <span className="chip filter ps-chip" key={`${chipOwner(chip)}-${chip.text}`}>
              {chip.lead && <em>{chip.lead}</em>} {chip.text}
              <Link
                className="ps-chip-off"
                href={without(chip)}
                aria-label={`Remove the ${[chip.lead, chip.text].filter(Boolean).join(" ")} filter`}
              >
                ×
              </Link>
            </span>
          ))}
          <Link className="btn sm ps-clear" href="/app/search">
            Clear all
          </Link>
        </div>
      )}

      <div className="ps-grid">
        <aside className="ps-rail" aria-label="Filters">
          <h2 className="ps-rail-head">Filters</h2>

          <Group title="Who they are" count={used(GROUPS.who)} holds="Individual or organization">
            <div className="field">
              <label htmlFor="type">Provider type</label>
              <select id="type" name="type" form={FORM} defaultValue={type}>
                <option value="">Any</option>
                <option value="individual">Individual</option>
                <option value="organization">Organization</option>
              </select>
            </div>
            {credentials.length > 0 && (
              <div className="field">
                <label htmlFor="credential">Credential</label>
                <select id="credential" name="credential" form={FORM} multiple size={6}
                        defaultValue={Array.isArray(who.credential) ? who.credential : []}>
                  {credentials.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.label} ({option.provider_count.toLocaleString("en-US")})
                    </option>
                  ))}
                </select>
                <span className="fine">
                  Any of the ones you pick. NPPES does not require a credential, so a large part of
                  the register has filed none at all and is left out by this filter &mdash;
                  physicians included.
                </span>
              </div>
            )}
            <div className="ps-pair">
              <div className="field">
                <label htmlFor="first_name">First name</label>
                <input id="first_name" name="first_name" form={FORM} maxLength={120}
                       defaultValue={typeof who.first_name === "string" ? who.first_name : ""} placeholder="part of a first name" />
              </div>
              <div className="field">
                <label htmlFor="last_name">Surname</label>
                <input id="last_name" name="last_name" form={FORM} maxLength={120}
                       defaultValue={typeof who.last_name === "string" ? who.last_name : ""} placeholder="part of a surname" />
              </div>
            </div>
            <div className="field">
              <label htmlFor="organization_name">Organization name</label>
              <input id="organization_name" name="organization_name" form={FORM} maxLength={120}
                     defaultValue={typeof who.organization_name === "string" ? who.organization_name : ""}
                     placeholder="part of an organization's name" />
            </div>
            {/* The one control on this screen that takes a paste rather than a value. Somebody
                checking a list they already hold is the commonest reason to be here at all, and
                until now there was no way to express it. */}
            <div className="field">
              <label htmlFor="npi_list">These NPIs only</label>
              <textarea id="npi_list" name="npi_list" form={FORM} rows={3}
                        defaultValue={npiLines(who.npi)}
                        placeholder="Paste a column or a comma-separated list" />
              <span className="fine">
                Up to {MAX_NPIS.toLocaleString("en-US")}. Anything that is not a 10-digit NPI is
                ignored, so a pasted column can keep its header. More than that belongs in Append,
                which takes a file.
              </span>
            </div>
            <p className="ps-note">
              Specialty and state are in the bar above, because almost every search starts with
              them.
            </p>
          </Group>

          <Group title="Where they practice" count={used(GROUPS.where)} holds="City, ZIP, within N miles of a ZIP, street">
            <div className="field">
              <label htmlFor="city">City</label>
              <input id="city" name="city" form={FORM} defaultValue={place.city ?? ""}
                     maxLength={120} placeholder="e.g. Austin" />
            </div>
            <div className="field">
              <label htmlFor="postal_code">ZIP</label>
              <input
                id="postal_code"
                name="postal_code"
                form={FORM}
                defaultValue={place.postal_code ?? ""}
                maxLength={120}
                placeholder="5 digits, or first 3; several with commas"
              />
            </div>
            {/* Within N miles of a ZIP: a real distance test against ZIP centroids, not a prefix
                on the ZIP column - which is why it sits here rather than hiding under State. A
                territory rarely stops at a state line. The two inputs are only ever sent together
                (lib/radius.ts), and the chip above removes them as one thing. */}
            <div className="ps-pair">
              <div className="field">
                <label htmlFor="near_zip">Near ZIP</label>
                <input
                  id="near_zip"
                  name="near_zip"
                  form={FORM}
                  inputMode="numeric"
                  defaultValue={radiusInUse(radius) ? radius.near_zip : ""}
                  maxLength={5}
                  placeholder="78701"
                />
              </div>
              <div className="field">
                <label htmlFor="radius_miles">Within</label>
                <select
                  id="radius_miles"
                  name="radius_miles"
                  form={FORM}
                  defaultValue={radiusInUse(radius) ? String(radius.radius_miles) : ""}
                >
                  {/* No "Any": a radius means nothing without a centre, and the ZIP box beside it
                      is where "anywhere" is expressed by leaving it blank. Every option is inside
                      the platform's own range, so none can produce a refusal nobody can see. */}
                  {RADIUS_CHOICES.map((miles) => (
                    <option key={miles} value={miles}>
                      {miles} miles
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* A street needs a ZIP, a city or a radius to anchor it, or the platform refuses the
                whole search. Rather than send that and show an empty page, the street is dropped
                and the note below says so - see `strayStreet`. */}
            <div className="field">
              <label htmlFor="street">Street</label>
              <input
                id="street"
                name="street"
                form={FORM}
                defaultValue={place.street ?? askedStreet}
                maxLength={120}
                placeholder="e.g. 43 New Scotland Ave"
              />
            </div>
            <p className="ps-note">
              A street needs a city, a ZIP or a radius to search within.
            </p>
          </Group>

          <Group title="How to reach them" count={used(GROUPS.reach)} holds="Work email and its trust tier, practice phone, postal address, employer website">
            <div className="field">
              <label htmlFor="has_email">Work email</label>
              <select id="has_email" name="has_email" form={FORM}
                      defaultValue={reach.has_email ?? ""}>
                <option value="">Any</option>
                <option value="true">We hold one</option>
                <option value="false">We hold none</option>
              </select>
            </div>
            {/* The tier the address has to clear, not whether one exists. `/help/email-trust`
                explains the tiers; this is the filter that article has been describing. */}
            <div className="field">
              <label htmlFor="email_trust">Email trust</label>
              <select id="email_trust" name="email_trust" form={FORM}
                      defaultValue={reach.email_trust ?? ""}>
                <option value="">Any</option>
                {EMAIL_TRUST.map((tier) => (
                  <option key={tier} value={tier}>
                    {tier === "any" ? "Any tier on file" : tier[0].toUpperCase() + tier.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="ps-pair">
              <div className="field">
                <label htmlFor="has_phone">Practice phone</label>
                <select id="has_phone" name="has_phone" form={FORM}
                        defaultValue={reach.has_phone ?? ""}>
                  <option value="">Any</option>
                  <option value="true">We hold one</option>
                  <option value="false">We hold none</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="has_address">Postal address</label>
                <select id="has_address" name="has_address" form={FORM}
                        defaultValue={reach.has_address ?? ""}>
                  <option value="">Any</option>
                  <option value="true">We hold one</option>
                  <option value="false">We hold none</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label htmlFor="has_domain">Employer website</label>
              <select id="has_domain" name="has_domain" form={FORM}
                      defaultValue={reach.has_domain ?? ""}>
                <option value="">Any</option>
                <option value="true">We hold a domain</option>
                <option value="false">We hold none</option>
              </select>
            </div>
          </Group>

          {/* Where they live. Only for a plan that carries it: `premium_contacts` is the same test
              the reveal uses (`app.reveals.premium_residence_open` - the owner's switch, a real
              plan, and consumer access an admin sets after a contract). Offering these to a plan
              without them would be four fields whose only possible answer is a refused search.

              These narrow the results; they do not open anything. A row still costs a reveal, and
              the platform deliberately does not mark *which* providers matched -
              `has_home_address=true` finds them without naming them, or every search would publish
              for free what the reveal is for. */}
          <Group title="Home address &amp; cell" count={used(GROUPS.home)} holds="Home address, cell phone, which state they live in, home vs practice">
            {billing?.premium_contacts ? (
              <>
                <div className="ps-pair">
                  <div className="field">
                    <label htmlFor="has_home_address">Home address</label>
                    <select
                      id="has_home_address"
                      name="has_home_address"
                      form={FORM}
                      defaultValue={residence.has_home_address ?? ""}
                    >
                      <option value="">Any</option>
                      <option value="true">We hold one</option>
                      <option value="false">We hold none</option>
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="has_cell_phone">Cell phone</label>
                    <select
                      id="has_cell_phone"
                      name="has_cell_phone"
                      form={FORM}
                      defaultValue={residence.has_cell_phone ?? ""}
                    >
                      <option value="">Any</option>
                      <option value="true">We hold one</option>
                      <option value="false">We hold none</option>
                    </select>
                  </div>
                </div>
                {/* A text box rather than the State select: this filter is repeatable, and
                    somebody working a patch asks for "TX, NM" in one search rather than two. */}
                <div className="field">
                  <label htmlFor="home_state">Lives in</label>
                  <input
                    id="home_state"
                    name="home_state"
                    form={FORM}
                    defaultValue={(residence.home_state ?? []).join(", ")}
                    maxLength={120}
                    placeholder="2-letter states, e.g. TX, NM"
                  />
                </div>
                <div className="field">
                  <label htmlFor="practice_home_relation">Home vs practice</label>
                  <select
                    id="practice_home_relation"
                    name="practice_home_relation"
                    form={FORM}
                    defaultValue={residence.practice_home_relation ?? ""}
                  >
                    <option value="">Any</option>
                    {HOME_RELATIONS.map((relation) => (
                      <option key={relation} value={relation}>
                        {relation === "same_zip"
                          ? "Lives in the ZIP they practice in"
                          : relation === "same_state"
                            ? "Lives in the state they practice in"
                            : "Lives in a different state"}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="ps-note">
                  These narrow the results. They do not open anything: a row still costs a reveal,
                  and a search never marks which providers matched.
                </p>
              </>
            ) : (
              <div className="ps-locked">
                <b>Not on this plan</b>
                Home address and cell phone are opened under a signed contract that states your
                permissible use. <Link href={salesHref("Contact plan")}>Talk to us</Link> and four
                filters appear here.
              </div>
            )}
          </Group>

          {/* Public record: when the NPI was issued, the CMS star rating, the PECOS billing group,
              the two HRSA programmes, the EHR product, and the three Medicare standings. Each shows
              back the *normalised* value, so a year or a rating the shape check dropped does not
              sit in the box looking accepted. */}
          <Group title="The record" count={used(GROUPS.record)} holds="Year the NPI was issued, CMS star rating, billing group, HRSA shortage area and health center, EHR system, Medicare standing">
            <div className="ps-pair">
              <div className="field">
                <label htmlFor="enumerated_from">NPI issued from</label>
                <input id="enumerated_from" name="enumerated_from" form={FORM} inputMode="numeric"
                       maxLength={4} defaultValue={facts.enumerated_from ?? ""}
                       placeholder="e.g. 2015" />
              </div>
              <div className="field">
                <label htmlFor="enumerated_to">…up to</label>
                <input id="enumerated_to" name="enumerated_to" form={FORM} inputMode="numeric"
                       maxLength={4} defaultValue={facts.enumerated_to ?? ""}
                       placeholder="e.g. 2020" />
              </div>
            </div>
            <div className="field">
              <label htmlFor="min_star_rating">Star rating at least</label>
              <select id="min_star_rating" name="min_star_rating" form={FORM}
                      defaultValue={facts.min_star_rating ?? ""}>
                <option value="">Any</option>
                {["1", "1.5", "2", "2.5", "3", "3.5", "4", "4.5", "5"].map((n) => (
                  <option key={n} value={n}>{n} and above</option>
                ))}
              </select>
            </div>
            <p className="ps-note">
              The rating belongs to the certified facility behind the NPI, and not every NPI can be
              tied to one &mdash; so this narrows to the ones we could, which is a floor rather
              than a census.
            </p>
            <div className="field">
              <label htmlFor="group_name">Billing group</label>
              <input id="group_name" name="group_name" form={FORM} maxLength={255}
                     defaultValue={facts.group_name ?? ""}
                     placeholder="starts with, e.g. Austin Family" />
            </div>
            {/* Repeatable on the platform, so a multiple select rather than one choice: "dental or
                mental health" is one question, and asking it twice is two searches. */}
            <div className="field">
              <label htmlFor="shortage_area">HRSA shortage area</label>
              <select id="shortage_area" name="shortage_area" form={FORM} multiple size={4}
                      defaultValue={facts.shortage_area ?? []}>
                {SHORTAGE_AREAS.map((v) => (
                  <option key={v} value={v}>
                    {v === "any" ? "Any shortage area" : v.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="health_center">HRSA health center</label>
              <select id="health_center" name="health_center" form={FORM} multiple size={3}
                      defaultValue={facts.health_center ?? []}>
                {HEALTH_CENTERS.map((v) => (
                  <option key={v} value={v}>
                    {v === "any" ? "Any health center" : v === "fqhc" ? "FQHC" : "Look-alike"}
                  </option>
                ))}
              </select>
            </div>
            {/* Only rendered when the platform has actually identified some products. An empty
                select would be a filter that can only return nothing, which is worse than no
                filter at all. The counts are shown because "Epic (412,908)" tells somebody whether
                a filter is worth using far better than "Epic" does. */}
            {ehrSystems.length > 0 && (
              <div className="field">
                <label htmlFor="ehr_system">EHR system</label>
                <select id="ehr_system" name="ehr_system" form={FORM} defaultValue={ehrSystem}>
                  <option value="">Any</option>
                  {ehrSystems.map((option) => (
                    <option key={option.ehr_system} value={option.ehr_system}>
                      {option.ehr_system} ({option.provider_count.toLocaleString("en-US")})
                    </option>
                  ))}
                </select>
              </div>
            )}
            {/* Standing rather than volume: whether they opted out, were excluded, or had their
                enrolment revoked. The volumes are under What they bill, where the other "at least"
                filters are. */}
            {MEDICARE_FLAGS.map((key) => (
              <div className="field" key={key}>
                <label htmlFor={key}>{FLAG_LABELS[key][0]}</label>
                <select id={key} name={key} form={FORM} defaultValue={medicare[key] ?? ""}>
                  <option value="">Either</option>
                  <option value="true">{FLAG_LABELS[key][1]}</option>
                  <option value="false">{FLAG_LABELS[key][2]}</option>
                </select>
              </div>
            ))}
          </Group>

          {/* Who they work for. An affiliation rather than a fact about the person, which is why
              these sit together and away from the filed fields above. */}
          <Group title="Who they work for" count={used(GROUPS.employer)} open={systemQuery !== ""} holds="Health system by name, health plan or PBM, health information exchange">
            <div className="field">
              <label htmlFor="system_q">Health system by name</label>
              <input
                id="system_q"
                name="system_q"
                form={FORM}
                type="search"
                maxLength={200}
                placeholder="e.g. Ascension, or Saint Thomas"
                defaultValue={systemQuery}
              />
            </div>
            <p className="ps-note">
              Type a name and search; the matches appear here to tick. Providers reach a system by
              identifier &mdash; their own NPI, a hospital affiliation, or Medicare billing
              reassigned to a member hospital or group &mdash; never by a name match.
            </p>

            {/* Already chosen, so a second search does not lose them. The slug is what the filter
                carries and it reads as the name it was made from; the full name comes back beside
                it only while it is in the matches. */}
            {systems.map((slug) => (
              <label className="ps-tick" key={`chosen-${slug}`}>
                <input type="checkbox" name="system" form={FORM} value={slug} defaultChecked />{" "}
                {slug === "any" ? <>Any health system</> : <span className="mono">{slug}</span>}{" "}
                <span className="fine">chosen &mdash; untick to drop it</span>
              </label>
            ))}

            {systemQuery !== "" && systemMatches !== null && (
              <>
                {systemMatches.length === 0 ? (
                  <p className="ps-note">
                    No health system matches &ldquo;{systemQuery}&rdquo;. Try fewer words: the legal
                    name is often not the name on the door.
                  </p>
                ) : (
                  <>
                    <p className="ps-note">
                      {systemMatches.length} match{systemMatches.length === 1 ? "" : "es"}, largest
                      first. How many providers are in one is what the search itself answers.
                    </p>
                    {systemMatches
                      .filter((match) => !systems.includes(match.slug))
                      .map((match) => (
                        <label className="ps-tick" key={match.slug}>
                          <input type="checkbox" name="system" form={FORM} value={match.slug} />{" "}
                          {match.name}{" "}
                          {match.hq_state && <span className="fine">{match.hq_state}</span>}{" "}
                          <span className="fine">
                            {match.hospitals.toLocaleString("en-US")} hospital
                            {match.hospitals === 1 ? "" : "s"}
                          </span>
                        </label>
                      ))}
                  </>
                )}
              </>
            )}
            {systemQuery !== "" && systemMatches === null && (
              <p className="ps-note">
                The health system list did not answer just now. Your other filters still ran.
              </p>
            )}

            <div className="field">
              <label htmlFor="payer_employer">Works for a payer</label>
              <select
                id="payer_employer"
                name="payer_employer"
                form={FORM}
                defaultValue={affils.payer_employer ?? ""}
              >
                <option value="">Either</option>
                {PAYER_EMPLOYERS.map((value) => (
                  <option key={value} value={value}>
                    {value === "any"
                      ? "A health plan or PBM"
                      : value === "pbm"
                        ? "A pharmacy benefit manager"
                        : value === "health_plan"
                          ? "A health plan"
                          : "Neither"}
                  </option>
                ))}
              </select>
            </div>
            {/* The one derived audience on this screen. Everything else here is filed or published,
                and a derived audience read as a filed fact is the one way this filter misleads - so
                the sentence the platform carries is shown with it. */}
            <p className="ps-note">
              Worked out from the employer we hold for them against a declared list of payers
              &mdash; not a filed job title. Expect to confirm it.
            </p>
            <div className="field">
              <label htmlFor="has_hie">Health information exchange</label>
              <select id="has_hie" name="has_hie" form={FORM} defaultValue={affils.has_hie ?? ""}>
                <option value="">Either</option>
                <option value="true">A member</option>
                <option value="false">Not one we know of</option>
              </select>
            </div>
            <p className="ps-note">
              As the federal provider directory records it: the organization itself, or one an
              individual works for.
            </p>
            {/* Facts about the CMS-certified facility behind the NPI rather than about the person.
                `facilities.npi` is nullable - Care Compare and the enrolment files do not always
                carry one - so these find the ones we could tie together, which is a floor rather
                than a census. */}
            <div className="field">
              <label htmlFor="has_facility">Certified facility</label>
              <select id="has_facility" name="has_facility" form={FORM}
                      defaultValue={typeof who.has_facility === "string" ? who.has_facility : ""}>
                <option value="">Either</option>
                <option value="true">We can tie them to one</option>
                <option value="false">We cannot</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="min_beds">That facility has at least</label>
              <input id="min_beds" name="min_beds" form={FORM} type="number" min={1} max={9999}
                     inputMode="numeric" placeholder="beds, e.g. 300"
                     defaultValue={typeof who.min_beds === "string" ? who.min_beds : ""} />
              <span className="fine">
                Setting this asks for a certified facility too, since a bed count means nothing
                without one.
              </span>
            </div>
          </Group>

          <Group title="What they bill" count={used(GROUPS.bills)} open={claimsOpen} holds="Procedures billed, drugs prescribed, Medicare patient and claim volumes, MIPS score">
            <p className="ps-note">
              Procedures billed and drugs prescribed, from published Medicare data for {YEAR}.
              Search by name; you do not need the code. Medicare fee-for-service only, and about
              one clinician in six has anything published here &mdash; so these narrow hard.{" "}
              {WHY_EMPTY} An exclusion built on them means &ldquo;does not bill it to Medicare in
              published volume&rdquo;, never &ldquo;never does it&rdquo;. One year is held, so
              there is no trend to filter on.
            </p>

            <div className="field">
              <label htmlFor="hcpcs_q">Procedure by name or code</label>
              <input
                id="hcpcs_q"
                name="hcpcs_q"
                form={FORM}
                type="search"
                maxLength={120}
                placeholder="e.g. knee replacement, or 27447"
                defaultValue={procedureQuery}
              />
            </div>

            {/* Already chosen, so a second search does not lose them. Rendered before the matches
                because a customer looks for what they picked before what is on offer. */}
            {codes.map((code) => (
              <label className="ps-tick" key={`chosen-${code}`}>
                <input type="checkbox" name="hcpcs_code" form={FORM} value={code} defaultChecked />{" "}
                <span className="mono">{code}</span>{" "}
                <span className="fine">chosen &mdash; untick to drop it</span>
              </label>
            ))}

            {procedureQuery !== "" && procedureMatches !== null && (
              <>
                {procedureMatches.length === 0 ? (
                  <p className="ps-note">
                    Nothing billed matches &ldquo;{procedureQuery}&rdquo;. Only codes somebody
                    actually billed are offered, so a code nobody billed is not here to pick.
                  </p>
                ) : (
                  <>
                    <p className="ps-note">
                      {procedureMatches.length} match
                      {procedureMatches.length === 1 ? "" : "es"}, most-billed first. The count is
                      providers with published volume, which is a floor rather than a census.
                    </p>
                    {procedureMatches
                      .filter((match) => !codes.includes(match.code))
                      .map((match) => (
                        <label className="ps-tick" key={match.code}>
                          <input type="checkbox" name="hcpcs_code" form={FORM} value={match.code} />{" "}
                          <span className="mono">{match.code}</span>{" "}
                          {match.description ?? "No description published"}{" "}
                          {match.drug && <span className="tag">drug, billed under Part B</span>}{" "}
                          <span className="fine">
                            {match.provider_count.toLocaleString("en-US")} providers
                          </span>
                        </label>
                      ))}
                  </>
                )}
              </>
            )}
            {procedureQuery !== "" && procedureMatches === null && (
              <p className="ps-note">
                The procedure list did not answer just now. Your other filters still ran.
              </p>
            )}

            <div className="field">
              <label htmlFor="min_hcpcs_services">Services of those procedures, at least</label>
              <input
                id="min_hcpcs_services"
                name="min_hcpcs_services"
                form={FORM}
                type="number"
                min={1}
                inputMode="numeric"
                placeholder="e.g. 50"
                defaultValue={minServices}
              />
              <span className="fine">Summed across the procedures you ticked. Needs one.</span>
            </div>

            <div className="field">
              <label htmlFor="drug_q">Drug by brand or generic name</label>
              <input
                id="drug_q"
                name="drug_q"
                form={FORM}
                type="search"
                maxLength={120}
                placeholder="e.g. Eliquis, or apixaban"
                defaultValue={drugQuery}
              />
              <span className="fine">
                A generic name means the molecule &mdash; every prescription filed under it,
                whichever brand.
              </span>
            </div>

            {drugs.map((name) => (
              <label className="ps-tick" key={`chosen-drug-${name}`}>
                <input type="checkbox" name="drug" form={FORM} value={name} defaultChecked />{" "}
                <b>{name}</b> <span className="fine">chosen &mdash; untick to drop it</span>
              </label>
            ))}

            {drugQuery !== "" && drugMatches !== null && (
              <>
                {drugMatches.length === 0 ? (
                  <p className="ps-note">
                    Nothing prescribed matches &ldquo;{drugQuery}&rdquo;. Only names somebody
                    actually prescribed in the year held are offered.
                  </p>
                ) : (
                  <>
                    <p className="ps-note">
                      {drugMatches.length} match{drugMatches.length === 1 ? "" : "es"},
                      most-prescribed first.
                    </p>
                    {drugMatches
                      .filter((match) => !drugs.includes(match.name))
                      .map((match) => (
                        <label className="ps-tick" key={match.name}>
                          <input type="checkbox" name="drug" form={FORM} value={match.name} />{" "}
                          <b>{match.name}</b> <span className="tag">{match.kind}</span>{" "}
                          {match.generics.length > 0 && (
                            <span className="fine">filed under {match.generics.join(", ")}</span>
                          )}{" "}
                          <span className="fine">
                            {match.prescriber_count.toLocaleString("en-US")} prescribers
                          </span>
                        </label>
                      ))}
                  </>
                )}
              </>
            )}
            {drugQuery !== "" && drugMatches === null && (
              <p className="ps-note">
                The drug list did not answer just now. Your other filters still ran.
              </p>
            )}

            <div className="field">
              <label htmlFor="min_drug_claims">Claims for those drugs, at least</label>
              <input
                id="min_drug_claims"
                name="min_drug_claims"
                form={FORM}
                type="number"
                min={1}
                inputMode="numeric"
                placeholder="e.g. 400"
                defaultValue={minClaims}
              />
              <span className="fine">Summed across the drugs you ticked. Needs one.</span>
            </div>

            {/* The published Medicare volumes. A provider with no published row does not match an
                "at least" filter - which is the same warning as above, and the reason these sit
                here rather than under The record. */}
            {MEDICARE_FLOORS.map((key) => (
              <div className="field" key={key}>
                <label htmlFor={key}>{FLOOR_LABELS[key][0]}</label>
                <input
                  id={key}
                  name={key}
                  form={FORM}
                  type="number"
                  min={0}
                  max={key === "min_mips_score" ? 100 : undefined}
                  step="any"
                  inputMode="numeric"
                  placeholder={FLOOR_LABELS[key][1]}
                  defaultValue={medicare[key] ?? ""}
                />
              </div>
            ))}
          </Group>

          {/* Industry payments. Public, federal and published by CMS by name and NPI - which is
              why it is offered plainly and named as theirs rather than as ours. */}
          <Group title="Industry payments" count={used(GROUPS.payments)} holds="Paid at least, paid under, in a program year">
            <div className="ps-pair">
              <div className="field">
                <label htmlFor="min_payment_amount">Paid at least</label>
                <input
                  id="min_payment_amount"
                  name="min_payment_amount"
                  form={FORM}
                  type="number"
                  min={0}
                  step="any"
                  inputMode="decimal"
                  placeholder="e.g. 5000"
                  defaultValue={payments.min_payment_amount ?? ""}
                />
              </div>
              <div className="field">
                <label htmlFor="payment_amount_below">Paid under</label>
                <input
                  id="payment_amount_below"
                  name="payment_amount_below"
                  form={FORM}
                  type="number"
                  min={0}
                  step="any"
                  inputMode="decimal"
                  placeholder="e.g. 500"
                  defaultValue={payments.payment_amount_below ?? ""}
                />
              </div>
            </div>
            {/* The years the platform actually holds, not the ones the calendar implies: it refuses
                a program year it loaded nothing into, and a refused search arrives as an empty
                page. No years at all means Open Payments has not been loaded, and a field whose
                every answer would be refused is not shown. */}
            {paymentYears.length > 0 && (
              <div className="field">
                <label htmlFor="payment_year">In program year</label>
                <select id="payment_year" name="payment_year" form={FORM}
                        defaultValue={payments.payment_year ?? ""}>
                  <option value="">Any single year</option>
                  {paymentYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <span className="fine">Needs an amount beside it to mean anything.</span>
              </div>
            )}
            <p className="ps-note">
              What drug and device manufacturers reported paying them, from CMS&rsquo;s Open
              Payments file. Both amounts are <b>within one program year</b> rather than a lifetime
              total, so naming a year makes the question precise rather than narrower. &ldquo;Paid
              under&rdquo; keeps providers with no payments at all, which is what makes it the
              clean-hands cut and not simply the opposite of the other.
            </p>
          </Group>

          {/* Subtracting. The platform has taken these since before this screen existed, and the
              one somebody actually reaches for is the first: everyone except the people already
              contacted, which is a saved list and therefore one value however large it is.

              Where there is a known set of answers the control is a multiple select, because the
              platform's filter is repeatable and "any of these" is the question. Where there is
              not - a city, a ZIP, an employer's domain - it is one box and one value, which is
              honest about what a form can carry without JavaScript to add a second. */}
          <Group
            title="Leave out"
            count={used(GROUPS.exclude)}
            holds="People already on one of your lists, NPIs you paste, places, specialties, credentials, an EHR, an employer"
          >
            {lists.length > 0 ? (
              <div className="field">
                <label htmlFor="exclude_list_id">Not on these lists</label>
                <select
                  id="exclude_list_id"
                  name="exclude_list_id"
                  form={FORM}
                  multiple
                  size={Math.min(6, Math.max(2, lists.length))}
                  defaultValue={asList(exclude.exclude_list_id)}
                >
                  {lists.map((row: ListRow) => (
                    <option key={row.id} value={row.id}>
                      {row.name} ({row.member_count.toLocaleString("en-US")})
                    </option>
                  ))}
                </select>
                <span className="fine">
                  The whole list is subtracted, however large it is &mdash; which is why this is
                  the filter to use for &ldquo;nobody we have already contacted&rdquo; rather than
                  pasting NPIs.
                </span>
              </div>
            ) : (
              <p className="ps-note">
                Keep a <Link href="/app/lists">list</Link> of the people you have contacted and it
                can be subtracted here, so a search never returns them again.
              </p>
            )}
            <div className="field">
              <label htmlFor="exclude_npi_list">Not these NPIs</label>
              <textarea
                id="exclude_npi_list"
                name="exclude_npi_list"
                form={FORM}
                rows={3}
                placeholder="Paste a column, or a comma-separated list"
                defaultValue={asList(exclude.exclude_npi).join("\n")}
              />
              <span className="fine">
                Up to {MAX_EXCLUDED_NPIS.toLocaleString("en-US")}. Anything that is not ten
                digits is ignored, so a pasted column can keep its header.
              </span>
            </div>
            <div className="ps-pair">
              <div className="field">
                <label htmlFor="exclude_state">Not in state</label>
                <select
                  id="exclude_state"
                  name="exclude_state"
                  form={FORM}
                  multiple
                  size={6}
                  defaultValue={asList(exclude.exclude_state)}
                >
                  {US_STATES.map(([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="exclude_taxonomy_classification">Not this specialty</label>
                <select
                  id="exclude_taxonomy_classification"
                  name="exclude_taxonomy_classification"
                  form={FORM}
                  multiple
                  size={6}
                  defaultValue={asList(exclude.exclude_taxonomy_classification)}
                >
                  {CLASSIFICATIONS.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="ps-pair">
              <div className="field">
                <label htmlFor="exclude_city">Not in city</label>
                <input
                  id="exclude_city"
                  name="exclude_city"
                  form={FORM}
                  maxLength={120}
                  defaultValue={asList(exclude.exclude_city)[0] ?? ""}
                  placeholder="e.g. Houston"
                />
              </div>
              <div className="field">
                <label htmlFor="exclude_postal_code">Not in ZIP</label>
                <input
                  id="exclude_postal_code"
                  name="exclude_postal_code"
                  form={FORM}
                  inputMode="numeric"
                  maxLength={5}
                  defaultValue={asList(exclude.exclude_postal_code)[0] ?? ""}
                  placeholder="5 digits"
                />
              </div>
            </div>
            {credentials.length > 0 && (
              <div className="field">
                <label htmlFor="exclude_credential">Not this credential</label>
                <select
                  id="exclude_credential"
                  name="exclude_credential"
                  form={FORM}
                  multiple
                  size={4}
                  defaultValue={asList(exclude.exclude_credential)}
                >
                  {credentials.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {/* The same warning the positive filter carries, for the same reason and the
                    opposite effect: most of the register has filed no credential at all, so
                    excluding MD removes the people who said MD and keeps everyone silent on it. */}
                <span className="fine">
                  Removes providers who filed that credential. A large part of the register filed
                  none at all and is kept.
                </span>
              </div>
            )}
            <div className="ps-pair">
              <div className="field">
                <label htmlFor="exclude_ehr_system">Does not run</label>
                <input
                  id="exclude_ehr_system"
                  name="exclude_ehr_system"
                  form={FORM}
                  maxLength={120}
                  defaultValue={asList(exclude.exclude_ehr_system)[0] ?? ""}
                  placeholder="an EHR"
                />
              </div>
              <div className="field">
                <label htmlFor="exclude_employer_domain">Not at employer</label>
                <input
                  id="exclude_employer_domain"
                  name="exclude_employer_domain"
                  form={FORM}
                  maxLength={253}
                  defaultValue={asList(exclude.exclude_employer_domain)[0] ?? ""}
                  placeholder="example.com"
                />
                <span className="fine">Their website&rsquo;s domain, not its name.</span>
              </div>
            </div>
            <p className="ps-note">
              Every one of these narrows the search <i>and</i> the file: the row count beside the
              Export button is counted after they are applied, so what you are billed for is what
              you are shown.
            </p>
          </Group>
        </aside>

        {results === null ? (
          <div className="notice warn ps-results-empty">
            {askedResidence && !billing?.premium_contacts
              ? // Reachable from a shared or hand-edited URL, not from the rail above, which does
                // not offer these fields to a plan without them. The platform refuses the whole
                // search rather than dropping the filter, so saying "the platform did not answer"
                // would blame us for the plan - and leave somebody retrying a search that cannot
                // succeed.
                "This search filters on a home address or cell phone, which this plan does not " +
                "include. The platform refused it rather than answering without the filter and " +
                "handing you every provider. Clear it from the address bar, or talk to us."
              : "The platform did not answer. Nothing was counted — try again in a moment."}
          </div>
        ) : (
          <section className="ps-results" aria-label="Results">
            <div className="ps-rhead">
              <span className="ps-n num">
                {total.toLocaleString("en-US")} <span>provider{total === 1 ? "" : "s"}</span>
              </span>
              <span className="fine">
                page {page.toLocaleString("en-US")} of {pages.toLocaleString("en-US")}
              </span>
              {results.hint && <span className="fine">· {results.hint}</span>}
              {/* Said rather than silently dropped. The platform refuses a street with nothing to
                  anchor it, so sending it would have produced an empty page that reads as an
                  answer. */}
              {strayStreet && (
                <span className="fine ps-stray">
                  The street was left out — it needs a city, a ZIP or a radius to search within —
                  and the rest of your search ran.
                </span>
              )}
            </div>

            {/* Putting a result somewhere. The form is here, outside the table, and the tick
                boxes in the rows below belong to it through the `form` attribute - the HTML form
                owner - because a form cannot be nested inside the one that runs the search and a
                second one wrapping the table would swallow the Reveal buttons.

                One control does both halves of the decision: choose a list, or type a name and
                get a new one. That is one thought to the person using it ("put these somewhere"),
                and the route behind it treats a name with no list chosen as "make it". */}
            <form method="post" action="/api/app/lists" id="add-to-list">
              <input type="hidden" name="action" value="add" />
              <input type="hidden" name="return_to" value={returnTo} />
            </form>

            {/* The same decision for the whole search rather than the ticked rows. A separate form
                because it carries the search's filters rather than a set of NPIs, and because the
                two buttons must not be able to submit each other's fields: one adds what you
                ticked, the other adds everyone, and confusing them is expensive in both
                directions. The filters are the one list's own output, rendered the way the export
                form renders it, so the set added is the set the count above was counted from. */}
            <form method="post" action="/api/app/lists" id="add-all-to-list">
              <input type="hidden" name="action" value="add-all" />
              <input type="hidden" name="return_to" value={returnTo} />
              {Object.entries(filters).flatMap(([name, value]) =>
                (Array.isArray(value) ? value : [value]).map((each, index) => (
                  <input
                    key={`${name}-${index}`}
                    type="hidden"
                    name={name}
                    value={String(each)}
                  />
                )),
              )}
            </form>

            <div className="ps-rhead ps-pick">
              <span className="fine">
                Tick rows, then put them on a list — to export later, or to leave out of the next
                search.
              </span>
              <span className="ps-pick-acts">
                <ListDestinationPicker key={pickedList} initialValue={pickedList} lists={lists.map(({ id, name, member_count }) => ({ id, name, member_count }))} />
                <label htmlFor="add-name" className="sr-only">
                  Name for a new list
                </label>
                <input
                  id="add-name"
                  name="name"
                  type="text"
                  maxLength={120}
                  form="add-to-list"
                  placeholder={lists.length > 0 ? "…or name a new one" : "Name your first list"}
                />
                <button type="submit" form="add-to-list" className="btn sm primary">
                  Add ticked
                </button>
                {/* The list picker above belongs to the other form, so this one is told which list
                    by a field of its own, kept in step by the controlled picker. A new list
                    cannot be created this way on purpose - a double-submit would make two large
                    lists whose only difference is their name. */}
                {total > 0 && (
                  <button type="submit" form="add-all-to-list" className="btn sm">
                    Add all {total.toLocaleString("en-US")}
                  </button>
                )}
              </span>
            </div>

            <div className="ps-tw">
              <table>
                <thead>
                  <tr>
                    <th>
                      <span className="sr-only">Choose</span>
                    </th>
                    <SortHeader field="name" label="Provider" current={sort} here={here.toString()} />
                    {/* Specialty is not in `sort_columns`, so it is not offered as one. A header
                        that looks clickable and is not is worse than a header that does not. */}
                    <th>Specialty</th>
                    <SortHeader field="city" label="Where" current={sort} here={here.toString()} />
                    <th>Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const open = contacts.get(row.npi);
                    return (
                      <tr key={row.npi}>
                        <td>
                          <input
                            type="checkbox"
                            name="npi"
                            value={row.npi}
                            form="add-to-list"
                            aria-label={`Choose ${row.name}`}
                          />
                        </td>
                        {/* One line. The name is the link to the record a customer pays for -
                            it used to point at the public page, with a separate "Open the record"
                            on a third line beneath the NPI, which is two lines spent saying where
                            to click. The public page is still reachable from the record. */}
                        <td className="ps-who">
                          <Link
                            href={
                              row.type === "organization"
                                ? `/app/organization/${row.npi}`
                                : `/app/provider/${row.npi}`
                            }
                          >
                            <b>{row.name}</b>
                          </Link>
                          {row.credentials && <span className="tag">{row.credentials}</span>}
                          <span className="ps-npi mono">{row.npi}</span>
                        </td>
                        <td className="fine">{row.primary_taxonomy?.display ?? "—"}</td>
                        <td className="fine ps-where">
                          {[row.city, row.state].filter(Boolean).join(", ") || "Not filed"}
                          {row.employer_name && (
                            <span className="ps-aside-clip" title={row.employer_name}>
                              {row.employer_name}
                            </span>
                          )}
                        </td>
                        <td className="ps-contact">
                          {open ? (
                            <ContactLines opened={open} />
                          ) : (
                            <form method="post" action="/api/app/reveal">
                              {/* What is held, before the reveal is spent. The public page has
                                  always shown this and the omnisearch began to on 2026-10-03;
                                  the signed-in results were the one screen that did not, so a
                                  customer could spend a reveal to learn there was no address.

                                  `email_count` is the platform's own suppression-aware count -
                                  counted under exactly the same conditions the address would be
                                  shown under - so this cannot promise something the reveal would
                                  then withhold. It speaks only about the work email, because that
                                  is the only signal on this row: a reveal may also return a home
                                  address or cell on a premium contract, and saying "nothing held"
                                  would be a claim about those too. */}
                              <span className="fine ps-held">
                                {(row.email_count ?? 0) > 0
                                  ? `${row.email_count} work email${row.email_count === 1 ? "" : "s"} on file`
                                  : "No work email on file"}
                              </span>
                              <input type="hidden" name="npi" value={row.npi} />
                              <input type="hidden" name="return_to" value={returnTo} />
                              <button
                                type="submit"
                                className="btn sm primary"
                                disabled={reveals?.limit !== null && reveals?.remaining === 0}
                              >
                                Reveal
                              </button>
                              <span className="fine ps-aside">
                                {reveals?.limit === null
                                  ? "1 reveal"
                                  : `1 reveal · ${(reveals?.remaining ?? 0).toLocaleString("en-US")} left`}
                              </span>
                            </form>
                          )}
                          <ReportedTags reported={reported.get(row.npi) ?? []} />
                          <ReportProblem
                            kind="npi"
                            id={row.npi}
                            returnTo={returnTo}
                            reported={reported.get(row.npi) ?? []}
                          />
                        </td>
                      </tr>
                    );
                  })}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="table-empty">
                        Nothing matched. Take a filter off above, widen one in the rail, or search a
                        name rather than an NPI.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {pages > 1 && (
              <div className="ps-rhead ps-rfoot">
                {page > 1 ? (
                  <Link className="btn sm" href={`/app/search?${here}&page=${page - 1}`}>
                    Previous
                  </Link>
                ) : (
                  <span />
                )}
                {page < pages && (
                  <Link className="btn sm" href={`/app/search?${here}&page=${page + 1}`}>
                    Next
                  </Link>
                )}
                <span className="fine">
                  Showing {((page - 1) * PAGE_SIZE + 1).toLocaleString("en-US")}&ndash;
                  {Math.min(page * PAGE_SIZE, total).toLocaleString("en-US")} of{" "}
                  {total.toLocaleString("en-US")}
                </span>
              </div>
            )}
          </section>
        )}
      </div>

      <details className="panel ps-panel" id="alert">
        <summary>
          <b>Save as alert</b>{" "}
          <span className="fine">
            — be told when providers matching these filters are new, move, hire or are deactivated.
          </span>
        </summary>
        <form className="filters" method="post" action="/api/app/alerts" style={{ marginTop: 12 }}>
          <input type="hidden" name="action" value="create" />
          <input type="hidden" name="q" value={q} />
          <input type="hidden" name="state" value={state} />
          <input type="hidden" name="classification" value={classification} />
          <input type="hidden" name="type" value={type} />
          <div className="field">
            <label htmlFor="alert-name">Alert name</label>
            <input
              id="alert-name"
              name="name"
              required
              maxLength={120}
              defaultValue={[classification, state].filter(Boolean).join(" in ") || "My territory"}
            />
          </div>
          <fieldset className="field">
            <legend>Watch for</legend>
            {Object.entries(ALERT_EVENT_LABELS).map(([value, label]) => (
              <label key={value} style={{ display: "block" }}>
                <input
                  type="checkbox"
                  name="event_types"
                  value={value}
                  defaultChecked={value === "new_provider" || value === "practice_moved"}
                />{" "}
                {label}
              </label>
            ))}
          </fieldset>
          <div className="field">
            <label htmlFor="alert-cadence">How often</label>
            <select id="alert-cadence" name="cadence" defaultValue="weekly">
              <option value="weekly">Weekly</option>
              <option value="daily">Daily</option>
            </select>
          </div>
          <button type="submit" className="btn">
            Save alert
          </button>
        </form>
        <p className="fine" style={{ marginTop: 10 }}>
          Watches the search text, state, specialty and provider type from the bar above — not the
          others, so an alert that has been running for months is not quietly narrowed by a filter
          you set once. Alerts list who changed and when — never contact details, which stay one
          reveal each.
        </p>
      </details>

      <details className="panel ps-panel" id="export">
        <summary>
          <b>Export these results</b>{" "}
          <span className="fine">
            — the same providers as above, as a file, with the columns named the way your CRM
            expects them.
          </span>
        </summary>
        <form
          id="search-export"
          className="filters"
          method="post"
          action="/api/app/export"
          style={{ marginTop: 12 }}
        >
          {/* The filters exactly as this page ran them - the same object the search was made with,
              rendered field by field - so the file is the search rather than a second guess at it.
              This used to be a hand-written list of four names plus the Medicare and claims filters,
              and it was missing twelve of them: city, ZIP, street, the radius, four reachability
              flags, the trust tier, the EHR system and the status. A search narrowed to Austin
              exported the whole of Texas, and `export_rows` was billed for the difference.

              A repeatable filter gets one field per value rather than one joined value: the file has
              to be the search that was counted, not a wider one. The route reads all of this back
              through the same module, and the API validates it again with the search's own code. */}
          {Object.entries(filters).flatMap(([key, value]) =>
            (Array.isArray(value) ? value : [value]).map((each) => (
              <input key={`x-${key}-${each}`} type="hidden" name={key} value={each} />
            )),
          )}
          <input type="hidden" name="return_to" value={returnTo} />
          <FormatAndPreset
            idPrefix="search-export"
            preset={DEFAULT_PRESET}
            format={DEFAULT_FORMAT}
          />
          <button type="submit" className="btn primary" disabled={overBudget}>
            Export {total.toLocaleString("en-US")}
          </button>
        </form>
        <ExportCost rows={total} limit={exportRows} />
        <CrmNote />
        <p className="fine" style={{ marginTop: 8 }}>
          Home address and cell phone are never in an export. They are opened one provider at a
          time, above, under contract.
        </p>
      </details>

      {/* What this search would cost and the two things to do with it, where they can be reached
          from any scroll position. The Export button submits the form in the panel above by id, so
          the file is still the search this page ran and the format chosen there is the one used. */}
      {results !== null && (
        <div className="ps-bar">
          <div className="ps-bar-inner">
            <span className="ps-bar-n num">{total.toLocaleString("en-US")}</span>
            <span className="fine">
              {overBudget && total > 0
                ? "More rows than your export allowance has left this month — narrow the search, or talk to us about more."
                : `providers · exporting this search uses ${total.toLocaleString("en-US")} row${
                    total === 1 ? "" : "s"
                  }${budget === null ? "" : ` of the ${budget.toLocaleString("en-US")} you have left`}.`}
            </span>
            <span className="ps-bar-acts">
              {/* To the field inside the panel rather than to the panel itself: a browser expands
                  a closed `<details>` to reach a fragment *within* it, and does not when the id is
                  the `<details>`. Where it does not, the panel is still there to click. */}
              <Link className="btn sm" href="#alert-name">
                Save as alert
              </Link>
              <button
                type="submit"
                form="search-export"
                className="btn sm primary"
                disabled={overBudget}
              >
                Export {total.toLocaleString("en-US")}
              </button>
            </span>
          </div>
        </div>
      )}
    </main>
  );
}

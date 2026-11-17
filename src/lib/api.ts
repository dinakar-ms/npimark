import { publicDecisionNetwork, type PublicDecisionNetworkData } from "./decisionNetwork";
/**
 * The only way this site talks to the platform.
 *
 * The public site is a customer like any other: it holds an API key, calls `/api/v1`, and can
 * reach exactly what that key's scopes allow. It has no database connection and no session with
 * the admin app, which is what makes "customers never touch the main tool" a fact of the
 * deployment rather than a rule somebody has to remember.
 *
 * The key is server-side only. It is read from `NPI_API_KEY` - deliberately not
 * `NEXT_PUBLIC_*`, because anything with that prefix is compiled into the browser bundle - and
 * every function here runs on the server. A page that needs data fetches it in a server
 * component and sends HTML; the browser never sees a credential.
 *
 * Public pages render only the public record. The API row carries more than that for a key
 * with the right scopes - emails, and for consumer plans home contact - so `toPublic` is the
 * single place a row is reduced to what an unsigned visitor may see, and every public page
 * goes through it.
 */

import "server-only";
import { publicApiBase } from "@/lib/apiOrigins";
import { GPC_BROWSER_HEADER } from "@/lib/gpc";

export type TaxonomyRef = { code: string; display: string };

/** The row the API returns. Fields beyond the public record exist here so nothing is lost. */
export type ProviderRow = {
  npi: string;
  type: "individual" | "organization";
  status: "active" | "inactive";
  name: string;
  credentials: string | null;
  primary_taxonomy: TaxonomyRef | null;
  matched_taxonomy?: TaxonomyRef | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  phone: string | null;
  employer_name: string | null;
  employer_domain?: string | null;
  email?: string | null;
  email_count?: number;
  has_home_contact?: boolean | null;
  distance_miles?: number | null;
  updated_at: string | null;
};

/** What an unsigned visitor may see: the federal public record and nothing derived. */
export type PublicProvider = {
  npi: string;
  type: "individual" | "organization";
  status: "active" | "inactive";
  name: string;
  credentials: string | null;
  primary_taxonomy: TaxonomyRef | null;
  /**
   * The taxonomy that satisfied the specialty filter, when it was not the primary one.
   *
   * A specialty filter matches any taxonomy an NPI claims, which is what somebody means by "all
   * of internal medicine" - but it means a row can match on a specialty the row does not show.
   * Without this the page looks like a filter that does not work. Public record either way: it is
   * the same NUCC taxonomy list `primary_taxonomy` comes from.
   */
  matched_taxonomy: TaxonomyRef | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  phone: string | null;
  employer_name: string | null;
  updated_at: string | null;
  /** Whether a signed-in customer would find contact details here. Never the details. */
  has_email: boolean;
  has_home_contact: boolean;
};

export function toPublic(row: ProviderRow): PublicProvider {
  return {
    npi: row.npi,
    type: row.type,
    status: row.status,
    name: row.name,
    credentials: row.credentials,
    primary_taxonomy: row.primary_taxonomy,
    // Only when it adds something: the API sets it on every row of a taxonomy-filtered search,
    // including the rows where it is simply the primary one again.
    matched_taxonomy:
      row.matched_taxonomy && row.matched_taxonomy.code !== row.primary_taxonomy?.code
        ? row.matched_taxonomy
        : null,
    city: row.city,
    state: row.state,
    postal_code: row.postal_code,
    phone: row.phone,
    employer_name: row.employer_name,
    updated_at: row.updated_at,
    has_email: Boolean(row.email) || (row.email_count ?? 0) > 0,
    has_home_contact: row.has_home_contact === true,
  };
}

export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
};

/** What the API said when it refused, kept whole so a page can render the real reason. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    detail: string,
  ) {
    super(detail);
    this.name = "ApiError";
  }
}

function baseUrl(): string {
  return publicApiBase(process.env.NPI_PUBLIC_API_BASE_URL, process.env.NPI_API_BASE_URL);
}

export type CallOptions = {
  revalidate?: number;
  search?: URLSearchParams;
  /**
   * `"manual"` hands back the redirect instead of following it â€” the only way to read a `308`,
   * which is how `/v1/systems/{slug}` says a system was folded into another one.
   */
  redirect?: RequestRedirect;
};

/**
 * One call to the API, as a raw response.
 *
 * `revalidate` is how long Next may serve a cached copy. Provider records change on a weekly
 * refresh, so a day of cache costs nothing in freshness and is the
 * difference between a crawl that the origin absorbs and one that it feels.
 */
export async function apiFetch(path: string, options: CallOptions = {}): Promise<Response> {
  const { revalidate = 86_400, search, redirect } = options;
  const key = process.env.NPI_API_KEY;
  if (!key) {
    throw new Error("NPI_API_KEY is not set. This site cannot read anything without one.");
  }

  const query = search && [...search.keys()].length > 0 ? `?${search}` : "";
  return fetch(`${baseUrl()}${path}${query}`, {
    headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
    redirect,
    next: { revalidate },
  });
}

/**
 * One call to the API, decoded, with the API's own refusal raised as an `ApiError`.
 *
 * Every fetcher in this file goes through here. `apiFetch` above is for the one caller that has
 * to see the response itself rather than its body - the health-system route, whose `308` is the
 * answer and not an error.
 */
async function call<T>(path: string, options: CallOptions = {}): Promise<T> {
  const response = await apiFetch(path, options);

  if (!response.ok) {
    // The API's error shape is {detail, code}. Passing it through beats inventing a message:
    // "more than 60 calls a minute for this key" tells us what to fix; "failed to fetch"
    // sends somebody to the logs to find out what we already knew.
    let detail = `The API answered ${response.status}.`;
    let code = "error";
    try {
      const body = (await response.json()) as { detail?: string; code?: string };
      detail = body.detail ?? detail;
      code = body.code ?? code;
    } catch {
      // A non-JSON body means something in front of the API answered - a proxy, a 502 page.
    }
    throw new ApiError(response.status, code, detail);
  }

  return (await response.json()) as T;
}

/** One provider by NPI, or null when the registry has no such record. */
export async function getProvider(npi: string): Promise<ProviderRow | null> {
  try {
    return await call<ProviderRow>(`/providers/${encodeURIComponent(npi)}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/** A page of providers. Every filter the API takes is passed straight through. */
export async function searchProviders(
  filters: Record<string, string | number | boolean | undefined>,
  { revalidate }: { revalidate?: number } = {},
): Promise<Page<ProviderRow>> {
  const search = new URLSearchParams();
  for (const [name, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") search.set(name, String(value));
  }
  return call<Page<ProviderRow>>("/providers", { search, revalidate });
}

/** The live provider count, or null when the API cannot be reached. Never throws. */
export async function providerCount(): Promise<number | null> {
  try {
    const page = await searchProviders({ page_size: 1 }, { revalidate: 3600 });
    return page.total;
  } catch {
    return null;
  }
}

/**
 * How many providers match one set of filters, or null when it cannot be read. Never throws.
 *
 * A page that wants to say "this many of them are X" asks for a single row and reads the total,
 * the way `providerCount` does. Null and zero stay different on purpose: the caller prints the
 * figure or drops the claim, and never publishes a zero it cannot stand behind.
 */
export async function providerCountWhere(
  filters: Record<string, string | number | boolean | undefined>,
): Promise<number | null> {
  try {
    const page = await searchProviders({ ...filters, page_size: 1 });
    return page.total;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------------------------------
 * The public directory: facilities, leadership counts and the A-Z.
 *
 * The API returns these as allow-lists already - no field on them is anything but public
 * record, and no person without an NPI is ever named - but they go through `toPublicFacility`
 * all the same, so what a page renders is decided here and not by whatever the API adds next.
 * ---------------------------------------------------------------------------------------- */

export type FacilityType =
  | "hospital"
  | "nursing_home"
  | "home_health"
  | "hospice"
  | "dialysis"
  | "other";

export type PublicFacility = {
  ccn: string;
  facility_type: FacilityType;
  category: string | null;
  subtype: string | null;
  name: string | null;
  address_line: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  county: string | null;
  /** The facility's published main line - an institution's switchboard, never a person's. */
  phone: string | null;
  ownership_type: string | null;
  chain_organization: string | null;
  beds: number | null;
  overall_rating: number | null;
  health_inspection_rating: number | null;
  staffing_rating: number | null;
  quality_measure_rating: number | null;
  emergency_services: boolean | null;
  npi: string | null;
  organization_name: string | null;
  medicare_since: string | null;
};

export type RoleCount = { role: string; count: number };
/** How many named leadership contacts exist, by role. Never who they are. */
export type LeadershipCounts = { total: number; by_role: RoleCount[] };
export type PublicFacilityDetail = PublicFacility & { leadership: LeadershipCounts; network?: PublicDecisionNetworkData | null };

export function toPublicFacility(row: PublicFacility): PublicFacility {
  return {
    ccn: row.ccn,
    facility_type: row.facility_type,
    category: row.category,
    subtype: row.subtype,
    name: row.name,
    address_line: row.address_line,
    city: row.city,
    state: row.state,
    postal_code: row.postal_code,
    county: row.county,
    phone: row.phone,
    ownership_type: row.ownership_type,
    chain_organization: row.chain_organization,
    beds: row.beds,
    overall_rating: row.overall_rating,
    health_inspection_rating: row.health_inspection_rating,
    staffing_rating: row.staffing_rating,
    quality_measure_rating: row.quality_measure_rating,
    emergency_services: row.emergency_services,
    npi: row.npi,
    organization_name: row.organization_name,
    medicare_since: row.medicare_since,
  };
}

function toLeadership(counts: LeadershipCounts): LeadershipCounts {
  return {
    total: counts.total,
    by_role: counts.by_role.map(({ role, count }) => ({ role, count })),
  };
}

/** One active facility with its leadership counted by role, or null when there is none. */
export async function getFacility(ccn: string): Promise<PublicFacilityDetail | null> {
  try {
    const row = await call<PublicFacilityDetail>(`/facilities/${encodeURIComponent(ccn)}`);
    return { ...toPublicFacility(row), leadership: toLeadership(row.leadership), network: publicDecisionNetwork(row.network) };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/** A page of facilities: state, city, facility_type, name, npi, page, page_size. */
export async function searchFacilities(
  filters: Record<string, string | number | undefined>,
): Promise<Page<PublicFacility>> {
  const search = new URLSearchParams();
  for (const [name, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") search.set(name, String(value));
  }
  const page = await call<Page<PublicFacility>>("/facilities", { search });
  return { ...page, items: page.items.map(toPublicFacility) };
}

export type Place = { state: string; city: string | null; count: number };

/** Where facilities of one type are: by state, by city in `state`, or every city (`by: city`). */
export async function facilityPlaces(
  type: FacilityType,
  { state, by }: { state?: string; by?: "state" | "city" } = {},
): Promise<Place[]> {
  const search = new URLSearchParams({ facility_type: type });
  if (state) search.set("state", state);
  if (by) search.set("by", by);
  return call<Place[]>("/facilities/places", { search });
}

export type FacilityIndexItem = {
  ccn: string;
  name: string | null;
  facility_type: FacilityType;
  state: string | null;
};

/** Every active facility in CCN order, a few fields each. What the sitemaps are built from. */
export async function facilityIndex(page: number, pageSize: number): Promise<Page<FacilityIndexItem>> {
  const search = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  return call<Page<FacilityIndexItem>>("/facilities/index", { search });
}

/** Leadership contacts of an organisation NPI, counted by role; null for anything else. */
export async function organizationLeadership(npi: string): Promise<LeadershipCounts | null> {
  try {
    return toLeadership(
      await call<LeadershipCounts>(`/providers/${encodeURIComponent(npi)}/leadership`),
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export type DirectoryKind = "providers" | "organizations";
export type DirectoryProvider = {
  npi: string;
  name: string;
  credentials: string | null;
  specialty: string | null;
  city: string | null;
  state: string | null;
};
export type DirectoryNode = {
  kind: DirectoryKind;
  prefix: string;
  total: number;
  leaf: boolean;
  children: { prefix: string; count: number }[];
  items: DirectoryProvider[];
  items_total: number;
  page: number;
  page_size: number;
};

/** One node of the A-Z, or null when nothing is under the prefix or the page is past the end. */
export async function directoryNode(
  kind: DirectoryKind,
  prefix: string,
  page = 1,
  pageSize = 200,
): Promise<DirectoryNode | null> {
  const search = new URLSearchParams({
    prefix,
    page: String(page),
    page_size: String(pageSize),
  });
  try {
    const node = await call<DirectoryNode>(`/directory/${kind}`, { search });
    return {
      ...node,
      items: node.items.map((item) => ({
        npi: item.npi,
        name: item.name,
        credentials: item.credentials,
        specialty: item.specialty,
        city: item.city,
        state: item.state,
      })),
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/** One published role count: a role, a facility family and a state (null for the nation). */
export type RoleCell = {
  role: string;
  facility_type: FacilityType;
  state: string | null;
  people: number;
  facilities: number;
};
export type RoleCounts = {
  floor: number;
  min_facilities: number;
  refreshed_at: string | null;
  items: RoleCell[];
};

/**
 * Every published leadership role count, national and by state, in one call - a few thousand
 * small rows, cached for a day, shared by every role page and the sitemap. Counts only: the
 * API never returns who these people are, and the cells below its floor are simply absent.
 * Only the allowed fields are copied through, so a field added upstream never reaches a page.
 */
export async function leadershipRoleCounts(): Promise<RoleCounts> {
  const body = await call<RoleCounts>("/leadership/counts");
  return {
    floor: body.floor,
    min_facilities: body.min_facilities,
    refreshed_at: body.refreshed_at,
    items: body.items.map((c) => ({
      role: c.role,
      facility_type: c.facility_type,
      state: c.state,
      people: c.people,
      facilities: c.facilities,
    })),
  };
}

/* ------------------------------------------------------------------------------------------
 * Lists, health systems and organisation profiles.
 *
 * Counts from the platform's nightly summary, and the public record. Nothing on these shapes
 * names a person without an NPI or carries an email address; the example providers on a
 * profile are NPI holders with public `/npi` pages of their own.
 * ---------------------------------------------------------------------------------------- */

export type ListCounts = {
  total: number;
  with_email: number;
  with_trusted_email: number;
  with_phone: number;
  with_location: number;
};

/**
 * How much of a population's Medicare activity is in the published data, as the platform measured
 * it. Counts and a floor, never a percentage: the share is computed where it is printed, from these
 * two numbers, so every page rounds it the same way.
 *
 * `clinicians` is active individual providers in the segment - the same population the national
 * figure uses, and not the record count beside it, which is after suppression and includes the
 * organisations filed under the same specialty.
 */
export type MedicareUtilisation = {
  clinicians: number;
  with_procedures: number;
  with_prescribing: number;
  /** The fewest clinicians a share may be published off. */
  share_floor: number;
  /** False below the floor: print the counts and refuse the percentage. */
  share_published: boolean;
  measured_at: string | null;
};

export type TaxonomyListSummary = {
  slug: string;
  level: "classification" | "specialization";
  label: string;
  grouping: string | null;
  classification: string;
  specialization: string | null;
  counts: ListCounts;
  /** States with a page of their own. */
  states: string[];
  /** This specialty's published Medicare utilisation, nationally - national even on a state page,
   * because it is measured once for the country. Null until the platform has measured it. */
  medicare_utilisation: MedicareUtilisation | null;
};

export type FacilityListCounts = {
  facilities: number;
  beds: number;
  with_phone: number;
  with_org_link: number;
  with_leadership: number;
};

export type FacilityListSummary = {
  slug: string;
  facility_type: FacilityType;
  label: string;
  counts: FacilityListCounts;
  states: string[];
};

export type ListCatalogue = {
  refreshed_at: string | null;
  provider_floor: number;
  facility_floor: number;
  taxonomies: TaxonomyListSummary[];
  facility_types: FacilityListSummary[];
  /** The same measurement over every active clinician: the national figure the per-specialty ones
   * are read against, and what `lib/claims.ts` publishes as "about one in six". */
  medicare_utilisation: MedicareUtilisation | null;
};

export type TaxonomyListDetail = TaxonomyListSummary & {
  codes: string[];
  state: string | null;
  national: ListCounts;
  by_state: { state: string; counts: ListCounts; published: boolean }[];
  related: { slug: string; label: string; level: string; total: number }[];
  refreshed_at: string | null;
  floor: number;
};

export type FacilityListDetail = FacilityListSummary & {
  state: string | null;
  national: FacilityListCounts;
  by_state: { state: string; counts: FacilityListCounts; published: boolean }[];
  refreshed_at: string | null;
  floor: number;
};

export type SystemSummary = {
  slug: string;
  label: string;
  facilities: number;
  beds: number;
  states: string[];
  by_type: Record<string, number>;
};

export type SystemDetail = SystemSummary & {
  members: PublicFacility[];
  refreshed_at: string | null;
};

/* ------------------------------------------------------------------------------------------
 * Health systems (IDNs) - `/v1/health-systems`, what the /systems pages read.
 *
 * A different surface from `/v1/systems` above, which is the nightly chain summary the facility
 * and organisation profiles reference. This one is the health-system surface: systems as the public
 * record itself names them, with members by CCN, merges and a permanent slug. A chain's slug is the
 * same string in both, so the /systems URLs do not change hands. Which files stand behind it is a
 * platform matter, named there and not in this tree.
 *
 * These shapes carry what the platform rules call public-safe and nothing more. No person, and no
 * provider NPI: `providers` is a count, taken with the suppression list applied as the call runs.
 * ---------------------------------------------------------------------------------------- */

export type HealthSystemCounts = {
  hospitals: number;
  nursing_homes: number;
  home_health: number;
  /** Every member kind, hospitals included. Never rendered as a hospital count. */
  facilities: number;
  groups: number;
  organizations: number;
  providers: number;
  /** Outpatient centres - clinic and other outpatient sites. Not physician groups. */
  outpatient_centers: number | null;
};

export type HealthSystemMemberKind = "hospital" | "nursing_home" | "home_health" | "facility";

export type HealthSystemMember = {
  name: string | null;
  ccn: string | null;
  city: string | null;
  state: string | null;
  member_kind: HealthSystemMemberKind;
  member_type: string | null;
  /** Set only where the CCN is a facility we hold - so it decides whether a member links out. */
  facility_type: FacilityType | null;
  beds: number | null;
  corp_parent_name: string | null;
  corp_parent_type: string | null;
};

export type HealthSystemMemberGroup = {
  member_kind: HealthSystemMemberKind;
  label: string;
  total: number;
  items: HealthSystemMember[];
  truncated: boolean;
};

export type HealthSystem = {
  slug: string;
  name: string;
  kind: "health_system" | "chain";
  hq_city: string | null;
  hq_state: string | null;
  beds: number;
  states: string[];
  organization_npis: string[];
  ownership: string | null;
  multistate: boolean | null;
  counts: HealthSystemCounts;
};

export type HealthSystemDetail = HealthSystem & {
  members: HealthSystemMemberGroup[];
  /** The footnote that must be printed wherever `ownership` is. */
  ownership_note: string;
  notes: string[];
};

export type HealthSystemPage = {
  items: HealthSystem[];
  total: number;
  page: number;
  page_size: number;
  ownership_types: string[];
  ownership_note: string;
};

export type HealthSystemFilters = {
  q?: string;
  state?: string;
  member_state?: string;
  kind?: "health_system" | "chain" | "all";
  ownership?: string;
  min_beds?: number;
  min_hospitals?: number;
  sort?: "hospitals" | "beds" | "facilities" | "name";
  page?: number;
  page_size?: number;
};

export type OrganizationProfile = {
  network?: PublicDecisionNetworkData | null;
  npi: string | null;
  affiliated_providers: number;
  affiliation_basis: ("billing" | "directory")[];
  by_specialty: { label: string; slug: string | null; count: number }[];
  examples: DirectoryProvider[];
  ehr_system: string | null;
  ehr_basis: "organization" | "affiliated_providers" | null;
  practice_locations: number;
  facility_count: number;
  facilities: FacilityIndexItem[];
  system: { slug: string; label: string; facilities: number } | null;
  similar: {
    name: string | null;
    ccn: string | null;
    npi: string | null;
    facility_type: FacilityType | null;
    specialty: string | null;
    city: string | null;
    state: string | null;
    beds: number | null;
  }[];
};

async function orNull<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/** Every published list, with national counts and the states that have a page. */
export async function listCatalogue(): Promise<ListCatalogue> {
  return call<ListCatalogue>("/lists");
}

/** One taxonomy list, nationally or in a state; null below the floor. */
export async function taxonomyList(slug: string, state?: string): Promise<TaxonomyListDetail | null> {
  const search = new URLSearchParams(state ? { state } : {});
  return orNull(call<TaxonomyListDetail>(`/lists/taxonomies/${encodeURIComponent(slug)}`, { search }));
}

/** One facility-type list, nationally or in a state; null below the floor. */
export async function facilityTypeList(slug: string, state?: string): Promise<FacilityListDetail | null> {
  const search = new URLSearchParams(state ? { state } : {});
  return orNull(call<FacilityListDetail>(`/lists/facility-types/${encodeURIComponent(slug)}`, { search }));
}

/** Health systems at or above the floor, largest first. */
export async function listSystems(): Promise<{ refreshed_at: string | null; floor: number; items: SystemSummary[] }> {
  return call("/systems");
}

/** One health system and its member facilities, or null. */
export async function getSystem(slug: string): Promise<SystemDetail | null> {
  const system = await orNull(call<SystemDetail>(`/systems/${encodeURIComponent(slug)}`));
  return system ? { ...system, members: system.members.map(toPublicFacility) } : null;
}

function systemQuery(filters: HealthSystemFilters): URLSearchParams {
  const search = new URLSearchParams();
  for (const [name, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") search.set(name, String(value));
  }
  return search;
}

/** A page of health systems from the IDN tables. Merged and off-file systems are not listed. */
export async function listHealthSystems(
  filters: HealthSystemFilters = {},
): Promise<HealthSystemPage> {
  return call<HealthSystemPage>("/health-systems", { search: systemQuery(filters) });
}

/**
 * One health system, the slug it moved to, or nothing.
 *
 * The three answers are kept apart because a page does something different with each: render,
 * `permanentRedirect`, fall back. Collapsing "moved" into "missing" would retire a URL that was
 * promised to work for ever, and following the `308` would serve the target's content at the old
 * address, so the redirect is read rather than followed.
 */
export type HealthSystemLookup =
  | { kind: "system"; system: HealthSystemDetail }
  | { kind: "moved"; to: string }
  | { kind: "missing" };

export async function getHealthSystem(slug: string): Promise<HealthSystemLookup> {
  const response = await apiFetch(`/health-systems/${encodeURIComponent(slug)}`, {
    redirect: "manual",
  });
  if (response.status === 308) {
    const body = (await response.json()) as { merged_into?: string };
    return body.merged_into ? { kind: "moved", to: body.merged_into } : { kind: "missing" };
  }
  if (response.status === 404) return { kind: "missing" };
  if (!response.ok) {
    throw new ApiError(response.status, "error", `The API answered ${response.status}.`);
  }
  return { kind: "system", system: (await response.json()) as HealthSystemDetail };
}

/** One kind of a system's members, paged - for a system with more than a page of them. */
export async function listHealthSystemMembers(
  slug: string,
  kind: HealthSystemMemberKind,
  { page = 1, page_size = 100 }: { page?: number; page_size?: number } = {},
): Promise<{
  items: HealthSystemMember[];
  total: number;
  page: number;
  page_size: number;
  member_kind: HealthSystemMemberKind;
  label: string;
}> {
  const search = new URLSearchParams({ kind, page: String(page), page_size: String(page_size) });
  return call(`/health-systems/${encodeURIComponent(slug)}/members`, { search });
}

/**
 * Every health-system slug, largest first, for the sitemap.
 *
 * The list endpoint leaves out systems folded into another and systems no longer on file, so a
 * slug that only redirects can never reach a sitemap. Paged because the endpoint caps a page at
 * 200; capped overall because a sitemap is a hint and an unbounded crawl to build one is not.
 */
export async function healthSystemSlugs(limit = 10_000): Promise<string[]> {
  const pageSize = 200;
  const slugs: string[] = [];
  for (let page = 1; slugs.length < limit; page += 1) {
    const found = await listHealthSystems({ kind: "all", page, page_size: pageSize });
    if (found.items.length === 0) break;
    slugs.push(...found.items.map((item) => item.slug));
    if (found.items.length < pageSize || slugs.length >= found.total) break;
  }
  return slugs.slice(0, limit);
}

function toProfile(p: OrganizationProfile): OrganizationProfile {
  return {
    network: publicDecisionNetwork(p.network),
    npi: p.npi,
    affiliated_providers: p.affiliated_providers,
    affiliation_basis: p.affiliation_basis,
    by_specialty: p.by_specialty.map(({ label, slug, count }) => ({ label, slug, count })),
    examples: p.examples.map((e) => ({
      npi: e.npi,
      name: e.name,
      credentials: e.credentials,
      specialty: e.specialty,
      city: e.city,
      state: e.state,
    })),
    ehr_system: p.ehr_system,
    ehr_basis: p.ehr_basis,
    practice_locations: p.practice_locations,
    facility_count: p.facility_count,
    facilities: p.facilities,
    system: p.system,
    similar: p.similar,
  };
}

/** What an organisation NPI's profile adds to its record, or null for anything else. */
export async function organizationProfile(npi: string): Promise<OrganizationProfile | null> {
  const profile = await orNull(call<OrganizationProfile>(`/organizations/${encodeURIComponent(npi)}/profile`));
  return profile ? toProfile(profile) : null;
}

/** What a facility's profile adds to its record, or null when it is not an active facility. */
export async function facilityProfile(ccn: string): Promise<OrganizationProfile | null> {
  const profile = await orNull(call<OrganizationProfile>(`/facilities/${encodeURIComponent(ccn)}/profile`));
  return profile ? toProfile(profile) : null;
}

/**
 * Post a signed-in visitor's Global Privacy Control signal, as the site's own key.
 *
 * The only write this file makes, and the only one it needs: everything else the site does on
 * somebody's behalf goes through a session (`lib/session.ts`), but `POST /v1/privacy/gpc` takes
 * key auth on the `privacy.submit` scope, which the site's key alone carries
 * (`app/api/public_privacy.py`). It sits outside the billing gate and is metered by nothing - a
 * consumer's right to opt out does not depend on an invoice.
 *
 * `site_request_id` is the account id and nothing else. It is what makes a repeat idempotent, and
 * it is deliberately not an email or anything else about the person: the field is a key for
 * matching the two records up later, so it holds an identifier of ours rather than one of theirs.
 *
 * Never throws. `false` means the platform does not have the signal - a refusal, a timeout, no key
 * configured - and the caller ({@link recordGpcOptOutForSignedInVisitor}) treats that as "try
 * again on the next page" rather than as a page failure. It is deliberately not cached and
 * deliberately short: a page render is waiting on it.
 */
export async function postGpcOptOut(visitor: {
  accountId: string;
  email: string;
}): Promise<boolean> {
  const key = process.env.NPI_API_KEY;
  if (!key) return false;
  try {
    const response = await fetch(`${baseUrl()}/privacy/gpc`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email: visitor.email,
        site_request_id: visitor.accountId,
        signal: `${GPC_BROWSER_HEADER}: 1`,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(4_000),
    });
    return response.ok;
  } catch {
    // A DNS failure, a refused connection, the timeout above. The visitor sees their page.
    return false;
  }
}

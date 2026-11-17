/**
 * The leadership role pages: which roles get pages, where they live, and the words for them.
 *
 *   /leadership                          the hub: every role, by facility family
 *   /leadership/<role>                   one role across the five families
 *   /leadership/<role>/<kind>            one role at one family, nationally, by state
 *   /leadership/<role>/<kind>/<state>    one role at one family in one state
 *
 * Counts only. The people behind these numbers have no NPI and are never named on a public page
 * - not in the copy, not in the structured data, not in a sitemap. A page says how many there
 * are and what a signed-in customer gets; the names are behind sign-up.
 *
 * Every page needs a published count behind it. The API returns only cells with at least its
 * floor of people (ten) across at least three facilities; a combination it does not return is
 * a 404 here, never a page with a zero on it. A role at a family in a state that falls below the
 * floor is still counted in the family's national page, which is where its state page's links
 * point instead.
 *
 * The role keys and their exact definitions live in the API (`app/leadership_roles.py`); this
 * file only gives them addresses and a sentence of context each.
 */

import "server-only";
import { leadershipRoleCounts, type FacilityType, type RoleCell } from "@/lib/api";
import { kindFromSlug, stateFromSlug, type FacilityKind } from "@/lib/facilities";

export type RolePage = {
  /** The API's role key. */
  key: string;
  /** The path segment: `/leadership/cfos`. */
  slug: string;
  /** How a heading says it after a family: "Hospital CFOs". */
  short: string;
  /** The role spelled out, for the first mention. */
  long: string;
  /** Why a seller wants this person, in a sentence. */
  why: string;
};

export const ROLE_PAGES: readonly RolePage[] = [
  {
    key: "ceo",
    slug: "ceos",
    short: "CEOs",
    long: "chief executive officers",
    why: "The final signature on strategic purchases, partnerships and acquisitions.",
  },
  {
    key: "cfo",
    slug: "cfos",
    short: "CFOs",
    long: "chief financial officers",
    why: "Owns the budget, revenue cycle, payer contracts and every purchase that has to pay back.",
  },
  {
    key: "coo",
    slug: "coos",
    short: "COOs",
    long: "chief operating officers",
    why: "Runs day-to-day operations: staffing, throughput, facilities and the vendors behind them.",
  },
  {
    key: "cio",
    slug: "cios",
    short: "CIOs",
    long: "chief information officers",
    why: "Decides the EHR, integrations, infrastructure and security spend.",
  },
  {
    key: "chief_medical_officer",
    slug: "chief-medical-officers",
    short: "chief medical officers",
    long: "chief medical officers",
    why: "Leads the medical staff, clinical quality and the clinical case for new services and tools.",
  },
  {
    key: "chief_nursing_officer",
    slug: "chief-nursing-officers",
    short: "chief nursing officers",
    long: "chief nursing officers",
    why: "Leads nursing: staffing models, agency spend, clinical workflow and nurse retention.",
  },
  {
    key: "administrator",
    slug: "administrators",
    short: "administrators",
    long: "administrators",
    why: "The licensed head of a nursing home, and often the top decision maker at a smaller facility.",
  },
  {
    key: "director_of_nursing",
    slug: "directors-of-nursing",
    short: "directors of nursing",
    long: "directors of nursing",
    why: "Runs nursing on the floor: staffing, supplies, training and survey readiness.",
  },
  {
    key: "medical_director",
    slug: "medical-directors",
    short: "medical directors",
    long: "medical directors",
    why: "The physician accountable for clinical policy, quality programs and admissions criteria.",
  },
  {
    key: "compliance_officer",
    slug: "compliance-officers",
    short: "compliance officers",
    long: "compliance officers",
    why: "Owns regulatory, privacy and audit risk - and the tools and services that reduce it.",
  },
  {
    key: "board_member",
    slug: "board-members",
    short: "board members",
    long: "board members, trustees and directors",
    why: "Sets direction and approves the largest decisions: affiliations, capital and leadership.",
  },
  {
    key: "owner",
    slug: "owners",
    short: "owners and partners",
    long: "individual owners and partners",
    why: "The people with an ownership stake - the decision makers behind independent and investor-owned operators.",
  },
];

export function roleFromSlug(slug: string): RolePage | null {
  return ROLE_PAGES.find((r) => r.slug === slug) ?? null;
}

export function roleOf(key: string): RolePage | null {
  return ROLE_PAGES.find((r) => r.key === key) ?? null;
}

export function rolePath(role: RolePage, kind?: FacilityKind, state?: string): string {
  let path = `/leadership/${role.slug}`;
  if (kind) path += `/${kind.slug}`;
  if (kind && state) path += `/${state.toLowerCase()}`;
  return path;
}

/** "Hospital CFOs", "Nursing home administrators". */
export function roleHeading(role: RolePage, kind: FacilityKind): string {
  return `${kind.singular} ${role.short}`;
}

/**
 * The published counts, indexed. One API call (cached for a day) serves every role page, so a
 * crawl of all of them is one read of the platform, not thousands.
 */
export type RoleIndex = {
  cells: RoleCell[];
  floor: number;
  minFacilities: number;
  /**
   * The day the platform last recomputed these counts, `YYYY-MM-DD`, or null when it did not say.
   * It is the only honest last-modified date a leadership page has: the page is a view of these
   * counts and nothing else, so the day they were recomputed is the day it could have changed.
   */
  refreshedAt: string | null;
  get(role: string, type: FacilityType, state?: string | null): RoleCell | null;
};

export async function roleIndex(): Promise<RoleIndex> {
  const body = await leadershipRoleCounts();
  const byKey = new Map<string, RoleCell>();
  for (const cell of body.items) {
    byKey.set(`${cell.role}|${cell.facility_type}|${cell.state ?? ""}`, cell);
  }
  return {
    cells: body.items,
    floor: body.floor,
    minFacilities: body.min_facilities,
    refreshedAt: body.refreshed_at ? body.refreshed_at.slice(0, 10) : null,
    get: (role, type, state) => byKey.get(`${role}|${type}|${state ?? ""}`) ?? null,
  };
}

/** The same, or an empty index when the API cannot answer - for a panel that decorates a page
 * whose own content does not depend on it. */
export async function roleIndexOrEmpty(): Promise<RoleIndex> {
  try {
    return await roleIndex();
  } catch {
    return { cells: [], floor: 10, minFacilities: 3, refreshedAt: null, get: () => null };
  }
}

/** A role page's path segments resolved, or null when any of them is not one we publish. */
export function resolveSegments(
  roleSlug: string,
  kindSlug?: string,
  stateSlug?: string,
): { role: RolePage; kind: FacilityKind | null; state: string | null } | null {
  const role = roleFromSlug(roleSlug);
  if (!role) return null;
  if (kindSlug === undefined) return { role, kind: null, state: null };
  const kind = kindFromSlug(kindSlug);
  if (!kind) return null;
  if (stateSlug === undefined) return { role, kind, state: null };
  const state = stateFromSlug(stateSlug);
  if (!state) return null;
  return { role, kind, state };
}

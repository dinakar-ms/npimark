/**
 * The facility directory: which kinds of facility get pages, where those pages live, and the
 * few rules every facility page shares.
 *
 * Five kinds get a directory - hospitals, nursing homes, home health agencies, hospices and
 * dialysis centres - because those are the families with a published rating and real volume
 * in every state. Everything else that is certified (rural health clinics, surgery centres and
 * the rest) still gets a profile page, reachable from its city's neighbours and the sitemap,
 * but no directory of its own: a "surgery centres in Boise" page with one row is the thin
 * content these pages exist to avoid.
 *
 * A city page needs `MIN_CITY` facilities of its kind. Below that, the state page lists the
 * facilities themselves, so every facility is two clicks from its state and nothing is lost.
 */

import type { FacilityType, PublicFacility } from "@/lib/api";
import { slugify } from "@/lib/geo";
import { titleCase } from "@/lib/names";
import { US_STATES } from "@/lib/site";

export type FacilityKind = {
  type: Exclude<FacilityType, "other">;
  /** The top-level path segment: `/hospitals`. */
  slug: string;
  plural: string;
  singular: string;
  /** What the kind is, in a sentence fragment a visitor would recognise. */
  blurb: string;
};

export const FACILITY_KINDS: readonly FacilityKind[] = [
  {
    type: "hospital",
    slug: "hospitals",
    plural: "Hospitals",
    singular: "Hospital",
    blurb: "acute care, critical access, psychiatric and specialty hospitals",
  },
  {
    type: "nursing_home",
    slug: "nursing-homes",
    plural: "Nursing homes",
    singular: "Nursing home",
    blurb: "skilled nursing facilities, with star ratings for inspections, staffing and quality",
  },
  {
    type: "home_health",
    slug: "home-health-agencies",
    plural: "Home health agencies",
    singular: "Home health agency",
    blurb: "certified agencies delivering skilled care at home",
  },
  {
    type: "hospice",
    slug: "hospices",
    plural: "Hospices",
    singular: "Hospice",
    blurb: "certified hospice providers",
  },
  {
    type: "dialysis",
    slug: "dialysis-centers",
    plural: "Dialysis centers",
    singular: "Dialysis center",
    blurb: "outpatient dialysis facilities",
  },
];

/** A city page needs at least this many facilities of its kind. */
export const MIN_CITY = 3;

export function kindOf(type: FacilityType): FacilityKind | null {
  return FACILITY_KINDS.find((kind) => kind.type === type) ?? null;
}

export function kindFromSlug(slug: string): FacilityKind | null {
  return FACILITY_KINDS.find((kind) => kind.slug === slug) ?? null;
}

/** A state code from a path segment, or null when it is not one we publish. */
export function stateFromSlug(slug: string): string | null {
  const code = slug.toUpperCase();
  return US_STATES.some(([c]) => c === code) && slug === slug.toLowerCase() ? code : null;
}

export function kindPath(kind: FacilityKind, state?: string, city?: string): string {
  let path = `/${kind.slug}`;
  if (state) path += `/${state.toLowerCase()}`;
  if (state && city) path += `/${slugify(city)}`;
  return path;
}

/**
 * The canonical address of a facility's page: its name, then its CCN. The CCN is what resolves
 * it; the name is for the reader and the crawler, and a stale or hand-typed name redirects.
 */
export function facilityPath(f: { ccn: string; name: string | null }): string {
  const name = slugify(f.name ?? "");
  const ccn = f.ccn.toLowerCase();
  return name ? `/facility/${name}-${ccn}` : `/facility/${ccn}`;
}

/** The CCN a facility slug ends in, or null when it cannot be one. */
export function ccnFromSlug(slug: string): string | null {
  const last = slug.split("-").pop() ?? "";
  return /^[a-z0-9]{6,10}$/.test(last) ? last.toUpperCase() : null;
}

/** Display casing lives in names.ts; re-exported here, where the facility pages already look. */
export { titleCase };

export function facilityName(f: Pick<PublicFacility, "name" | "ccn">): string {
  return titleCase(f.name) || `Facility ${f.ccn}`;
}

/** What a facility is, in words: its kind, or its certification category for the rest. */
export function facilityLabel(f: Pick<PublicFacility, "facility_type" | "category">): string {
  const kind = kindOf(f.facility_type);
  if (kind) return kind.singular;
  return f.category ? titleCase(f.category) : "Certified facility";
}

export function stars(value: number | null): string | null {
  if (value === null || value === undefined) return null;
  return `${Number.isInteger(value) ? value : value.toFixed(1)} of 5`;
}

/**
 * The schema.org type for a facility. Only types schema.org actually defines, and only ones that
 * are also a `Place`, because the beds, ownership and ratings ride in `additionalProperty`,
 * whose domain is `Place` (and a plain `MedicalOrganization` is not one). A hospital is a
 * `Hospital`; a dialysis centre a `MedicalClinic`; a nursing home, home health agency, hospice
 * or anything else certified a `MedicalBusiness` with the specialty that describes it -
 * schema.org has no `NursingHome`.
 */
export function schemaFor(type: FacilityType): { "@type": string; medicalSpecialty?: string[] } {
  switch (type) {
    case "hospital":
      return { "@type": "Hospital" };
    case "nursing_home":
      return { "@type": "MedicalBusiness", medicalSpecialty: ["Geriatric", "Nursing"] };
    case "home_health":
    case "hospice":
      return { "@type": "MedicalBusiness", medicalSpecialty: ["Nursing"] };
    case "dialysis":
      return { "@type": "MedicalClinic", medicalSpecialty: ["Renal"] };
    default:
      return { "@type": "MedicalBusiness" };
  }
}

/** A role bucket in words, for the leadership block. */
export const ROLE_LABELS: Record<string, string> = {
  executive: "Executive",
  finance: "Finance",
  compliance: "Compliance",
  operations: "Operations",
  clinical_leadership: "Clinical leadership",
  administration: "Administration",
  owner: "Owner",
  other: "Other",
};

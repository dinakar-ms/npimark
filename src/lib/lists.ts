/**
 * The list product pages: where they live, what a list carries, and the words every one of them
 * shares.
 *
 * A list page answers the buyer's first three questions from real numbers - how many, how many I
 * can email, how many I can call - and then says exactly what each record carries. The fields
 * named here are the columns a customer's export actually has (the platform's export writer);
 * nothing is promised that a file would not contain.
 *
 * The sample record is invented, and says so: a fictional name, a phone number in the 555-01xx
 * block reserved for fiction, an address at example.com, which can never be anyone's.
 */

import type {
  FacilityListCounts,
  HealthSystemCounts,
  HealthSystemMemberKind,
  ListCounts,
} from "@/lib/api";
import { percent, type Utilisation } from "@/lib/claims";
import { FACILITY_KINDS, type FacilityKind } from "@/lib/facilities";

export function listPath(slug: string, state?: string | null): string {
  return state ? `/lists/${slug}/${state.toLowerCase()}` : `/lists/${slug}`;
}

export function systemPath(slug: string): string {
  return `/systems/${slug}`;
}

/**
 * What a system page calls each kind of member.
 *
 * Beside `systemPath` rather than in the page, because the same words are wanted in the jump
 * links, the table heading and the group's own heading, and three copies would drift.
 */
export const MEMBER_LABELS: Record<HealthSystemMemberKind, string> = {
  hospital: "Hospitals",
  nursing_home: "Nursing homes",
  home_health: "Home health and hospice",
  facility: "Other certified facilities",
};

export function memberLabel(kind: string): string {
  return MEMBER_LABELS[kind as HealthSystemMemberKind] ?? "Members";
}

/**
 * What a system page calls each count. Two of these are why this map exists rather than a label
 * written at each call site: `facilities` says "all kinds", because the number includes hospitals
 * and reading it as a hospital count is the easy mistake; and `outpatient_centers` says outpatient
 * centers, which is what it counts - clinic and other outpatient sites, not physician groups.
 * `groups` is our own count of member physician groups and keeps its own name.
 */
export const SYSTEM_COUNT_LABELS: Record<keyof HealthSystemCounts, string> = {
  hospitals: "Hospitals",
  nursing_homes: "Nursing homes",
  home_health: "Home health and hospice",
  facilities: "Facilities (all kinds)",
  groups: "Physician groups",
  organizations: "Organizations",
  providers: "Providers",
  outpatient_centers: "Outpatient centers",
};

/**
 * The ownership word as prose about the system - "a for-profit, investor-owned system".
 *
 * Every phrase ends in "system" on purpose. The word describes the system's general acute care
 * hospitals weighted by beds, so "a for-profit system" is true and "a for-profit facility" is not
 * something this function can be made to say. A word with no phrase returns null and the prose
 * leaves ownership out; the word itself still appears in the facts panel, beside its footnote.
 */
export function ownershipPhrase(word: string | null): string | null {
  switch (word) {
    case "Nonprofit":
      return "a nonprofit system";
    case "Church-operated":
      return "a church-operated system";
    case "Public/government":
      return "a public or government system";
    case "For-profit/investor owned":
      return "a for-profit, investor-owned system";
    default:
      return null;
  }
}

/** Facility-type lists live beside the taxonomy lists, at the same slugs as the directory. */
export function facilityKindForList(slug: string): FacilityKind | null {
  return FACILITY_KINDS.find((kind) => kind.slug === slug) ?? null;
}

export function fmt(value: number): string {
  return value.toLocaleString("en-US");
}

/** A share, as a whole percentage; "under 1%" rather than a misleading 0%. */
export function share(part: number, whole: number): string {
  if (!whole) return "0%";
  const pct = (part / whole) * 100;
  if (pct > 0 && pct < 1) return "under 1%";
  return `${Math.round(pct)}%`;
}

export function refreshedOn(value: string | null | undefined): string | null {
  return value ? value.slice(0, 10) : null;
}

/** The rows of the counts panel on a provider list. */
export function providerCountRows(c: ListCounts): { name: string; value: string; note: string }[] {
  return [
    { name: "Records", value: fmt(c.total), note: "active providers on the list" },
    {
      name: "With work email",
      value: fmt(c.with_email),
      note: `${share(c.with_email, c.total)} of records`,
    },
    {
      name: "With trusted-tier email",
      value: fmt(c.with_trusted_email),
      note: `${share(c.with_trusted_email, c.with_email)} of the emails on this list`,
    },
    {
      name: "With practice phone",
      value: fmt(c.with_phone),
      note: `${share(c.with_phone, c.total)} of records`,
    },
    {
      name: "With practice city, state and ZIP",
      value: fmt(c.with_location),
      note: `${share(c.with_location, c.total)} of records`,
    },
  ];
}

/**
 * The rows of the "what they bill and prescribe" panel on a provider list.
 *
 * A second panel rather than two more rows in `providerCountRows`, because the denominator is a
 * different one: these are counted over the active individual clinicians filed under the specialty,
 * nationally, and the rows above are counted over the records on this list after removals. Putting
 * them in one panel would invite a reader to divide one by the other, and each row here says which
 * base it is a share of.
 *
 * Below the platform's share floor there is no percentage at all - the count, and why not.
 */
export function utilisationRows(
  measured: Utilisation,
  label: string,
): { name: string; value: string; note: string }[] {
  const base = `of the ${fmt(measured.clinicians)} active individual ${label.toLowerCase()} on file`;
  const tooFew = `${fmt(measured.clinicians)} in the specialty is too small a base for a percentage`;
  return [
    {
      name: "Clinicians in this specialty",
      value: fmt(measured.clinicians),
      note: "active individual providers filed under it, nationally - not the record count above",
    },
    {
      name: "With a published procedure line",
      value: measured.sharePublished
        ? percent(measured.withProcedures, measured.clinicians)
        : fmt(measured.withProcedures),
      note: measured.sharePublished ? `${fmt(measured.withProcedures)} ${base}` : tooFew,
    },
    {
      name: "With published prescribing",
      value: measured.sharePublished
        ? percent(measured.withPrescribing, measured.clinicians)
        : fmt(measured.withPrescribing),
      note: measured.sharePublished ? `${fmt(measured.withPrescribing)} ${base}` : tooFew,
    },
  ];
}

export function facilityCountRows(c: FacilityListCounts): { name: string; value: string; note: string }[] {
  return [
    { name: "Facilities", value: fmt(c.facilities), note: "certified and still operating" },
    { name: "Certified beds", value: fmt(c.beds), note: "where a count is published" },
    {
      name: "With main phone",
      value: fmt(c.with_phone),
      note: `${share(c.with_phone, c.facilities)} of facilities`,
    },
    {
      name: "Linked to an organization NPI",
      value: fmt(c.with_org_link),
      note: `${share(c.with_org_link, c.facilities)} of facilities`,
    },
    {
      name: "With named leadership on file",
      value: fmt(c.with_leadership),
      note: `${share(c.with_leadership, c.facilities)} of facilities`,
    },
  ];
}

/** What each provider record carries, in the export's own column names. */
export const PROVIDER_FIELDS: readonly { field: string; detail: string }[] = [
  { field: "NPI", detail: "The provider's 10-digit National Provider Identifier" },
  { field: "Name and credentials", detail: "As filed, with credentials such as MD, DO, NP" },
  { field: "Type and status", detail: "Individual or organization; active or inactive" },
  { field: "Specialty and specialty group", detail: "Primary taxonomy, classification and specialization" },
  { field: "Practice city, state and ZIP", detail: "Where the provider practices" },
  { field: "Practice phone", detail: "The phone on the provider's practice record" },
  { field: "Employer and employer domain", detail: "Who the provider works for, where known, with how it was established" },
  { field: "Work email (up to three)", detail: "Each with where it came from; filter to trusted-tier addresses only" },
  { field: "EHR system", detail: "The electronic health record the practice runs, where evidenced" },
  { field: "Last updated", detail: "The date the record was last refreshed" },
];

export const FACILITY_FIELDS: readonly { field: string; detail: string }[] = [
  { field: "CCN", detail: "The facility's certification number" },
  { field: "Name and enrolled legal name", detail: "The name on the door and the legal entity" },
  { field: "Address, county and main phone", detail: "The facility's published location and switchboard" },
  { field: "Organization NPI", detail: "The NPI the facility bills under, where linked" },
  { field: "Ownership type and chain", detail: "For-profit, non-profit or government; the system it belongs to" },
  { field: "Certified beds and ratings", detail: "Bed count and published star ratings, where they exist" },
  { field: "Owners", detail: "Ownership interests, with private-equity and REIT flags" },
  { field: "Certification category and date", detail: "What the facility is certified as, and since when" },
  { field: "Leadership contacts", detail: "Executives and officers by role and title, in the signed-in app" },
];

/** A record that is obviously invented. Never a real provider. */
export function sampleProviderRecord(label: string): { field: string; value: string }[] {
  return [
    { field: "NPI", value: "0000000000 (sample)" },
    { field: "Name", value: "Jordan Sample, MD (fictional)" },
    { field: "Specialty", value: label },
    { field: "Practice location", value: "Anytown, ST 00000" },
    { field: "Practice phone", value: "(555) 010-0123" },
    { field: "Work email", value: "jordan.sample@example.com · trusted tier" },
    { field: "Employer", value: "Example Health Partners" },
    { field: "EHR system", value: "Example EHR" },
    { field: "Last updated", value: "2026-01-01" },
  ];
}

export function sampleFacilityRecord(singular: string): { field: string; value: string }[] {
  return [
    { field: "CCN", value: "000000 (sample)" },
    { field: "Name", value: `Example ${singular} (fictional)` },
    { field: "Address", value: "100 Sample Way, Anytown, ST 00000" },
    { field: "Main phone", value: "(555) 010-0100" },
    { field: "Organization NPI", value: "0000000000" },
    { field: "Ownership", value: "Non-profit" },
    { field: "Certified beds", value: "120" },
    { field: "Leadership on file", value: "Executive 2 · Finance 1 · Owner 3" },
  ];
}

export const PROVIDER_USE_CASES: readonly { title: string; body: string }[] = [
  {
    title: "Email campaigns that land",
    body: "Filter to trusted-tier addresses only, and see before you buy how many of the list carry one.",
  },
  {
    title: "Territory planning",
    body: "Counts by state and practice location show where the population is before a rep is hired or a route is drawn.",
  },
  {
    title: "Recruiting",
    body: "Reach providers of one specialty in the states you are hiring in, with the practice phone on the record.",
  },
  {
    title: "Market sizing",
    body: "The by-state table is the market: real, current counts rather than an estimate from a survey.",
  },
];

export const FACILITY_USE_CASES: readonly { title: string; body: string }[] = [
  {
    title: "Account-based selling",
    body: "Every facility with its organization NPI, chain and size, so accounts roll up to the system that buys.",
  },
  {
    title: "Reach the decision makers",
    body: "Leadership contacts by role - executive, finance, compliance, operations - for signed-in customers.",
  },
  {
    title: "Prioritize by size and quality",
    body: "Certified beds and published ratings let a team work the largest or best-rated facilities first.",
  },
  {
    title: "Ownership research",
    body: "Ownership type, owners and private-equity or REIT flags, for diligence and competitive work.",
  },
];

export type Faq = { q: string; a: string };

export function faqJsonLd(faq: readonly Faq[]): Record<string, unknown> {
  return {
    "@type": "FAQPage",
    mainEntity: faq.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

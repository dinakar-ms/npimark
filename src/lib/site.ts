/**
 * Facts about the site that more than one page needs: its name, its origin, the sources it
 * draws on, and the reference lists the search form offers. Nothing here touches the API.
 */

export const SITE_NAME = "NPImark";
export const PRODUCT = "Provider Data";
export const TAGLINE =
  "Provider insights. Better connections.";

/** Canonical production origin also available during CI prerendering. Staging remains noindex. */
export function siteUrl(path = ""): string {
  const base = (process.env.SITE_BASE_URL?.trim() || "https://npimark.com").replace(/\/$/, "");
  return `${base}${path}`;
}

/**
 * The link-unfurl card for one fixed page.
 *
 * Next replaces the whole `openGraph` object when a page declares one rather than merging it
 * into the root layout's, so a page that wrote only a title would lose the site name and the
 * type with it - and a page that declares none at all unfurls as the site rather than as
 * itself. Saying all of it once is also the only way a dozen cards stay consistent.
 *
 * The image is named here rather than left to Next's file convention. `app/opengraph-image.tsx`
 * is inherited by a route that declares no `openGraph` of its own - but every page on this site
 * declares one through this helper, and a declared object replaces rather than merges. Leaving it
 * out is how `twitter:card: summary_large_image` came to be served with no image at all for
 * several weeks, which unfurls as a blank rectangle and is worse than declaring nothing.
 */
export function socialCard(path: string, title: string, description: string) {
  return {
    type: "website" as const,
    siteName: SITE_NAME,
    title,
    description,
    url: siteUrl(path),
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${SITE_NAME} — ${PRODUCT}` }],
  };
}

/**
 * Where a "talk to us" button goes, when one is set. It is read from the environment rather
 * than written here because it is a real mailbox somebody has to be watching on launch day: a
 * hard-coded address nobody reads is worse than no button. Unset, `salesHref` sends people to
 * sign-up, which is a live route. Two pricing cards shipped with `mailto:sales@example.com`.
 */
export const SALES_EMAIL = (process.env.SALES_EMAIL ?? "sales@npimark.com").trim();

/** A mailto for `subject` when a sales address is configured; otherwise the sign-up page. */
export function salesHref(subject: string): string {
  if (!SALES_EMAIL) return "/sign-up";
  return `mailto:${SALES_EMAIL}?subject=${encodeURIComponent(subject)}`;
}

export const NAV = [
  { href: "/search", label: "Search" },
  { href: "/directory", label: "Directory" },
  { href: "/tour", label: "Tour" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs/api", label: "API" },
] as const;

/**
 * What a record carries, for the pages that describe the product.
 *
 * Named by what the customer gets rather than by where we got it. Our supplier relationships and
 * the way records are assembled are not a customer's question and are not a competitor's
 * business, so the public pages answer "what is in it and how current is it" and stop there.
 */
export const COVERAGE = [
  {
    code: "Identity",
    name: "Who the provider is",
    cadence: "Weekly",
    gives: "Name, credentials, NPI, individual or organization, active status, enumeration date",
  },
  {
    code: "Specialty",
    name: "What they practice",
    cadence: "Weekly",
    gives: "Primary and secondary taxonomies, classification and specialization, license state",
  },
  {
    code: "Location",
    name: "Where they practice",
    cadence: "Weekly",
    gives: "Practice and mailing address, phone and fax, additional locations, ZIP and radius search",
  },
  {
    code: "Affiliation",
    name: "Who they work for",
    cadence: "Monthly",
    gives: "Employer and group affiliations, reassignments, organization NPI where one exists",
  },
  {
    code: "Contact",
    name: "How to reach them",
    cadence: "Continuous",
    gives: "Work email with its trust tier and check date, practice phone; home address and mobile on contracted plans",
  },
  {
    code: "Standing",
    name: "Whether they are in good standing",
    cadence: "Monthly",
    gives: "Federal program exclusions, opt-out and revocation flags, sanction dates",
  },
  {
    code: "Facilities",
    name: "The organizations behind them",
    cadence: "Monthly",
    gives: "Hospitals, hospices, home health, nursing and dialysis facilities, and who owns them",
  },
] as const;

export const US_STATES: ReadonlyArray<readonly [string, string]> = [
  ["AL", "Alabama"],
  ["AK", "Alaska"],
  ["AZ", "Arizona"],
  ["AR", "Arkansas"],
  ["CA", "California"],
  ["CO", "Colorado"],
  ["CT", "Connecticut"],
  ["DE", "Delaware"],
  ["DC", "District of Columbia"],
  ["FL", "Florida"],
  ["GA", "Georgia"],
  ["HI", "Hawaii"],
  ["ID", "Idaho"],
  ["IL", "Illinois"],
  ["IN", "Indiana"],
  ["IA", "Iowa"],
  ["KS", "Kansas"],
  ["KY", "Kentucky"],
  ["LA", "Louisiana"],
  ["ME", "Maine"],
  ["MD", "Maryland"],
  ["MA", "Massachusetts"],
  ["MI", "Michigan"],
  ["MN", "Minnesota"],
  ["MS", "Mississippi"],
  ["MO", "Missouri"],
  ["MT", "Montana"],
  ["NE", "Nebraska"],
  ["NV", "Nevada"],
  ["NH", "New Hampshire"],
  ["NJ", "New Jersey"],
  ["NM", "New Mexico"],
  ["NY", "New York"],
  ["NC", "North Carolina"],
  ["ND", "North Dakota"],
  ["OH", "Ohio"],
  ["OK", "Oklahoma"],
  ["OR", "Oregon"],
  ["PA", "Pennsylvania"],
  ["PR", "Puerto Rico"],
  ["RI", "Rhode Island"],
  ["SC", "South Carolina"],
  ["SD", "South Dakota"],
  ["TN", "Tennessee"],
  ["TX", "Texas"],
  ["UT", "Utah"],
  ["VT", "Vermont"],
  ["VA", "Virginia"],
  ["WA", "Washington"],
  ["WV", "West Virginia"],
  ["WI", "Wisconsin"],
  ["WY", "Wyoming"],
];

/**
 * NUCC classifications the search form offers. The API matches `taxonomy_classification`
 * exactly against the reference list, so these are spelled as NUCC spells them.
 */
export const CLASSIFICATIONS: readonly string[] = [
  "Allergy & Immunology",
  "Anesthesiology",
  "Chiropractor",
  "Clinic/Center",
  "Clinical Medical Laboratory",
  "Counselor",
  "Dentist",
  "Dermatology",
  "Dietitian, Registered",
  "Durable Medical Equipment & Medical Supplies",
  "Emergency Medicine",
  "Family Medicine",
  "General Acute Care Hospital",
  "Home Health",
  "Internal Medicine",
  "Neurological Surgery",
  "Nurse Practitioner",
  "Obstetrics & Gynecology",
  "Occupational Therapist",
  "Ophthalmology",
  "Optometrist",
  "Orthopaedic Surgery",
  "Otolaryngology",
  "Pathology",
  "Pediatrics",
  "Pharmacist",
  "Pharmacy",
  "Physical Medicine & Rehabilitation",
  "Physical Therapist",
  "Physician Assistant",
  "Plastic Surgery",
  "Podiatrist",
  "Psychiatry & Neurology",
  "Psychologist",
  "Radiology",
  "Registered Nurse",
  "Skilled Nursing Facility",
  "Social Worker",
  "Speech-Language Pathologist",
  "Surgery",
  "Urology",
];

export function stateName(code: string | null | undefined): string | null {
  if (!code) return null;
  const hit = US_STATES.find(([c]) => c === code.toUpperCase());
  return hit ? hit[1] : null;
}

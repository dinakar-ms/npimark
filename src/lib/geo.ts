/**
 * The metros the directory pages cover, and the slugs they live at.
 *
 * Why a list and not every city
 * -----------------------------
 * There are tens of thousands of places with a provider in them, and a site that publishes a
 * page for each one on day one is a site that gets classified as thin content before any of
 * them ranks. So this is wave one: the metros people actually search by, crossed with the
 * specialties people actually search for. A few thousand pages, each with real rows behind it.
 *
 * Later waves come from the platform rather than from this file - a city with enough providers
 * earns a page - but that needs an endpoint the public key can call, and this needed to exist
 * first.
 *
 * Every page validates its combination against these lists and against the row count, so a URL
 * somebody invents by hand is a 404 rather than an empty page with a title.
 */

export type Metro = { city: string; state: string };

/** Top metros by provider population, roughly. Kept short on purpose. */
export const METROS: readonly Metro[] = [
  { city: "New York", state: "NY" },
  { city: "Brooklyn", state: "NY" },
  { city: "Buffalo", state: "NY" },
  { city: "Rochester", state: "NY" },
  { city: "Los Angeles", state: "CA" },
  { city: "San Diego", state: "CA" },
  { city: "San Francisco", state: "CA" },
  { city: "Sacramento", state: "CA" },
  { city: "San Jose", state: "CA" },
  { city: "Fresno", state: "CA" },
  { city: "Houston", state: "TX" },
  { city: "Dallas", state: "TX" },
  { city: "Austin", state: "TX" },
  { city: "San Antonio", state: "TX" },
  { city: "Fort Worth", state: "TX" },
  { city: "El Paso", state: "TX" },
  { city: "Miami", state: "FL" },
  { city: "Orlando", state: "FL" },
  { city: "Tampa", state: "FL" },
  { city: "Jacksonville", state: "FL" },
  { city: "Chicago", state: "IL" },
  { city: "Philadelphia", state: "PA" },
  { city: "Pittsburgh", state: "PA" },
  { city: "Phoenix", state: "AZ" },
  { city: "Tucson", state: "AZ" },
  { city: "Atlanta", state: "GA" },
  { city: "Charlotte", state: "NC" },
  { city: "Raleigh", state: "NC" },
  { city: "Columbus", state: "OH" },
  { city: "Cleveland", state: "OH" },
  { city: "Cincinnati", state: "OH" },
  { city: "Detroit", state: "MI" },
  { city: "Boston", state: "MA" },
  { city: "Seattle", state: "WA" },
  { city: "Denver", state: "CO" },
  { city: "Nashville", state: "TN" },
  { city: "Memphis", state: "TN" },
  { city: "Baltimore", state: "MD" },
  { city: "Minneapolis", state: "MN" },
  { city: "St Louis", state: "MO" },
  { city: "Kansas City", state: "MO" },
  { city: "Milwaukee", state: "WI" },
  { city: "Las Vegas", state: "NV" },
  { city: "Portland", state: "OR" },
  { city: "Indianapolis", state: "IN" },
  { city: "Louisville", state: "KY" },
  { city: "New Orleans", state: "LA" },
  { city: "Oklahoma City", state: "OK" },
  { city: "Salt Lake City", state: "UT" },
  { city: "Birmingham", state: "AL" },
  { city: "Richmond", state: "VA" },
  { city: "Newark", state: "NJ" },
  { city: "Hartford", state: "CT" },
  { city: "Providence", state: "RI" },
  { city: "Albuquerque", state: "NM" },
  { city: "Omaha", state: "NE" },
  { city: "Des Moines", state: "IA" },
  { city: "Little Rock", state: "AR" },
  { city: "Charleston", state: "SC" },
  { city: "Boise", state: "ID" },
] as const;

/**
 * The specialties the directory covers, spelled as the reference list spells them.
 *
 * A subset of `CLASSIFICATIONS`, and only names that appear in it. The API matches
 * `taxonomy_classification` exactly against the reference list, so a name that is really a
 * sub-specialty - Cardiology, say, which is filed under Internal Medicine - would match nothing
 * and publish an empty page. Every name here is a classification, not a specialisation.
 */
export const DIRECTORY_SPECIALTIES: readonly string[] = [
  "Internal Medicine",
  "Family Medicine",
  "Pediatrics",
  "Psychiatry & Neurology",
  "Obstetrics & Gynecology",
  "Surgery",
  "Orthopaedic Surgery",
  "Dermatology",
  "Radiology",
  "Anesthesiology",
  "Emergency Medicine",
  "Nurse Practitioner",
  "Registered Nurse",
  "Physician Assistant",
  "Dentist",
  "Pharmacist",
  "Physical Therapist",
  "Psychologist",
  "Optometrist",
  "Chiropractor",
  "Podiatrist",
  "Social Worker",
  "Speech-Language Pathologist",
  "Occupational Therapist",
];

/** A path segment: lower case, words joined by hyphens, everything else dropped. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** The specialty a slug names, or null when it names nothing we publish. */
export function specialtyFromSlug(slug: string): string | null {
  return DIRECTORY_SPECIALTIES.find((name) => slugify(name) === slug) ?? null;
}

/** The metro a state and city slug name, or null. */
export function metroFromSlug(state: string, citySlug: string): Metro | null {
  const code = state.toUpperCase();
  return (
    METROS.find((metro) => metro.state === code && slugify(metro.city) === citySlug) ?? null
  );
}

export function specialtyPath(specialty: string, metro: Metro): string {
  return `/specialty/${slugify(specialty)}/${metro.state.toLowerCase()}/${slugify(metro.city)}`;
}

/** Other metros in the same state, for the links at the foot of a page. */
export function siblingMetros(metro: Metro, limit = 5): Metro[] {
  return METROS.filter((m) => m.state === metro.state && m.city !== metro.city).slice(0, limit);
}

/** Every combination this wave publishes. Used by the sitemap. */
export function directoryCombinations(): { specialty: string; metro: Metro }[] {
  const out: { specialty: string; metro: Metro }[] = [];
  for (const specialty of DIRECTORY_SPECIALTIES) {
    for (const metro of METROS) out.push({ specialty, metro });
  }
  return out;
}

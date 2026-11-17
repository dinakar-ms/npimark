/**
 * The one list of what "this is wrong" can say, shared by the public form, the signed-in control
 * and both route handlers.
 *
 * It is here rather than in each page for the reason every allow-list in this codebase is shared:
 * the route handler has to refuse a value the API would refuse anyway, and two copies of the list
 * drift apart on the first edit. The words are the ones a person would use - never a column name,
 * and never anything that hints at where the data came from.
 *
 * No `server-only`: the pages that render the selects and the handlers that validate a post both
 * read it, and nothing here touches a credential or the network.
 */

/** Which record is being reported. Matches the API's `subject_kind`. */
export const SUBJECT_KINDS = ["npi", "ccn", "org_contact"] as const;
export type SubjectKind = (typeof SUBJECT_KINDS)[number];

/**
 * Which fields may be reported. Every one is shown to a customer or on a public profile, which is
 * the test for belonging here: you cannot report a field you cannot see. Home address and cell
 * phone are deliberately absent - they are never on a public page and never in a message to a
 * reporter.
 */
export const CORRECTION_FIELDS = [
  "phone",
  "email",
  "fax",
  "specialty",
  "practice_address",
  "employment",
  "name",
  "title",
] as const;
export type CorrectionField = (typeof CORRECTION_FIELDS)[number];

export const CORRECTION_REASONS = [
  "not_at_practice",
  "wrong_number",
  "wrong_specialty",
  "retired_deceased",
  "duplicate",
  "other",
] as const;
export type CorrectionReason = (typeof CORRECTION_REASONS)[number];

export const FIELD_LABELS: Record<CorrectionField, string> = {
  phone: "Phone number",
  email: "Email address",
  fax: "Fax number",
  specialty: "Specialty",
  practice_address: "Practice address",
  employment: "Where they work",
  name: "Name",
  title: "Job title",
};

/** The short list the brief asks for, in the order a person reads it. */
export const REASON_LABELS: Record<CorrectionReason, string> = {
  not_at_practice: "No longer at this practice",
  wrong_number: "Wrong number",
  wrong_specialty: "Wrong specialty",
  retired_deceased: "Retired or deceased",
  duplicate: "Duplicate record",
  other: "Something else",
};

export const REASON_ORDER: readonly CorrectionReason[] = [
  "not_at_practice",
  "wrong_number",
  "wrong_specialty",
  "retired_deceased",
  "duplicate",
  "other",
];

/** Which fields each kind of record actually shows, so a select never offers a field that is not
 * on the page. A provider carries the lot; a facility has no specialty or job title; a leadership
 * row is a person at an organisation, so it has a name, a title, a number and an employer. */
export const FIELDS_FOR: Record<SubjectKind, readonly CorrectionField[]> = {
  npi: ["phone", "email", "fax", "specialty", "practice_address", "employment", "name"],
  ccn: ["phone", "practice_address", "employment", "name"],
  org_contact: ["name", "title", "phone", "employment"],
};

export function isSubjectKind(value: string): value is SubjectKind {
  return (SUBJECT_KINDS as readonly string[]).includes(value);
}

export function isCorrectionField(value: string): value is CorrectionField {
  return (CORRECTION_FIELDS as readonly string[]).includes(value);
}

export function isCorrectionReason(value: string): value is CorrectionReason {
  return (CORRECTION_REASONS as readonly string[]).includes(value);
}

/** The shape of a subject id, for a handler that must not pass rubbish on. The API checks the NPI
 * check digit too; this only keeps an obvious mistake out of a round trip. */
export function subjectIdLooksRight(kind: SubjectKind, id: string): boolean {
  if (kind === "npi") return /^\d{10}$/.test(id);
  if (kind === "ccn") return /^[A-Za-z0-9-]{1,20}$/.test(id);
  return /^\d{1,18}$/.test(id);
}

/**
 * A reference as the API mints one: `FC-2026-A1B2C3D4E5F6`. The only value either page reads back
 * out of a URL, so the pattern is the whole of what may be shown - anything else is dropped.
 *
 * It used to be `FC-000042`, which was the queue's running total. The length is a range rather
 * than exactly twelve so a longer token later does not silently stop the reference appearing.
 */
export const REFERENCE_PATTERN = /^FC-\d{4}-[0-9A-F]{6,24}$/;

/** Where the "Report a problem" link on a public profile points. */
export function reportPath(kind: SubjectKind, id: string, field?: CorrectionField): string {
  const params = new URLSearchParams({ kind, id });
  if (field) params.set("field", field);
  return `/report-a-problem?${params.toString()}`;
}

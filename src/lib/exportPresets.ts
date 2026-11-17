/**
 * What the export controls offer: the file formats, and the column presets by name.
 *
 * Only ids and labels live here. The *columns* each preset contains, and the headers it writes
 * them under, are defined once in the API (`backend/app/jobs/export_presets.py`) and resolved
 * there — this site posts an id. That is on purpose: two lists of columns that must agree and are
 * never compared is exactly the bug that made two of the old column sets fail for every customer
 * who chose them (the site asked for `taxonomy`; the backend's key is `specialty`).
 *
 * `backend/tests/test_site_export_columns.py` reads this file and asserts every id here exists in
 * the API's preset registry, and that every column in every one of those presets exists in the
 * export column catalogue. So the two can still only drift through a failing test.
 */

import { NO_VOLUME_IN_A_FILE, ONE_IN_WORDS } from "@/lib/claims";

/** A preset id, exactly as `EXPORT_PRESETS` in the API spells it. */
export const EXPORT_PRESETS = [
  { id: "practice", label: "Identity and practice", crm: false },
  { id: "identity", label: "Identity only", crm: false },
  { id: "contact", label: "Identity, practice and work email", crm: false },
  { id: "name_parts", label: "Name in parts", crm: false },
  { id: "outreach", label: "Name in parts, work email and practice", crm: false },
  { id: "claims", label: "Identity, practice and what they do", crm: false },
  { id: "salesforce_lead", label: "Salesforce Lead", crm: true },
  { id: "hubspot_contact", label: "HubSpot Contact", crm: true },
  { id: "pipedrive_person", label: "Pipedrive Person", crm: true },
  { id: "zoho_lead", label: "Zoho Lead", crm: true },
] as const;

export type ExportPresetId = (typeof EXPORT_PRESETS)[number]["id"];

export const DEFAULT_PRESET: ExportPresetId = "practice";

/**
 * The preset to start on when the destination is a CRM.
 *
 * Derived rather than named, so adding or reordering a CRM preset cannot leave a stale id behind.
 * It matters because `DEFAULT_PRESET` is one of ours: a campaign aimed at a CRM that started on
 * "Identity and practice" would hand somebody our header names under a sentence promising their
 * CRM's, and an import would fail on the far side where nobody can see why.
 */
export const DEFAULT_CRM_PRESET: ExportPresetId =
  (EXPORT_PRESETS.find((entry) => entry.crm)?.id ?? DEFAULT_PRESET) as ExportPresetId;

/** A format id, exactly as `EXPORT_FORMATS` in the API spells it. */
export const EXPORT_FORMATS = [
  { id: "csv", label: "CSV (comma-separated)" },
  { id: "tsv", label: "TSV (tab-separated)" },
  { id: "pipe", label: "Pipe-delimited" },
  { id: "xlsx", label: "Excel workbook (.xlsx)" },
  { id: "json", label: "JSON" },
] as const;

export type ExportFormatId = (typeof EXPORT_FORMATS)[number]["id"];

export const DEFAULT_FORMAT: ExportFormatId = "csv";

const PRESET_IDS = new Set<string>(EXPORT_PRESETS.map((preset) => preset.id));
const FORMAT_IDS = new Set<string>(EXPORT_FORMATS.map((format) => format.id));

/** The preset a form asked for, or the default. Never a value the API would refuse. */
export function presetOrDefault(raw: unknown): ExportPresetId {
  const value = String(raw ?? "");
  return (PRESET_IDS.has(value) ? value : DEFAULT_PRESET) as ExportPresetId;
}

/** The format a form asked for, or the default. */
export function formatOrDefault(raw: unknown): ExportFormatId {
  const value = String(raw ?? "");
  return (FORMAT_IDS.has(value) ? value : DEFAULT_FORMAT) as ExportFormatId;
}

/**
 * What a customer should know before they load a CRM preset, in one sentence.
 *
 * The register files a person's name in parts, so a preset fills the importer's own first-name and
 * last-name fields with them. Nothing is split to fill a part: where the register filed one string
 * and no parts, that string goes into the last-name field whole, as it always did. An organization
 * has no person name at all, so its name goes to the company field and the name fields are empty.
 */
/**
 * What a customer should know before they choose the claims columns, said where they choose them.
 *
 * Two facts, and the first one is the one that decides whether the file is useful: only a minority
 * of clinicians have any published volume, so most rows carry the words rather than a number.
 * Saying that here rather than after the file arrives is the difference between a limit and a
 * complaint. The share and the empty-cell wording are both `lib/claims.ts` constants rather than a
 * second copy of them - a second copy is a second wording, and this one would be the generous one.
 */
export const CLAIMS_NOTE =
  "“Identity, practice and what they do” adds the published Medicare summary: the highest-volume " +
  "few procedures and drugs, and the sizes, one cell each, with the data year in every one of " +
  `those headers. About one clinician in ${ONE_IN_WORDS} has any published volume — the rest read ` +
  `“${NO_VOLUME_IN_A_FILE}”, which is not a zero — and those columns widen a row rather than ` +
  "adding one, so the file costs the same rows with them as without.";

export const CRM_NOTE =
  "Headers are written the way that importer expects, so the file loads without a mapping " +
  "screen. A person's first and last names go in the importer's own name fields; an organization " +
  "has no person name, so its name goes in the company field and the name fields are left empty. " +
  "NPI is the one column you map yourself — no CRM has a standard field for it.";

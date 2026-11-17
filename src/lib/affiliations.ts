/**
 * Who a provider works for: a health system, a health plan or PBM, a health information exchange.
 *
 * Three filters the platform has always had and this screen has not, and each of them is an
 * affiliation rather than a fact about the person - which is why they share a module and a caveat.
 *
 * **The health system is named by its slug, never by its id.** The platform's filter is `idn`, and
 * the admin tool sends `idn_systems.id` because it has the ids. A filter value on this site ends up
 * in a URL the customer can see, bookmark and share, and the id is an internal field: so the screen
 * sends the permanent slug from `/api/reference/health-systems` and the platform translates it,
 * exactly as `/v1/providers` does with its `system` parameter. The screen's field is `system` and
 * the platform's is `idn`; the rename lives here, and *both* spellings are read so the object
 * round-trips through the export form and back.
 *
 * **`payer_employer` is an inference.** Everything else on the screen is filed or published;
 * "employed by a health plan or PBM" is derived from the employer we hold against a provider
 * against a declared list of payers. The platform carries a sentence saying so
 * (`app.payers.PAYER_AUDIENCE_LIMITS`) and it has to be shown wherever the filter is offered - a
 * derived audience read as a filed fact is the one way this filter misleads.
 *
 * **`has_hie` is membership of a health information exchange** as the federal provider directory
 * records it: the organisation itself, or an organisation an individual's PractitionerRole names.
 * `false` means neither, which is not the same as "we do not know" - there is no third value.
 */

/** What the platform accepts for `payer_employer`. `any` is any payer on the declared list. */
export const PAYER_EMPLOYERS = ["any", "pbm", "health_plan", "none"] as const;

/**
 * A health system's public slug, as `app.idn.slugs` writes it: lower case letters, digits and
 * hyphens, and at least one character that is not a digit.
 *
 * The non-digit is not decoration. The platform reads a value of digits alone as an *id*, because
 * that is what its own admin tool sends, so a digits-only value here would be searched on as
 * somebody else's row number. It refuses one it cannot find, but this keeps it from ever being sent.
 */
const SLUG = /^(?=[a-z0-9-]*[a-z-])[a-z0-9][a-z0-9-]{0,159}$/;

export type Read = (name: string) => string | undefined;
export type ReadAll = (name: string) => string[];

export type AffiliationFilters = {
  idn?: string[];
  payer_employer?: string;
  has_hie?: string;
};

/** The three, normalised, under the platform's names. */
export function affiliationFilters(read: Read, readAll: ReadAll): AffiliationFilters {
  const out: AffiliationFilters = {};

  // `system` is what the screen calls it and `idn` is what the platform calls it. Both are read:
  // the export form renders this object as its hidden fields and the route reads it back through
  // the same function, so a filter whose output name differs from its input name would survive the
  // screen and vanish on the way to the file.
  // `any` is the platform's wildcard - "works in some health system, no matter which" - and it
  // reaches the platform as itself rather than as a slug, because the platform tests for it first.
  const systems = [
    ...new Set(
      [...readAll("system"), ...readAll("idn")]
        .map((one) => one.trim().toLowerCase())
        .filter((one) => SLUG.test(one)),
    ),
  ];
  if (systems.length > 0) out.idn = systems;

  const payer = (read("payer_employer") ?? "").trim();
  if ((PAYER_EMPLOYERS as readonly string[]).includes(payer)) out.payer_employer = payer;

  const hie = (read("has_hie") ?? "").trim();
  if (hie === "true" || hie === "false") out.has_hie = hie;

  return out;
}

import { connection } from "next/server";
import { listCatalogue } from "@/lib/api";
import {
  boundary,
  fromApi,
  METERING,
  NOT_HELD,
  NO_VOLUME,
  publishable,
  YEAR,
} from "@/lib/claims";
import { COST_LABELS, FIELD_GROUPS, surfaceClause } from "@/lib/fields";
import { SITE_NAME, siteUrl } from "@/lib/site";

/**
 * The field reference, machine-readable.
 *
 * Generated from `lib/fields.ts` - the same constant `/fields` renders - so the dictionary a
 * script reads and the page a buyer reads cannot disagree. That is the whole reason this exists
 * as a route rather than as a checked-in file somebody would have to remember to regenerate.
 *
 * The coverage block is read live from the platform, exactly as the page reads it, and a figure
 * the platform cannot answer is `null` rather than `0`. `medicare_utilisation` is read the same
 * way: it is the platform's own measurement with the date it was taken on, so this file cannot
 * publish a coverage figure the database has moved away from - and when the platform does not
 * answer, the whole block is null and the limits still stand. A consumer of this file must treat null
 * as "not published": zero here would mean "none of them", which is a different and much worse
 * claim. Every `example` is fictional and the payload says so in its own header fields, so nothing
 * downstream can mistake one for a real provider's details.
 *
 * Rendered when asked, not when built: the origin comes from `SITE_BASE_URL`, which lives in the
 * container's environment rather than in the image, and the coverage figures need the API.
 */

export async function GET(): Promise<Response> {
  await connection();

  const catalogue = await listCatalogue().catch(() => null);
  const classes = (catalogue?.taxonomies ?? []).filter((t) => t.level === "classification");
  const sum = (pick: (t: (typeof classes)[number]) => number) =>
    classes.length === 0 ? null : classes.reduce((total, row) => total + pick(row), 0);
  const measured = publishable(fromApi(catalogue?.medicare_utilisation ?? null));

  // Per specialty, at the same two levels the list pages publish: the broad classification, and the
  // specialisation beneath it. Only the segments the platform will publish a share off carry one;
  // the rest carry their counts and `share_published: false`, so a script cannot turn a base of
  // sixty into a percentage. The shares themselves are left to the consumer to divide, for the same
  // reason the page does: one rule for rounding, in one place.
  const bySpecialty = (catalogue?.taxonomies ?? []).flatMap((row) => {
    // Through `fromApi`, so a specialty the platform has not measured is absent rather than a row
    // of nulls a script could read as zero - and so an older platform that does not carry the field
    // at all produces no rows rather than one per specialty saying nothing.
    const m = publishable(fromApi(row.medicare_utilisation));
    return m === null
      ? []
      : [
          {
            list: row.slug,
            label: row.label,
            level: row.level,
            classification: row.classification,
            specialization: row.specialization,
            clinicians: m.clinicians,
            with_procedures: m.withProcedures,
            with_prescribing: m.withPrescribing,
            share_published: m.sharePublished,
          },
        ];
  });

  const body = {
    name: `${SITE_NAME} field reference`,
    url: siteUrl("/fields"),
    description:
      "Every attribute a provider, organization or facility record carries: what it means, what it is used for, what it costs, and its API, export and append names.",
    notes: {
      examples:
        "Every example value is invented for illustration and describes no real person or organization.",
      coverage:
        "A null coverage figure means not published, never zero. Coverage is measured only for the fields listed under `coverage`. The `email`, `trusted_email`, `phone` and `location` keys are counted over the providers on the published specialty lists and read live; `procedures` and `prescribing` are counted over active individual providers and carry the date they were measured on, under `medicare_utilisation`.",
      medicare_utilisation:
        "The `procedures` and `prescribing` coverage keys describe published Medicare data and the limits under `medicare_utilisation` apply to every field carrying them. Do not treat an absent row as a zero. A null block means the platform did not answer, not that the coverage is zero.",
      by_specialty:
        "`medicare_utilisation.by_specialty` is the same measurement cut by specialty, at the two levels the list pages publish: every clinician is counted once, under their primary taxonomy, so a classification is the sum of the specializations beneath it and the specialties sum to the national figure. Where `share_published` is false the base is under `share_floor` and no percentage may be computed from the counts - publish the counts instead.",
      sources:
        "Where a record is assembled from is not published. A field's source column gives how a value was reached, in plain words.",
      names:
        "`api` is the field name in a /v1 provider response, `export` the column header a file is written with, `append` the field name the append tool accepts. Null means the field is not available on that surface.",
    },
    cost_bands: COST_LABELS,
    coverage: {
      refreshed_at: catalogue?.refreshed_at ?? null,
      measured_over: "Providers on the published specialty lists.",
      listed: sum((t) => t.counts.total),
      with_email: sum((t) => t.counts.with_email),
      with_trusted_email: sum((t) => t.counts.with_trusted_email),
      with_phone: sum((t) => t.counts.with_phone),
      with_location: sum((t) => t.counts.with_location),
    },
    // Published separately from `coverage` because it is a different denominator, a different
    // measurement moment and a set of limits that travel with the figures. Merging the two blocks
    // would let a script quote a utilisation share against the specialty-list base.
    medicare_utilisation: {
      year: YEAR,
      years_held: 1,
      measured_at: measured?.measuredOn ?? null,
      measured_over: "Active individual providers.",
      clinicians: measured?.clinicians ?? null,
      with_procedures: measured?.withProcedures ?? null,
      with_prescribing: measured?.withPrescribing ?? null,
      share_floor: measured?.shareFloor ?? null,
      by_specialty: bySpecialty,
      all_payor: false,
      patient_level: false,
      trend_supported: false,
      empty_state: NO_VOLUME,
      not_held_state: NOT_HELD,
      limits: boundary(measured),
      metering: METERING,
    },
    groups: FIELD_GROUPS.map((group) => ({
      key: group.key,
      title: group.title,
      description: group.blurb,
      fields: group.fields.map((field) => ({
        key: field.key,
        name: field.name,
        url: siteUrl(`/fields#${field.key}`),
        what_it_is: field.what,
        example: field.example,
        used_for: field.uses,
        coverage: field.coverage,
        api: field.api,
        export: field.exportHeader,
        append: field.append,
        cost_band: field.band,
        // The surface clause is derived from the three names above, not written beside them, so
        // this string can never claim a surface the `api`/`export`/`append` keys deny.
        cost: `${field.cost} ${surfaceClause(field)}`,
        ...(field.note ? { note: field.note } : {}),
      })),
    })),
  };

  return new Response(`${JSON.stringify(body, null, 2)}\n`, {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

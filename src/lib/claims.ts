import { listCatalogue, type MedicareUtilisation } from "@/lib/api";

/**
 * What a provider *does*, as opposed to who they are: the published Medicare procedure and
 * prescribing detail, and the one boundary sentence that must travel with it everywhere.
 *
 * Why this file exists rather than the words being typed on each page
 * ------------------------------------------------------------------
 * The capability is the answer to a specific prospect objection - "their data says what a doctor
 * does, yours only says who they are" - and the answer is only worth anything if the limits come
 * with it. Said three different ways on three pages, one of those ways will be the generous one,
 * and that is the one a prospect quotes back during a contract argument. So the boundary is one
 * exported function, used by `/data`, `/fields`, `/why-npi-mark` and the signed-in screens, and a
 * page that wants to say something shorter calls `boundaryShort` rather than improvising.
 *
 * Where the numbers come from
 * ---------------------------
 * They are read, not typed. Counting distinct providers across ten million procedure lines and
 * twenty-eight million prescribing rows is not a per-request query, so the platform's own coverage
 * job measures it - `reachable_population` and the two numerators, all counted over active
 * individual providers - and publishes the result on the list catalogue, which every page here
 * already reads for its other counts. `utilisation()` is that read, and the figures carry the day
 * they were measured on, because a measured number that says when it was taken is honest and one
 * that implies it is live is not.
 *
 * This file used to hold those three figures as constants with a `MEASURED_ON` beside them, which
 * was true on the day it was written and quietly less true every week after. The same measurement
 * now also answers per specialty, and `/data` and the list pages publish that: nationally the share
 * is about one in six, and that national figure is dragged down by every profession that never
 * bills Medicare Part B at all, so a cardiologist who reads only the national number learns
 * something misleading about cardiology.
 *
 * The rule the rest of the site follows applies here too: a figure is measured or it is "not
 * published". Nothing here is inferred from another number, nothing is rounded in a flattering
 * direction, and when the platform cannot answer, the sentences that need a figure say so instead
 * of falling back on one somebody typed.
 *
 * What must never be said
 * -----------------------
 * - Never name the agency that publishes the data. "Published Medicare data" is the boundary;
 *   whose file it is is not a customer's question and is a competitor's business.
 * - Never imply a trend. One year is held and no history, so "growing", "declining", "recently
 *   started performing" and "up on last year" are all unsupportable today.
 * - Never imply patient-level data. Every figure is an aggregate published about the provider.
 * - Never imply we can tell why a provider has nothing. See `NO_VOLUME` and `WHY_EMPTY`.
 * - Never let a specialty's high share be read as a claim about our contact data for that
 *   specialty. Those are different datasets over different populations, and a buyer will conflate
 *   them if a page lets them: see `SHARE_IS_NOT_CONTACT_DATA`.
 */

/** The data year both datasets are held for. One year; see `NO_HISTORY`. */
export const YEAR = 2024;

/**
 * The measured coverage of one population: every clinician in the country, or one specialty.
 *
 * `clinicians` is the denominator, and it is active individual providers - never the record count
 * of the list beside it, which is after suppression and includes the organisations filed under the
 * same specialty. Quoting one against the other is how a data sheet starts lying.
 */
export type Utilisation = {
  clinicians: number;
  withProcedures: number;
  withPrescribing: number;
  /** `YYYY-MM-DD`, or null when the platform did not say. */
  measuredOn: string | null;
  /** The fewest clinicians the platform will publish a share off. */
  shareFloor: number;
  /** False below that floor: print the counts and refuse the percentage. */
  sharePublished: boolean;
};

/**
 * The platform's measurement as this file uses it, or null.
 *
 * Null for three reasons that all mean the same thing to a page: the platform has not measured it
 * yet, it did not answer, or the population is empty. A page with null prints the limits without
 * the figures rather than a zero, which would read as "none of them".
 */
export function fromApi(measured: MedicareUtilisation | null | undefined): Utilisation | null {
  if (!measured || measured.clinicians <= 0) return null;
  return {
    clinicians: measured.clinicians,
    withProcedures: measured.with_procedures,
    withPrescribing: measured.with_prescribing,
    measuredOn: measured.measured_at ? measured.measured_at.slice(0, 10) : null,
    shareFloor: measured.share_floor,
    sharePublished: measured.share_published,
  };
}

/**
 * True when the measurement found nothing in either numerator.
 *
 * That is a statement about us, not about the clinicians: it means none of this dataset is loaded,
 * which is what `NOT_HELD` says in words and is a different fact from a low share. It happens on a
 * fresh deployment and on the demo database, and the difference has to survive onto the page,
 * because "no clinician in the country bills Medicare" is the one reading that must never appear.
 */
export function heldNone(measured: Utilisation): boolean {
  return measured.withProcedures === 0 && measured.withPrescribing === 0;
}

/**
 * The measurement where it is a coverage figure, and null where it is not.
 *
 * Every page that quotes the coverage in prose goes through this, so none of them can render "about
 * one in 99 clinicians" off a numerator of zero. `/data` is the exception and reads the raw
 * measurement, because saying which of the two states we are in is that page's whole job.
 */
export function publishable(measured: Utilisation | null): Utilisation | null {
  return measured && !heldNone(measured) ? measured : null;
}

/**
 * The national figure, read live, and null unless it is a figure worth printing. Every caller
 * handles that null - the same discipline `/data` keeps for every other count on it.
 */
export async function utilisation(): Promise<Utilisation | null> {
  const catalogue = await listCatalogue().catch(() => null);
  return publishable(fromApi(catalogue?.medicare_utilisation ?? null));
}

/** `1,203,649` and friends, for prose. */
export function count(value: number): string {
  return value.toLocaleString("en-US");
}

const WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
] as const;

/** A small whole number in words, so "one in 6" never renders and gets read as a typo. */
function words(value: number): string {
  return WORDS[value] ?? count(value);
}

/** How many clinicians there are for each one with a published procedure line. */
function oneIn(measured: Utilisation): number {
  return Math.round(measured.clinicians / Math.max(measured.withProcedures, 1));
}

/**
 * The honest headline share, as a plain-English fraction: "about one in six".
 *
 * Derived from the procedure figure, which is the larger of the two and the one the sentence is
 * about - whether we hold what a provider billed. The prescribing count is printed beside it
 * wherever this phrase appears, so a reader never gets the fraction on its own, and any arithmetic
 * that needs the real share divides the counts itself rather than reading a second number from
 * here that could fall out of step with them.
 */
export function oneInWords(measured: Utilisation): string {
  return words(oneIn(measured));
}

/**
 * A share as a whole percentage, for a specialty or for the country.
 *
 * Whole percentages, because a tenth of a point on a measurement like this is false precision, and
 * "under 1%" rather than a rounded 0%, because zero is a different claim. Callers check
 * `sharePublished` first: below the platform's floor there is no percentage to print at all.
 */
export function percent(part: number, whole: number): string {
  if (whole <= 0) return "not published";
  const share = (part / whole) * 100;
  if (share > 0 && share < 1) return "under 1%";
  return `${Math.round(share)}%`;
}

/** What a page says instead of a share when the base is too small to carry one. */
export function tooFewToPublish(measured: Utilisation): string {
  return `Too few to publish a share: under ${count(
    measured.shareFloor,
  )} clinicians, one person moves a whole-percent figure by more than half a point, so the counts are published and the percentage is not.`;
}

/**
 * The single phrase for a provider we hold the data for and who has nothing in it.
 *
 * One phrase and not three, because three would be a lie. There is no way to distinguish "no
 * Medicare volume", "below the publication threshold" and "does not bill Medicare": the rows are
 * removed before publication, so a low-volume provider arrives as an absence rather than as a
 * flagged row, and the flag the data model has for a withheld count is false on every row we
 * hold. Wherever this appears, `WHY_EMPTY` appears with it at least once on the page.
 */
export const NO_VOLUME = "No published Medicare volume";

/** Why `NO_VOLUME` is one phrase rather than a diagnosis. Said once per page, near it. */
export const WHY_EMPTY =
  "Low-volume providers are removed from the published file before we receive it, so this covers a provider with no Medicare volume, one below the publication threshold, and one who does not bill Medicare — and nothing in the published data separates them.";

/**
 * The sentence that stops a good specialty share being read as a claim about our contact data.
 *
 * It travels with the per-specialty figures, because they invite exactly that inference: a buyer
 * who reads "68% of nephrologists" three lines under "84% with a work email" will remember one
 * number and attach it to the other. They are different datasets over different populations, and
 * neither is evidence about the other.
 */
export const SHARE_IS_NOT_CONTACT_DATA =
  "A high share here means the published Medicare data covers that specialty well. It says nothing about how complete our contact data is for it — different datasets, measured over different populations — and the email, phone and location fill rates are counted and published separately on the same page.";

/**
 * The boundary, in full. Every page that names the capability carries this, or `boundaryShort`
 * where there is room for one sentence only.
 *
 * Five limits, in the order a buyer discovers they matter: which payor, how much of the market,
 * why a provider can be blank, no history, and not patient-level. The second one carries the
 * measured figures, and with no measurement to hand it states the limit without them rather than
 * dropping the limit or quoting a figure from memory.
 */
export function boundary(measured: Utilisation | null): readonly string[] {
  const coverage = measured
    ? `It covers about one in ${oneInWords(measured)} clinicians. ${count(
        measured.withProcedures,
      )} of ${count(measured.clinicians)} active individual providers have a published procedure ` +
      `line and ${count(measured.withPrescribing)} have a published prescribing row${
        measured.measuredOn ? `, measured ${measured.measuredOn}` : ""
      }. The other ${words(Math.max(oneIn(measured) - 1, 1))} in ${oneInWords(measured)} are ` +
      "blank on these columns, and some of your own list will be too — though the share is far " +
      "higher in the specialties that bill Medicare Part B for a living, and it is published per " +
      "specialty rather than left as a national average."
    : "It covers a minority of clinicians rather than nearly all of them, because low-volume " +
      "providers are removed from the published file before we receive it. The measured share, " +
      "nationally and per specialty, is published on the data page; we will not print one here " +
      "from memory.";
  return [
    `This is published Medicare data for ${YEAR} — fee-for-service only. It is not all-payor claims: a provider's commercial, Medicaid and Medicare Advantage volume is not in it.`,
    coverage,
    `A provider with nothing here reads "${NO_VOLUME}", and that is one phrase because it has to be: low-volume providers are removed from the published file before we ever receive it, so it covers a provider with no Medicare volume, one below the publication threshold, and one who does not bill Medicare at all. Nothing in the published data separates them, and we will not pretend to tell them apart.`,
    `One year is held and no history yet, so nothing here supports a trend: we cannot tell you a procedure count is rising or that somebody recently started performing one.`,
    `Every figure is an aggregate published about the provider. There is no patient-level data here, in any form.`,
  ] as const;
}

/** The one-sentence version, for a card or a table cell. */
export function boundaryShort(measured: Utilisation | null): string {
  const coverage = measured
    ? `covering about one in ${oneInWords(measured)} clinicians nationally, and more in the specialties that bill it most`
    : "covering a minority of clinicians rather than nearly all of them";
  return `Published Medicare fee-for-service data for ${YEAR}, ${coverage} — not all-payor claims, and low-volume providers are removed before publication.`;
}

/**
 * The word form of the national share as it was last measured, for a page with no live read.
 *
 * One page still uses it: `/pricing`, whose only figure is the phrase "about one in six" in a
 * sentence about what a lookup costs. Everything else calls `utilisation()` and prints what the
 * platform answered. It is a measured figure - the coverage job's, on 2026-09-24 - rather than a
 * live one, and the page that reads it should be moved onto the read; the phrase is kept in the
 * meantime because dropping it would drop a limit from a page that needs to carry it.
 */
export const ONE_IN_WORDS = "six";

/**
 * The same phrase in a file, where the column header has already said "Medicare".
 *
 * A cell is not a screen: the words sit in a column two inches wide, under a header that already
 * reads "Medicare services (2024)", and repeating "Medicare" in every one of them would push the
 * number out of view on the one row in six that has a number. So the file says
 * "No published volume" and means exactly what `NO_VOLUME` means - `WHY_EMPTY` covers both.
 *
 * It is a phrase and not an empty cell on purpose, and this is the one place the reasoning
 * belongs: the published data contains no zeros, because a low-volume line is removed before
 * publication rather than published small. An empty cell in a column of volumes is read as a zero
 * by the next person to open the file, and that zero would be ours rather than the data's. The
 * platform writes this into every claims column an export or an append carries
 * (`backend/app/claims_summary.py`, which is where the columns themselves are defined).
 */
export const NO_VOLUME_IN_A_FILE = "No published volume";

/**
 * The other state, which *is* a statement about us rather than about the provider: we hold none
 * of this dataset. Kept separate from `NO_VOLUME` because conflating them would tell a customer
 * a provider bills nothing when the truth is that we have loaded nothing.
 */
export const NOT_HELD = "Not held yet";

/** What one year and no history means, where a page has room for it on its own. */
export const NO_HISTORY = `${YEAR} only. No earlier years are loaded, so nothing here can be read as a trend.`;

/**
 * How a procedure or prescribing line is metered, in the words the implementation actually
 * follows - and the door matters, so the sentence names it.
 *
 * `app/api/public_claims.py` charges one row per line returned and nothing for a provider with no
 * published volume. Reading the same lines on screen in the app goes through the signed-in
 * provider record, which is not row-metered any more than search is. An earlier draft of this
 * string said "your plan's row allowance" without naming the door, which would have read as a
 * charge for looking at a screen.
 *
 * A file is the third door and it is the one that needed saying out loud, because the arithmetic
 * is not obvious: a file carries the *summary* rather than the lines, so a claims column widens a
 * row and never adds one. Ten thousand providers with every claims column switched on are ten
 * thousand rows, exactly as they are with none of them - and a provider with nothing published
 * still costs the row they were always going to cost, because they are in the file either way.
 * The per-line price stays on the API, where a line is what you asked for.
 */
export const METERING =
  "Through the API, one published procedure line and one published prescribing line each count as one row against your plan's row allowance — the same allowance an export spends — so thirty procedure lines for one surgeon are thirty rows. Asking about a provider whose Medicare volume was never published returns nothing and costs no rows, and the procedure and drug pickers cost no rows at all. Reading the detail on screen in the app is included, like search, and filtering a search on a procedure or a drug costs nothing beyond the providers it returns. In a file it is priced differently, because a file carries the summary and not the lines: the claims columns widen a row and never add one, so an export or an append costs exactly the same rows with them as without.";

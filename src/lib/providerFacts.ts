/**
 * Five filters the help page and the platform have always had, and the customer's screen has not:
 * when the NPI was issued, the CMS star rating, the PECOS billing group, and the two HRSA
 * programme flags.
 *
 * All five are plain public record — nothing licensed, nothing consumer-derived — which is why they
 * are here and the rest of that list is not. What each of them needs is a shape check, because each
 * has a way of being refused:
 *
 * * **the enumeration years are years**, and `enumerated_from` above `enumerated_to` is an empty
 *   result that reads as "nobody matches" when it means "you typed the range backwards";
 * * **`min_star_rating` is 1 to 5** on the platform (`ge=1, le=5`), so 0 or 6 is a 422;
 * * **`shortage_area` and `health_center` are enums**, repeatable — anything outside them is
 *   refused rather than ignored, and a refusal arrives here as an empty page.
 *
 * Not in here, deliberately:
 *
 * * **`accepting_new_patients`** reads "With plan_id or issuer_id", and providers the directory
 *   says nothing about match neither — so without a plan or issuer filter on this screen, which
 *   there is not, it would narrow almost everything away. It needs that filter first, not a
 *   checkbox.
 * * **several `taxonomy_classification` values.** The platform's parameter is already repeatable
 *   and this screen already sends it; offering more than one is a change to a working field rather
 *   than a missing filter, so it is somebody's decision and not a gap to fill.
 */

/** What the platform accepts for `shortage_area`. */
export const SHORTAGE_AREAS = ["any", "primary_care", "dental", "mental_health"] as const;
/** What it accepts for `health_center`. */
export const HEALTH_CENTERS = ["any", "fqhc", "look_alike"] as const;

const YEAR = /^\d{4}$/;
/** NPPES began in 2005. A year before that is a typo, not a filter. */
const FIRST_NPI_YEAR = 2005;

export type Read = (name: string) => string | undefined;
export type ReadAll = (name: string) => string[];

export type ProviderFacts = {
  enumerated_from?: string;
  enumerated_to?: string;
  min_star_rating?: string;
  group_name?: string;
  shortage_area?: string[];
  health_center?: string[];
};

/** A four-digit year at or after the first NPI, or "". */
function year(raw: string | undefined): string {
  const value = (raw ?? "").trim();
  if (!YEAR.test(value)) return "";
  return Number(value) >= FIRST_NPI_YEAR ? value : "";
}

/**
 * The five, normalised.
 *
 * A backwards year range drops the *upper* bound rather than refusing both: "issued since 2020"
 * is almost certainly what somebody typing 2020 and 2019 meant, and keeping the half that reads as
 * an intention beats answering with an empty page.
 */
export function providerFacts(read: Read, readAll: ReadAll): ProviderFacts {
  const out: ProviderFacts = {};
  const from = year(read("enumerated_from"));
  const to = year(read("enumerated_to"));
  if (from) out.enumerated_from = from;
  // Both, only when they are the right way round.
  if (to && (!from || Number(to) >= Number(from))) out.enumerated_to = to;

  // 1 to 5 on the platform (`ge=1, le=5`), so anything outside is a 422 - and a whole or half star
  // is all CMS publishes, which is why arbitrary decimals are refused too.
  //
  // Shape *and* range, because the shape alone lets "5.5" through: 5 matches the digit class and
  // .5 matches the optional half, and 5.5 is over the platform's ceiling. A pattern that looks
  // like a bounds check is not one.
  const stars = (read("min_star_rating") ?? "").trim();
  if (/^[1-5](\.[05])?$/.test(stars) && Number(stars) >= 1 && Number(stars) <= 5) {
    out.min_star_rating = stars;
  }

  const group = (read("group_name") ?? "").trim().slice(0, 255);
  if (group) out.group_name = group;

  const pick = (name: string, allowed: readonly string[]) => {
    const chosen = [...new Set(readAll(name).map((v) => v.trim()).filter((v) => allowed.includes(v)))];
    return chosen.length > 0 ? chosen : undefined;
  };
  const shortage = pick("shortage_area", SHORTAGE_AREAS);
  if (shortage) out.shortage_area = shortage;
  const centres = pick("health_center", HEALTH_CENTERS);
  if (centres) out.health_center = centres;
  return out;
}

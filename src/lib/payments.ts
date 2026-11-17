/**
 * Industry payments: the three filters that read CMS's Open Payments file.
 *
 * Open Payments is the federal record of what drug and device manufacturers pay doctors -
 * consulting, speaking, food, travel, royalties, ownership. It is published by CMS, by name and by
 * NPI, and it is what lets a search say "paid at least $5,000 in a year" or the opposite, "nobody
 * who was".
 *
 * Three filters and not two, because the amount means nothing without the year: the platform reads
 * a floor **within one program year**, so `min_payment_amount=5000` with no year asks "at least
 * $5,000 in any single year" and with a year asks about that year alone. A year on its own narrows
 * nothing on this screen, so it is dropped rather than sent - the platform accepts it, and a
 * parameter that is accepted and does nothing is one somebody will believe in.
 *
 * The year is checked against the years the platform holds
 * -------------------------------------------------------
 * It used to be checked against the calendar, because nothing served the real list. Both halves
 * are fixed now. The platform **refuses** a program year nothing loaded into, because the two
 * filters fail in opposite directions in an empty year - the floor matches nobody while
 * `payment_amount_below`, a negation, keeps everybody - and
 * `/api/reference/open-payments/years` serves the years it holds, so the screen offers those and
 * this drops anything else. Without a list it still falls back to the calendar, which is the
 * export route's case: the value it receives came from the screen's own field, already checked.
 */

export type Read = (name: string) => string | undefined;

export type PaymentOptions = {
  /**
   * The program years the platform holds, when the caller has them.
   *
   * The screen does; the export route does not and must not fetch them - its value came from the
   * screen's own hidden field, and a year that slipped through narrows the file rather than
   * widening it. Without the list the calendar check below applies instead.
   */
  years?: readonly number[];
};

export type PaymentFilters = {
  min_payment_amount?: string;
  payment_amount_below?: string;
  payment_year?: string;
};

/** Open Payments' first program year. Anything earlier is a typo, not a filter. */
export const FIRST_PAYMENT_YEAR = 2013;
/** Dollars, whole or to the cent. `ge=0` on the platform, so a negative is a 422. */
const AMOUNT = /^\d{1,9}(\.\d{1,2})?$/;
const YEAR = /^\d{4}$/;

/** The newest program year worth offering: CMS publishes one in the middle of the next year. */
export function newestPublishedYear(now: Date = new Date()): number {
  return now.getUTCFullYear() - 1;
}

/**
 * The three, normalised, under the platform's own names.
 *
 * Both amounts may be sent together - "paid something, but not a fortune" is a real question, and
 * the platform reads them as a band rather than as a contradiction. What is not sent is a year with
 * neither amount beside it.
 */
export function paymentFilters(
  read: Read,
  options: PaymentOptions = {},
  now: Date = new Date(),
): PaymentFilters {
  const out: PaymentFilters = {};
  const amount = (name: keyof PaymentFilters) => {
    const value = (read(name) ?? "").trim();
    // A leading zero or a bare "." is not a number this sends: the shape is the check, and
    // `Number` agreeing is not the same as the platform accepting it.
    return AMOUNT.test(value) ? value : "";
  };
  const atLeast = amount("min_payment_amount");
  const below = amount("payment_amount_below");
  if (atLeast) out.min_payment_amount = atLeast;
  if (below) out.payment_amount_below = below;
  if (!atLeast && !below) return out;

  const year = (read("payment_year") ?? "").trim();
  if (!YEAR.test(year)) return out;
  const asked = Number(year);
  if (options.years !== undefined) {
    // The platform's own list. A year outside it would be refused, and a refusal arrives as an
    // empty page that reads as "nobody was paid that much".
    if (options.years.includes(asked)) out.payment_year = year;
    return out;
  }
  if (asked >= FIRST_PAYMENT_YEAR && asked <= newestPublishedYear(now) + 1) {
    out.payment_year = year;
  }
  return out;
}

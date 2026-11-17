/**
 * Display casing for names filed in capitals: "ST. LUKE'S HOSPITAL OF KANSAS CITY LLC" reads
 * as "St. Luke's Hospital of Kansas City LLC", "HCA HEALTHCARE" as "HCA Healthcare".
 *
 * Deliberately conservative, and display only - stored data is never touched:
 * - Input that is already mixed case is returned as it came; someone cased it on purpose.
 * - A curated set of acronyms and legal suffixes stays in capitals (LLC, PC, HCA, UPMC...).
 * - A word with no vowel (Y counts) is taken for an acronym and kept in capitals ("SSM"),
 *   except for the common abbreviations that are words ("ST", "DR", "BLVD").
 * - A two-letter state code stays in capitals only straight after a comma ("KANSAS CITY, MO").
 * - "of", "and", "the", "at", "for" are lower case unless they open the name.
 * - "LUKE'S" is "Luke's" but "O'BRIEN" is "O'Brien"; "MCALLEN" is "McAllen"; each side of a
 *   hyphen or slash is cased on its own ("WINSTON-SALEM" is "Winston-Salem").
 *
 * This file has no imports so `node --test` can load it directly (see names.test.mjs).
 */

/** Always in capitals, wherever they fall. */
const ACRONYMS = new Set([
  "LLC", "LLP", "LP", "PC", "PA", "PLLC", "MD", "DO", "DDS", "NP", "PT", "HCA", "UPMC", "CHI",
  "USA", "US", "VA", "II", "III", "IV", "NE", "NW", "SE", "SW",
]);

/** Words with a fixed spelling other than plain capitalisation. */
const FIXED: Record<string, string> = { INC: "Inc" };

/** Vowel-less abbreviations that read as words, so they are capitalised, not kept in capitals. */
const VOWELLESS_WORDS = new Set([
  "ST", "STS", "DR", "RD", "MT", "FT", "JR", "SR", "MR", "MRS", "MS", "CT", "LN", "PL", "SQ",
  "BLVD", "STE", "HWY", "PKWY", "CTR", "CNTR", "TPKE", "PLZ", "BLDG", "FL", "HLTH", "SVC", "SVCS",
  "MGMT", "DPT", "DEPT",
]);

/** Lower case unless they open the name. */
const SMALL = new Set(["OF", "AND", "THE", "AT", "FOR"]);

const STATES = new Set(
  (
    "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH " +
    "NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY PR GU VI AS MP"
  ).split(" "),
);

/** A run of letters and digits, with any apostrophe parts attached: LUKE'S, O'BRIEN, 1ST. */
const WORD = /[A-Za-z0-9]+(?:'[A-Za-z]+)*/g;

function capitalise(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/** One word, in capitals as filed, cased for display. */
function caseWord(word: string, first: boolean, afterComma: boolean, wholeToken: boolean): string {
  if (afterComma && wholeToken && STATES.has(word)) return word;
  if (ACRONYMS.has(word)) return word;
  if (word in FIXED) return FIXED[word];
  if (SMALL.has(word) && wholeToken && !first) return word.toLowerCase();
  if (/^[0-9]/.test(word)) return word.toLowerCase();
  if (word.includes("'")) {
    const [head, ...rest] = word.split("'");
    // O'BRIEN, D'ANGELO: a one-letter prefix, then a name. LUKE'S, CHILDREN'S: a possessive.
    if (head.length === 1 && rest.length === 1 && rest[0].length > 1) {
      return `${head.toUpperCase()}'${capitalise(rest[0])}`;
    }
    return [capitalise(head), ...rest.map((r) => r.toLowerCase())].join("'");
  }
  if (word.length > 1 && /^[A-Z]+$/.test(word) && !/[AEIOUY]/.test(word) && !VOWELLESS_WORDS.has(word)) {
    return word;
  }
  if (word.length > 3 && word.startsWith("MC") && /^[A-Z]+$/.test(word)) {
    return `Mc${capitalise(word.slice(2))}`;
  }
  return capitalise(word);
}

/** Names are filed in capitals more often than not; a page reads better in title case. */
export function titleCase(value: string | null | undefined): string {
  if (!value) return "";
  if (value !== value.toUpperCase()) return value;
  let seenWord = false;
  let afterComma = false;
  return value
    .split(/(\s+)/)
    .map((token) => {
      if (/^\s*$/.test(token)) return token;
      const core = token.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9']+$/g, "");
      const cased = token.replace(WORD, (word, offset: number) => {
        const first = !seenWord;
        const followsComma = afterComma && offset === token.search(WORD);
        seenWord = true;
        return caseWord(word, first, followsComma, word === core);
      });
      afterComma = token.endsWith(",");
      return cased;
    })
    .join("");
}

/**
 * What makes a page a draft, declared once and read by everything that needs to know.
 *
 * What this is for
 * ----------------
 * Three mechanisms on this site deliberately render internal notes into the page. `OwnerNotes`
 * prints `[OWNER: ...]` wherever a company fact is still a question; `ChannelNote` prints one
 * wherever a mailbox has not been set in the environment; and `LegalDocument` prints counsel's
 * `[LAWYER: ...]` notes while `LEGAL_PAGES_APPROVED` is off. All three exist so an unanswered
 * question is impossible to ignore, and all three are right to do that.
 *
 * None of them was ever stopped from being **found**. Measured on production 11 Oct 2026, before
 * this existed: `/about` carried 5 notes, `/security` 3, `/contact` 3, `/privacy` 30 counsel notes
 * and `/terms` 20 — internal notes on pages that `robots.txt` allows, that carried no
 * `X-Robots-Tag`, and that we were *submitting* in the sitemap. One of them told any reader which
 * states we have applied to as a data broker and that none had yet been granted.
 *
 * The notes are an internal review mechanism. A search index is the opposite of internal, and a
 * snippet is forever in a way a page is not. So the rule is simply: while a page is asking, it is
 * not ready to be found.
 *
 * Why one table, and why it holds the whole answer
 * -----------------------------------------------
 * Four things need to agree about whether a page is finished: the draft banner at the top of it,
 * the `[OWNER: ...]` notes in its prose, its `robots` metadata, and whether `app/sitemap.ts`
 * submits it. They were three separate lists, and they had already drifted twice —
 *
 *   * `/about` passed five facts to its own `DraftNotice` while rendering a sixth note
 *     (`dataBrokerRegistration`) in its prose, so the banner undercounted what the page asked;
 *   * `/contact` and `/security` both print the `SECURITY_EMAIL` channel note, which no list
 *     mentioned at all. Both were noindexed only because their *facts* were unanswered. Answer
 *     those — which `content/answers.ts` now makes a one-variable change — and each page would
 *     have been published carrying an internal note naming an unset environment variable.
 *
 * Neither drift was anybody's mistake; they are what three hand-maintained lists of the same thing
 * do. So there is one entry per route here, and the page reads it rather than restating it:
 * `<DraftNotice {...draftOf("/contact")} />` for the banner, `draftRobots("/contact")` for the
 * metadata, and `isDraft` for the sitemap. One list cannot disagree with itself.
 *
 * It only ever *removes* indexing, and it re-indexes a page the moment its last question is
 * answered — nothing to flip, nothing to grep for twice.
 *
 * Adding a page: register its route below with everything it can print a note about, drive its
 * `DraftNotice` from `draftOf`, and call `draftRobots` in its metadata.
 * `scripts/draft-pages-noindex.mjs` checks all three.
 */

import type { Metadata } from "next";
import {
  COMPANY,
  type Channel,
  type CompanyFact,
  anyUnanswered,
  channel,
} from "../content/company.ts";
import { legalPagesApproved } from "../content/legal/version.ts";

/**
 * Everything one route can print an internal note about.
 *
 * Channels are held as keys, not as resolved `Channel` objects: a mailbox is read from the
 * environment at request time, and resolving one here — in a module-level const — would freeze
 * whatever was set when the module loaded.
 */
type DraftPage = {
  /** The company facts this page renders, including any in its prose. */
  readonly facts?: readonly CompanyFact[];
  /** The contact channels it renders, by key. An unset mailbox prints a note. */
  readonly channels?: readonly string[];
  /** For the two pages whose whole text is a draft until counsel approves it. */
  readonly legal?: true;
};

/**
 * Every page that can print an internal note, and what would make it finished.
 *
 * This must list what the page actually renders. Listing less is the bug described above: the page
 * keeps a note and gets indexed anyway. The guard script checks that each page is driven from
 * here, which is what stops the two falling out of step again, but only the page knows which
 * sentences it writes — so when you add a `<Fact>` or a `<ChannelNote>`, add it here.
 */
export const DRAFT_PAGES: Readonly<Record<string, DraftPage>> = {
  "/why-npi-mark": { facts: [COMPANY.customerNames] },
  "/about": {
    facts: [
      COMPANY.legalEntity,
      COMPANY.dataBrokerRegistration,
      COMPANY.founded,
      COMPANY.teamSize,
      COMPANY.office,
      COMPANY.customerNames,
    ],
  },
  "/security": {
    facts: [COMPANY.securityAssurance, COMPANY.securityRewards],
    channels: ["security"],
  },
  "/contact": {
    facts: [COMPANY.office, COMPANY.phone],
    channels: ["sales", "support", "privacy", "security"],
  },
  // `/status` is deliberately absent. It renders the support channel but never prints a note for
  // it: with no address set it writes "Read the help pages" and links to them, which is a finished
  // sentence rather than a question. Listing it would noindex and unlist a page whose whole job is
  // to be found when somebody searches for our status.
  "/terms": { legal: true },
  "/privacy": { legal: true },
};

/** What a draft page tells a crawler. `follow` stays off too: the notes link nowhere useful. */
const DRAFT: Metadata["robots"] = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: { index: false, follow: false },
};

/**
 * The facts and channels a route renders notes for, resolved for this request.
 *
 * Pages spread it straight into `DraftNotice`, so the banner counts exactly what the robots
 * metadata and the sitemap count.
 */
export function draftOf(path: string): {
  facts: readonly CompanyFact[];
  channels: readonly Channel[];
} {
  const page = DRAFT_PAGES[path];
  return {
    facts: page?.facts ?? [],
    channels: (page?.channels ?? []).map(channel),
  };
}

/**
 * Is this route still asking a question? `false` for any route not in the table, which is every
 * page that cannot print a note.
 */
export function isDraft(path: string): boolean {
  const page = DRAFT_PAGES[path];
  if (page === undefined) return false;
  if (page.legal) return !legalPagesApproved();
  if (anyUnanswered(page.facts ?? [])) return true;
  return (page.channels ?? []).some((key) => channel(key).address === null);
}

/**
 * Metadata for a page in the table above: `{robots: ...}` while it is a draft, and nothing at all
 * once its questions are answered, so the page falls back to the site default.
 *
 * Throws on a route that is not registered. A mistyped route would otherwise return `{}` and
 * index the page silently, which is the exact failure this module exists to prevent — and these
 * are module-level `metadata` consts, so it throws at build rather than in front of a reader.
 */
export function draftRobots(path: string): Pick<Metadata, "robots"> {
  if (!(path in DRAFT_PAGES)) {
    throw new Error(
      `draftRobots("${path}"): not a registered draft page. Add it to DRAFT_PAGES in lib/draft.ts ` +
        `with everything the page can print a note about, or drop the call if it cannot print one.`,
    );
  }
  return isDraft(path) ? { robots: DRAFT } : {};
}

/**
 * Answering a company fact without a code change.
 *
 * The problem
 * -----------
 * `content/company.ts` declares the things only the owner knows — the legal entity, the founding
 * year, the size of the team, which mailbox is watched — as facts with a question attached, and
 * the company pages print the question wherever the answer is missing. That part works. But the
 * answer itself was a string literal in a TypeScript file, so answering one meant an edit, a
 * review, a gate run and a deploy. Eight questions have sat unanswered on production for that
 * reason, and `lib/draft.ts` keeps those pages out of the search index until they are answered,
 * so the cost of the slow path is pages nobody can find.
 *
 * What this does
 * --------------
 * A fact's answer may come from the environment instead. `COMPANY_OFFICE=...` answers the office
 * question; the page then prints the answer, `OwnerNotes` stops printing the note, and once the
 * last question on a page is answered `lib/draft.ts` lets it be indexed again — all from one
 * variable and a restart, with no deploy.
 *
 * The variable name is derived from the fact's id, so it cannot be chosen wrongly: `legal-entity`
 * is answered by `COMPANY_LEGAL_ENTITY`, `data-broker-registration` by
 * `COMPANY_DATA_BROKER_REGISTRATION`. `answers.test.mjs` asserts every fact's variable is
 * documented in `infra/site.env.example`, because a mistyped variable is a silent no-op: the page
 * keeps printing the question and nothing says why.
 *
 * What it deliberately does not do
 * --------------------------------
 * It carries **answers to specific questions, never prose**. The marketing copy stays in the
 * repository and under the guards that protect it: the no-sourcing rule written into the types in
 * `lib/reach.ts`, the structured-data tests, the lint checks. A mechanism that let any sentence on
 * the site be rewritten at runtime would bypass every one of those, on a site whose copy carries
 * claims about data broker registration and permissible use. So the editable surface is exactly
 * the set of questions the owner has already been asked, and nothing else.
 *
 * Why the environment and not a database
 * --------------------------------------
 * It is the mechanism the site already uses for `LEGAL_PAGES_APPROVED`, `PRIVACY_EMAIL` and
 * `SUPPORT_EMAIL`, all read at request time on pages that call `connection()`. The `settings`
 * table was the obvious alternative and is the wrong tool: it is org-scoped and Fernet-encrypted,
 * built for API credentials, and reading it from the public site would mean a public endpoint that
 * decrypts settings.
 *
 * This module has no imports on purpose, so it can be unit-tested under bare `node --test`, where
 * the `@/` alias does not resolve.
 */

/** The prefix every company answer shares, so one grep finds the whole surface. */
const PREFIX = "COMPANY_";

/**
 * The environment variable that answers the fact with this id.
 *
 * Derived rather than declared: a second list of names would be a second thing to keep in step,
 * and getting it wrong is invisible — the page simply goes on asking the question.
 */
export function answerKey(id: string): string {
  return PREFIX + id.replace(/[^A-Za-z0-9]+/g, "_").toUpperCase();
}

/**
 * The answer to use: the environment's, if it has one, otherwise whatever the source declares.
 *
 * The environment wins over a committed value, which is what makes this useful for a correction
 * as well as for a first answer — a wrong year on a live page is fixable in a minute. Blank and
 * whitespace-only are treated as unset, so an empty variable left in a file does not silently
 * un-answer a question that the source had answered.
 *
 * The returned string is handled by `answered()` and `settled()` in `company.ts` exactly as a
 * committed one is, which means `PUBLISH_NOTHING` works here too: setting a variable to
 * `publish nothing` settles the question by removing the sentence.
 */
export function answerFor(
  id: string,
  declared: string,
  env: Record<string, string | undefined> = process.env,
): string {
  const fromEnv = (env[answerKey(id)] ?? "").trim();
  return fromEnv === "" ? declared : fromEnv;
}

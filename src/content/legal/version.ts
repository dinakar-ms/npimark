/**
 * The version of the Terms of Service and Privacy Policy, and whether counsel has approved them.
 *
 * TERMS_VERSION is what the sign-up box refers to. The API records it on every account opened
 * through the form (backend/app/legal.py holds the same string, and a backend test compares the
 * two). Bump both, in the same commit, whenever the substance of either document changes - a date
 * is enough - so a later "the terms changed, accept again" check has something to compare.
 *
 * LEGAL_PAGES_APPROVED is an environment setting on the site, default off. While it is off, both
 * pages carry a "Draft - under legal review" banner and show every [LAWYER] note inline. The owner
 * switches it on (LEGAL_PAGES_APPROVED=true, then a restart) once counsel has signed off the text;
 * from then on the banner and the notes render as nothing. It is read at request time, so the
 * switch needs no rebuild.
 */

export const TERMS_VERSION = "2026-10-26.1";

export function legalPagesApproved(): boolean {
  return (process.env.LEGAL_PAGES_APPROVED ?? "").trim().toLowerCase() === "true";
}

/** Where privacy questions and requests go. Set PRIVACY_EMAIL in the site's env before launch. */
export function privacyEmail(): string | null {
  const value = (process.env.PRIVACY_EMAIL ?? "").trim();
  return value || null;
}

/** Where account and billing questions go (SUPPORT_EMAIL), when set. */
export function supportEmail(): string | null {
  const value = (process.env.SUPPORT_EMAIL ?? "support@npimark.com").trim();
  return value || null;
}

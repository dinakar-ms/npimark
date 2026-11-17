/**
 * The shape of a legal document, kept deliberately plain so counsel's edits drop straight in.
 *
 * A document is a list of sections; a section is a heading and a list of blocks; a block is a
 * paragraph (a string) or a bulleted list (an array of strings). Inside any string:
 *
 *   [LAWYER: ...]     a decision for counsel. Shown as a highlighted note while the pages are a
 *                     draft (LEGAL_PAGES_APPROVED off); rendered as nothing once approved. Delete
 *                     the note when the point is settled.
 *   [link text](/path) a link. Only site paths ("/..."), anchors ("#...") and mailto: are
 *                     honoured; anything else is shown as typed.
 *   {{PRIVACY_EMAIL}} / {{SUPPORT_EMAIL}} / {{TERMS_VERSION}} / {{TARGET_DAYS}}
 *                     filled in at render time from the site's settings.
 *
 * No HTML is ever interpreted: the renderer builds React elements, so a stray "<" in the text is
 * shown as a "<".
 */

export type Block = string | readonly string[];

export type Section = {
  /** The anchor, e.g. "acceptable-use". Stable: other pages and emails may link to it. */
  id: string;
  heading: string;
  blocks: readonly Block[];
  /**
   * Set when counsel has approved this section's wording while the rest of the document is still
   * a draft. It is shown with an "Approved wording" tag so reviewers know not to reopen it.
   */
  approved?: boolean;
};

export type LegalDocument = {
  title: string;
  /** One or two sentences under the title. */
  summary: string;
  sections: readonly Section[];
};

/**
 * The help section: which pages exist, and in what order.
 *
 * The hub, the footer and the sitemap all read this, for the same reason the audience pages have
 * a list of their own - three hand-kept lists is three chances to link to a page that is not
 * there. `blurb` is what the hub and the footer say about a page; it has to describe the question
 * the page answers, because somebody scanning the hub is looking for their question rather than
 * for our heading.
 *
 * Deliberately no numbers anywhere in this section. Plan allowances live on /pricing and limits
 * a key is subject to come back in response headers; a figure restated in help is a figure that
 * goes stale where nobody is looking.
 */

export type HelpPage = {
  /** Path segment under /help. */
  slug: string;
  /** How a link to it reads in a list. */
  label: string;
  /** The question it answers, in one line. */
  blurb: string;
};

export const HELP_PAGES: readonly HelpPage[] = [
  {
    slug: "reveals",
    label: "Reveals",
    blurb:
      "What a reveal is, what it costs, when it is free, and why a refused reveal is never counted.",
  },
  {
    slug: "plans-and-limits",
    label: "Plans and limits",
    blurb:
      "The four things every plan meters, how to see what you have left, and what happens when one runs out.",
  },
  {
    slug: "search-and-filters",
    label: "Search and filters",
    blurb:
      "How the filters combine, and the difference between a classification and a specialization.",
  },
  {
    slug: "email-trust",
    label: "Email trust tiers",
    blurb:
      "What trusted, probable, doubtful and rejected mean, and what an unscored address counts as.",
  },
  {
    slug: "suppression",
    label: "Suppression and removal",
    blurb:
      "How an opt-out is applied everywhere, why nothing is deleted, and how someone gets removed.",
  },
  {
    slug: "api-keys",
    label: "API keys",
    blurb:
      "Scopes, the per-minute pace, the monthly quota, the headers that report both, and where the reference is.",
  },
  {
    slug: "exports-and-append",
    label: "Exports and append",
    blurb:
      "What lands in a file, how rows are counted, how your own file is matched, and how files are marked.",
  },
  {
    slug: "accounts",
    label: "Accounts and sign-in",
    blurb:
      "Seats and invitations, two-step sign-in, signing other sessions out, and who can change billing.",
  },
  {
    slug: "premium-contact-data",
    label: "Home address and cell",
    blurb:
      "The contracted product: how it is matched, what the confidence score means, and where it never appears.",
  },
];

/** The path a help page lives at. */
export function helpPath(slug?: string): string {
  return slug ? `/help/${slug}` : "/help";
}

/** One help page by slug, or null - so a caller can fail loudly rather than link to nothing. */
export function helpPage(slug: string): HelpPage | null {
  return HELP_PAGES.find((page) => page.slug === slug) ?? null;
}

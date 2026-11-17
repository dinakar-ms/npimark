/**
 * Every audience landing page, in one list.
 *
 * The pages themselves are built from `components/AudienceLanding`, one file each, because the
 * copy on them is the point and copy belongs beside the page it is on. What belongs here is the
 * address list: the footer, the home page, the sitemap and `llms.txt` all have to name these
 * pages, and four hand-maintained lists is four chances to publish a link to a page that does
 * not exist - or to ship a page nothing links to, which is the same as not shipping it.
 *
 * `note` is the sentence `llms.txt` publishes for the page and the title attribute a footer
 * link could use; it says what the page covers, not what it is called.
 */

export type AudienceLink = {
  /** Path segment, without a slash: the page lives at `/${slug}`. */
  slug: string;
  /** How a link to it reads in a list of professions. */
  label: string;
  /** One line of what it covers, for machine-readable descriptions. */
  note: string;
};

export const AUDIENCES: readonly AudienceLink[] = [
  {
    slug: "physicians",
    label: "Physicians",
    note: "physician data by specialty, state and employer.",
  },
  {
    slug: "nurses",
    label: "Nurses & NPs",
    note: "nurse practitioner, registered nurse and advanced practice nursing data.",
  },
  {
    slug: "advanced-practice-providers",
    label: "NPs & PAs",
    note: "nurse practitioners and physician assistants together, the prescribers a physician list misses.",
  },
  {
    slug: "dentists",
    label: "Dentists",
    note: "dentists and dental specialists, with the practices they own and work in.",
  },
  {
    slug: "mental-health-providers",
    label: "Mental health",
    note: "psychologists, counselors and clinical social workers, with psychiatrists counted separately as a physician specialty.",
  },
  {
    slug: "pharmacists",
    label: "Pharmacists",
    note: "pharmacists and the pharmacies they dispense from, people and organizations kept apart.",
  },
  {
    slug: "physical-occupational-therapists",
    label: "PT, OT & speech",
    note: "physical therapists, occupational therapists and speech-language pathologists.",
  },
  {
    slug: "optometrists-ophthalmologists",
    label: "Eye care",
    note: "optometrists and ophthalmologists, the two halves of eye care in one search.",
  },
  {
    slug: "chiropractors",
    label: "Chiropractors",
    note: "chiropractors by state, city and practice.",
  },
  {
    slug: "podiatrists",
    label: "Podiatrists",
    note: "podiatrists and foot and ankle surgeons, by state and practice.",
  },
  {
    slug: "healthcare-professionals",
    label: "All professions",
    note: "every profession - dental, pharmacy, therapy, behavioral health - and the organizations behind them.",
  },
];

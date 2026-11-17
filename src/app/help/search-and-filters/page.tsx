import type { Metadata } from "next";
import Link from "next/link";
import { HelpArticle, type HelpArticle as Article } from "@/components/HelpArticle";
import { socialCard } from "@/lib/site";

const ARTICLE: Article = {
  slug: "search-and-filters",
  h1: "How search works, and what a classification is.",
  lede:
    "Filters combine as an and, every one of them has a not, and the single most useful thing to " +
    "understand is the difference between a classification and a specialization — because getting " +
    "that wrong is how a list comes back short.",
  sections: [
    {
      heading: "Classification and specialization",
      body: [
        "A specialty is filed in two levels. The classification is the broad heading — internal " +
          "medicine, dentist, nurse practitioner, psychologist. The specialization is one kind of " +
          "practice beneath it — cardiology and endocrinology sit under internal medicine, " +
          "orthodontics under dentist, family practice under nurse practitioner.",
        "Asking for a classification matches every specialization beneath it. That is almost " +
          "always what somebody means by “all of internal medicine”, and it has a second " +
          "advantage: when a new specialization is added to the reference list, a classification " +
          "filter already includes it, while a hand-ticked list of specializations silently does " +
          "not.",
        "Asking for a specialization returns only that one. Use it when the product or the message " +
          "is genuinely for that practice and nobody else — and expect a much smaller list, which " +
          "is the point.",
        "The trap is the other direction. A word that sounds like a heading is often a " +
          "specialization: endocrinology is not a classification, it is a specialization under " +
          "three different ones. Typing it into the search box works, because free text is matched " +
          "against every level and returns the people who filed it. Typing it into a classification " +
          "filter does not, because nothing is filed under that name as a heading.",
      ],
    },
    {
      heading: "What you can narrow on",
      body: [
        "Filters are combined with an and: every one you add makes the list smaller. Each also has " +
          "an exclusion twin, so you can ask for a state and not a specialty, or a specialty and not " +
          "an employer, without building two lists and subtracting them by hand.",
      ],
      table: {
        head: ["Family", "What it covers"],
        rows: [
          [
            "Who they are",
            "Identifier, first and last name, organization name, individual or organization, active or inactive, and when the identifier was issued. Active only, unless you ask otherwise.",
          ],
          [
            "Where they practice",
            "State, city, ZIP, street, or a radius in miles around a ZIP — which is how to cover a catchment that does not respect a county line.",
          ],
          [
            "What they practice",
            "Classification, specialization, the raw taxonomy code, and the credential letters they filed.",
          ],
          [
            "How reachable they are",
            "Whether a work email exists, the trust tier it has to clear, whether the employer has a website domain.",
          ],
          [
            "Who they work for",
            "Employer, billing group, health system, the certified facilities they are affiliated with, and the record system a practice runs where that is evidenced.",
          ],
          [
            "Standing and programs",
            "Federal program exclusions, opt-out and revocation flags, and the program participation a record carries.",
          ],
          [
            "Facility attributes",
            "Facility type, certified beds, published star ratings, chain and ownership — for the organizations rather than the people.",
          ],
        ],
      },
    },
    {
      heading: "What search will never return",
      body: [
        <>
          A record somebody has asked us to suppress is not in the results, and a suppressed value
          on a record that is otherwise public is withheld rather than blanked. Both are covered on
          the <Link href="/help/suppression">suppression page</Link>.
        </>,
        <>
          A quarantined email address is never counted as an address, whatever the trust filter is
          set to — including when it is set to any. Why an address ends up quarantined is on the{" "}
          <Link href="/help/email-trust">trust tiers page</Link>.
        </>,
        "Contact details are never in a public result. Public pages carry the public record: name, " +
          "identifier, credentials, specialty, practice location and the practice phone as filed.",
      ],
    },
    {
      heading: "Counting before you commit",
      body: [
        <>
          Every filtered search reports a total before you export anything, and the{" "}
          <Link href="/lists">list pages</Link> publish counts per specialty and per state — records,
          how many carry a work email, how many carry a trusted-tier one, how many carry a practice
          phone — without an account. That is the cheapest way to find out whether your segment is
          worth buying, and it is deliberately readable by anyone.
        </>,
      ],
    },
  ],
  faq: [
    {
      q: "What is the difference between a classification and a specialization?",
      a: "A classification is the broad heading a specialty is filed under; a specialization is one kind of practice beneath it. Asking for a classification matches every specialization under it, and keeps doing so when a new one is added to the reference list.",
    },
    {
      q: "Why did my specialty filter return nothing?",
      a: "Usually because the word is a specialization rather than a classification, or the other way round. Endocrinology, for instance, is a specialization under three separate classifications. Typing it into the search box works, because free text is matched against every level.",
    },
    {
      q: "Do filters combine as and or or?",
      a: "As and: each filter you add narrows the result. Where a filter takes several values — several states, several classifications — those values are an or among themselves, which is what you want.",
    },
    {
      q: "Can I exclude something?",
      a: "Yes. Every criterion has an exclusion twin, so you can ask for one thing and not another in a single query rather than building two lists and subtracting.",
    },
    {
      q: "Does a search include inactive providers?",
      a: "No, not unless you ask for them. The default is active records only, which is what almost everybody wants; retired and deactivated identifiers are available when the question is specifically about them.",
    },
    {
      q: "Can I search by distance rather than by state?",
      a: "Yes. Give a ZIP and a radius in miles and the search covers everything inside it, which is how to describe a catchment or a territory that does not follow state or county lines.",
    },
  ],
};

export const metadata: Metadata = {
  title: "How search and the filters work",
  description:
    "How filters combine, what you can narrow on, and the difference between a classification and a specialization that decides whether a list comes back short.",
  alternates: { canonical: "/help/search-and-filters" },
  openGraph: socialCard(
    "/help/search-and-filters",
    "How search and the filters work",
    "How the filters combine, and classification versus specialization explained.",
  ),
};

export default function HelpSearchPage() {
  return <HelpArticle article={ARTICLE} name="How search and the filters work" />;
}

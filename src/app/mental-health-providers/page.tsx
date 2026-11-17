import type { Metadata } from "next";
import { AudienceLanding, type Audience } from "@/components/AudienceLanding";
import { socialCard } from "@/lib/site";

const AUDIENCE: Audience = {
  slug: "mental-health-providers",
  title: "Mental health providers",
  /*
   * Psychologists, counsellors and social workers - the three headings that are behavioural
   * health and nothing else.
   *
   * Psychiatrists are deliberately not here. They are filed as a specialty of a physician
   * heading that also holds every neurologist, so adding that heading would put neurologists
   * into a mental-health count and into a mental-health list. They get a link of their own under
   * "go deeper" instead, which lands on the psychiatrist list rather than on a wrong total.
   */
  classifications: ["Psychologist", "Counselor", "Social Worker"],
  h1: "Mental health provider data, without the guesswork.",
  lede:
    "Psychologists, licensed counselors and clinical social workers, by license type, state and " +
    "practice — the professions that carry most of the country's therapy hours and are hardest to " +
    "reach, because most of them practice alone.",
  deeper: [
    {
      href: "/lists/psychiatrists",
      label: "Psychiatrists",
      note: "Counted on their own, because they are a physician specialty rather than a profession of their own.",
    },
    {
      href: "/lists/psychologists",
      label: "Psychologists",
      note: "National and state counts, refreshed nightly, with the contact coverage behind them.",
    },
    {
      href: "/lists/counselors",
      label: "Counsellors",
      note: "Licensed professional counselors, addiction counselors and the rest of the heading.",
    },
    {
      href: "/lists/social-workers",
      label: "Social workers",
      note: "Clinical and non-clinical social work, counted separately by specialization.",
    },
  ],
  filters: [
    "License type and clinical specialization",
    "State, city, ZIP and radius",
    "Solo practice or group",
    "Employer, clinic and facility",
    "Has verified email",
    "Active or inactive",
  ],
  useCases: [
    {
      title: "Reach clinicians who have no front desk",
      body:
        "Most of this population practices solo or in a two-person office, so there is no group " +
        "switchboard to call and no corporate directory to buy. The record holds the practice " +
        "address and phone each clinician files, which is usually the only published route to them.",
    },
    {
      title: "Sell the right thing to the right license",
      body:
        "A prescribing psychiatrist, a testing psychologist, a counselor billing outpatient " +
        "therapy and a clinical social worker in a hospital buy different software, take different " +
        "training and carry different liability. Each is its own filter rather than one bucket.",
    },
    {
      title: "Build a network directory that holds up",
      body:
        "Behavioral health directories rot faster than any other kind, because solo clinicians " +
        "move offices and change status often. Every field carries the date it was last confirmed, " +
        "and retired identifiers drop out of search instead of sitting there looking current.",
    },
    {
      title: "Cover a territory properly",
      body:
        "Filter by state, city, ZIP or a radius around a point to see who is actually within reach " +
        "of a patient or a referral, then check the count before you commit a campaign to it.",
    },
  ],
  faq: [
    {
      q: "Are psychiatrists included?",
      a: "Psychiatrists are filed as a specialty of a physician heading that also contains every neurologist, so counting that heading here would silently add neurologists to a mental-health number. They are on the physician side of the site and have a list of their own, linked above, and a search can ask for the psychiatry specialty directly.",
    },
    {
      q: "Which counseling and social work licenses are covered?",
      a: "Every one that is filed: professional and clinical counselors, mental health counselors, addiction and substance use counselors, marriage and family therapists, school counselors, clinical social workers and the wider social work headings. Asking for the profession returns all of them; asking for a specialization returns one.",
    },
    {
      q: "Can I tell a clinical social worker from a school or case-management one?",
      a: "Yes, by specialization. The profession heading covers all of them, and the specialization beneath it says which kind of practice was filed — which matters, because only some of them are a buyer for clinical software or continuing education.",
    },
    {
      q: "How good is contact coverage for solo practices?",
      a: "Practice phone and address are on most records because they are part of what a clinician files. Work email coverage is thinner here than in hospital-based professions, and we publish the counts per state on the list pages rather than describing coverage in adjectives.",
    },
    {
      q: "Is there any patient or clinical information in here?",
      a: "None, in any form — not identified, not de-identified, not aggregated. The platform holds who a clinician is, what they practice and where. It holds nothing whatsoever about anyone they have treated.",
    },
    {
      q: "Can I get the same records through the API?",
      a: "Yes, over a versioned REST API with scoped keys, per-minute pacing and a monthly quota. The reference is public, and exports and appends run against the same records.",
    },
  ],
};

export const metadata: Metadata = {
  title: "Mental health provider data",
  description:
    "Psychologists, licensed counselors and clinical social workers by license type, state and practice, with the date each field was last confirmed.",
  alternates: { canonical: "/mental-health-providers" },
  openGraph: socialCard(
    "/mental-health-providers",
    "Mental health provider data",
    "Psychologists, counselors and clinical social workers by license type and state.",
  ),
};

export default function MentalHealthProvidersPage() {
  return <AudienceLanding audience={AUDIENCE} />;
}

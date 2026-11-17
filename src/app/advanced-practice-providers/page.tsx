import type { Metadata } from "next";
import { AudienceLanding, type Audience } from "@/components/AudienceLanding";
import { socialCard } from "@/lib/site";

const AUDIENCE: Audience = {
  slug: "advanced-practice-providers",
  title: "NPs and PAs",
  // Two classifications, kept in this order because the first one is what the hero's search box
  // submits and what the by-state links fall back to when the counts cannot be read.
  classifications: ["Nurse Practitioner", "Physician Assistant"],
  h1: "Nurse practitioners and physician assistants, in one file.",
  lede:
    "The two professions that write a growing share of prescriptions and run a growing share of " +
    "visits — filed under their own headings rather than under medicine, which is why a physician " +
    "list misses them. Searchable by specialty, state, employer and prescribing role.",
  deeper: [
    {
      href: "/lists/nurse-practitioners",
      label: "Nurse practitioners",
      note: "National and state counts, refreshed nightly, with the email and phone coverage behind them.",
    },
    {
      href: "/lists/physician-assistants",
      label: "Physician assistants",
      note: "The same, for the PA side of the file.",
    },
    {
      href: "/nurses",
      label: "The wider nursing file",
      note: "Registered nurses, clinical nurse specialists and the rest of the nursing roles.",
    },
    {
      href: "/physicians",
      label: "Physicians",
      note: "The supervising and collaborating side of the same practice.",
    },
  ],
  filters: [
    "Clinical focus and certification area",
    "State, city, ZIP and radius",
    "Employer, group and clinic",
    "Nurse practitioner or physician assistant",
    "Has verified email",
    "Active or inactive",
  ],
  useCases: [
    {
      title: "Stop missing half the prescribers",
      body:
        "Advanced practice clinicians are filed under nursing and PA headings, not under the " +
        "physician specialties. A target list built from physician specialties alone leaves them " +
        "out entirely, however large the file is.",
    },
    {
      title: "Reach the clinician who runs the visit",
      body:
        "In primary care, urgent care and much of behavioral health the NP or PA is the person " +
        "seeing the patient and choosing the product. Filtering by clinical focus and employer " +
        "puts you in front of them rather than their collaborating physician.",
    },
    {
      title: "Find the clinic, then everyone in it",
      body:
        "NPs and PAs are reconciled to the organizations they bill under, so a retail clinic, a " +
        "hospital group or a telehealth employer can be described by its whole clinical staff " +
        "rather than by whoever happens to be titled a physician.",
    },
    {
      title: "Recruit where the roles actually are",
      body:
        "Scope of practice differs by state, and so does where these clinicians work. Filter by " +
        "role, state and employer to see who is practicing where before you spend on a campaign " +
        "or open a requisition.",
    },
  ],
  faq: [
    {
      q: "Why put nurse practitioners and physician assistants on one page?",
      a: "Because buyers treat them as one audience: both practice at an advanced level, both are reached through the same clinics, and both are routinely left out of physician lists for the same reason. The records stay separate, and a search can ask for one profession or both.",
    },
    {
      q: "Can I filter to prescribers only?",
      a: "Yes. Both professions can be identified by their filed heading, so a list can be narrowed to advanced practice roles rather than to every clinician at a site.",
    },
    {
      q: "Do you show certification area or clinical focus?",
      a: "Yes, where it is filed: family, adult and gerontology, acute care, psychiatric and mental health, pediatrics, women's health and the rest. Asking for the profession returns every focus beneath it; asking for one focus returns only that.",
    },
    {
      q: "Do you know who supervises or collaborates with them?",
      a: "We hold the organization and group each clinician bills under, and the physicians filed under the same organizations. That is an employment and billing relationship as filed, not a claim about who signs off which chart.",
    },
    {
      q: "What contact data is available?",
      a: "Practice phone and address from the record, and a work email with a trust tier on paid plans. Home address and personal mobile are a separate contracted product, matched to the named clinician, and never included in an export or a list.",
    },
    {
      q: "How current is it?",
      a: "Identity, role and location refresh weekly; employers and standing monthly; contact data is verified continuously. Every field carries the date it was last confirmed.",
    },
  ],
};

export const metadata: Metadata = {
  title: "Nurse practitioner and PA data",
  description:
    "Nurse practitioners and physician assistants by clinical focus, state and employer: the prescribers a physician list leaves out, each field dated.",
  alternates: { canonical: "/advanced-practice-providers" },
  openGraph: socialCard(
    "/advanced-practice-providers",
    "Nurse practitioner and PA data",
    "The advanced practice clinicians a physician list leaves out, by focus and state.",
  ),
};

export default function AdvancedPracticeProvidersPage() {
  return <AudienceLanding audience={AUDIENCE} />;
}

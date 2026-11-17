import type { Metadata } from "next";
import { AudienceLanding, type Audience } from "@/components/AudienceLanding";
import { socialCard } from "@/lib/site";


const AUDIENCE: Audience = {
  slug: "nurses",
  title: "Nurses",
  h1: "Nurse and nurse practitioner data, by license and location.",
  lede:
    "Nurse practitioners, registered nurses and the advanced practice roles that prescribe, " +
    "searchable by specialty, state and employer — with the date each field was last confirmed.",
  // Nursing roles only, spelled as the reference list spells them. Counselors, social workers
  // and dietitians used to sit here; they are not nurses, and they have their own page.
  classifications: [
    "Nurse Practitioner",
    "Registered Nurse",
    "Licensed Practical Nurse",
    "Licensed Vocational Nurse",
    "Nurse Anesthetist, Certified Registered",
    "Clinical Nurse Specialist",
    "Advanced Practice Midwife",
  ],
  deeper: [
    {
      href: "/leadership",
      label: "Healthcare leadership",
      note: "How many lead nursing at hospitals and care facilities, by state.",
    },
    {
      href: "/leadership/directors-of-nursing",
      label: "Directors of nursing",
      note: "The people who run nursing in long-term care, counted by state.",
    },
    {
      href: "/nursing-homes",
      label: "Nursing homes",
      note: "Every certified facility with beds, ownership and ratings.",
    },
    {
      href: "/lists",
      label: "All lists",
      note: "Every profession and specialty, with counts you can see before you sign up.",
    },
  ],
  filters: [
    "Role and specialty",
    "State, city, ZIP and radius",
    "Employer and practice",
    "Prescribing authority",
    "Has verified email",
    "Active or inactive",
  ],
  useCases: [
    {
      title: "Reach prescribers, not just physicians",
      body:
        "Nurse practitioners and physician assistants write a large and growing share of " +
        "prescriptions. Targeting physicians alone misses them, and they are filed under their " +
        "own taxonomies rather than under medicine.",
    },
    {
      title: "Recruit where the licenses are",
      body:
        "Filter by role, state and employer to find who is practicing where — useful when the " +
        "question is staffing rather than selling.",
    },
    {
      title: "Build a clinic-level picture",
      body:
        "Nurses are reconciled to the practices and organizations they work for, so a clinic can " +
        "be described by its whole staff rather than by its physicians alone.",
    },
    {
      title: "Keep an existing roster current",
      body:
        "Upload the roster you have. Get back your own columns, in your own order, with current " +
        "location, employer and contact fields appended. Anything suppressed is left out of the " +
        "file and counted in the result, so the gap is a number you can see.",
    },
  ],
  faq: [
    {
      q: "Which nursing roles are included?",
      a: "Nurse practitioners, registered nurses, licensed practical and vocational nurses, clinical nurse specialists, certified registered nurse anesthetists and nurse midwives. Physician assistants and the allied professions have their own pages.",
    },
    {
      q: "Can I filter to prescribers only?",
      a: "Yes. Prescribing roles are identifiable by their taxonomy, so a list can be narrowed to the advanced practice roles that write prescriptions.",
    },
    {
      q: "How current is it?",
      a: "Identity, role and location are refreshed weekly; employers and standing monthly; contact data is verified continuously. Every record shows when it was last confirmed.",
    },
    {
      q: "Do you have work email for nurses?",
      a: "Coverage is lower than for physicians and we say so rather than padding it. Every address carries a trust tier, and a campaign can require verified-only.",
    },
    {
      q: "Can I export or use an API?",
      a: "Both, on a paid plan. Exports run against your monthly row quota; the API is versioned, scoped by key and metered per organization.",
    },
  ],
};

export const metadata: Metadata = {
  title: "Nurse and NP data",
  // Its own sentence rather than the page's lede, which runs past what a result snippet shows.
  description:
    "Nurse practitioners, registered nurses and the advanced practice roles that prescribe, by specialty, state and employer, with every field dated.",
  alternates: { canonical: "/nurses" },
  openGraph: socialCard(
    "/nurses",
    "Nurse and NP data",
    "Nurse practitioners, registered nurses and the roles that prescribe, by state.",
  ),
};

export default function NursesPage() {
  return <AudienceLanding audience={AUDIENCE} />;
}

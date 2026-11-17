import type { Metadata } from "next";
import { AudienceLanding, type Audience } from "@/components/AudienceLanding";
import { socialCard } from "@/lib/site";


const AUDIENCE: Audience = {
  slug: "healthcare-professionals",
  title: "Healthcare professionals",
  h1: "HCP data across every profession, in one place.",
  lede:
    "Physicians, nurses, dentists, pharmacists, therapists, behavioral health and the " +
    "organizations they practice under — one record per professional, filterable by profession, " +
    "specialty, location and employer.",
  classifications: [
    "Dentist",
    "Pharmacist",
    "Physical Therapist",
    "Psychologist",
    "Optometrist",
    "Chiropractor",
    "Occupational Therapist",
    "Speech-Language Pathologist",
    "Podiatrist",
  ],
  deeper: [
    {
      href: "/lists",
      label: "All lists",
      note: "Every profession and specialty, with counts you can see before you sign up.",
    },
    {
      href: "/leadership",
      label: "Who runs healthcare organizations",
      note: "Executives, administrators and owners, counted by role and state.",
    },
    {
      href: "/hospitals",
      label: "Facilities",
      note: "Hospitals, nursing homes, hospices, home health and dialysis, by state and town.",
    },
    {
      href: "/directory",
      label: "Browse A to Z",
      note: "Providers and organizations by name.",
    },
  ],
  filters: [
    "Profession and specialty",
    "Individual or organization",
    "State, city, ZIP and radius",
    "Employer, group and facility",
    "Has verified email",
    "Program standing",
  ],
  useCases: [
    {
      title: "Sell to a whole profession",
      body:
        "Dental, pharmacy, vision, behavioral health and rehab each have their own taxonomies " +
        "and their own buying centers. Each is addressable on its own terms rather than as a " +
        "slice of a physician file.",
    },
    {
      title: "Reach the organization, not only the person",
      body:
        "Practices, clinics, pharmacies, laboratories and facilities carry their own records, " +
        "with the professionals who practice under them linked to them.",
    },
    {
      title: "Mix professions in one list",
      body:
        "A campaign aimed at a clinic usually needs the physician, the nurse practitioner and the " +
        "practice manager. One search, one export, one set of suppression rules.",
    },
    {
      title: "Keep it lawful and provable",
      body:
        "A suppressed value is left out of your file and counted in the result, and every " +
        "export is logged with its row count — so what you sent can be explained later.",
    },
  ],
  faq: [
    {
      q: "What counts as an HCP here?",
      a: "Anyone enumerated as a healthcare provider: physicians, nurses, dentists, pharmacists, therapists, counselors, technicians and the organizations they practice under.",
    },
    {
      q: "Can I search organizations as well as people?",
      a: "Yes. Individuals and organizations are both first-class records, and a search can be restricted to either.",
    },
    {
      q: "How is the data kept current?",
      a: "Identity, profession and location refresh weekly; employers, facilities and standing monthly; contact data is verified continuously. Each field shows when it was last confirmed.",
    },
    {
      q: "What contact data is available?",
      a: "Practice phone and address on every plan that includes contact fields; work email on paid plans, shown with its trust tier and the date it was last checked; home address and personal mobile only under a contract with a stated permissible use.",
    },
    {
      q: "Can I try it before paying?",
      a: "Yes. Search is open without an account, and an account on a paid plan adds work email reveals, API access and export allowances.",
    },
  ],
};

export const metadata: Metadata = {
  title: "HCP data",
  // Its own sentence rather than the page's lede, which runs past what a result snippet shows.
  description:
    "Physicians, nurses, dentists, pharmacists, therapists and behavioral health: one record per professional, filterable by profession, specialty and location.",
  alternates: { canonical: "/healthcare-professionals" },
  openGraph: socialCard(
    "/healthcare-professionals",
    "HCP data",
    "One record per healthcare professional, across every profession, filterable.",
  ),
};

export default function HcpPage() {
  return <AudienceLanding audience={AUDIENCE} />;
}

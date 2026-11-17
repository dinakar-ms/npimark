import type { Metadata } from "next";
import { AudienceLanding, type Audience } from "@/components/AudienceLanding";
import { socialCard } from "@/lib/site";


const AUDIENCE: Audience = {
  slug: "physicians",
  title: "Physicians",
  h1: "Physician data, current to the week.",
  lede:
    "Every practicing physician in the United States, by specialty, city and employer — with the " +
    "date each field was last confirmed, so you know how current a record is before you act on it.",
  classifications: [
    "Internal Medicine",
    "Family Medicine",
    "Psychiatry & Neurology",
    "Surgery",
    "Obstetrics & Gynecology",
    "Pediatrics",
    "Radiology",
    "Anesthesiology",
  ],
  deeper: [
    {
      href: "/leadership",
      label: "Healthcare leadership",
      note: "How many lead medicine at hospitals and health systems, by state.",
    },
    {
      href: "/leadership/medical-directors",
      label: "Medical directors",
      note: "Counted across hospitals, nursing homes, hospices and home health.",
    },
    {
      href: "/hospitals",
      label: "Hospitals",
      note: "Every certified hospital, with beds, ownership and the physicians who bill there.",
    },
    {
      href: "/directory/providers",
      label: "Browse A to Z",
      note: "Every provider by name, one letter at a time.",
    },
  ],
  filters: [
    "Specialty and sub-specialty",
    "State, city, ZIP and radius",
    "Employer and group",
    "Individual or organization",
    "Has verified email",
    "Active or inactive",
  ],
  useCases: [
    {
      title: "Target a specialty properly",
      body:
        "A specialty name matches every taxonomy beneath it, so asking for endocrinologists finds " +
        "the ones filed under internal medicine too — the single most common way a physician " +
        "list comes back short.",
    },
    {
      title: "Reach the right person",
      body:
        "Every work email carries a trust tier, so a campaign can require verified-only and " +
        "prove afterwards that it did. Practice phone comes from the record, not a guess.",
    },
    {
      title: "Know who they work for",
      body:
        "Group affiliations and employers are reconciled onto the physician, so you can target a " +
        "health system, a practice, or every physician who moved out of one.",
    },
    {
      title: "Check standing before you spend",
      body:
        "Program exclusions, opt-outs and revocations are on the record. A provider who has " +
        "asked to be left alone is not in the search your file came from, and a suppressed " +
        "value is left out of the file and counted in the result rather than quietly missing.",
    },
  ],
  faq: [
    {
      q: "How many physicians are covered?",
      a: "Every physician with a current NPI, across all specialties and every state and territory — individuals and the organizations they practice under.",
    },
    {
      q: "How current is it?",
      a: "Identity, specialty and location are refreshed weekly; affiliations and standing monthly; contact data is verified continuously. Each record shows the date it was last confirmed.",
    },
    {
      q: "Can I get email addresses?",
      a: "Yes, on a paid plan. Work email is scored and tiered, and quarantined addresses are never shipped as verified. Home address and personal mobile need a contract and a stated permissible use.",
    },
    {
      q: "Can I append to a list I already have?",
      a: "Yes. Upload a file of NPIs, choose the fields you want, and get your own columns back in your own row order with the requested fields added.",
    },
    {
      q: "Is there an API?",
      a: "Yes — the same records over a versioned REST API with scoped keys, per-minute pacing and monthly quotas. The reference is public.",
    },
  ],
};

export const metadata: Metadata = {
  title: "Physician data",
  // Its own sentence rather than the page's lede, which runs past what a result snippet shows.
  description:
    "Every practicing US physician by specialty, city and employer, with the date each field was last confirmed. Search free; sign in for contact details.",
  alternates: { canonical: "/physicians" },
  openGraph: socialCard(
    "/physicians",
    "Physician data",
    "Every practicing US physician by specialty, city and employer, each field dated.",
  ),
};

export default function PhysiciansPage() {
  return <AudienceLanding audience={AUDIENCE} />;
}

import type { Metadata } from "next";
import { AudienceLanding, type Audience } from "@/components/AudienceLanding";
import { socialCard } from "@/lib/site";

const AUDIENCE: Audience = {
  slug: "optometrists-ophthalmologists",
  title: "Eye care providers",
  // Optometrists are a profession of their own; ophthalmology is a physician heading. Optometrist
  // leads because the metro directory publishes that name and the by-state fallback links use the
  // first entry.
  classifications: ["Optometrist", "Ophthalmology"],
  h1: "Optometrists and ophthalmologists, counted separately.",
  lede:
    "The two halves of eye care in one search and never in one undifferentiated total: " +
    "optometrists in practices and retail settings, ophthalmologists with their surgical and " +
    "medical subspecialties, by state, city and employer.",
  deeper: [
    {
      href: "/lists/optometrists",
      label: "Optometrists",
      note: "National and state counts, refreshed nightly, with the contact coverage behind them.",
    },
    {
      href: "/lists/ophthalmologists",
      label: "Ophthalmologists",
      note: "The physician side, counted on its own rather than folded into the optometrist total.",
    },
    {
      href: "/physicians",
      label: "Physicians",
      note: "Every other physician specialty, including the surgeons an eye practice refers to.",
    },
    {
      href: "/directory/organizations",
      label: "Eye care practices A to Z",
      note: "Practices and groups by name, each with the clinicians filed under it.",
    },
  ],
  filters: [
    "Optometry or ophthalmology",
    "Subspecialty, including surgical",
    "State, city, ZIP and radius",
    "Practice, group and health system",
    "Has verified email",
    "Active or retired",
  ],
  useCases: [
    {
      title: "Sell to the setting, not the label",
      body:
        "Frames, lenses and chair-side diagnostics go to optometry; lasers, intraocular lenses and " +
        "theatre consumables go to ophthalmology. The two professions are filed under different " +
        "headings, so a list can be one, the other, or both with the split visible.",
    },
    {
      title: "Find the subspecialty that performs the procedure",
      body:
        "Retina, cornea, glaucoma, pediatric ophthalmology and oculoplastics are filed as distinct " +
        "specializations. Asking for ophthalmology returns all of them; asking for one returns only " +
        "the surgeons who do that work.",
    },
    {
      title: "Map the groups consolidating the market",
      body:
        "Eye care is being bought up practice by practice, and acquired sites keep filing under " +
        "their own identifiers. Affiliations are reconciled onto each clinician, so a group's whole " +
        "footprint shows up as one account rather than forty.",
    },
    {
      title: "Cover a catchment before you commit",
      body:
        "Filter by ZIP or a radius to see how many optometrists and ophthalmologists sit inside a " +
        "catchment, and check the published counts for the state before a campaign is budgeted.",
    },
  ],
  faq: [
    {
      q: "Are optometrists and ophthalmologists counted together?",
      a: "Never in the same figure without saying so. Optometry is its own profession and ophthalmology is a physician specialty; they are filed under different headings and counted under different headings. On this page each has its own count and its own list.",
    },
    {
      q: "Are opticians included?",
      a: "Dispensing opticians and ophthalmic technicians are separate professions and are not part of either count here. If the person fitting the frames is who you need, ask for those headings rather than the optometrist one.",
    },
    {
      q: "Can I filter to surgeons only?",
      a: "You can filter to ophthalmology and to its surgical subspecialties, which is the closest honest answer: what is filed is a specialty, not a procedure log. Where you need procedure-level detail, that is a different question from who a clinician is.",
    },
    {
      q: "Do you have the practice as well as the clinician?",
      a: "Yes. Eye care practices and surgery centers file as organizations with their own identifiers, locations and owners, and the clinicians who bill under them are linked to them.",
    },
    {
      q: "What contact data is available?",
      a: "Practice phone and address from the record, and a work email with a trust tier on paid plans. Home address and personal mobile are contract-only, matched to the named provider, and never included in an export or a list.",
    },
    {
      q: "How current is it?",
      a: "Identity, specialty and location refresh weekly; affiliations, ownership and standing monthly; contact data is verified continuously. Each field shows the date it was last confirmed.",
    },
  ],
};

export const metadata: Metadata = {
  title: "Optometrist and ophthalmologist data",
  description:
    "Optometrists and ophthalmologists by subspecialty, practice and state, counted separately rather than merged into one eye care total.",
  alternates: { canonical: "/optometrists-ophthalmologists" },
  openGraph: socialCard(
    "/optometrists-ophthalmologists",
    "Optometrist and ophthalmologist data",
    "Both halves of eye care by subspecialty and state, counted separately.",
  ),
};

export default function EyeCarePage() {
  return <AudienceLanding audience={AUDIENCE} />;
}

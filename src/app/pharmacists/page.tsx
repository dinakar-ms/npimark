import type { Metadata } from "next";
import { AudienceLanding, type Audience } from "@/components/AudienceLanding";
import { socialCard } from "@/lib/site";

const AUDIENCE: Audience = {
  slug: "pharmacists",
  // "Pharmacist" is the person and "Pharmacy" the organization: two headings, kept in that order
  // so the hero's search box and the by-state fallback links use the pharmacist one.
  classifications: ["Pharmacist", "Pharmacy"],
  title: "Pharmacists and pharmacies",
  h1: "Pharmacists and the pharmacies they dispense from.",
  lede:
    "Community, hospital, compounding, specialty, long-term care and mail-order pharmacy — the " +
    "pharmacists as people and the pharmacies as organizations, kept as separate records so a " +
    "list of one is never quietly a list of the other.",
  deeper: [
    {
      href: "/lists/pharmacists",
      label: "The pharmacist list",
      note: "National and state counts, refreshed nightly, with the contact coverage behind them.",
    },
    {
      href: "/lists/pharmacies",
      label: "The pharmacy list",
      note: "Pharmacies as organizations, counted by state and by the kind of dispensing they file.",
    },
    {
      href: "/hospitals",
      label: "Hospitals",
      note: "Where hospital and infusion pharmacy sits: beds, ownership and the clinicians who bill there.",
    },
    {
      href: "/nursing-homes",
      label: "Nursing homes",
      note: "The long-term care sites a consultant pharmacist and a closed-door pharmacy serve.",
    },
  ],
  filters: [
    "Kind of pharmacy practice",
    "Person or organization",
    "State, city, ZIP and radius",
    "Chain, owner and health system",
    "Has verified email",
    "Active or closed",
  ],
  useCases: [
    {
      title: "Separate the pharmacist from the pharmacy",
      body:
        "A clinical product is sold to a pharmacist; dispensing equipment, software and inventory " +
        "are sold to the pharmacy. Both are first-class records here, linked to each other, so you " +
        "can build either list without having to guess which one you got.",
    },
    {
      title: "Find the kind of dispensing you serve",
      body:
        "Specialty, compounding, nuclear, long-term care, home infusion and mail order are filed " +
        "distinctly. That is the difference between a list of everybody who fills prescriptions and " +
        "a list of the handful of sites that could actually use what you sell.",
    },
    {
      title: "Get to the chain behind the counter",
      body:
        "Independent sites, regional chains and health-system pharmacies buy in completely " +
        "different ways. Organization records carry the owner and the system a site reports under, " +
        "so one query gives you a whole estate or only the independents.",
    },
    {
      title: "Reach the clinical pharmacist inside a hospital",
      body:
        "Hospital and infusion pharmacists are tied to the organizations and facilities they " +
        "practice at, so you can target them by facility type, bed count or health system instead " +
        "of by a retail address that is not where they work.",
    },
  ],
  faq: [
    {
      q: "Do I get pharmacists, pharmacies, or both?",
      a: "Both, as separate records that are linked. A pharmacist is a person; a pharmacy is an organization with its own identifier, locations and owner. A search can ask for either, or return both in one list — and a count always says which of the two it is counting.",
    },
    {
      q: "Can I filter to specialty or compounding pharmacies?",
      a: "Yes. The kind of pharmacy practice is filed as a specialization beneath the pharmacy heading — specialty, compounding, nuclear, long-term care, home infusion, mail order and the rest — so a list can be narrowed to one of them.",
    },
    {
      q: "Are pharmacy technicians included?",
      a: "They are a separate profession with their own filed records, and they are not counted in a pharmacist total on this page. If you need them, ask for the technician heading rather than the pharmacist one.",
    },
    {
      q: "Do you know which system a pharmacy runs?",
      a: "Sometimes, and only where there is public evidence for it. Where a practice publishes a secure-messaging address whose host belongs to one vendor, that vendor is recorded; where it publishes nothing, or publishes through a shared router, the field is left blank rather than guessed at.",
    },
    {
      q: "How current is it?",
      a: "Identity, practice kind and location refresh weekly; owners, chains and standing monthly; contact data is verified continuously. Closed sites drop out of search rather than sitting in a list looking open.",
    },
    {
      q: "Can I match this against my own account list?",
      a: "Yes. Upload your identifiers and the current location, owner, affiliation and contact fields come back against your own rows, in your own order. Anything suppressed is left out of the file and counted in the result, so the gap is a number you can see rather than a silent one.",
    },
  ],
};

export const metadata: Metadata = {
  title: "Pharmacist and pharmacy data",
  description:
    "Pharmacists and pharmacies as separate linked records: retail, hospital, specialty, compounding and long-term care, by state, chain and owner.",
  alternates: { canonical: "/pharmacists" },
  openGraph: socialCard(
    "/pharmacists",
    "Pharmacist and pharmacy data",
    "Pharmacists and pharmacies as separate linked records, by kind, state and owner.",
  ),
};

export default function PharmacistsPage() {
  return <AudienceLanding audience={AUDIENCE} />;
}

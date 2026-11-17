import type { Metadata } from "next";
import { AudienceLanding, type Audience } from "@/components/AudienceLanding";
import { socialCard } from "@/lib/site";

const AUDIENCE: Audience = {
  slug: "dentists",
  title: "Dentists",
  // "Dentist" is one classification with every dental specialty filed beneath it, so the
  // specialty panel fills itself from the catalogue: general dentists, orthodontists, oral
  // surgeons, endodontists and the rest arrive as specialisation rows under this one name.
  classifications: ["Dentist"],
  h1: "Dentist data, practice by practice.",
  lede:
    "General dentists, orthodontists, oral surgeons, endodontists, periodontists and the rest of " +
    "the chairside specialties — by city, by practice and by the organization that owns it, with " +
    "the date every field was last confirmed.",
  deeper: [
    {
      href: "/lists/dentists",
      label: "The dentist list",
      note: "National and state counts, refreshed nightly, with the email and phone coverage behind them.",
    },
    {
      href: "/lists/orthodontists",
      label: "Orthodontists",
      note: "One dental specialty on its own, counted before you buy anything.",
    },
    {
      href: "/directory/organizations",
      label: "Dental practices A to Z",
      note: "Group practices and dental organizations by name, each with the clinicians filed under it.",
    },
    {
      href: "/healthcare-professionals",
      label: "Every other profession",
      note: "Hygienists, assistants and the rest of the clinic, in one place.",
    },
  ],
  filters: [
    "Dental specialty",
    "State, city, ZIP and radius",
    "Practice or group owner",
    "Solo dentist or organization",
    "Has verified email",
    "Active or retired",
  ],
  useCases: [
    {
      title: "Sell to the owner, not the associate",
      body:
        "A dental practice buys as an organization. Dentists are reconciled to the practices they " +
        "bill under, so you can separate the owner-dentist who signs for a chair from the three " +
        "associates who work in it.",
    },
    {
      title: "Find the specialty that uses the product",
      body:
        "Aligners go to orthodontists, implants to oral surgeons and periodontists, files to " +
        "endodontists. Asking for dentists returns all of them; asking for one specialty returns " +
        "only the chairs where the product is used.",
    },
    {
      title: "Map a group before you pitch it",
      body:
        "Dental groups grow by buying practices, and the acquired sites keep filing under their " +
        "own identifiers. Affiliations are reconciled onto each dentist, so one query shows the " +
        "whole estate rather than one town of it.",
    },
    {
      title: "Reach the chair without dialing the front desk",
      body:
        "Practice phone comes straight from the record. Work email carries a trust tier, so a " +
        "campaign can insist on verified-only addresses and show afterwards that it did.",
    },
  ],
  faq: [
    {
      q: "Which dental professions are included?",
      a: "Every dentist with a current identifier, general and specialist: orthodontics, oral and maxillofacial surgery, endodontics, periodontics, prosthodontics, pediatric dentistry, oral pathology and the rest. Hygienists, assistants and dental laboratories are separate professions with their own records.",
    },
    {
      q: "Can I tell a practice owner from an associate?",
      a: "You can see which organization each dentist bills under and which organizations file as dental practices, including the group behind a chain of sites. Ownership as such is only stated where an organization files it about itself; we do not infer who owns a practice from a shared address.",
    },
    {
      q: "Do you have the practice, or only the dentist?",
      a: "Both, as separate records. A dental practice is an organization with its own identifier, its own locations and the clinicians filed under it; a dentist is a person. A search can ask for either, or for both in one list.",
    },
    {
      q: "How current is it?",
      a: "Identity, specialty and practice location are refreshed weekly, affiliations and standing monthly, and contact data is verified continuously. Each field carries the date it was last confirmed, so you can see what is fresh before you act on it.",
    },
    {
      q: "Can I append to a list of practices I already have?",
      a: "Yes. Upload your file, choose the fields you want, and your own columns come back in your own row order with the current specialty, location, affiliation and contact fields added. Anything suppressed is left out of the file and counted in the result, so the gap is a number you can see rather than a silent one.",
    },
    {
      q: "Is dental email coverage as good as physician email?",
      a: "No, and we would rather say so than pad it. Small practices publish less and change addresses more often. Every address carries its trust tier and the counts are published per state on the list pages, so you can check coverage for your own territory before buying.",
    },
  ],
};

export const metadata: Metadata = {
  title: "Dentist and dental practice data",
  description:
    "Every US dentist by dental specialty, city and practice, with the dental groups behind them and the date each field was last confirmed.",
  alternates: { canonical: "/dentists" },
  openGraph: socialCard(
    "/dentists",
    "Dentist and dental practice data",
    "Dentists by specialty, city and practice, with the groups that own the chairs.",
  ),
};

export default function DentistsPage() {
  return <AudienceLanding audience={AUDIENCE} />;
}

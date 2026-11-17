import type { Metadata } from "next";
import { AudienceLanding, type Audience } from "@/components/AudienceLanding";
import { socialCard } from "@/lib/site";

const AUDIENCE: Audience = {
  slug: "chiropractors",
  title: "Chiropractors",
  // One heading, with its filed specialisations - sports, orthopaedic, neurology, radiology,
  // rehabilitation - arriving from the catalogue beneath it.
  classifications: ["Chiropractor"],
  h1: "Chiropractor data, clinic by clinic.",
  lede:
    "Every practicing chiropractor in the country, with the clinic each one files, the " +
    "specialization they practice and the state they are licensed in — a profession of small " +
    "owner-operated businesses, which is exactly why a current address matters.",
  deeper: [
    {
      href: "/lists/chiropractors",
      label: "The chiropractor list",
      note: "National and state counts, refreshed nightly, with the email and phone coverage behind them.",
    },
    {
      href: "/physical-occupational-therapists",
      label: "Physical therapists",
      note: "The profession chiropractors most often share a building and a referral with.",
    },
    {
      href: "/podiatrists",
      label: "Podiatrists",
      note: "Another owner-operated clinical profession, counted the same way.",
    },
    {
      href: "/directory/providers",
      label: "Browse A to Z",
      note: "Every provider by name, one letter at a time.",
    },
  ],
  filters: [
    "Chiropractic specialization",
    "State, city, ZIP and radius",
    "Clinic and practice owner",
    "Solo practitioner or organization",
    "Has verified email",
    "Active or inactive",
  ],
  useCases: [
    {
      title: "Sell to an owner who is also the clinician",
      body:
        "In most of this profession the person adjusting patients is the person who signs for the " +
        "table, the software and the lease. One record is both the clinical and the commercial " +
        "decision maker, which makes the list unusually efficient to work.",
    },
    {
      title: "Reach a clinic that has moved",
      body:
        "Small practices relocate, rebrand and split more often than institutions do. Practice " +
        "address and phone are refreshed weekly and each carries the date it was confirmed, and a " +
        "move between cities is available as a dated change event rather than a silent overwrite.",
    },
    {
      title: "Target a specialization",
      body:
        "Sports, orthopedic, rehabilitation, neurology and chiropractic radiology are filed " +
        "distinctly. That is the difference between everybody in the profession and the subset who " +
        "buy imaging, rehab equipment or a particular certification.",
    },
    {
      title: "Build a territory list you can check",
      body:
        "Filter by state, city, ZIP or a radius and see the count before you buy anything. The same " +
        "counts are published per state, so a territory can be sized without an account.",
    },
  ],
  faq: [
    {
      q: "How many chiropractors are covered?",
      a: "Every chiropractor holding a current identifier, in every state and territory, along with the clinics that file as organizations. The count is published on the list page and refreshed nightly, so you can read it rather than take our word for it.",
    },
    {
      q: "Can I tell a clinic from a practitioner?",
      a: "Yes. A clinic that files as an organization has its own record, its own locations and the clinicians who bill under it; a chiropractor is a person. A search can ask for either or both, and a count always says which it is counting.",
    },
    {
      q: "Do you have specializations?",
      a: "Where they are filed: sports, orthopedic, rehabilitation, neurology, nutrition, occupational health and chiropractic radiology among them. Asking for the profession returns every specialization beneath it.",
    },
    {
      q: "What contact details can I get?",
      a: "Practice phone and address are on the record. Work email is available on paid plans and carries a trust tier, so a campaign can require verified-only addresses. Home address and personal mobile are a separate contracted product, revealed one provider at a time and never included in an export or a list.",
    },
    {
      q: "Do you flag anyone who should not be contacted?",
      a: "Suppression requests apply to every search, count, page and file. On a page a suppressed value says it was withheld rather than going blank; in a file it is left out and counted in the job result, so the gap is a number you can see. Program exclusions and opt-out flags are on the record too, dated, so you can see standing before you spend.",
    },
    {
      q: "Can I append to a list I already have?",
      a: "Yes. Upload your own file, pick the fields, and your columns come back in your row order with current location, specialization and contact fields added.",
    },
  ],
};

export const metadata: Metadata = {
  title: "Chiropractor data by state and clinic",
  description:
    "Every practicing US chiropractor by specialization, state and clinic, with the date each field was last confirmed and dated practice moves.",
  alternates: { canonical: "/chiropractors" },
  openGraph: socialCard(
    "/chiropractors",
    "Chiropractor data by state and clinic",
    "Chiropractors by specialization, state and clinic, with every field dated.",
  ),
};

export default function ChiropractorsPage() {
  return <AudienceLanding audience={AUDIENCE} />;
}

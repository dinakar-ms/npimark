import type { Metadata } from "next";
import { AudienceLanding, type Audience } from "@/components/AudienceLanding";
import { socialCard } from "@/lib/site";

const AUDIENCE: Audience = {
  slug: "podiatrists",
  title: "Podiatrists",
  // One heading; foot and ankle surgery, sports medicine and diabetic foot care arrive as
  // specialisations beneath it from the catalogue.
  classifications: ["Podiatrist"],
  h1: "Podiatrist data, including the surgical side.",
  lede:
    "Podiatrists in private practice, hospital clinics and wound care — foot and ankle surgery, " +
    "sports medicine, diabetic limb salvage — with the practices they work in, the facilities they " +
    "operate at and the date every field was last confirmed.",
  deeper: [
    {
      href: "/lists/podiatrists",
      label: "The podiatrist list",
      note: "National and state counts, refreshed nightly, with the contact coverage behind them.",
    },
    {
      href: "/hospitals",
      label: "Hospitals",
      note: "Where the surgical and wound care work happens: beds, ownership and linked clinicians.",
    },
    {
      href: "/physical-occupational-therapists",
      label: "Therapists",
      note: "The rehabilitation half of the same patient journey.",
    },
    {
      href: "/physicians",
      label: "Physicians",
      note: "Endocrinology, vascular surgery and the other specialties a diabetic foot referral crosses.",
    },
  ],
  filters: [
    "Podiatric specialization",
    "State, city, ZIP and radius",
    "Practice, group and hospital affiliation",
    "Individual or organization",
    "Has verified email",
    "Active or inactive",
  ],
  useCases: [
    {
      title: "Sell to a surgeon and a shop-front at once",
      body:
        "This profession spans both: an operating theatre list and a high-street practice buying " +
        "orthotics, imaging and wound care supplies. Specialization and facility affiliation tell " +
        "you which of the two you are looking at before you write the email.",
    },
    {
      title: "Follow the diabetic foot pathway",
      body:
        "Limb salvage involves podiatry, endocrinology, vascular surgery and wound care in the same " +
        "few buildings. Every one of those clinicians is on the same platform and tied to the same " +
        "organizations, so a pathway can be targeted as a pathway.",
    },
    {
      title: "Reach the hospital-affiliated subset",
      body:
        "Affiliations are reconciled onto the podiatrist, so you can separate the ones operating " +
        "at certified facilities from the ones running an office practice — a different sale, a " +
        "different budget and often a different buyer entirely.",
    },
    {
      title: "Keep a small, specific list accurate",
      body:
        "A profession this size rewards precision over volume. Upload the list you have and get " +
        "your own rows back with the current practice address, affiliation and contact fields. " +
        "Anything suppressed is left out and counted in the result, so the gap is a number.",
    },
  ],
  faq: [
    {
      q: "Are foot and ankle surgeons included?",
      a: "Yes. Surgical podiatry is filed as a specialization beneath the podiatry heading, alongside sports medicine, diabetic foot care and primary podiatric medicine. Asking for the profession returns all of them; asking for one returns only that.",
    },
    {
      q: "Can I see which hospital a podiatrist operates at?",
      a: "You can see the organizations they bill under and the certified facilities linked to those organizations. That is an affiliation as filed, not a theatre schedule, and it is dated so you can see how recent it is.",
    },
    {
      q: "Do you distinguish podiatrists from orthopedic surgeons?",
      a: "Completely. They are separate headings — podiatry is its own profession and orthopedic surgery is a physician specialty — so neither is ever silently counted inside the other. Both are searchable, together or apart.",
    },
    {
      q: "What contact data comes with the record?",
      a: "Practice phone and address from the record, and a work email with a trust tier on paid plans. Home address and personal mobile are a contract-only product, matched to the named provider, and never part of an export or a list.",
    },
    {
      q: "How current is it?",
      a: "Identity, specialization and location refresh weekly; affiliations and standing monthly; contact data is verified continuously. Each field carries the date it was last confirmed.",
    },
    {
      q: "Is there an API?",
      a: "Yes — the same records over a versioned REST API with scoped keys, per-minute pacing and a monthly quota. The reference is public and needs no contract to read.",
    },
  ],
};

export const metadata: Metadata = {
  title: "Podiatrist data, surgical and office",
  description:
    "US podiatrists by specialization, state and practice, including foot and ankle surgery and the facilities they are affiliated with.",
  alternates: { canonical: "/podiatrists" },
  openGraph: socialCard(
    "/podiatrists",
    "Podiatrist data, surgical and office",
    "Podiatrists by specialization, state and practice, surgical and office alike.",
  ),
};

export default function PodiatristsPage() {
  return <AudienceLanding audience={AUDIENCE} />;
}

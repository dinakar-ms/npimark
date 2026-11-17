import type { Metadata } from "next";
import { AudienceLanding, type Audience } from "@/components/AudienceLanding";
import { socialCard } from "@/lib/site";

const AUDIENCE: Audience = {
  slug: "physical-occupational-therapists",
  title: "Therapists",
  // Three headings that share a buyer: the rehab clinic, the school district and the hospital
  // therapy department all employ some mix of them. Physical therapy leads because it is the
  // largest and is one of the specialties the metro directory publishes.
  classifications: ["Physical Therapist", "Occupational Therapist", "Speech-Language Pathologist"],
  h1: "Physical, occupational and speech therapy data.",
  lede:
    "Physical therapists, occupational therapists and speech-language pathologists — outpatient " +
    "clinics, hospital departments, schools, home health and skilled nursing — by specialization, " +
    "state and employer, with the date every field was last confirmed.",
  deeper: [
    {
      href: "/lists/physical-therapists",
      label: "Physical therapists",
      note: "National and state counts, refreshed nightly, with the contact coverage behind them.",
    },
    {
      href: "/lists/occupational-therapists",
      label: "Occupational therapists",
      note: "The same for occupational therapy, including the hand and pediatric specializations.",
    },
    {
      href: "/lists/speech-language-pathologists",
      label: "Speech-language pathologists",
      note: "Counted on their own, which is how school and clinic buyers ask for them.",
    },
    {
      href: "/home-health-agencies",
      label: "Home health agencies",
      note: "Where a large share of therapy visits happen: every certified agency by state and town.",
    },
  ],
  filters: [
    "Therapy discipline and specialization",
    "State, city, ZIP and radius",
    "Clinic, hospital, school or agency employer",
    "Individual or practice",
    "Has verified email",
    "Active or inactive",
  ],
  useCases: [
    {
      title: "Sell equipment to the site, training to the clinician",
      body:
        "Tables, modalities and gait technology are bought by a clinic or a department; courses, " +
        "certifications and documentation tools are bought by the therapist. Both sides are here " +
        "and linked, so you can address whichever one holds the budget.",
    },
    {
      title: "Reach one discipline, not all three",
      body:
        "A dysphagia product is nothing to a physical therapist, and a gait trainer is nothing to a " +
        "speech-language pathologist. Each discipline is its own heading, and the specializations " +
        "beneath them — hand therapy, pediatrics, neurology, sports — narrow it further.",
    },
    {
      title: "Follow therapy into the settings it happens in",
      body:
        "Much of this work is not in an outpatient clinic at all: it is in home health, skilled " +
        "nursing, schools and hospital departments. Therapists are reconciled to the organizations " +
        "and certified facilities they work for, so you can target by setting.",
    },
    {
      title: "Staff a clinic or a contract",
      body:
        "Filter by discipline, state and employer to see who is practicing in a territory before " +
        "you promise coverage on a contract — and keep an existing roster current by uploading it " +
        "and getting the changed fields back.",
    },
  ],
  faq: [
    {
      q: "Which therapy professions are on this page?",
      a: "Physical therapy, occupational therapy and speech-language pathology, each as its own heading with its filed specializations beneath it. Assistants — physical therapist assistants and occupational therapy assistants — are separate professions with their own records and are not counted in a therapist total here.",
    },
    {
      q: "Can I filter to hand therapy, pediatrics or sports?",
      a: "Yes, where the specialization is filed. Asking for a discipline returns every specialization beneath it, which is what most buyers want; asking for one specialization returns only that, which is what a niche product needs.",
    },
    {
      q: "Do you cover school-based therapists?",
      a: "Where they hold a current identifier and file a practice location, yes — and their employer is on the record when it is filed. Therapists employed by a school district who bill nothing are the one group you should expect to be thin, and we would rather say that than imply a complete census.",
    },
    {
      q: "Can I see the clinic as well as the clinician?",
      a: "Yes. Therapy practices file as organizations with their own identifiers and locations, and the clinicians who bill under them are linked. Certified home health agencies and skilled nursing facilities carry their own records too, with beds, ownership and ratings.",
    },
    {
      q: "What contact data comes with it?",
      a: "Practice phone and address from the record, and a work email with a trust tier on paid plans. Home address and personal mobile are a separate contracted product, matched to the named clinician, and never part of an export or a list.",
    },
    {
      q: "How often does it change?",
      a: "Identity, discipline and location are refreshed weekly, employers and standing monthly, and contact data is verified continuously — which matters in a profession where clinicians move between clinics, agencies and travel contracts often.",
    },
  ],
};

export const metadata: Metadata = {
  title: "Therapist data: PT, OT and speech",
  description:
    "Physical therapists, occupational therapists and speech-language pathologists by specialization, setting and state, with every field dated.",
  alternates: { canonical: "/physical-occupational-therapists" },
  openGraph: socialCard(
    "/physical-occupational-therapists",
    "Therapist data: PT, OT and speech",
    "Three therapy disciplines by specialization, setting and state, each field dated.",
  ),
};

export default function TherapistsPage() {
  return <AudienceLanding audience={AUDIENCE} />;
}

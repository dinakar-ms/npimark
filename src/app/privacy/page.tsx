import type { Metadata } from "next";
import { draftRobots } from "@/lib/draft";
import { connection } from "next/server";
import { LegalDocument } from "@/components/LegalDocument";
import { PRIVACY } from "@/content/legal/privacy";
import { socialCard } from "@/lib/site";

export const metadata: Metadata = {
  // Not indexed while the text is a draft: this page prints counsel's [LAWYER: ...]
  // notes until LEGAL_PAGES_APPROVED is on, and those are not for a search result.
  ...draftRobots("/privacy"),
  title: "Privacy Policy",
  description:
    "What NPI Mark collects about customers, what it holds about healthcare professionals, and how to have your information removed.",
  alternates: { canonical: "/privacy" },
  openGraph: socialCard(
    "/privacy",
    "Privacy Policy",
    "What we hold about customers and about healthcare professionals, and how to have it removed.",
  ),
};

/** The text is in src/content/legal/privacy.ts. */
export default async function PrivacyPage() {
  // Per request, for the same reason as /terms: LEGAL_PAGES_APPROVED is read at run time.
  await connection();
  return <LegalDocument doc={PRIVACY} eyebrow="Legal" />;
}

import type { Metadata } from "next";
import { draftRobots } from "@/lib/draft";
import { connection } from "next/server";
import { LegalDocument } from "@/components/LegalDocument";
import { TERMS } from "@/content/legal/terms";
import { socialCard } from "@/lib/site";

export const metadata: Metadata = {
  // Not indexed while the text is a draft: this page prints counsel's [LAWYER: ...]
  // notes until LEGAL_PAGES_APPROVED is on, and those are not for a search result.
  ...draftRobots("/terms"),
  title: "Terms of Service",
  description:
    "The terms for using NPI Mark: permitted use of provider data, no scraping or resale, plan limits, Do Not Call and TCPA responsibilities, and billing.",
  alternates: { canonical: "/terms" },
  openGraph: socialCard(
    "/terms",
    "Terms of Service",
    "Permitted use of provider data, plan limits, Do Not Call duties, and billing.",
  ),
};

/** The text is in src/content/legal/terms.ts. */
export default async function TermsPage() {
  // Rendered per request so LEGAL_PAGES_APPROVED is read from the running environment, not
  // frozen at build: switching the draft banner off is an env change and a restart.
  await connection();
  return <LegalDocument doc={TERMS} eyebrow="Legal" />;
}

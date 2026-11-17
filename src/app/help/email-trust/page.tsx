import type { Metadata } from "next";
import Link from "next/link";
import { HelpArticle, type HelpArticle as Article } from "@/components/HelpArticle";
import { socialCard } from "@/lib/site";

const ARTICLE: Article = {
  slug: "email-trust",
  h1: "What the email trust tiers mean.",
  lede:
    "A work email is the one field on a record that cannot simply be read off a filing, so it is " +
    "the one field we score. The tier tells you what the address is good for, and every tier keeps " +
    "the arithmetic that produced it.",
  sections: [
    {
      heading: "The four tiers",
      body: [
        "One tier per address, from a score that combines several signals. The tier is what you " +
          "filter on, so a campaign can require a floor and show afterwards that it held.",
      ],
      table: {
        head: ["Tier", "What it means for you"],
        rows: [
          [
            "Trusted",
            "Safe to send. This is the only tier the append tool will use unless you widen it.",
          ],
          [
            "Probable",
            "Good enough to tell you where somebody works, not good enough to mail without care.",
          ],
          ["Doubtful", "Kept and shown to you, and never acted on."],
          ["Rejected", "Not usable, and said so rather than quietly dropped."],
        ],
      },
    },
    {
      heading: "What the score is made of",
      body: [
        "Each address starts from we-know-nothing and moves on signals that can each be named: " +
          "whether the domain belongs to a real employer or is a consumer mailbox, whether a " +
          "verifier found it deliverable, whether the address matches the provider's own name, " +
          "whether it is a shared desk address rather than a person, how many other providers carry " +
          "the identical address, and whether the domain resolves at all.",
        "Each signal's contribution is stored with the score. When you ask why an address is only " +
          "probable there is an answer, it is the same answer every time, and it is specific enough " +
          "to argue with.",
        "An organization's address is scored without the name and shared-address signals, because " +
          "neither means anything for an organization — and the score records that it skipped them " +
          "rather than pretending they passed.",
      ],
    },
    {
      heading: "Four things that reject an address outright",
      body: [
        "Some findings are not a matter of degree. An address is rejected regardless of everything " +
          "else when it is not a valid address at all, when its domain is a disposable or reserved " +
          "one, when a verifier says it is undeliverable, or when its domain carries the signature " +
          "of a fabricated list — thousands of addresses across dozens of states, all built to one " +
          "pattern, on a domain with almost no real employer behind it.",
        "That last one is the reason this scoring exists. Bought email files are full of " +
          "generated addresses that look perfect and belong to nobody, and a verifier alone will " +
          "not catch them.",
      ],
    },
    {
      heading: "Unmeasured is never treated as fine",
      body: [
        "An address that has not been scored yet has no tier. It fails every trust filter and is " +
          "not used to derive anything — not an employer, not a domain, not a count. Defaulting an " +
          "unknown to acceptable is how a database quietly fills with addresses nobody ever checked.",
      ],
    },
    {
      heading: "Which tier each tool uses",
      body: [
        "The defaults differ on purpose, because the two tools have different jobs.",
      ],
      table: {
        head: ["Tool", "Default"],
        rows: [
          [
            "Append",
            "Trusted only. An appended file usually goes on to a client or into a campaign, so the strict floor is the safe default. Over the API it is always trusted only.",
          ],
          [
            "Export",
            "Every tier. An export is often how somebody goes and looks at the weaker addresses, and blanking them would hide the work rather than help. Narrow it to trusted only if that is what you want.",
          ],
          [
            "Search",
            "Every tier, unless you set a floor. Setting one to trusted is how you size a mailable segment rather than a contactable one.",
          ],
        ],
      },
    },
    {
      heading: "Where the counts are published",
      body: [
        <>
          Coverage is not the same in every profession, and we would rather publish that than
          describe it in adjectives. The <Link href="/lists">list pages</Link> carry, per specialty
          and per state, how many records exist, how many carry a work email and how many carry a
          trusted-tier one. Hospital-based professions do better than solo practices; the numbers
          say by how much.
        </>,
        <>
          The tiers and what a record carries are also described on{" "}
          <Link href="/data">what is in the data</Link>.
        </>,
      ],
    },
  ],
  faq: [
    {
      q: "What does trusted actually promise?",
      a: "That the address cleared every signal we score: a real employer domain that resolves, a deliverable result from a verifier, a name that matches the provider, and no sign of being a shared or generated address. It is safe to send to. It is not a guarantee that nobody has left the job.",
    },
    {
      q: "Why is an address only probable?",
      a: "Because at least one signal did not clear — a catch-all domain, a partial name match, an address several providers share, or a verifier result that was inconclusive. The score keeps which signal it was, and the answer is the same every time you ask.",
    },
    {
      q: "What does a tier of nothing mean?",
      a: "That the address has not been scored yet. It counts as untrusted everywhere: it fails every trust filter and is never used to derive an employer or fill a count. Unmeasured is not treated as fine.",
    },
    {
      q: "Do I get doubtful addresses in an export?",
      a: "Yes, because an export is often exactly how somebody inspects the weaker ones, and you can narrow an export to trusted only when that is what you want. The append tool is the opposite by default: trusted only unless you widen it, and through the API always trusted only.",
    },
    {
      q: "Can a trusted address still bounce?",
      a: "Yes. A tier describes what was true when the address was last checked; people change jobs, and mailboxes are closed. Every address carries the date it was last confirmed for exactly that reason.",
    },
    {
      q: "Do you ever ship a quarantined address as verified?",
      a: "No. A quarantined address is not counted as an address at all, even when a filter asks for any tier, and it is never handed over by a reveal.",
    },
  ],
};

export const metadata: Metadata = {
  title: "What the email trust tiers mean",
  description:
    "Trusted, probable, doubtful and rejected: what each tier means, the signals behind the score, and why an unscored address counts as untrusted.",
  alternates: { canonical: "/help/email-trust" },
  openGraph: socialCard(
    "/help/email-trust",
    "What the email trust tiers mean",
    "The four tiers, the signals behind them, and what an unscored address counts as.",
  ),
};

export default function HelpEmailTrustPage() {
  return <HelpArticle article={ARTICLE} name="What the email trust tiers mean" />;
}

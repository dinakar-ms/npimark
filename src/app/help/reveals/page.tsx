import type { Metadata } from "next";
import Link from "next/link";
import { HelpArticle, type HelpArticle as Article } from "@/components/HelpArticle";
import { socialCard } from "@/lib/site";

const ARTICLE: Article = {
  slug: "reveals",
  h1: "What a reveal is, and what it costs.",
  lede:
    "A reveal opens one provider's contact details. It is the one action on the platform that " +
    "spends something every time, so it is worth knowing exactly when it is charged, when it is " +
    "free, and why a refusal never costs you anything.",
  sections: [
    {
      heading: "One provider at a time",
      body: [
        "Search is open and unmetered. Revealing is not: a reveal takes one provider and returns " +
          "the contact details your plan includes for them — a work email with the tier it was " +
          "confirmed at, and the practice phone on the record. There is no bulk reveal, and there " +
          "is no endpoint that opens a page of results at once. That is deliberate, and it is the " +
          "single largest reason the contact data is worth having.",
        "Every reveal is written to an audit trail with the person or key that made it, the time " +
          "and the connection it came from. You can read your own; we can read it when somebody " +
          "asks us to account for how a record traveled.",
      ],
    },
    {
      heading: "The same provider is free for the rest of the month",
      body: [
        "A reveal is counted once per provider per organization per calendar month. Opening the " +
          "same provider again — by you, by a colleague, from the app or from a key — returns the " +
          "details again and is not charged, and the response says it was not charged. Two people " +
          "working the same account do not pay twice for it.",
        "Reading details back afterwards follows that same ledger: you can re-read what your " +
          "organization revealed this month, and asking for a provider nobody has revealed yet is " +
          "refused rather than quietly served.",
      ],
    },
    {
      heading: "What a reveal counts against",
      body: [
        <>
          Reveals have their own monthly allowance, separate from export rows, appended rows and
          API calls. What your plan includes is on the <Link href="/pricing">pricing page</Link>,
          and what is left this month is shown in the app.
        </>,
      ],
      table: {
        head: ["Where you reveal", "What it spends"],
        rows: [
          ["In the app", "One reveal, the first time that provider is opened this month."],
          [
            "Through the API",
            "One reveal and one API call — a request was made and contact data was handed over, and those are two different allowances.",
          ],
          [
            "A provider already revealed this month",
            "Nothing. The response says it was not charged.",
          ],
          [
            "A contracted home address or cell phone",
            "More than one reveal, because it is a licensed product with a cost behind it. The surcharge applies only when those values are actually handed over.",
          ],
        ],
      },
    },
    {
      heading: "A refused call is never metered",
      body: [
        "Every check that can refuse a reveal runs before anything is counted or written: whether " +
          "your subscription is live, whether the allowance covers it, whether the pace limits " +
          "allow it, and whether the provider exists at all. If any of them says no, the refusal " +
          "explains which one and your allowance is untouched. Nothing is half-done, and there is " +
          "no case where being told no costs you a reveal.",
        "The refusals say so in as many words — being told no should not spend the month's " +
          "allowance, so the messages end by telling you nothing was counted and nothing started.",
      ],
    },
    {
      heading: "Pace limits, and what triggers a pause",
      body: [
        "Alongside the monthly allowance there are pace limits: how many new reveals an " +
          "organization may make in a minute and in an hour, and a lower limit for any one person " +
          "or key. Repeats never count towards them. Hitting a pace limit is a wait-a-minute " +
          "refusal, not a quota refusal, and it costs nothing.",
        "Sustained refusals, or a volume far outside normal use, pause an organization's reveals " +
          "until somebody here has looked at it. That is a deliberate brake on a leaked credential " +
          "or a script gone wrong, and it is cleared by a person rather than by waiting.",
      ],
    },
    {
      heading: "What a reveal will never return",
      body: [
        <>
          A value somebody has asked us to suppress is not revealed, whatever your plan says. The
          response names the kinds of detail it withheld rather than returning a blank, because a
          silent omission and &ldquo;there is nothing on file&rdquo; look identical and only one of
          them is true. How that works is on the{" "}
          <Link href="/help/suppression">suppression page</Link>.
        </>,
        <>
          Home address and cell phone are a contracted product and are described on their own{" "}
          <Link href="/help/premium-contact-data">page</Link>. They are never part of a list, never
          on a public page, and not available through the API at all. What an agreement covers, and
          what it allows in bulk, is settled with us.
        </>,
      ],
    },
  ],
  faq: [
    {
      q: "Does a refused reveal count against my allowance?",
      a: "No. Every gate — subscription, allowance, pace, and whether the provider exists — is checked before anything is counted or written, and a refusal leaves your allowance exactly where it was. The refusal message says so.",
    },
    {
      q: "If a colleague already revealed this provider, do I pay again?",
      a: "No. The allowance is counted per organization per calendar month, so the second and every later look at the same provider in that month is free, and the response says it was not charged.",
    },
    {
      q: "Does a reveal through the API cost twice?",
      a: "It spends one API call and one reveal, which are two separate allowances. That is on purpose: a request was made, and contact data was handed over. Polling a provider you have already revealed spends calls and no reveals.",
    },
    {
      q: "Why can I not reveal a page of results at once?",
      a: "Because the value of contact data depends on it not being available in bulk. There is no bulk reveal in the app and no endpoint for one. Export gives you rows at volume; what it does not give you is contact detail without an allowance behind it.",
    },
    {
      q: "Why was a phone number missing from a reveal that worked?",
      a: "Either nothing is on file, or somebody asked for that value to be suppressed. The response distinguishes the two: a suppressed value is named as withheld, and the app shows it as asked not to be contacted rather than as an empty field.",
    },
    {
      q: "Do I have to verify my email before revealing?",
      a: "Yes, on a customer account, before anything that hands over contact data. Searching needs no verification. The prompt appears in the app and the verification mail can be resent.",
    },
  ],
};

export const metadata: Metadata = {
  title: "What a reveal is and what it costs",
  description:
    "A reveal opens one provider's contact details. When it is charged, when it is free, the pace limits, and why a refused reveal is never metered.",
  alternates: { canonical: "/help/reveals" },
  openGraph: socialCard(
    "/help/reveals",
    "What a reveal is and what it costs",
    "When a reveal is charged, when it is free, and why a refusal costs nothing.",
  ),
};

export default function HelpRevealsPage() {
  return <HelpArticle article={ARTICLE} name="What a reveal is and what it costs" />;
}

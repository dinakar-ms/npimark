import type { Metadata } from "next";
import Link from "next/link";
import { HelpArticle, type HelpArticle as Article } from "@/components/HelpArticle";
import { socialCard } from "@/lib/site";

const ARTICLE: Article = {
  slug: "premium-contact-data",
  h1: "Home address and cell phone: the contracted product.",
  lede:
    "A provider's home address and personal mobile are licensed data, available only under an " +
    "agreement that states what they may be used for. They are matched to the provider rather than " +
    "filed by them, so they carry a confidence score — and they are never over the API and never " +
    "on a public page.",
  sections: [
    {
      heading: "Contract only, and never bought online",
      body: [
        "This is not a plan you can put on a card. It is switched on for an organization by a person " +
          "here, after an agreement that names the permissible use the data may be put to. Plans " +
          "that include it are not offered in online checkout at all.",
        <>
          A customer never holds the internal permission that governs consumer-derived data; the door
          is the contract on the plan. That is also why it is absent from the API entirely — see{" "}
          <Link href="/help/api-keys">API keys</Link>.
        </>,
      ],
    },
    {
      heading: "Matched, not filed — which is why there is a score",
      body: [
        "A practice address is something a provider files about themselves. A home address is not: " +
          "it is a link between a named provider and a person in a licensed national file, and a " +
          "link is either well evidenced or it is a guess. So every link carries a confidence score " +
          "out of a hundred, built from signals that are each named and weighted: how well the first " +
          "name agrees, how rare the name is, how far the home is from the practice, the middle " +
          "initial, and then age, gender and suffix where they are known.",
        "The distance matters more than people expect, and geography is measured as a distance from " +
          "the practice rather than as a state. Roughly one American worker in ten crosses a state " +
          "line to get to work, so matching on state alone both misses real people and invents " +
          "others.",
        "Rarity matters just as much. Every signal agreeing on a name almost nobody has is a " +
          "confident match. The same signals agreeing on one of forty people with the same common " +
          "name in one dense metropolitan area is not a match at all, and is not treated as one.",
        "Only a confirmed link under the current matching model is ever handed to a customer. A " +
          "link that is merely probable, one waiting on review, or one made by an older model that " +
          "has not been re-matched, is treated exactly as if nothing were on file. Nothing weaker is " +
          "shown to you with a shrug attached.",
      ],
    },
    {
      heading: "One provider at a time, counted and logged",
      body: [
        <>
          These values are revealed like any other contact detail: one provider, from their record,
          against your monthly allowance. A reveal that hands them over counts as more than one
          ordinary reveal, because the data underneath has a cost. The mechanics of allowances,
          repeats and refusals are on the <Link href="/help/reveals">reveals page</Link>.
        </>,
        "If a provider was opened earlier in the month before your plan included these values, " +
          "opening them the first time costs only the difference rather than a second full reveal.",
        "Reading back what you revealed follows the same record: you can see what your organization " +
          "opened this month, and nothing else.",
      ],
    },
    {
      heading: "Under the contract only, and never over the API",
      body: [
        "There is no home address column in an export on any plan — not an empty one, not a locked " +
          "one. The cell phone column is filled only for an organization holding the contract, and " +
          "never over the API.",
        "What an agreement covers is settled with us rather than read off this page, and an " +
          "organization holding the contract is told what its own plan allows in bulk and what that " +
          "costs. Nothing here is available online, on any plan, to anybody who has not signed one.",
        "Through the API, asking for these fields in an export or an append is refused by name " +
          "rather than answered with blanks. A column of empties looks like poor coverage; a refusal " +
          "tells the truth, which is that this is not available that way.",
        <>
          They are also never on a public page, in any form, and they are not blended into any count.
          What is and is not in a provider record is set out on{" "}
          <Link href="/data">what is in the data</Link>.
        </>,
      ],
    },
    {
      heading: "The Do Not Call flag",
      body: [
        "Where we have a flag for a number, it is shown when you reveal it — and it has three " +
          "states, not two: flagged, not flagged, and unknown. Unknown means we could not determine " +
          "it, and it is never dressed up as not flagged.",
        "The flag decides nothing. It never stops a reveal and never changes what you are charged; " +
          "it is looked up after the reveal is settled, and a failed lookup produces unknown rather " +
          "than a failed reveal.",
        "It is not the live national registry, and nothing here may be read as safe to call. " +
          "Whether to call or text a number, flagged or not, is your decision, and compliance with " +
          "do-not-call and telemarketing rules is your responsibility. What the flag buys you is " +
          "that you are not handed the number blind.",
      ],
    },
    {
      heading: "If a provider asks for these to be removed",
      body: [
        <>
          A provider can ask for their home address and cell phone specifically, without touching the
          rest of their record, and suppression is applied at exactly that grain. Nothing suppressed
          is ever revealed, whatever a plan says. See{" "}
          <Link href="/help/suppression">suppression</Link> and{" "}
          <Link href="/remove-my-information">remove my information</Link>.
        </>,
      ],
    },
  ],
  faq: [
    {
      q: "Can I buy home address and cell phone online?",
      a: "No. They are available only under an agreement that states the permissible use, switched on for an organization by a person here. Plans that include them are not in online checkout.",
    },
    {
      q: "What does the confidence score mean?",
      a: "How well the link between the provider and a person in the licensed file is evidenced, out of a hundred: how closely the name agrees, how rare that name is, how far the home is from the practice, and the middle initial, age, gender and suffix where they are known. Only a confirmed link under the current model is handed over.",
    },
    {
      q: "Can I get these fields in an export or an append?",
      a: "No. There is no home address column in an export at all, the cell phone column is filled only under the contract and never over the API, and the API refuses both fields by name rather than returning blanks.",
    },
    {
      q: "What does the Do Not Call flag mean?",
      a: "That the records we hold for that number carry the flag. It has three states — flagged, not flagged and unknown — and unknown is never reported as not flagged. It is not the live national registry and is not advice that a number is safe to call.",
    },
    {
      q: "Does a Do Not Call flag stop the reveal?",
      a: "No. The flag never decides whether something is revealed or what it costs; it is looked up after the reveal is settled, purely so that you are not handed a number blind. Whether to call is your decision, and compliance is your responsibility.",
    },
    {
      q: "Why does this reveal cost more than a work email reveal?",
      a: "Because the data underneath is licensed and has a cost per record. A reveal that actually hands over a home address or a cell phone counts as more than one ordinary reveal; one that does not hand them over costs the ordinary amount.",
    },
  ],
};

export const metadata: Metadata = {
  title: "Home address and cell phone",
  description:
    "The contracted product: how a home address is matched to a provider, what the confidence score means, and why it is never on a public page or over the API.",
  alternates: { canonical: "/help/premium-contact-data" },
  openGraph: socialCard(
    "/help/premium-contact-data",
    "Home address and cell phone",
    "Contract only, matched with a confidence score, and never on a public page or over the API.",
  ),
};

export default function HelpPremiumContactPage() {
  return <HelpArticle article={ARTICLE} name="Home address and cell phone" />;
}

import type { Metadata } from "next";
import Link from "next/link";
import { HelpArticle, type HelpArticle as Article } from "@/components/HelpArticle";
import { socialCard } from "@/lib/site";

const ARTICLE: Article = {
  slug: "suppression",
  h1: "Suppression: how an opt-out is applied, everywhere.",
  lede:
    "When somebody asks not to be contacted, the answer has to hold in every place the data is " +
    "read — including the ones nobody thinks about, like a count on a public page or a file that " +
    "went out last week and will be refreshed next week.",
  sections: [
    {
      heading: "One list, for everyone",
      body: [
        "There is a single suppression list, and it applies to every customer and every internal " +
          "user of the platform. An opt-out that one team honors and another does not is not an " +
          "opt-out, so the question of whose list it is never arises.",
        "It is consulted where the data is read rather than applied in a batch afterwards. That is " +
          "what makes it hold in the awkward places: search results, a provider page, a list page's " +
          "counts, a reveal, an export, an append, and every API response.",
      ],
    },
    {
      heading: "Three grains, because requests are not all the same",
      body: [
        "A request is rarely “remove everything”, so suppression is not one switch.",
      ],
      table: {
        head: ["Grain", "What it does"],
        rows: [
          [
            "A value",
            "This email address, this phone number, this postal address — suppressed wherever it appears, on whoever's record it appears on. Useful when the same shared number reaches several people.",
          ],
          [
            "One field of one record",
            "This provider's work email, or practice phone, or home address, or cell phone. The rest of the record — who they are, what they practice, where they practice — stays, because that part is the public record.",
          ],
          [
            "A whole record",
            "The provider is gone from search, from public pages, from counts and from every file. Not hidden from one surface: absent from all of them.",
          ],
        ],
      },
    },
    {
      heading: "How somebody gets removed",
      body: [
        <>
          A healthcare professional, or somebody who leads a healthcare organization, asks through{" "}
          <Link href="/remove-my-information">remove my information</Link>. No account is needed and
          nothing is charged.
        </>,
        "We send a one-time link to the contact address on the request to check it belongs to the " +
          "person asking. The link opens a page with a button rather than confirming by itself, " +
          "because mail scanners and link previewers fetch every URL they are sent and a request " +
          "must not be confirmed by a robot.",
        "A confirmed request is read by a person, not by a rule. Approval writes the suppressions " +
          "the request calls for, at whichever grain fits it. A request whose contact address was " +
          "never proved cannot simply be approved: the reviewer has to record how they verified the " +
          "person instead.",
        <>
          Our response target is stated on the{" "}
          <Link href="/remove-my-information">removal page</Link> itself, along with what we can and
          cannot undo — we can stop showing the details from now on, and we cannot recall a copy a
          customer downloaded before the request.
        </>,
      ],
    },
    {
      heading: "Nothing is deleted, and that is the point",
      body: [
        "Records are rebuilt from public filings every week. If a suppressed record were simply " +
          "deleted, the next refresh would read the same filing and recreate it — so the mark is " +
          "held against the identifier rather than against the row, and the refresh finds it there " +
          "waiting. That is why a removal survives a rebuild instead of being undone by one.",
        "Lifting a suppression is itself recorded, with who lifted it and when. The row stays, so " +
          "there is always an answer to what was suppressed, when, and by whom.",
      ],
    },
    {
      heading: "Withheld, not silently blank",
      body: [
        "Where a value is suppressed, the platform says so. A reveal names the kinds of detail it " +
          "withheld, and the app shows the field as asked-not-to-be-contacted rather than as an " +
          "empty box. A quiet blank reads as “nothing on file”, which sends somebody " +
          "looking for the number somewhere else — the opposite of what was asked for.",
        "In an export the suppressed value is left out of the file and counted in the job's result, " +
          "so the difference between what you asked for and what you got is a number you can see " +
          "rather than a silent gap. Suppressed records are not credited back against your plan.",
      ],
    },
    {
      heading: "If you hold your own do-not-contact list",
      body: [
        "Send it to us and it is applied for everyone, on the same list as every other suppression. " +
          "A suppression you apply only inside your own export is one your next export undoes; one " +
          "on the platform's list is applied before any file is written.",
      ],
    },
  ],
  faq: [
    {
      q: "How do I get my own details removed?",
      a: "Use the remove my information page. You will get a one-time link to confirm the address, and the confirmed request is reviewed by a person before it is applied. No account is needed and nothing is charged.",
    },
    {
      q: "Does a removal apply everywhere or only to search?",
      a: "Everywhere: search, public pages, the counts on list pages, reveals, exports, appends and the API. There is one suppression list and every reader consults it.",
    },
    {
      q: "Can I have just my phone number removed?",
      a: "Yes. A request can name a single field — work email, practice phone, home address or cell phone — or a single value wherever it appears, or the whole record. The rest of the public record stays as it is.",
    },
    {
      q: "Will my details come back after the next refresh?",
      a: "No. The mark is held against the identifier rather than the row, precisely so that rebuilding the record from a fresh filing cannot resurrect the value. That is also why the record is marked rather than deleted.",
    },
    {
      q: "Why is my record still visible after I asked?",
      a: "Either the confirmation link has not been followed yet, or the request is with a reviewer. The removal page states our response target and what happens at each step.",
    },
    {
      q: "Can you recall a file a customer already downloaded?",
      a: "No, and no data company that says otherwise is telling you the truth. Removal stops the details appearing from then on. Our terms prohibit resale and redistribution, and every export is traceable to the account that took it.",
    },
  ],
};

export const metadata: Metadata = {
  title: "Suppression and how removal works",
  description:
    "One suppression list for everyone, applied in search, counts, exports and the API. How a removal request works, and why a record is marked rather than deleted.",
  alternates: { canonical: "/help/suppression" },
  openGraph: socialCard(
    "/help/suppression",
    "Suppression and how removal works",
    "How an opt-out is applied everywhere, and why nothing is ever simply deleted.",
  ),
};

export default function HelpSuppressionPage() {
  return <HelpArticle article={ARTICLE} name="Suppression and how removal works" />;
}

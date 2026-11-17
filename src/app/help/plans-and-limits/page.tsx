import type { Metadata } from "next";
import Link from "next/link";
import { HelpArticle, type HelpArticle as Article } from "@/components/HelpArticle";
import { socialCard } from "@/lib/site";

const ARTICLE: Article = {
  slug: "plans-and-limits",
  h1: "Plans, limits, and what happens when one runs out.",
  lede:
    "Four things are metered, monthly and — on a paid plan — daily too, all of them readable " +
    "before you spend them. " +
    "Rows are one allowance however they leave — an export and the API come off the same number. " +
    "A limit is a refusal that explains itself, never a file that stops halfway or a number that " +
    "quietly changes.",
  sections: [
    {
      heading: "The four things a plan meters",
      body: [
        <>
          Everything else — searching, browsing the directory, reading a list page, looking at a
          provider — is unmetered. What your own plan includes is on the{" "}
          <Link href="/pricing">pricing page</Link>; the figures are kept there rather than repeated
          here, so there is one place to maintain and no chance of two pages disagreeing.
        </>,
      ],
      table: {
        head: ["Metered", "Counted when"],
        rows: [
          [
            "Reveals",
            "One per provider per calendar month. A repeat in the same month is free, and a refused reveal is never counted.",
          ],
          [
            "Rows",
            "One allowance for every row that leaves the platform. An export charges it when the file finishes, on the rows the file actually holds; the API charges it on the records a call returns. An export or a page refused for allowance never runs.",
          ],
          [
            "Appended rows",
            "On the rows that matched a provider. Your whole upload is weighed against the allowance first, because matching has not happened yet; what you are charged is what was matched.",
          ],
          [
            "Medicare procedure and prescribing lines",
            "Rows, on the same allowance, when they leave through the API. One published procedure line is one row and one published prescribing line is one row, so thirty procedure lines for one surgeon are thirty rows. A provider whose Medicare volume was never published returns nothing and costs no rows. Finding a procedure or a drug by name costs no rows — a code and a drug name are vocabulary, not records — and filtering a search on one costs nothing beyond the providers the search returns. Reading the detail on screen in the app is included, like search. In a file it is priced differently, because a file carries the summary of a provider’s lines rather than the lines themselves: the claims columns widen a row and never add one, so an export or an append of ten thousand providers costs ten thousand rows with every one of them switched on, exactly as it does with none. A provider with nothing published still costs the row they were always going to cost, because they are in the file either way.",
          ],
          [
            "API calls",
            "On each call the API answers, including one that answers \u201cno such record\u201d \u2014 the lookup happened. A call refused for pace or for allowance is not metered against the month.",
          ],
        ],
      },
    },
    {
      heading: "Why rows and calls are two numbers",
      body: [
        "Calls are pace and shape: how many times your system may ask us something this month. " +
          "Rows are volume: how much of the data that leaves with the answers. They are different " +
          "questions, so a plan states both, and a plan is never out of one because of the other.",
        "The practical consequence is worth spelling out. A page of results costs one call and as " +
          "many rows as it returned, so a page of fifty is fifty rows and a page of twelve is " +
          "twelve. Asking for a page bigger than the rows you have left is refused rather than " +
          "shortened — ask for a page that fits and you get it whole. Reading one record costs one " +
          "row, an empty result costs none, and a lookup that finds nothing costs the call and no " +
          "rows. Counts, place lists, specialty lists and published list pages name no record at " +
          "all and cost no rows.",
        "Reveals are priced as reveals and never also as rows, and a work email arriving in an " +
          "ordinary API row is not a reveal and never touches that allowance. Nothing is charged " +
          "twice: starting an export costs a call and no rows, the rows are charged when the file " +
          "is written, and downloading that file again costs neither.",
      ],
    },
    {
      heading: "Why a procedure line is a row",
      body: [
        "A record about a provider costs a row wherever it leaves, and a published procedure or " +
          "prescribing line is a record about a provider — it is the part of the answer that " +
          "took the work, and the part somebody would otherwise have exported. So through the API " +
          "it is metered as one, on the same monthly number an export spends, and the same refusal " +
          "applies: ask for a page bigger than the rows you have left and it is refused rather " +
          "than shortened. On screen in the app it is included, like search.",
        "A file is priced differently, and the difference is the point of it. A file has one row " +
          "per provider, so it carries a summary of a provider’s lines — the highest-volume few, " +
          "and the sizes — rather than the lines themselves. Those columns widen a row; they never " +
          "add one. An export or an append of ten thousand providers costs ten thousand rows with " +
          "every one of them switched on, exactly as it does with none, and a provider with " +
          "nothing published costs the row they were always going to cost because they are in the " +
          "file either way. The per-line price stays on the API, where a line is what you asked " +
          "for.",
        "Two consequences are in your favor, and worth knowing before you plan a run. Asking " +
          "about a provider with no published Medicare volume costs the call and nothing else, " +
          "which matters because most clinicians have none — the data covers about one in " +
          "six. And the two pickers that let you search “knee replacement” rather than " +
          "a code are free of rows entirely, so building the query costs nothing and only the " +
          "answer does.",
        "What this data is, and what it is not: published Medicare fee-for-service volume for one " +
          "year, not all-payor claims, with low-volume providers removed before publication. The " +
          "full limits are on the data page, and they are worth reading before you budget against " +
          "it.",
      ],
    },
    {
      heading: "Seats and alerts are features, not meters",
      body: [
        "A plan also says how many people can be in your organization and how many standing alerts " +
          "it can keep. Those are limits on what exists rather than on what you spend, so they do " +
          "not reset with the month.",
      ],
    },
    {
      heading: "A paid plan also has a daily cap",
      body: [
        "Beside the month, every paid plan carries a cap on rows, reveals and API calls for one " +
          "day — roughly a tenth of the month, so one afternoon cannot spend it. It is a separate " +
          "limit and the smaller of the two is what refuses, so a refusal names which one it was: " +
          "a day resets at midnight UTC and your month is not spent, and the balance panel in the " +
          "app shows both numbers side by side rather than making you work it out.",
        <>
          Appended rows have no daily cap, on purpose: an append is weighed against a file you
          uploaded yourself, so its size is your own list rather than a slice of ours. The free plan
          has no daily cap either — its month is small enough already. What your own plan allows in
          a day is on the <Link href="/pricing">pricing page</Link>.
        </>,
      ],
    },
    {
      heading: "The month is a calendar month",
      body: [
        "Every allowance is counted against the calendar month in which it was spent, and every " +
          "allowance resets on the first. Nothing carries over. When a plan changes mid-month the " +
          "usage already recorded stays recorded and the new limits apply from the moment the plan " +
          "does, so an upgrade takes effect on what is left of the month rather than on a new one.",
      ],
    },
    {
      heading: "What a limit refusal looks like",
      body: [
        "A refusal tells you how much you asked for, how much is left, what the limit is, how much " +
          "of it you have used and which month it is talking about — and it ends by saying that " +
          "nothing was started. That last part is the important one: an export that has already " +
          "begun is never truncated to fit an allowance, and an append is never run over the part " +
          "of your file that fits. You get a refusal and an intact allowance, not a partial result " +
          "you have to reconcile.",
        "A lapsed subscription is a different refusal with a different fix: nothing is spent, and " +
          "the message says the subscription rather than the allowance is the problem. Your data, " +
          "your saved lists and your history stay where they are while it is sorted out.",
        <>
          A pace refusal is a third thing again, and it means wait rather than upgrade. The
          difference matters: a pace refusal clears within the minute, while an allowance refusal
          will still be there in an hour. Which is which is spelled out on the{" "}
          <Link href="/help/api-keys">API keys page</Link> for calls and on the{" "}
          <Link href="/help/reveals">reveals page</Link> for reveals.
        </>,
      ],
    },
    {
      heading: "Reading what you have left",
      body: [
        <>
          The app shows the month&apos;s usage against each allowance on the billing screen, and
          every member of your organization can see it — a refusal that mentions a number is only
          useful to somebody allowed to go and look at that number. Through the API, one endpoint
          reports the plan and the month&apos;s usage, and the pace and quota headers on every
          response carry the same figures. The{" "}
          <Link href="/docs/api">API reference</Link> names them.
        </>,
        "An unlimited allowance is reported as unlimited rather than as a very large number, and " +
          "where a limit does not apply, no header is sent for it at all — a header you cannot " +
          "trust is worse than no header.",
      ],
    },
  ],
  faq: [
    {
      q: "What happens when I hit a monthly limit?",
      a: "The request is refused before anything runs. The refusal says how much you asked for, how much is left, what the limit is and which month it means, and it confirms that nothing was started. Your allowance is unchanged.",
    },
    {
      q: "Will an export stop halfway if I run out of rows?",
      a: "No. The row count is checked against your allowance before the job is queued, so an export either runs whole or is refused whole. You are charged on the rows the finished file holds.",
    },
    {
      q: "Do rows returned by the API come off the same allowance as an export?",
      a: "Yes. There is one row allowance and it covers both, because a row you read through the API is the same row you would have exported. The refusal names the rows asked for and the rows left, exactly as an export's does.",
    },
    {
      q: "I asked for 200 results and only had 40 rows left. Why was I refused instead of given 40?",
      a: "Because a short page you did not ask for is a result you have to reconcile. Ask for a page of 40 and you get 40. What you are charged is what the page actually returned, so a page of 200 that happens to hold 12 records costs 12 rows.",
    },
    {
      q: "Why was my whole upload weighed against my append allowance?",
      a: "Because at that moment nothing has been matched yet, so the only honest worst case is the number of rows you sent. What is actually charged when the job finishes is the rows that matched a provider.",
    },
    {
      q: "How much does a provider's procedure or prescribing detail cost?",
      a: "Through the API, one call and one row for every published line it returns — thirty procedure lines is thirty rows, off the same monthly allowance an export spends. A provider whose Medicare volume was never published returns nothing and costs no rows, and the pickers that find a procedure or a drug by name cost no rows at all. On screen in the app the same detail is included, like search.",
    },
    {
      q: "Do unused allowances roll over?",
      a: "No. Each allowance is counted against the calendar month it was spent in and resets on the first of the next one.",
    },
    {
      q: "What happens to my data if my subscription lapses?",
      a: "Nothing is deleted. Metered work is refused with a message that names the subscription as the reason, and your account, saved lists and history are all still there when it is restored.",
    },
    {
      q: "Who in my organization can see the plan and usage?",
      a: "Everyone who can use the app can read the plan and what has been used. Changing the plan or the payment details is limited to an administrator of your organization, and plans that include contracted contact data are not purchasable online at all.",
    },
  ],
};

export const metadata: Metadata = {
  title: "Plans, limits and what runs out",
  description:
    "The four things every plan meters, how the calendar month works, how to read what is left, and exactly what a limit refusal does and does not do.",
  alternates: { canonical: "/help/plans-and-limits" },
  openGraph: socialCard(
    "/help/plans-and-limits",
    "Plans, limits and what runs out",
    "What is metered, how the month works, and what a limit refusal actually does.",
  ),
};

export default function HelpPlansPage() {
  return <HelpArticle article={ARTICLE} name="Plans, limits and what runs out" />;
}

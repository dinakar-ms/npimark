import type { Metadata } from "next";
import Link from "next/link";
import { HelpArticle, type HelpArticle as Article } from "@/components/HelpArticle";
import { socialCard } from "@/lib/site";

const ARTICLE: Article = {
  slug: "api-keys",
  h1: "API keys: scopes, pace, quota and headers.",
  lede:
    "A key belongs to an organization rather than to a person, carries only the scopes it was " +
    "given, and is metered on two things at once: the calls it makes and the rows they return. " +
    "All of it is reported in the response headers on every call.",
  sections: [
    {
      heading: "Making a key",
      body: [
        "Keys are created in the app. The secret is shown exactly once, at the moment it is minted, " +
          "and is never recoverable afterwards — we hold a hash of it and the public prefix, which " +
          "is what appears in the list of your keys. If it is lost, make another and revoke the old " +
          "one.",
        "A key can never hold a scope its creator does not hold themselves, so a key is a ceiling " +
          "on what somebody could already do rather than a way around it. A key may be given an " +
          "expiry date, or none. Revoking a key stops it working immediately and keeps the record of " +
          "it, because the audit trail of what it did has to stay readable.",
        "Send it as a bearer token:",
        <code key="bearer">Authorization: Bearer npi_live_&lt;prefix&gt;_&lt;secret&gt;</code>,
        "An invalid key always gets the same answer, whether it never existed, was revoked or has " +
          "expired — a refusal that distinguishes those is a refusal that helps somebody guessing.",
      ],
    },
    {
      heading: "The scopes",
      body: [
        "Scopes are named for the thing they let a key do. A key asked to do something outside its " +
          "scopes is refused by name, and keys cannot be widened after the fact: make a new one with " +
          "the scopes you need.",
      ],
      table: {
        head: ["Scope", "What it allows"],
        rows: [
          ["providers.read", "Search and read providers, organizations and facilities."],
          ["providers.export", "Start provider exports and download the files."],
          [
            "contacts.reveal",
            "Open the contact details of one provider at a time, metered as a reveal.",
          ],
          ["append.run", "Submit files to the append tool and collect the results."],
          ["jobs.read", "Read the status and results of jobs this key started."],
          [
            "usage.read",
            "Read this organization's plan and what it has spent this month.",
          ],
        ],
      },
    },
    {
      heading: "Two limits, two reactions",
      body: [
        "Pace and volume are deliberately different answers, and telling them apart is most of " +
          "writing a well-behaved client.",
      ],
      table: {
        head: ["Refusal", "What to do"],
        rows: [
          [
            "Too fast (429)",
            "You are over the per-minute pace for your plan. Wait — the response says how long in whole seconds — and carry on. Nothing was metered against your month.",
          ],
          [
            "Out of quota (409)",
            "You have spent an allowance, or the page you asked for is bigger than the rows you have left. The message says which allowance, and which window: the month, which resets on the first, or — on a paid plan — the day, which resets at midnight UTC, so waiting does help for that one. Nothing was half-served \u2014 ask for a page that fits and you get it whole.",
          ],
          [
            "Subscription not live (402)",
            "Billing, not usage. Nothing is spent and nothing is lost while it is sorted out.",
          ],
          [
            "Scope missing (403)",
            "The key cannot do this. Mint a new key with the scope; an existing key is never widened.",
          ],
        ],
      },
    },
    {
      heading: "The headers",
      body: [
        "Every response carries what it is allowed to say, so a client never has to guess where it " +
          "stands.",
      ],
      table: {
        head: ["Header", "What it reports"],
        rows: [
          ["X-RateLimit-Limit", "Calls allowed in the current minute for this key's plan."],
          ["X-RateLimit-Remaining", "How many of them are left."],
          ["X-RateLimit-Reset", "When the current minute clears, as a Unix timestamp."],
          ["X-RateLimit-Window", "The length of the window, in seconds."],
          ["Retry-After", "On a 429 only: whole seconds to wait. Never zero."],
          ["X-Quota-Limit", "The month's call allowance."],
          ["X-Quota-Used", "How much of it has been spent."],
          ["X-Quota-Remaining", "What is left."],
          ["X-Quota-Period", "The month those three figures are about."],
          ["X-Quota-Rows-Limit", "The month's row allowance \u2014 the same one an export spends."],
          ["X-Quota-Rows-Used", "How many rows have been spent this month, by any door."],
          [
            "X-Quota-Rows-Remaining",
            "Rows left. As they stood when the request arrived, before this call's own rows were charged.",
          ],
          [
            "X-Request-ID",
            "On every response, success or failure. Quote it when you ask us about a call and we can find that exact one.",
          ],
        ],
      },
    },
    {
      heading: "What is metered, and the one exception",
      body: [
        "A call the API answers adds one to the month's calls, and the records it returns are " +
          "charged against the month's rows — the same allowance an export spends, because a row " +
          "read through a key is the same row. Both are written in the same transaction as the " +
          "read, before the answer leaves, and a refusal on either charges nothing at all.",
        "A page costs one call and as many rows as it returned: fifty for a page of fifty, twelve " +
          "for a page of twelve, none for a page that found nothing. One record costs one row. A " +
          "lookup that finds nothing costs the call and no rows, because the lookup happened. " +
          "Counts, place lists, specialty lists and published list pages name no record and cost " +
          "no rows at all.",
        "The page you ask for is checked against the rows you have left before anything is read, " +
          "so a page bigger than your remaining allowance is a 409 rather than a short page. Ask " +
          "for a page that fits and it is served whole.",
        "The exception is the per-minute pace counter, which does count a call it refused. That is " +
          "on purpose — a limiter that forgets the calls it turned away is a limiter a fast client " +
          "can hammer for free. It affects only the minute you are in, never the monthly quota.",
        <>
          A reveal through the API spends a call and a reveal and no rows, for the reasons on the{" "}
          <Link href="/help/reveals">reveals page</Link>; charging the same disclosure twice under
          two names would make both numbers meaningless. The converse holds too — a work email
          arriving in an ordinary row is metered as a row and never touches your reveals. Starting
          an export costs a call and no rows, its rows are charged when the file is written, and
          downloading that file again costs neither. An unlimited allowance sends no header for
          itself rather than a made-up ceiling.
        </>,
      ],
    },
    {
      heading: "What the API will not do",
      body: [
        <>
          Home address and cell phone are not available through the API at all. A call that asks for
          them is refused by name rather than returning an empty column, so a script can never
          quietly produce a file of blanks and call it coverage. They are revealed in the app, one
          provider at a time, under a contract — see{" "}
          <Link href="/help/premium-contact-data">home address and cell phone</Link>.
        </>,
        <>
          The full reference — every endpoint, the scope each needs, the filters, the shapes and the
          error codes — is public at <Link href="/docs/api">the API reference</Link>. Version 1
          changes only by adding.
        </>,
      ],
    },
  ],
  faq: [
    {
      q: "Where do I find my API key?",
      a: "In the app, under keys. The secret is shown once when the key is minted and cannot be retrieved afterwards — only a hash and the public prefix are stored. If it is lost, mint a new key and revoke the old one.",
    },
    {
      q: "What is the difference between a 429 and a 409?",
      a: "A 429 means you are going too fast: wait the seconds the response names and carry on. A 409 means an allowance is spent — the month's, which resets on the first, or a paid plan's daily cap, which resets at midnight UTC. The message says which. Neither one costs you anything against your quota.",
    },
    {
      q: "Does a refused call count against my monthly quota?",
      a: "No \u2014 neither the call nor any rows. Only a call the API answers is metered, and a lookup that answers \u201cno such record\u201d is an answer. The per-minute pace counter does count a refused call, so retrying immediately does not help, but that affects the current minute only.",
    },
    {
      q: "Do the rows I read through the API come off my export allowance?",
      a: "Yes, and that is deliberate: there is one row allowance and it counts every row that leaves the platform, whichever door it leaves by. X-Quota-Rows-Remaining reports what is left of it on every response.",
    },
    {
      q: "Can I widen an existing key's scopes?",
      a: "No. Keys are never widened after they are made, which is what makes one safe to hand to a script. Mint a new key with the scopes you need and revoke the old one.",
    },
    {
      q: "Can I get home address or cell phone through the API?",
      a: "No. Those fields are refused by name for every key, and a key is refused whatever the plan behind it says - a refusal rather than a column of blanks, because blanks read as poor coverage. They are reached in the app, on a contracted plan, and never over the API.",
    },
    {
      q: "How do I know what my limits are?",
      a: "From the headers on any response: one set reports the per-minute pace, one the month's calls, one the month's rows, and a usage endpoint reports the plan, its daily caps and everything spent against all of them. A limit that does not apply to your plan sends no header rather than a number you cannot trust.",
    },
  ],
};

export const metadata: Metadata = {
  title: "API keys, scopes and rate limits",
  description:
    "How keys are made and scoped, the difference between the per-minute pace and the monthly allowances for calls and rows, the headers that report all of them, and what is never metered.",
  alternates: { canonical: "/help/api-keys" },
  openGraph: socialCard(
    "/help/api-keys",
    "API keys, scopes and rate limits",
    "Scopes, the pace limit, the monthly quota, and the headers that report both.",
  ),
};

export default function HelpApiKeysPage() {
  return <HelpArticle article={ARTICLE} name="API keys, scopes and rate limits" />;
}

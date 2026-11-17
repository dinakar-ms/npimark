import type { Metadata } from "next";
import Link from "next/link";
import { HelpArticle, type HelpArticle as Article } from "@/components/HelpArticle";
import { socialCard } from "@/lib/site";

const ARTICLE: Article = {
  slug: "exports-and-append",
  h1: "Exports and append: what lands in the file.",
  lede:
    "An export takes a search and gives you a file. An append takes your file and gives it back " +
    "with columns added. Both are jobs rather than downloads you wait on, both are counted on what " +
    "they actually produced, and both are traceable to the organization that ran them.",
  sections: [
    {
      heading: "An export is a job",
      body: [
        "You start it from a search, it runs, and the file is there to download when it finishes. " +
          "Nothing is held in memory, so the size of the result does not decide whether it works. " +
          "Rows come out in identifier order, as CSV.",
        "There is no row cap of its own: whatever your filters match is what the file contains. The " +
          "only ceiling is your plan's monthly export rows, and it is checked against an exact count " +
          "before the job is queued — so an export either runs whole or is refused whole. You are " +
          "charged on the rows the finished file holds. A job that failed or was canceled leaves " +
          "nothing downloadable behind, and an old job's file is gone rather than silently empty.",
      ],
    },
    {
      heading: "What a row carries",
      body: [
        "You choose the columns; the ones on offer are the record itself. Identity — identifier, " +
          "name, credentials, whether it is a person or an organization, active or not. Specialty, " +
          "with the heading it sits under. Practice city, state, ZIP and phone. Employer and its " +
          "website domain. Work email, and further addresses where a provider has more than one, " +
          "each with where it came from. The record system a practice runs, where that is evidenced. " +
          "The date the record was last updated.",
        "The name comes two ways, and you can take both. There is the whole filed name, and there " +
          "are the parts it was filed in — prefix, first, middle, last, suffix — so a CRM or a mail " +
          "merge puts a surname in a surname field. Nothing is split to fill a part: where only one " +
          "string was filed the parts are empty rather than guessed at. An organization has no " +
          "person name, so its name is in the organization column and its person-name columns are " +
          "empty. The presets named after a CRM use the parts and write each header the way that " +
          "importer spells it.",
        <>
          Every column and every append field, one entry each — what it means, what it is for, how
          complete it is, and which of the two it is available in — is on the{" "}
          <Link href="/fields">field reference</Link>.
        </>,
        <>
          There is no home address column at all, on any plan. A cell phone column exists and is
          filled only for an organization holding the contract that includes it, and never through
          the API — see <Link href="/help/premium-contact-data">home address and cell phone</Link>.
        </>,
        <>
          Where a value is suppressed it is left out of the file and counted in the job&apos;s
          result, so the gap between what you asked for and what you got is a number rather than a
          mystery. Records suppressed outright are not in the search that drove the export, and are
          not credited back against your plan. See{" "}
          <Link href="/help/suppression">suppression</Link>.
        </>,
      ],
    },
    {
      heading: "What a provider does, in a file",
      body: [
        "A row can also carry the published Medicare summary: the three highest-volume procedures " +
          "and the three highest-volume drugs, each as its published code or name with its volume, " +
          "in one cell; and four sizes — how many services were published across every procedure " +
          "line, how many distinct procedure codes those lines cover, how many claims were " +
          "published across every drug, and how many drugs there is a published row for. The " +
          "column set called “Identity, practice and what they do” is those six beside the " +
          "identity columns, and the append tool offers the same six under the same headers.",
        "It is a summary because a provider has many lines and a file has one row per provider. " +
          "Three per cell, values separated by “; ” — the same separator the phone and email " +
          "columns use — with each value’s volume in brackets at the end of it. The order is the " +
          "published volume, largest first, and a tie is broken by the code or the name so that " +
          "two runs of the same export produce the same cell. A tie is not a claim that two " +
          "procedures matter equally. The lines themselves, one per row with the published " +
          "averages beside them, are an API call rather than a file.",
        "Every one of those headers ends with the data year — “Medicare services (2024)” — " +
          "because a volume with no year beside it is a number somebody reads next year as next " +
          "year’s. The year comes from the data the numbers came from, not from a label, so it " +
          "cannot say one year while the column holds another.",
        "About one clinician in six has any published volume, so five rows in six will carry the " +
          "words “No published volume” rather than a number. That is not a zero and it is not a " +
          "gap in the file: low-volume lines are removed before the data is published, so it " +
          "covers a provider with no Medicare volume, one below the publication threshold and one " +
          "who bills Medicare for none of it, and nothing in the published data separates them. " +
          "The cells say so in words rather than being left empty on purpose — the published data " +
          "contains no zeros at all, and an empty cell in a column of volumes is read as one.",
        "These columns cost you no extra rows. They widen a row; they never add one. An export of " +
          "ten thousand providers costs ten thousand rows with all six switched on and ten " +
          "thousand with none of them, and an append is still charged on the rows that matched. " +
          "Only the API, where you ask for the individual lines, charges a row per line.",
        "What it is and is not: published Medicare fee-for-service volume for one year. Not " +
          "all-payor claims — commercial, Medicaid and Medicare Advantage work is not in it. One " +
          "year, so nothing in it supports a trend. Every figure is an aggregate published about " +
          "the provider, and there is nothing patient-level in any of it.",
      ],
    },
    {
      heading: "Every file is marked to your organization",
      body: [
        "Provider exports carry markers tied to the organization that took them. If a file turns up " +
          "somewhere it should not be, we can say which account it came from. That is also why the " +
          "terms prohibit resale and redistribution: the prohibition is enforceable rather than " +
          "decorative.",
        "The markers cost you nothing — they are not charged against your export allowance — and " +
          "they are only in provider exports. An append never carries them, because an append " +
          "returns your own rows and a row you did not send would be a corruption of your file " +
          "rather than a watermark.",
      ],
    },
    {
      heading: "Append: your file, your columns, your order",
      body: [
        "Upload a spreadsheet or a delimited file. Every original column survives, in the original " +
          "order, with the original row order, and the fields you asked for are added on the right. " +
          "Nothing else is touched, so the file can go straight back to whoever sent it to you.",
        "You pick the fields from a catalog: identity, practice address and phone, specialty and " +
          "license, work email and its source, employer and the record system, program " +
          "standing, and the published Medicare summary described above. A field that cannot be " +
          "filled for a row still gets its column, with a note in " +
          "the job's result explaining why — a file whose shape depends on who ran it is worse than " +
          "an empty column.",
        "Append is charged on the rows that matched a provider. Your whole upload is weighed against " +
          "the allowance first, because at that point nothing has been matched yet, but what you pay " +
          "for is what came back filled.",
        <>
          Work email in an append is trusted-tier only by default, because an appended file usually
          goes on to somebody else. Through the API it is always trusted only. The tiers are on the{" "}
          <Link href="/help/email-trust">trust tiers page</Link>.
        </>,
      ],
    },
    {
      heading: "How a row is matched",
      body: [
        "Rules are tried in order, strongest first, and the first one that identifies exactly one " +
          "provider wins. Three columns are added to say what happened: the identifier matched, the " +
          "method that matched it, and how confident that method is.",
      ],
      table: {
        head: ["Confidence", "What matched"],
        rows: [
          ["Certain", "A valid identifier was already in your file."],
          [
            "High",
            "An email address we hold against one provider; an address at a known employer plus a name there; a name with a practice ZIP; a last name with a practice phone; a name with a specialty and a state; an organization name with a ZIP.",
          ],
          [
            "Medium",
            "A name that belongs to exactly one active provider in the country; a name with a city and state; a name with a specialty; an organization name with a city and state.",
          ],
          [
            "No match",
            "Nothing identified one provider, or two fitted equally well. The row comes back with its added columns empty and marked as unmatched.",
          ],
        ],
      },
    },
    {
      heading: "Why some rows come back empty",
      body: [
        "A name on its own is not a rule, and neither is a name with a state: there are hundreds of " +
          "John Smiths in Texas, and picking one would put a confident wrong answer into a file that " +
          "goes to a client. Where two providers fit a row equally well, the row is left unmatched " +
          "on purpose.",
        "That is the trade worth understanding before comparing match rates between suppliers. A " +
          "higher rate is easy to produce; the rows it produces are the ones you cannot check.",
      ],
    },
  ],
  faq: [
    {
      q: "What format is an export?",
      a: "CSV, in identifier order, with the columns you chose. It is produced as a job: start it, and download the file when it finishes.",
    },
    {
      q: "Is there a maximum number of rows in an export?",
      a: "No cap of its own — whatever your filters match is what the file holds. The limit is your plan's monthly export rows, checked exactly before the job starts, so an export runs whole or is refused whole.",
    },
    {
      q: "Are exported files watermarked?",
      a: "Yes. Provider exports carry markers tied to the organization that took them, at no cost against your allowance, so a leaked file can be traced back to an account. Append results never carry them, because those are your own rows.",
    },
    {
      q: "Will an append change my file?",
      a: "Only by adding columns on the right. Your columns, their order and your row order all survive exactly as uploaded, plus three columns saying which provider matched, by what method, and with what confidence.",
    },
    {
      q: "Why did some of my rows not match?",
      a: "Either nothing identified one provider, or two fitted equally well. A name alone, or a name and a state, is deliberately not enough to match on — a guess in a file that goes to a client is worse than a blank.",
    },
    {
      q: "Am I charged for rows that did not match?",
      a: "No. Append is charged on the rows that matched. Your upload is weighed against the allowance up front, because matching has not happened yet, but the charge is on what came back filled.",
    },
    {
      q: "Can I get what a provider billed or prescribed in a file?",
      a: "Yes — as a summary. Six columns: the three highest-volume procedures and the three highest-volume drugs with their volumes in one cell each, and four sizes. Choose “Identity, practice and what they do” in an export, or the same six fields in an append. The individual lines, with the published averages, stay on their own API call, because a busy surgeon has dozens of them and a file has one row per provider.",
    },
    {
      q: "Do those columns cost extra rows?",
      a: "No. They widen a row rather than adding one, so a file costs exactly the same rows with them as without. The per-line row cost applies only to the API endpoints that hand back the lines themselves.",
    },
    {
      q: "Why do most of those cells say “No published volume”?",
      a: "Because most providers have none published, and about one clinician in six does. Low-volume lines are removed before the data is published, so that phrase covers a provider with no Medicare volume, one below the publication threshold and one who bills Medicare for none of it — and nothing in the published data separates them. It is written in words rather than left blank because the published data contains no zeros, and an empty cell in a column of volumes gets read as one.",
    },
    {
      q: "Can I get home address or cell phone in a file?",
      a: "Home address is not an export column on any plan, and cell phone is filled only for an organization holding the contract that includes it — never through the API. An append is different: for an organization holding that contract, the cell phone and home address columns are filled from the same matched links a reveal would open, and they are metered on their own allowance, separately from the rows. A row costs one whether it carried both or just the one. If a file needs more than the allowance has left, it comes back with those columns empty and a note saying so, and nothing is charged — a part-filled column would read as patchy coverage rather than as an allowance running out.",
    },
  ],
};

export const metadata: Metadata = {
  title: "Exports and append, file by file",
  description:
    "What an export file holds, how rows are counted, how files are marked to your organization, and how an appended file is matched without guessing.",
  alternates: { canonical: "/help/exports-and-append" },
  openGraph: socialCard(
    "/help/exports-and-append",
    "Exports and append, file by file",
    "What lands in an export, how rows are counted, and how append matches your file.",
  ),
};

export default function HelpExportsPage() {
  return <HelpArticle article={ARTICLE} name="Exports and append, file by file" />;
}

import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import Turnstile from "@/components/Turnstile";
import { LIST_TEST_PATH } from "@/lib/listTest";

/**
 * «Test it on your own list»: paste your own identifiers, read your own coverage.
 *
 * Why this page exists
 * --------------------
 * The question in every first call is "why is your data better than the incumbent's, and how
 * accurate is it". Answered in words it is an argument between two companies describing their own
 * marketing, and we do not win it: they have a decade of brand and we have better numbers nobody
 * can see yet. Answered by handing the buyer a box to paste their own list into, it stops being an
 * argument. They are reading their own segment, counted by the engine that would fill their file.
 *
 * A plain HTML form posting to `/api/list-test`, which forwards it to the platform and redirects to
 * the result at its own URL. No client code but Cloudflare's Turnstile, and nothing typed is ever
 * echoed back: a refusal comes back as a fixed error name and the page words the help itself.
 *
 * What it will not do, said on the page
 * ------------------------------------
 * It proves coverage, not content: counts, tiers and dates, never an email address or a phone
 * number. That is stated above the button rather than discovered afterwards, because a tool that
 * looked like it was giving records away and then did not would feel like a trick - and because it
 * is the honest reason the tool can exist at all without a contract.
 */

export const metadata: Metadata = {
  title: "Test it on your own list",
  description:
    "Paste up to 100 NPIs you already have and see what we hold for your segment: fill rate per field, work email by trust tier, and how recently each record was confirmed. No account, and no contact details are revealed.",
  alternates: { canonical: LIST_TEST_PATH },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const MAX_NPIS = 100;
const MIN_NPIS = 10;
const RETENTION_DAYS = 14;

const ERRORS: Record<string, string> = {
  empty: "Paste the NPIs you want checked, or choose a CSV that has a column of them.",
  "too-short": `We found fewer than ${MIN_NPIS} valid NPIs. This report counts coverage across a segment rather than looking one record up, and a fill rate over a handful of rows reads as if it meant more than it can.`,
  "too-long": `That is more than ${MAX_NPIS} NPIs. Send a sample of ${MAX_NPIS} and the numbers will hold for the rest of the segment - or talk to us and we will measure the whole list.`,
  "no-column": "We could not find the NPIs in that file. Name a column “NPI”, or paste them into the box instead.",
  "too-large": "That file is larger than this report takes. Send a CSV of the NPI column on its own, or paste them.",
  "too-many": `This connection has checked its hour's worth of NPIs. Wait an hour and the next list will run, or write to us and we will measure the whole segment in one go.`,
  challenge:
    "We could not confirm you are a person, so nothing was measured. Complete the check above the button and try again.",
  "challenge-down":
    "The check that keeps automated requests out is not answering. Try again in a minute.",
  unavailable: "Something went wrong on our side and nothing was measured. Please try again shortly.",
  failed: "That list could not be read. Check that it is NPIs, one per line, and try again.",
};

function one(value: string | string[] | undefined): string | null {
  return typeof value === "string" ? value : null;
}

export default async function TestYourListPage({ searchParams }: Props) {
  await connection();
  const error = one((await searchParams).error);

  return (
    <main>
      <section className="hero short">
        <div className="wrap">
          <span className="eyebrow">
            <span className="dot" aria-hidden="true" />
            Your list · your numbers · no account
          </span>
          <h1>Stop comparing claims. Measure us on your own list.</h1>
          <p className="lede">
            Paste up to {MAX_NPIS} NPIs you already hold. You will get the fill rate for every field
            we could put beside them, the trust tier on each work email, and how recently each record
            was last confirmed - counted over <em>your</em> list, by the same engine that fills a
            file when you send us one. Nothing is revealed and nothing is charged.
          </p>
        </div>
      </section>

      <section className="wrap remove-layout">
        <div>
          <h2>Your list</h2>
          {error && (
            <div className="notice stop" role="alert" style={{ marginTop: 16 }}>
              {ERRORS[error] ?? ERRORS.failed}
            </div>
          )}

          <form
            className="form"
            method="post"
            action="/api/list-test"
            encType="multipart/form-data"
            style={{ marginTop: 20 }}
          >
            <div className="field">
              <label htmlFor="list">Paste your NPIs</label>
              <textarea
                id="list"
                name="list"
                rows={10}
                maxLength={4000}
                placeholder={"1234567893\n1245319599\n1023065117"}
                aria-describedby="list-help"
              />
              <span className="fine" id="list-help">
                One per line, or separated by commas - any run of ten digits is read as an NPI.
                Between {MIN_NPIS} and {MAX_NPIS} of them. We check the identifier&rsquo;s own check
                digit, drop repeats, and tell you how many of each there were.
              </span>
            </div>

            <div className="field">
              <label htmlFor="file">Or upload a CSV</label>
              <input id="file" name="file" type="file" accept=".csv,.tsv,.txt,text/csv" />
              <span className="fine">
                A CSV or TSV with a column of NPIs - the other columns are ignored. We find the NPI
                column the same way our append tool does, and the result says which one we read. A
                spreadsheet needs saving as CSV first: this form takes text only.
              </span>
            </div>

            <Turnstile action="list" />
            <button type="submit" className="btn primary lg">
              Measure my list
            </button>
            <p className="fine" style={{ marginTop: 14 }}>
              By pressing this you are asking us to count what we hold for those identifiers. You are
              not creating an account, joining a mailing list or agreeing to anything.
            </p>
          </form>
        </div>

        <aside>
          <div className="panel">
            <h2 style={{ fontSize: "1.15rem" }}>What you get, and what you do not</h2>
            <p className="fine" style={{ marginTop: 12 }}>
              <strong>You get counts.</strong> How many of your NPIs we hold at all; how many are
              inactive; the fill rate for practice phone, work email by trust tier, specialty,
              practice location, employer, billing group and license; the fields we hold that you may
              not have thought to ask for; and how long ago each record was last confirmed. Every
              figure as <em>n</em> of the number you sent, never a percentage on its own.
            </p>
            <p className="fine" style={{ marginTop: 12 }}>
              <strong>You do not get contact details.</strong> Not one email address, not one phone
              number, not one row of anybody&rsquo;s record. This report proves coverage, not
              content. We are saying so here rather than letting you find out at the bottom of the
              results, and it is the reason the report needs no contract: it hands over nothing that
              is ours to sell.
            </p>
            <p className="fine" style={{ marginTop: 12 }}>
              <strong>You get the gaps too.</strong> The report names what we do <em>not</em> hold
              for your list. A supplier who will not tell you where their data thins out is a
              supplier you find out about after you have paid.
            </p>
          </div>

          <div className="panel">
            <h2 style={{ fontSize: "1.15rem" }}>What we do with your list</h2>
            <p className="fine" style={{ marginTop: 12 }}>
              We read it, count against it, and throw it away inside the request. The NPIs you paste
              are never stored - there is nowhere in the database to put one. What is stored is the
              counts, so the result keeps its own link for {RETENTION_DAYS} days and you can send it
              to a colleague. After that the link stops answering and the row is deleted.
            </p>
            <p className="fine" style={{ marginTop: 12 }}>
              Records somebody has asked us to suppress are not counted as held - they read exactly
              as an NPI we have never had, which is the point of a suppression. See{" "}
              <Link href="/remove-my-information">Remove my information</Link> and our{" "}
              <Link href="/privacy">Privacy Policy</Link>.
            </p>
          </div>

          <div className="panel">
            <h2 style={{ fontSize: "1.15rem" }}>Why {MIN_NPIS} is the minimum</h2>
            <p className="fine" style={{ marginTop: 12 }}>
              Two reasons, and they point the same way. A fill rate over three records is not a fill
              rate - it invites you to multiply it by four thousand. And a report over a single
              identifier would be a per-record lookup rather than a measurement of a segment, which
              is not what this is for and not something we will hand out to a stranger.
            </p>
            <p className="fine" style={{ marginTop: 12 }}>
              The same figures are published per specialty and per state on the{" "}
              <Link href="/lists">list pages</Link>, computed the same way - so you can check this
              report against them before you believe either.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}

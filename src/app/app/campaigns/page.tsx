import { Fragment } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { FormatAndPreset } from "@/components/ExportControls";
import {
  DESTINATIONS,
  MERGE_FIELDS,
  OBLIGATIONS,
  destination,
  proposedSteps,
  verdict,
  type Reach,
} from "@/lib/campaign";
import { DEFAULT_CRM_PRESET, DEFAULT_FORMAT } from "@/lib/exportPresets";
import { getLists, listProviders, type ListRow } from "@/lib/session";

/**
 * Build a campaign: pick who, see how many of them you can actually reach, and hand them to the
 * tool that sends.
 *
 * The thing this page is careful not to be is a mail server. We do not send the email - see
 * `lib/campaign.ts` for why that is a decision rather than a gap - and the page says so where
 * somebody is deciding, not in a footnote. What it does instead is the part the data makes
 * possible: the reachability number that says whether a campaign is worth running at all, and a
 * file whose header row matches the merge fields in the copy.
 *
 * All four destinations work today on endpoints that already exist. The one worth noticing is the
 * activation file - hashed identifiers for LiveRamp, The Trade Desk, Google Customer Match and
 * Meta - which has been reachable with `providers.export` since it was written and has never had
 * a screen.
 *
 * Forms and redirects, no client JavaScript, like the rest of the signed-in site.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Campaigns",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const UUID = /^[0-9a-f-]{36}$/i;

const ERRORS: Record<string, string> = {
  "needs-destination": "Choose where the audience should go.",
  "needs-audience": "Choose a list first. A campaign with no audience would be the whole register.",
  "activation-residence":
    "The activation file is built from provider data only, so it cannot be filtered on home address or cell phone.",
  quota_exceeded:
    "That is more rows than your plan has left — for this month or for today. Your balance is on Plan and usage.",
  format_row_limit: "That is more rows than an Excel workbook holds. Choose CSV.",
  validation_error: "The platform refused one of those filters, so nothing was queued.",
  subscription_inactive: "This organization's subscription is not active, so nothing was queued.",
  forbidden: "Your role cannot start an export. Ask an admin on your team.",
  failed: "That didn't work, and nothing was queued. Try again.",
};

/**
 * The four counts a campaign is decided on, for one list.
 *
 * Four calls with `page_size=1`: the rows are not wanted, only the totals, and asking the platform
 * to count is cheaper than asking it to count and then serialise fifty providers. They run
 * together because they are independent.
 */
async function reachOf(listId: string): Promise<Reach | null> {
  // `null` when the platform did not answer, not zero. Four zeros render as "This audience is
  // empty", which is a statement about the customer's list; a failed request is a statement about
  // us, and the two must not look the same on a page somebody is deciding a campaign from.
  const count = async (extra: Record<string, string>) =>
    (await listProviders(listId, { page_size: 1, status: "any", ...extra }))?.total ?? null;
  const [total, withEmail, withTrustedEmail, withPhone] = await Promise.all([
    count({}),
    count({ has_email: "true" }),
    count({ has_email: "true", email_trust: "trusted" }),
    count({ has_phone: "true" }),
  ]);
  if (total === null || withEmail === null || withTrustedEmail === null || withPhone === null) return null;
  return {
    total,
    withEmail,
    withTrustedEmail,
    withPhone,
  };
}

export default async function CampaignsPage({ searchParams }: Props) {
  const params = await searchParams;
  const one = (name: string): string =>
    Array.isArray(params[name]) ? String(params[name]?.[0] ?? "") : String(params[name] ?? "");

  const loadedLists = await getLists();
  const lists = loadedLists ?? [];
  const listId = UUID.test(one("list_id")) ? one("list_id") : "";
  const chosenList = lists.find((row) => row.id === listId) ?? null;
  const chosen = destination(one("destination")) ?? DESTINATIONS[0];
  const reach = chosenList ? await reachOf(chosenList.id) : null;
  const said = reach ? verdict(reach, chosen.channel) : null;
  const steps = proposedSteps(chosen.channel);
  const error = ERRORS[one("error")];

  const here = new URLSearchParams();
  if (listId) here.set("list_id", listId);
  if (chosen.id !== DESTINATIONS[0].id) here.set("destination", chosen.id);
  const returnTo = `/app/campaigns${here.toString() ? `?${here}` : ""}`;

  return (
    <main className="wrap app-main">
      {loadedLists === null && <p className="notice warn" role="alert">Your saved lists could not be loaded. Refresh to try again; this does not mean your lists are empty.</p>}
      <header className="ps-head">
        <div className="ps-head-text">
          <h1>Build a campaign</h1>
          <p className="lede">
            Pick an audience, see how much of it you can actually reach, and hand it to the tool
            that sends. We do not send the email: it goes out from your domain, in your sequencer,
            where the unsubscribe link and the sender obligations belong to you.
          </p>
        </div>
      </header>

      {error && (
        <div className="notice stop" role="alert">
          {error}
        </div>
      )}

      {/* 1 - who */}
      <div className="panel">
        <h2>1. Who</h2>
        {lists.length === 0 ? (
          <p className="fine">
            A campaign starts from a list. Run a <Link href="/app/search">search</Link>, tick the
            rows you want, and name a list — then come back here.
          </p>
        ) : (
          <form method="get" action="/app/campaigns" className="pickbar">
            <label htmlFor="list_id" className="sr-only">
              Which list
            </label>
            <select id="list_id" name="list_id" defaultValue={listId}>
              <option value="">Choose a list…</option>
              {lists.map((row: ListRow) => (
                <option key={row.id} value={row.id}>
                  {row.name} ({row.member_count.toLocaleString("en-US")})
                </option>
              ))}
            </select>
            <input type="hidden" name="destination" value={chosen.id} />
            <button type="submit" className="btn">
              Use this list
            </button>
          </form>
        )}
      </div>

      {/* 2 - where it goes, which decides which reachability number matters */}
      <div className="panel">
        <h2>2. Where it goes</h2>
        <form method="get" action="/app/campaigns" className="form">
          <input type="hidden" name="list_id" value={listId} />
          <div className="pick-cards">
            {DESTINATIONS.map((option) => (
              <label key={option.id} className="field ps-tick">
                <input
                  type="radio"
                  name="destination"
                  value={option.id}
                  defaultChecked={option.id === chosen.id}
                />
                <b>{option.label}</b>
                <span className="fine">{option.examples}</span>
                <span className="fine">{option.how}</span>
              </label>
            ))}
          </div>
          <button type="submit" className="btn">
            Choose
          </button>
        </form>
      </div>

      {/* 3 - the number that decides whether to run it at all */}
      <div className="panel">
        <h2>3. How many you can reach</h2>
        {chosenList && reach === null ? (
          <div className="notice warn" role="alert">
            The platform did not answer, so this audience could not be counted. Nothing was
            queued &mdash; try again in a moment.
          </div>
        ) : !chosenList || !reach || !said ? (
          <p className="fine">Choose a list above and this is counted from it.</p>
        ) : (
          <>
            <div className="stats">
              <div className="stat">
                <span className="big num">{reach.total.toLocaleString("en-US")}</span>
                <span className="fine">on the list</span>
              </div>
              <div className="stat">
                <span className="big num">{said.usable.toLocaleString("en-US")}</span>
                <span className="fine">
                  reachable {chosen.channel === "phone" ? "by phone" : chosen.channel === "identity" ? "as a hashed key" : "by email"}
                </span>
              </div>
              <div className="stat">
                <span className="big num">
                  {reach.withTrustedEmail.toLocaleString("en-US")}
                </span>
                <span className="fine">trusted-tier addresses</span>
              </div>
            </div>
            <p className={said.thin ? "notice warn" : "fine"}>
              {said.note}
              {said.thin && (
                <>
                  {" "}
                  Most of this audience cannot be reached on this channel. Narrowing the search to{" "}
                  <i>has a work email</i> before building the list costs nothing and makes the
                  campaign&rsquo;s numbers mean something.
                </>
              )}
            </p>
            {/* The share is of the whole audience, not of the rows that have an address. A list
                where nearly every address is trusted but only a fifth of rows have one at all is a
                thin campaign dressed up as a good one. */}
            <p className="fine">
              Counted over the whole list, including anyone who has since gone inactive — a list
              keeps the people it was built around.
            </p>
          </>
        )}
      </div>

      {/* 4 - the copy, and the only reason this page knows about merge fields */}
      <div className="panel">
        <h2>4. The sequence</h2>
        <p className="fine">
          A starting point, not a campaign: a template nobody edits is a template every recipient
          has already seen. What matters here is the placeholders — your sequencer builds its
          variables out of the file&rsquo;s header row, so these are the names it will offer you.
        </p>
        <ol className="checklist">
          {steps.map((step) => (
            <li key={step.day}>
              <b>
                Day {step.day} · {step.what}
              </b>
              <span className="fine">{step.body}</span>
            </li>
          ))}
        </ol>
        <h3>The merge fields</h3>
        <div className="ps-tw">
          <table>
            <thead>
              <tr>
                <th>Column in your file</th>
                <th>What it holds</th>
              </tr>
            </thead>
            <tbody>
              {MERGE_FIELDS.map((field) => (
                <tr key={field.header}>
                  <td className="mono">{field.header}</td>
                  <td className="fine">
                    {field.what}
                    {field.blankForOrganisations && (
                      <>
                        {" "}
                        <b>Empty for an organization NPI</b> — &ldquo;Hi {"{{First name}}"}&rdquo;
                        sends &ldquo;Hi&rdquo; to a hospital.
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5 - the handoff */}
      <div className="panel">
        <h2>5. Hand it over</h2>
        {!chosenList ? (
          <p className="fine">Choose a list above first.</p>
        ) : (
          <form method="post" action="/api/app/campaign" className="form">
            <input type="hidden" name="list_id" value={chosenList.id} />
            {/* A list keeps inactive providers deliberately, so the file does too unless the
                customer narrowed it. Stated as a field rather than left to the default, which is
                `active`. */}
            <input type="hidden" name="status" value="any" />
            <input type="hidden" name="destination" value={chosen.id} />
            <input type="hidden" name="return_to" value={returnTo} />

            {chosen.id === "activation" ? (
              <>
                <p className="fine">
                  Twelve columns: an opaque row id; the best email hashed three ways; the phone
                  hashed; first and last name each hashed; and <b>ZIP, state, country, specialty
                  and credentials in the clear</b>. There is no NPI and no plaintext identifier.
                  Suppressed values are withheld before hashing, and anyone left with no key at
                  all is counted and left out.
                </p>
                <p className="fine">
                  The last two are worth knowing about: specialty and credentials are not
                  identifiers, but they are not hashed either, so the file tells the platform you
                  send it to what kind of clinician each row is.
                </p>
                <div className="field">
                  <label htmlFor="only_trusted_emails">Which addresses to include</label>
                  <select id="only_trusted_emails" name="only_trusted_emails" defaultValue="true">
                    <option value="true">Trusted-tier addresses only (recommended)</option>
                    <option value="false">Any address we hold</option>
                  </select>
                  <span className="fine">
                    Every address in a file that leaves here is a claim that it belongs to that
                    person, which is why the narrow one is the default.
                  </span>
                </div>
              </>
            ) : chosen.id === "crm" ? (
              <>
                <p className="fine">
                  Choose your CRM&rsquo;s shape and the file arrives with that CRM&rsquo;s own
                  field names as its headers, ready to import.
                </p>
                <FormatAndPreset
                  idPrefix="campaign"
                  preset={DEFAULT_CRM_PRESET}
                  format={DEFAULT_FORMAT}
                  only="crm"
                />
              </>
            ) : (
              <p className="fine">
                The file uses the{" "}
                <b>
                  {chosen.preset === "outreach"
                    ? "Name in parts, work email and practice"
                    : "Identity and practice"}
                </b>{" "}
                column set
                {chosen.preset === "outreach"
                  ? " — its header row is exactly the merge fields above, in that order."
                  : ", with the practice phone on every row."}
              </p>
            )}

            <button type="submit" className="btn primary">
              Queue the file for {chosen.label.replace(/^(An?|Your) /, "")}
            </button>
            <p className="fine">
              {chosenList.member_count.toLocaleString("en-US")} row
              {chosenList.member_count === 1 ? "" : "s"} against your plan&rsquo;s allowance. It
              appears on <Link href="/app/exports">Exports</Link> when it is ready.
            </p>
          </form>
        )}
      </div>

      <div className="panel">
        <h2>Before you send</h2>
        <dl className="deflist">
          {/* A keyed Fragment, not a wrapper element: `.deflist` is a two-column grid whose
              children are the terms and the values, so a <div> around each pair makes the grid
              lay out pairs two-across with the term stacked on its value. */}
          {OBLIGATIONS.map((item) => (
            <Fragment key={item.title}>
              <dt>{item.title}</dt>
              <dd>{item.body}</dd>
            </Fragment>
          ))}
        </dl>
        <p className="fine">
          This is what we know about our own data, not legal advice. Your counsel decides what your
          campaign needs.
        </p>
      </div>
    </main>
  );
}

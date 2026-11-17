import { connection } from "next/server";
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { providerCount, providerCountWhere } from "@/lib/api";
import { FACILITY_KINDS } from "@/lib/facilities";
import { roleIndexOrEmpty } from "@/lib/roles";
import { siteUrl, socialCard } from "@/lib/site";

/**
 * EHR/EMR technographics, and the named people at the organizations that run them.
 *
 * Every figure here is read live through `lib/api.ts`, the way `/data` does it, and a figure that
 * cannot be read takes its sentence with it rather than rendering a zero. The page used to carry
 * its numbers as literals - 349,177 clinicians, 51 systems, 6.1M contacts, and a count against
 * each system - which were true on the day they were typed and were drifting the day after. A
 * claim nobody can recompute is a claim a buyer will eventually disprove.
 *
 * The temptation with technographics is to imply a census - "Epic: 206,175" reads like market
 * share if nobody says otherwise - so the table says what the figure is: the clinicians whose
 * system we can name and evidence. The share column is explicitly a share of the systems listed
 * here, because a share of the whole named set is not a number this page can read.
 *
 * Two claims were cut rather than converted. "51 systems identified" has no public equivalent:
 * the endpoint that counts distinct systems is an internal one, and a key like this site's cannot
 * call it. "6.1M named people at healthcare organizations" likewise - what can be read publicly
 * is the leadership contacts published at certified facilities, which is a smaller and different
 * thing, so that is what the stat says it is.
 *
 * The system names are listed here rather than read, because the API takes an exact name as a
 * filter and has no public endpoint that enumerates them. A name that stops matching returns
 * nothing, and a row with nothing behind it is dropped rather than printed as a zero.
 */

const SYSTEM_NAMES = [
  "Epic",
  "athenahealth",
  "Oracle Health (Cerner)",
  "NextGen Healthcare",
  "Practice Fusion",
  "TherapyNotes",
  "SimplePractice",
  "Elation Health",
  "eClinicalWorks",
] as const;

type SystemRow = { name: string; clinicians: number };

type Figures = {
  /** Every provider on the platform, individuals and organizations. */
  providers: number | null;
  /** The systems we could read a count for today, largest first. */
  systems: SystemRow[];
  /** Clinicians across those systems - the denominator the share column is honest about. */
  listed: number | null;
  /** Leadership contacts published at certified facilities, as `/data` counts them. */
  leadership: number | null;
};

/** A positive number, or null - so "could not read it" and "it is zero" render the same way. */
function some(value: number): number | null {
  return value > 0 ? value : null;
}

async function figures(): Promise<Figures> {
  const [providers, counted, roles] = await Promise.all([
    providerCount(),
    Promise.all(
      SYSTEM_NAMES.map(
        async (name): Promise<{ name: string; clinicians: number | null }> => ({
          name,
          // Individuals only: the column says clinicians, so the filter has to say so too.
          clinicians: await providerCountWhere({ ehr_system: name, type: "individual" }),
        }),
      ),
    ),
    roleIndexOrEmpty(),
  ]);

  const systems: SystemRow[] = counted
    .filter((row) => row.clinicians !== null && row.clinicians > 0)
    .map((row) => ({ name: row.name, clinicians: row.clinicians as number }))
    .sort((a, b) => b.clinicians - a.clinicians);

  return {
    providers,
    systems,
    listed: some(systems.reduce((total, row) => total + row.clinicians, 0)),
    leadership: some(
      FACILITY_KINDS.reduce((total, kind) => total + (roles.get("all", kind.type)?.people ?? 0), 0),
    ),
  };
}

function n(value: number | null): string | null {
  return value === null ? null : value.toLocaleString("en-US");
}

const BUYERS = [
  {
    who: "Health IT and digital health",
    looking: "Practices running a system theirs integrates with — or one it replaces.",
    buying: "Target lists by EHR, size and specialty, plus the officer or owner to call.",
  },
  {
    who: "Medical devices and diagnostics",
    looking: "Clinicians in the specialties that use the device, and the facility that buys it.",
    buying: "Specialty-filtered clinician lists tied to the organizations and facilities behind them.",
  },
  {
    who: "Pharma and life sciences",
    looking: "Prescribers by specialty and geography, including the NPs and PAs that prescriber lists miss.",
    buying: "Verified prescriber contacts, affiliation to groups and systems, and change signals.",
  },
  {
    who: "Staffing and recruitment",
    looking: "Who is licensed where, who just arrived, and which organizations are taking people on.",
    buying: "Role and license filters, new-credential and hiring events, contact details to reach them.",
  },
  {
    who: "Revenue cycle and billing",
    looking: "Clean identifiers, correct affiliations, and practices whose billing arrangements changed.",
    buying: "Bulk identifier validation, affiliation data, and an API their own system calls.",
  },
  {
    who: "Payers and networks",
    looking: "Directory accuracy: who practices where, under whom, and whether they are in good standing.",
    buying: "Periodic reconciliation files, standing flags, and address-change signals.",
  },
] as const;

const FAQ = [
  {
    q: "How do you know which EHR a practice runs?",
    a: "From the secure-messaging address a practice publishes. Those addresses sit on hosts operated by the system's vendor, so the host names the system. It is evidence you can inspect rather than a survey response or an estimate.",
  },
  {
    q: "Is this a census of EHR market share?",
    a: "No, and anybody selling you one from this kind of evidence is overstating it. These are the clinicians whose system we can name and show our working for. Practices that publish nothing, or that publish through a message router rather than their vendor, are simply left blank.",
  },
  {
    q: "Why leave a record blank instead of making a best guess?",
    a: "Because roughly half of published hosts belong to message routers that carry traffic for any system. Writing the router's name into an EHR field would put a confident wrong answer in front of your sales team, which is worse than an empty cell they can see.",
  },
  {
    q: "Can I see when a practice changes system?",
    a: "Yes. When a system is replaced the previous one is kept rather than overwritten, so a switch is visible as a dated change. This is newer and thinner than the base data, and we would rather tell you that than imply a complete migration feed.",
  },
  {
    q: "What contacts come with it?",
    a: "Named people at healthcare organizations — authorized officials, owners and officers — with their title, their organization, and a phone number where one is filed. From filings rather than from scraping, and counted on public pages rather than listed.",
  },
  {
    q: "Can I match this against my own account list?",
    a: "Yes. Upload your list of identifiers or organizations and the system, contacts and change signals come back against your own rows, in your own order.",
  },
] as const;

export const metadata: Metadata = {
  title: "EHR and EMR data",
  description:
    "Which EHR a practice runs, evidenced from what the practice publishes rather than estimated, and the named people at the organizations behind them.",
  alternates: { canonical: "/ehr-data" },
  openGraph: socialCard(
    "/ehr-data",
    "EHR and EMR data",
    "Which system a practice runs, counted from filings rather than estimated.",
  ),
};

export default async function EhrDataPage() {
  // At request time, not at build: the build has no API to call, and a page baked without its
  // counts would serve that until the next revalidation. The calls inside stay cached for a day
  // by `call()` in lib/api.ts, so a crawl lands on the cache rather than on the platform.
  await connection();
  const f = await figures().catch(
    (): Figures => ({ providers: null, systems: [], listed: null, leadership: null }),
  );
  const stats: { value: string; label: string }[] = [];
  const push = (value: string | null, label: string) => {
    if (value !== null) stats.push({ value, label });
  };
  // A local, so its narrowing holds inside the table's rows as well as in the test above them.
  const listed = f.listed;
  push(n(listed), "clinicians across the systems below");
  push(n(f.leadership), "leadership contacts at certified facilities, counted by role");
  push(n(f.providers), "providers to filter them from");

  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebPage",
              "@id": siteUrl("/ehr-data#page"),
              name: "EHR and EMR data",
              url: siteUrl("/ehr-data"),
              description: metadata.description as string,
            },
            {
              "@type": "FAQPage",
              mainEntity: FAQ.map(({ q, a }) => ({
                "@type": "Question",
                name: q,
                acceptedAnswer: { "@type": "Answer", text: a },
              })),
            },
          ],
        }}
      />

      {/* The stats strip is the block this hero's bottom padding is for, and it is left out
          rather than shown as zeroes when the counts cannot be read - so when it is gone the hero
          ends at the lede and takes the shorter bottom with it. */}
      <section className={`hero${stats.length > 0 ? "" : " short"}`}>
        <div className="wrap">
          <span className="eyebrow">
            <span className="dot" aria-hidden="true" />
            Evidence on every row · never an estimate
          </span>
          <h1>Which system they run, and who to call about it.</h1>
          <p className="lede">
            Sell into healthcare and two questions decide the quarter: which practices run the
            system you integrate with or replace, and who at those organizations can sign. We
            answer the first with evidence you can inspect, and the second with named people from
            filings.
          </p>

          {stats.length > 0 && (
            <div className="stats" style={{ marginTop: 26 }}>
              {stats.map((s) => (
                <div className="stat" key={s.label}>
                  <span className="value num">{s.value}</span>
                  <span className="label">{s.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow rule">Systems we can name</div>
            <h2>Counted honestly, which means smaller than a market-share chart.</h2>
            <p className="lede">
              These are clinicians whose system is evidenced, not an estimate of who runs what.
              A practice that publishes nothing is blank, and a practice that publishes through a
              message router rather than its vendor is blank too — because that router carries
              traffic for every system in the country and naming it would be a confident wrong
              answer.
            </p>
          </div>

          {/* Counts read at request time. A system whose count cannot be read drops out of the
              table rather than appearing as a zero, and when none of them can be read the table
              goes entirely and the systems are named without numbers. */}
          {f.systems.length > 0 && listed !== null ? (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>System</th>
                      <th>Clinicians we can name</th>
                      <th>Share of these systems</th>
                    </tr>
                  </thead>
                  <tbody>
                    {f.systems.map((s) => (
                      <tr key={s.name}>
                        <td>
                          <b>{s.name}</b>
                        </td>
                        <td className="num">{n(s.clinicians)}</td>
                        <td className="num fine">
                          {((s.clinicians / listed) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="fine" style={{ marginTop: 12 }}>
                The share is of the systems in this table, not of the market and not of every
                system we can name — a share of the whole is a figure this page would have to
                invent. Beyond these there is a long tail of specialty and behavioral-health
                systems; ask for the full list and the counts behind it.
              </p>
            </>
          ) : (
            <p className="fine">
              The systems named here include {SYSTEM_NAMES.join(", ")}, alongside a long tail of
              specialty and behavioral-health systems. Ask for the full list and the counts behind
              it.
            </p>
          )}
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow rule">Who buys this, and what they buy</div>
            <h2>Six kinds of team, one underlying question.</h2>
            <p className="lede">
              Everybody here is trying to find the right clinician or organization and reach a
              person who can decide. What changes is the filter.
            </p>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Who</th>
                  <th>What they are looking for</th>
                  <th>What they buy</th>
                </tr>
              </thead>
              <tbody>
                {BUYERS.map((b) => (
                  <tr key={b.who}>
                    <td>
                      <b>{b.who}</b>
                    </td>
                    <td className="fine">{b.looking}</td>
                    <td className="fine">{b.buying}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow rule">The people behind the organizations</div>
            <h2>Named contacts, from filings rather than guesswork.</h2>
          </div>
          <div className="grid">
            <div className="card feature">
              <h3>Authorized officials</h3>
              <p>
                The person an organization names as responsible when it registers. Title and
                organization on every row, phone where one is filed.
              </p>
            </div>
            <div className="card feature">
              <h3>Owners</h3>
              <p>
                Named ownership interests in certified facilities, including the corporate
                owners behind a chain rather than only the site manager.
              </p>
            </div>
            <div className="card feature">
              <h3>Officers and directors</h3>
              <p>
                Executives of non-profit health systems and of listed healthcare companies, with
                the title each filing gives them.
              </p>
            </div>
            <div className="card feature">
              <h3>Tied to the organization</h3>
              <p>
                Each contact is attached to the organization they belong to, so a system filter
                and a contact list are the same query rather than two lists to reconcile.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap narrow">
          <div className="section-head">
            <div className="eyebrow rule">Questions</div>
            <h2>What technical buyers ask.</h2>
          </div>
          <div className="faq">
            {FAQ.map(({ q, a }) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>

          <div className="cta" style={{ marginTop: 32 }}>
            <h2>Find the practices running your competitor&rsquo;s system.</h2>
            <p className="lede">
              Search free, then sign in to reveal contacts, export the list, or pull it through
              the API.
            </p>
            <div className="actions" style={{ marginTop: 16 }}>
              <Link className="btn primary lg" href="/sign-up">
                Get started
              </Link>
              <Link className="btn lg" href="/intent-data">
                See the change signals
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

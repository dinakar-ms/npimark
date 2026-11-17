import type { Metadata } from "next";
import Link from "next/link";
import HelpSearch from "@/components/HelpSearch";
import { JsonLd } from "@/components/JsonLd";
import { HELP_PAGES, helpPath } from "@/lib/help";
import { siteUrl, socialCard } from "@/lib/site";

/**
 * The help hub.
 *
 * Nine pages, each answering one question somebody arrives with. The hub's job is to get them to
 * the right one in a single glance, so it leads with the question rather than with our heading -
 * "why was my reveal refused", not "reveal semantics".
 *
 * Indexable, and static: nothing here reads the API, and no figure is restated from a plan. The
 * numbers customers ask about are on /pricing, where they are maintained in one place, and the
 * limits a key is actually subject to come back in response headers.
 */

/**
 * The id a question is reachable at. Derived from the question rather than written beside it, so
 * the anchor in the hero and the element it lands on cannot drift apart when a question is
 * reworded - both are the same string put through the same function.
 */
const faqId = (question: string) =>
  `asked-${question
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;

const FAQ = [
  {
    q: "What is a reveal?",
    a: "Opening one provider's contact details. It is counted against your plan's monthly reveal allowance, the same provider is free for the rest of that month, and a reveal that is refused for any reason is never counted.",
  },
  {
    q: "What happens when I reach a plan limit?",
    a: "The request is refused before anything runs, and the refusal says how much you asked for, how much is left and what the limit is. Nothing is half-served: you never get a truncated file that has quietly spent your allowance.",
  },
  {
    q: "What is the difference between a classification and a specialization?",
    a: "A classification is the broad heading a profession or specialty is filed under, and a specialization is one kind of practice beneath it. Asking for a classification matches every specialization under it, which is why a classification is usually the filter you want.",
  },
  {
    q: "How do I get my own details removed?",
    a: "Use the remove my information page. A confirmed request is reviewed by a person and then applied everywhere — search, public pages, counts, exports, appends and the API — and it keeps applying through later refreshes rather than being undone by them.",
  },
  {
    q: "Are home address and cell phone available?",
    a: "Only under a contract that states the permissible use, never over the API, and never on a public page. They are matched to the provider and carry a confidence score rather than being asserted as certain. Talk to us about what your agreement covers.",
  },
];

export const metadata: Metadata = {
  title: "Help and FAQ",
  description:
    "How reveals, plan limits, search filters, email trust tiers, suppression, API keys, exports, accounts and contracted contact data actually work.",
  alternates: { canonical: "/help" },
  openGraph: socialCard(
    "/help",
    "Help and FAQ",
    "How reveals, limits, filters, trust tiers, suppression, keys and exports work.",
  ),
};

export default function HelpPage() {
  return (
    <main className="np-help-page">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebPage",
              "@id": siteUrl("/help#page"),
              name: "Help and FAQ",
              description: metadata.description as string,
              url: siteUrl("/help"),
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

      {/* `short`: the pill row below is type, not a block, so the hero wants the space a
          paragraph wants under it rather than the space a panel does. */}
      <section className="hero short">
        <div className="wrap">
          <span className="eyebrow">
            <span className="dot" aria-hidden="true" />
            Nine answers · no sign-in needed to read them
          </span>
          <h1>How this works, in plain words.</h1>
          <p className="lede">
            Everything below is how the platform actually behaves, not how a brochure would like it
            to. Where the honest answer is a limit, an absence or a refusal, it says so — because
            the version you find out later is the expensive one.
          </p>
          {/* The questions this page already answers furthest down it, put where somebody arriving
              can see them. The hero had nothing under the lede and was a band of empty colour
              field; these are the page's own content rather than something to fill it with.

              Plain anchors, because the target is on this page: no router, no script, and the
              same behaviour with the bundle unrun. Each one lands on its `<details>`, which the
              browser leaves closed - a fragment only expands a disclosure when it points at
              something *inside* it, and pointing at the answer would mean a browser that does not
              do that has nothing to scroll to at all. So the jump puts the question at the top of
              the reading area and the reader opens it, which is the behaviour every browser has
              rather than the better one some of them have. */}
          <nav className="hints" aria-label="Asked most often">
            {FAQ.map(({ q }) => (
              <a key={q} href={`#${faqId(q)}`}>
                {q}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <section className="section"><div className="wrap"><HelpSearch /></div></section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow rule">Pick your question</div>
            <h2>Nine pages, one question each.</h2>
          </div>
          <div className="grid">
            {HELP_PAGES.map((page) => (
              <Link className="card feature" key={page.slug} href={helpPath(page.slug)}>
                <h3>{page.label}</h3>
                <p>{page.blurb}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap narrow">
          <div className="section-head">
            <div className="eyebrow rule">Asked most often</div>
            <h2>The short answers.</h2>
          </div>
          <div className="faq">
            {FAQ.map(({ q, a }) => (
              <details key={q} id={faqId(q)}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap narrow">
          <div className="section-head">
            <div className="eyebrow rule">Elsewhere on the site</div>
            <h2>Where the rest of the answers live.</h2>
          </div>
          {/* The same shape as the directory's lists - a link, and a sentence about where it goes
              - and set the same way, so the sentences line up with one another rather than each
              starting wherever its link happened to stop. */}
          <dl className="deflist">
            <dt>
              <Link href="/pricing">Pricing</Link>
            </dt>
            <dd>
              the plans, what each one includes, and the allowances behind the limits described
              here.
            </dd>
            <dt>
              <Link href="/data">What is in the data</Link>
            </dt>
            <dd>
              the fields a record carries, how often each is refreshed, and what the platform does
              not hold at all.
            </dd>
            <dt>
              <Link href="/docs/api">API reference</Link>
            </dt>
            <dd>
              every endpoint, the scopes each needs, and the headers that report your pace and your
              quota.
            </dd>
            <dt>
              <Link href="/status">Platform status</Link>
            </dt>
            <dd>
              whether search, reveals, exports and the API are working right now &mdash; the page to
              check before writing to us about something being slow.
            </dd>
            <dt>
              <Link href="/remove-my-information">Remove my information</Link>
            </dt>
            <dd>for a healthcare professional who wants their own details taken out.</dd>
            <dt>
              <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy</Link>
            </dt>
            <dd>
              what you agree to, and what we do with what we hold. Help explains; those two govern.
            </dd>
          </dl>
        </div>
      </section>
    </main>
  );
}

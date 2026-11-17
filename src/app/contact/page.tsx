import { connection } from "next/server";
import type { Metadata } from "next";
import { draftOf, draftRobots } from "@/lib/draft";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { ChannelNote, DraftNotice, FactParagraph } from "@/components/OwnerNotes";
import { COMPANY, channels, answered } from "@/content/company";
import { TARGET_DAYS } from "@/content/legal/removal";
import { SITE_NAME, siteUrl, socialCard } from "@/lib/site";

/**
 * The four ways to reach the company, each with what it is for.
 *
 * Two things this page must not do. It must not print a `mailto:` for a mailbox nobody has set -
 * an address that bounces is worse than no address - so every route comes from `channels()` in
 * `content/company.ts`, which resolves SALES_EMAIL, SUPPORT_EMAIL, PRIVACY_EMAIL and
 * SECURITY_EMAIL at request time and falls back to a live page when one is unset. And it must not
 * bury the removal form: most people who write to a data company are not customers, they are
 * asking to be taken out, and that is a form rather than a conversation.
 */

export const metadata: Metadata = {
  // Not indexed while any fact below is still a question: the page prints the question
  // itself, and an internal note is not something to leave in a search index. It
  // re-indexes itself when the last one is answered. See lib/draft.ts.
  ...draftRobots("/contact"),
  title: "Contact us",
  description:
    "How to reach NPI Mark: sales and plans, support for customers, privacy and removal requests, and security reports - with what each route is for.",
  alternates: { canonical: "/contact" },
  openGraph: socialCard(
    "/contact",
    "Contact us",
    "Sales, support, privacy and removal, and security reports - and what each route is for.",
  ),
};

export default async function ContactPage() {
  // The addresses are read from the environment at request time, so a mailbox goes live with a
  // restart rather than with a deploy. Nothing about the visitor is read.
  await connection();
  const contact = channels();
  const named = contact.filter((c) => c.address !== null);

  return (
    <main className="np-company-page np-contact-page">
      <div className="wrap" style={{paddingTop: 24}}><Link className="btn primary" href="/bulk-data">Buying a large list? Request a bulk quote</Link></div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "ContactPage",
              "@id": siteUrl("/contact#page"),
              name: "Contact us",
              url: siteUrl("/contact"),
              description: metadata.description as string,
            },
            {
              "@type": "Organization",
              "@id": siteUrl("/#org"),
              name: SITE_NAME,
              url: siteUrl("/"),
              // Only the mailboxes that are actually set. A contactPoint pointing at an address
              // nobody reads is a machine-readable version of the same mistake.
              ...(named.length > 0
                ? {
                    contactPoint: named.map((c) => ({
                      "@type": "ContactPoint",
                      contactType: c.name,
                      email: c.address,
                      areaServed: "US",
                      availableLanguage: "English",
                    })),
                  }
                : {}),
            },
          ],
        }}
      />

      <section className="section" style={{ paddingTop: 40 }}>
        <div className="wrap">
          <DraftNotice {...draftOf("/contact")} />
          <div className="section-head">
            <div className="eyebrow rule">Contact</div>
            <h1 style={{ fontSize: "clamp(1.8rem, 3.8vw, 2.7rem)" }}>
              Let’s talk about your next provider-data project.
            </h1>
            <p className="lede">
              Pick the one that fits what you are writing about. If you are here because your own
              details are in the database and you want them out, you do not need to write to anybody:
              use the <Link href="/remove-my-information">removal form</Link>, which is open to
              everyone and free.
            </p>
          </div>

          <div className="np-contact-brief">
            <div><span className="eyebrow">A useful first conversation</span><h2>Tell us who you need to find.</h2><p>Share your target specialties, states, approximate volume and whether you need the website, exports or an API integration. That gives us a concrete starting point for discussing fit.</p></div>
            <div className="actions"><a className="btn primary lg" href="#contact-sales">Explore plans with us</a><Link className="btn lg" href="/tour">Take the product tour</Link><Link className="np-text-link" href="/why-npi-mark#compare-platforms">Comparing providers? Start here →</Link></div>
          </div>
          <div className="grid pairs np-contact-grid">
            {contact.map((c) => (
              <div className="panel np-contact-card" id={`contact-${c.key}`} key={c.key}>
                <h2 style={{ fontSize: "1.15rem" }}>{c.name}</h2>
                <p className="fine">{c.what}</p>
                <p className="np-contact-action">
                  {c.href.startsWith("mailto:") ? (
                    <a className="btn primary" href={c.href}>
                      {c.label}
                    </a>
                  ) : (
                    <Link className="btn primary" href={c.href}>
                      {c.label}
                    </Link>
                  )}
                </p>
                {c.address === null && (
                  <p className="fine">
                    <ChannelNote of={c} />
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow rule">What to expect</div>
            <h2>What each route does with your message.</h2>
          </div>
          <div className="prose np-contact-expectations">
            <section className="np-contact-expectation"><h3>If you are asking to be removed</h3>
            <p>
              The form is the fastest route and the only one that needs no account. We email a
              confirmation link to the address you give, review the request when you follow it, and
              write to tell you the outcome; the target is {TARGET_DAYS} days from verifying it. A
              removal is a suppression rather than a deletion, and it applies to every search, page,
              count, export and appended file, and keeps applying when the data is next refreshed.
              What each kind of request does is set out in{" "}
              <Link href="/privacy-choices">your privacy choices</Link>.
            </p></section>

            <section className="np-contact-expectation"><h3>If you are a customer with a problem</h3>
            <p>
              If the platform itself looks slow or broken, <Link href="/status">platform status</Link>{" "}
              says whether search, reveals, exports and the API are working right now, and when we
              last checked &mdash; which is faster than writing to us and waiting for the same
              answer. Otherwise: tell us what you searched for and what you expected, or the
              identifier of the export or append job that failed - every job keeps one, and it is
              what lets us find your run rather than guess at it. The{" "}
              <Link href="/help">help pages</Link> cover the questions that come up most, including
              how allowances, reveals and API limits behave.
            </p></section>

            <section className="np-contact-expectation"><h3>If you are reporting a vulnerability</h3>
            <p>
              Send enough for us to reproduce it and we will confirm we have it. Please do not test
              against other people&apos;s accounts or records, and do not download more data than
              you need to demonstrate the problem. What is in scope, and what we can tell you about
              how the platform is protected, is on <Link href="/security">security and trust</Link>.
            </p></section>

            <section className="np-contact-expectation"><h3>If you want to buy something</h3>
            <p>
              Say what you are trying to reach and how you intend to use it. The{" "}
              <Link href="/pricing">pricing page</Link> lists what each plan includes and what it
              costs; the prices there are introductory. You choose a plan at sign-up and card details
              are taken in checkout. Check the current plan page for purchase options and contact sales for contract requirements. Access to
              provider-matched home address and cell phone is arranged under
              a signed contract with a stated permissible use rather than bought online.
            </p></section>

            {[COMPANY.phone, COMPANY.office].some((fact) => answered(fact) !== null) && (
              <>
                <h3>By phone or by post</h3>
                <FactParagraph of={COMPANY.phone} />
                <FactParagraph of={COMPANY.office} />
              </>
            )}
          </div>

          <div className="cta" style={{ marginTop: 32 }}>
            <h2>Before you write about the data itself.</h2>
            <p className="lede">
              Search is open without an account, and the field catalog says what a record holds
              and how often each part of it is refreshed. Most questions about coverage are faster
              to answer that way than by asking us.
            </p>
            <div className="actions">
              <Link className="btn primary lg" href="/search">
                Search providers
              </Link>
              <Link className="btn lg" href="/data">
                What is in the data
              </Link>
              <Link className="btn lg" href="/about">
                About the company
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

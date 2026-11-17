import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { HELP_PAGES, helpPath } from "@/lib/help";
import { siteUrl } from "@/lib/site";

/**
 * One shape for the help pages, so nine of them stay consistent and cheap to add to.
 *
 * A help page answers one question a customer arrives with, which is why each is its own page
 * rather than a heading on a long one: the person searching "why was my reveal refused" wants a
 * page about that, and a crawler can only rank a page that exists. Sections carry prose and, where
 * the answer is really a list of named things - trust tiers, key scopes, response headers - a
 * two-column table, because a table is how somebody reads that and a paragraph is not.
 *
 * Nothing here reads the API. These pages describe how the product behaves; they quote no counts,
 * and plan figures live on /pricing where they are maintained once. That also means a help page
 * renders the same whether or not the platform is reachable, which is the state somebody is often
 * in when they come looking for help.
 */

export type HelpSection = {
  heading: string;
  /** Paragraphs. A `ReactNode` so a sentence can carry a link where a link is the answer. */
  body: readonly ReactNode[];
  /** Where the answer is a set of named things rather than an argument. */
  table?: {
    head: readonly [string, string];
    rows: readonly (readonly [string, ReactNode])[];
  };
};

export type HelpArticle = {
  /** Path segment under /help; also the key into HELP_PAGES. */
  slug: string;
  h1: string;
  lede: string;
  sections: readonly HelpSection[];
  /**
   * Questions in the customer's own words. Rendered as an FAQ and published as FAQPage, so it
   * belongs only on a page where these really are the questions asked - not as a way of getting
   * structured data onto a page that is a description.
   */
  faq?: readonly { q: string; a: string }[];
};

export function HelpArticle({ article, name }: { article: HelpArticle; name: string }) {
  const here = helpPath(article.slug);
  const others = HELP_PAGES.filter((page) => page.slug !== article.slug);
  const faq = article.faq ?? [];

  return (
    <main className="np-help-page">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebPage",
              "@id": siteUrl(`${here}#page`),
              name,
              description: article.lede,
              url: siteUrl(here),
              // The hub, named rather than only referenced: a search engine reads one page at a
              // time, and a bare `@id` for a node that is declared on another page resolves to
              // nothing here.
              isPartOf: {
                "@type": "WebPage",
                "@id": siteUrl(`${helpPath()}#page`),
                name: "Help and FAQ",
                url: siteUrl(helpPath()),
              },
            },
            ...(faq.length > 0
              ? [
                  {
                    "@type": "FAQPage",
                    mainEntity: faq.map(({ q, a }) => ({
                      "@type": "Question",
                      name: q,
                      acceptedAnswer: { "@type": "Answer", text: a },
                    })),
                  },
                ]
              : []),
          ],
        }}
      />

      {/* Short, because this hero carries a breadcrumb, a title and a sentence and nothing else.
          A full hero's bottom padding is room for what the marketing pages put under their lede;
          here it was a tall band of empty colour field. The other help pages are deliberately not
          lifted up into it to fill it: they are already at the foot of the article, which is where
          somebody who has finished reading one goes looking for the next. */}
      <section className="hero short">
        <div className="wrap">
          <nav className="eyebrow" aria-label="Breadcrumb">
            <Link href="/help">Help</Link>
          </nav>
          <h1>{article.h1}</h1>
          <p className="lede">{article.lede}</p>
        </div>
      </section>

      <section className="section">
        <div className="wrap np-help-layout">
          <aside className="np-help-sidebar">
            <nav aria-label="On this page">
              <h2>On this page</h2>
              {article.sections.map((section, index) => (
                <a key={section.heading} href={`#help-section-${index}`}>{section.heading}</a>
              ))}
              {faq.length > 0 && <a href="#help-questions">Questions</a>}
              <a href="#help-related">Related help</a>
            </nav>
            <Link className="btn primary" href="/search">Try provider search</Link>
            <Link className="np-text-link" href="/contact">Contact support →</Link>
          </aside>
          <div className="np-help-content">
          {article.sections.map((section, sectionIndex) => (
            <section className="np-help-section" id={`help-section-${sectionIndex}`} key={section.heading}>
              <h2>{section.heading}</h2>
              <div className="np-help-section-body">
              {/* The paragraphs of one section, in the order they are written: the position is
                  the only key there is, and it is a stable one - the list never reorders. */}
              {section.body.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
              {section.table && (
                <div className="table-wrap" style={{ marginTop: 14 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>{section.table.head[0]}</th>
                        <th>{section.table.head[1]}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.table.rows.map(([term, means]) => (
                        <tr key={term}>
                          <td>
                            <b>{term}</b>
                          </td>
                          <td className="fine">{means}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              </div>
            </section>
          ))}

          {faq.length > 0 && (
            <>
              <h2 id="help-questions">Questions</h2>
              <div className="faq">
                {faq.map(({ q, a }) => (
                  <details key={q}>
                    <summary>{q}</summary>
                    <p>{a}</p>
                  </details>
                ))}
              </div>
            </>
          )}

          <h2 id="help-related">Other help pages</h2>
          {/* A link and the question it answers is a description list, not a sentence with a link
              at the front of it: set inline the label broke across lines and each blurb started
              somewhere different. */}
          <dl className="deflist">
            {others.map((page) => (
              <Fragment key={page.slug}>
                <dt>
                  <Link href={helpPath(page.slug)}>{page.label}</Link>
                </dt>
                <dd>{page.blurb}</dd>
              </Fragment>
            ))}
          </dl>
          </div>
        </div>
      </section>
    </main>
  );
}

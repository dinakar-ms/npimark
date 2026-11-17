/**
 * The structured data every page family shares: who publishes this site, what the site is, and
 * how a breadcrumb trail is written.
 *
 * One file because the alternative was eight: the breadcrumb trail was being built four different
 * ways, and three of them started at the second level, so the markup disagreed with the trail the
 * page actually displayed. A `BreadcrumbList` that does not match the visible crumbs is worse than
 * none - it tells a search engine the page sits somewhere it does not.
 *
 * Two rules hold here as everywhere on the public site. No source is ever named: the publisher is
 * us, and where a record came from is not a crawler's business. And nothing is asserted that a
 * page does not already say in words - structured data restates the page, it does not embellish it.
 */

import "server-only";
import { supportEmail } from "@/content/legal/version";
import { PRODUCT, SITE_NAME, TAGLINE, siteUrl } from "@/lib/site";

/** The publisher. Declared in full on the home page; referenced by `@id` everywhere else. */
export const ORG_ID = () => siteUrl("/#org");
/** The site itself. Declared in full on the home page, where the search box is read from. */
export const SITE_ID = () => siteUrl("/#site");

/**
 * The publisher, as much of it as another page needs to stand on its own: the identifier that ties
 * it to the home page's fuller description, and enough to be read without it.
 */
export function publisherRef(): Record<string, unknown> {
  return { "@type": "Organization", "@id": ORG_ID(), name: SITE_NAME, url: siteUrl("/") };
}

/** The site, for a page that says it is part of it. */
export function websiteRef(): Record<string, unknown> {
  return {
    "@type": "WebSite",
    "@id": SITE_ID(),
    name: `${SITE_NAME} ${PRODUCT}`,
    url: siteUrl("/"),
  };
}

/**
 * The home page's own two nodes: the publisher, and the site with its search box.
 *
 * `SearchAction` points at the real search page with the real parameter name, which is the only
 * version of this markup worth having - a sitelinks search box that 404s or searches nothing is
 * the one thing worse than not offering one.
 *
 * The publisher carries what we can honestly fill in. There is no logo file yet, no social
 * profiles to claim with `sameAs`, and no postal address that belongs on a public page, so none of
 * those appear. A contact point appears only when a support mailbox is configured, because an
 * address nobody is reading is worse than no address.
 */
export function siteGraph(): Record<string, unknown>[] {
  const support = supportEmail();
  return [
    {
      "@type": "Organization",
      "@id": ORG_ID(),
      name: SITE_NAME,
      legalName: "Lorann LLC",
      alternateName: ["NPI Mark", "NPIMARK"],
      logo: siteUrl("/icon.svg"),
      url: siteUrl("/"),
      description: TAGLINE,
      ...(support
        ? {
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "customer support",
              email: support,
              areaServed: "US",
              availableLanguage: "English",
            },
          }
        : {}),
    },
    {
      "@type": "WebSite",
      "@id": SITE_ID(),
      name: `${SITE_NAME} ${PRODUCT}`,
      url: siteUrl("/"),
      description: TAGLINE,
      inLanguage: "en-US",
      publisher: { "@id": ORG_ID() },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: siteUrl("/search?q={search_term_string}"),
        },
        "query-input": "required name=search_term_string",
      },
    },
  ];
}

/**
 * A breadcrumb trail, starting at the home page because every trail on this site displays it.
 * `items` is the trail as the page shows it, the current page last.
 */
export function breadcrumb(items: readonly { name: string; href: string }[]): Record<string, unknown> {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", href: "/" }, ...items].map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: siteUrl(item.href),
    })),
  };
}

/**
 * The whole provider dataset, which `/data` describes in full. A list page is a slice of it, and
 * says so by `isPartOf` - carrying enough of the node to be read on its own, because a search
 * engine reads one page at a time and an `@id` pointing off this page resolves to nothing.
 */
export const PLATFORM_DATASET_ID = () => siteUrl("/data#dataset");

export function platformDatasetRef(): Record<string, unknown> {
  return {
    "@type": "Dataset",
    "@id": PLATFORM_DATASET_ID(),
    name: `${SITE_NAME} US healthcare provider data`,
    url: siteUrl("/data"),
  };
}

/**
 * The properties every `Dataset` on this site shares.
 *
 * `isAccessibleForFree` is false and says something true: the public pages are free to read, and
 * the records behind them are not. `usageInfo` points at the Terms, which is where what a customer
 * may do with the data is actually written. There is no `license` because there is no licence
 * document to point at, and inventing a URL for one would be the worst kind of wrong: a machine
 * would follow it.
 */
export function datasetBase(): Record<string, unknown> {
  return {
    // The publisher is named in full so the node stands on its own wherever the dataset appears;
    // the creator is the same organisation, referenced rather than repeated.
    publisher: publisherRef(),
    creator: { "@id": ORG_ID() },
    isAccessibleForFree: false,
    usageInfo: siteUrl("/terms"),
    inLanguage: "en-US",
  };
}

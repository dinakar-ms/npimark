import { connection } from "next/server";
import { AUDIENCES } from "@/lib/audiences";
import { FACILITY_KINDS, MIN_CITY } from "@/lib/facilities";
import { GLOSSARY, GLOSSARY_FAMILIES, glossaryPath } from "@/lib/glossary";
import { HELP_PAGES } from "@/lib/help";
import { COVERAGE, SITE_NAME, siteUrl } from "@/lib/site";

/**
 * A plain-language description of the site for language models and the agents built on them.
 * It says what is here, what the data is, how to reach it properly, and what is not allowed,
 * in the same words a person would get.
 *
 * Written to the llmstxt.org convention: an H1 naming the site, a blockquote summary, prose, then
 * H2 sections of markdown link lists - `- [name](url): note` - because that is the shape the
 * readers of this file parse. It used to list bare URLs; a reader looking for a link found none.
 *
 * Rendered when asked, not when built. Every URL in here is absolute, and the origin comes from
 * `SITE_BASE_URL`, which lives in the container's environment and not in the image: baked at
 * build, this file would be a list of paths with no host on them, which is the one thing a
 * machine-readable index of a site cannot be. (It said `force-static` and was exactly that.)
 */

export async function GET(): Promise<Response> {
  await connection();
  const link = (path: string, name: string, note: string) =>
    `- [${name}](${siteUrl(path)}): ${note}`;

  const lines = [
    `# ${SITE_NAME} - US healthcare provider data`,
    "",
    "> Search US healthcare provider records - physicians, nurses, therapists, pharmacists and",
    "> healthcare organizations. Coverage and update dates vary by record and field. Public pages",
    "> carry identity, specialty and practice location; signed-in customers can reveal",
    "> work email, home address and cell phone one provider at a time, export lists, append their",
    "> own files, and use the same data over a REST API.",
    "",
    "Public directory pages provide server-rendered text, with structured data on supported",
    "page types. Interactive account workflows may require JavaScript. Directory counts are",
    "read from the platform; a count that cannot be read is",
    "left out rather than guessed. Where a record came from is not published - what it holds and",
    "how current it is, is.",
    "",
    "## What a record carries",
    "",
    ...COVERAGE.map((c) => `- ${c.code} (refreshed ${(c.cadence === "Continuous" ? "continuously" : c.cadence.toLowerCase())}): ${c.gives}.`),
    "- Home address and mobile are matched to individual providers and are available only to signed-in customers on plans that include them, one record at a time.",
    "",
    "API base URL: https://api.npimark.com/v1. OpenAPI: https://api.npimark.com/openapi.json. Data requests require a scoped API key.",
    "",
    "## Start here",
    "",
    link("/idn-data", "IDN intelligence", "Health system and facility relationships, ownership context and coverage limits."),
    link("/pbm-data", "PBMs and payer relationships", "The difference between plan formulary coverage, provider participation in a plan, and a PBM relationship. Plan formulary coverage is held and prepared as a dataset on request; there is no PBM relationship or rebate dataset."),
    link("/mcp", "MCP for AI assistants", "Integration overview; contact support to confirm availability and supported setup. No public hosted endpoint is advertised."),
    link("/mobile-app", "Mobile app", "Current web access and native app development status. No public app-store release is announced."),
    link("/", "Home", "what this is, the live provider count, and the search box."),
    link("/data", "What is in the data", "the field catalog for a provider and an organization record, the refresh cadence of each group, the work-email trust tiers and what each one means, how suppression is applied, and what the platform does not hold. Carries `Dataset` markup describing the whole collection."),
    link("/fields", "Field reference", "the data dictionary: every field a provider, organization or facility record carries, with what it means in plain English, what it is used for, how complete it is where that is measured, what it costs, and the name it travels under in the API, in an export column and in the append tool. Carries `DefinedTermSet` markup."),
    link("/directory", "Directory", "the way into every browsable family - providers and organizations by name, certified facilities by kind and place, specialists by metro."),
    link("/search", "Provider search", "by name, NPI, state, city, ZIP, specialty and type. Visitors see 25 rows a page and up to 10 pages; contact details are locked."),
    link("/docs/api", "API reference", "the /v1 surface, the scope each route needs, and what every refusal means."),
    "",
    "## Professions",
    "",
    // One line per audience landing page, from the list the pages themselves are registered in.
    ...AUDIENCES.map((audience) => link(`/${audience.slug}`, audience.label, audience.note)),
    "",
    "## Directories and lists",
    "",
    link("/directory/providers", "Providers A-Z", "every active individual with an NPI, by name prefix. A small prefix lists its names, each linked to its own page; a large one lists the longer prefixes under it with counts."),
    link("/directory/organizations", "Organizations A-Z", "the same, for practices, clinics, hospitals, pharmacies, laboratories and suppliers."),
    ...FACILITY_KINDS.map((kind) =>
      link(
        `/${kind.slug}`,
        kind.plural,
        `certified ${kind.plural.toLowerCase()} (${kind.blurb}) by state and by town, towns with ${MIN_CITY} or more.`,
      ),
    ),
    link("/lists", "Lists", "provider lists by taxonomy and facility lists by type. Each list page gives counts refreshed nightly - records, with work email, with a trusted-tier email, with practice phone, with practice location - a by-state table, the fields a record carries and a clearly labeled invented sample record. Each carries `Dataset` markup."),
    link("/systems", "Health systems and chains", "health systems and facility chains - headquarters, certified beds, the states each operates in, ownership, and how many hospitals, nursing homes, home health and hospice agencies, physician groups and outpatient centers each has. Ownership describes a system's general acute care hospitals, weighted by beds, so it qualifies a system and never one facility. Providers are counted, never listed. Carries `CollectionPage` markup."),
    link("/leadership", "Leadership by role", "the people who run certified facilities - the roles currently published in the directory - counted by role, facility type and state. Counts only; nobody is named."),
    link(
      "/glossary",
      "Glossary",
      `a reference glossary of healthcare professions and credential letters - ${GLOSSARY_FAMILIES.map(
        (family) => family.name.toLowerCase(),
      ).join(
        ", ",
      )}. One page per term at /glossary/<term>, each explaining what the profession is, how its people train and where they practice, then what the platform holds on that population: records, records with a confirmed work email, records with a practice phone, and the states with the most. Written reference, not a count: the explanation is the page and the figures are read live, so a figure that cannot be read is absent rather than zero.`,
    ),
    `- Glossary terms: ${GLOSSARY.map((entry) => `${entry.term} (${entry.label})`).join(", ")}. Credential pages answer the abbreviation - ${GLOSSARY.filter(
      (entry) => entry.kind === "credential",
    )
      .map((entry) => entry.label)
      .join(", ")} - and hand over to the profession's own page. Each specialty page exists only while the platform publishes a list for that specialty, so every one of them has real records behind it; ${siteUrl(
      glossaryPath("crna"),
    )} is the shape of one.`,
    "",
    "## The company, and how it compares",
    "",
    link("/why-npi-mark", "Why this and not something else", "how this compares with a public registry download, a scraped list, a generic B2B contact database and an in-house build, and the four cases where it is the wrong choice. No competitor is named."),
    link("/about", "About", "who operates the service, the three rules the data is built on - a confirmed date on every field, suppression honored everywhere, contact details metered and audited - and what the platform does not hold."),
    link("/security", "Security", "what a buyer's security review asks - sessions and two-step sign-in, what an API key can reach and how its scopes, pace and quota work, what is audited, how exports are traced to the organization that produced them, suppression, and how to report a vulnerability. Thresholds and mechanics are deliberately not published."),
    link("/contact", "Contact", "the four routes - sales, customer support, privacy and removal, security reports - and what each is for."),
    "",
    "## Detail pages, and the URL patterns they live at",
    "",
    "These are stable. A pattern is given once here rather than enumerated - the sitemaps below are",
    "the enumeration.",
    "",
    `- \`${siteUrl("/npi/<npi>")}\`: one provider or organization. \`Physician\` or \`MedicalOrganization\` JSON-LD, public record only. An organization's page is its profile: providers linked to it counted by specialty (a few named, each an NPI holder with a page of their own), the EHR it runs, its locations and certified facilities, its health system, similar organizations, leadership counted by role, and an FAQ drawn from those facts. An organization NPI with exactly one certified facility redirects to that facility, so every organization has one address.`,
    `- \`${siteUrl("/facility/<name>-<ccn>")}\`: one certified facility still operating - type, beds, ownership, health system, published star ratings, emergency services, address, county, main phone, certification date, the organization NPI it bills under, leadership counted by role, providers linked to it by specialty, its EHR, similar facilities, and an FAQ from those facts. \`Hospital\`, \`MedicalClinic\` or \`MedicalBusiness\` JSON-LD with \`FAQPage\`.`,
    `- \`${siteUrl("/<facility-kind>/<state>")}\` and \`${siteUrl("/<facility-kind>/<state>/<town>")}\`: one family of facility in one place.`,
    `- \`${siteUrl("/directory/<providers|organizations>/<prefix>")}\`: one name prefix, hyphenated (\`/directory/providers/smith-j\`).`,
    `- \`${siteUrl("/specialty/<specialty>/<state>/<city>")}\`: providers of one specialty in one metro.`,
    `- \`${siteUrl("/lists/<list>")}\` and \`${siteUrl("/lists/<list>/<state>")}\`: one list, nationally or in one state. A state page is published only where the state clears the list's floor; smaller states are counted on the national page without a page of their own.`,
    `- \`${siteUrl("/systems/<system>")}\`: one health system or chain - headquarters, certified beds, the states it operates in, ownership with the footnote that qualifies it, and its member hospitals, nursing homes, home health and hospice agencies and other certified facilities by name and certification number with their corporate parent, each linked to its facility profile where we hold one. Physician groups and organizations are counts; providers are a count and never a list. Slugs are permanent: a system folded into another redirects to it.`,
    `- \`${siteUrl("/leadership/<role>")}\`, \`${siteUrl("/leadership/<role>/<kind>")}\` and \`${siteUrl("/leadership/<role>/<kind>/<state>")}\`: one role, narrowing. A combination below the platform's floor has no page at all rather than a page with a small number on it.`,
    `- \`${siteUrl("/glossary/<term>")}\`: one profession or credential explained, with what the platform holds on that population.`,
    `- \`${siteUrl("/help/<topic>")}\`: one question answered. The topics are ${HELP_PAGES.map((p) => p.label.toLowerCase()).join(", ")}.`,
    "",
    "## Machine-readable endpoints",
    "",
    link("/sitemap-index.xml", "Sitemap index", "the index robots.txt points at. It lists the site sitemap, the facility sitemaps and the list sitemaps."),
    link("/sitemap.xml", "Site sitemap", "the site's own pages, the directory hubs, the facility directory by kind, state and town, specialty-by-metro, and the leadership pages. A URL carries `lastmod` only where the platform reports a real refresh date for it."),
    link("/facility/sitemap/0.xml", "Facility sitemaps", "certified facility profiles, 10,000 to a file, numbered from 0. How many there are is in the index."),
    link("/lists/sitemap/0.xml", "List sitemaps", "list and health-system pages, numbered from 0, with the refresh date of the counts behind them."),
    link("/fields.json", "Field reference, as JSON", "the same field dictionary as /fields, machine-readable, generated from the same constant so the two cannot drift. A null coverage figure means not published, never zero, and every example value in it is invented."),
    link("/robots.txt", "robots.txt", "what is open to crawlers and what is not, and where the sitemap index is."),
    link("/docs/api", "REST API, version 1", "the same data behind this site, over HTTP, with a scoped key. JSON, versioned, changed only by adding."),
    "",
    "## How to use it programmatically",
    "",
    "Do not scrape the HTML. Customers get a scoped API key and call /v1 with per-minute",
    "pacing and a monthly quota, both reported in response headers. Refused calls are never",
    `metered. The reference is at ${siteUrl("/docs/api")}.`,
    "",
    "## Rules",
    "",
    "- An NPI is an identifier, not a credential. Enumeration does not mean licensed or in good standing.",
    // The permission wording is the accurate replacement for "never on public pages and never
    // in bulk", which was false on both halves - facility main lines are public, and bulk is
    // sold. The prohibition is a separate sentence and is kept deliberately: dropping it is a
    // commercial and legal decision for the owner, not a consequence of correcting a claim,
    // and this file is read by automated consumers where a plain prohibition does real work.
    "- Personal contact access requires the appropriate account permissions. Public practice and facility main-line numbers may appear on public pages. Export permissions and usage restrictions are defined by the applicable plan and terms. Scraping, resale and redistribution are prohibited.",
    "- People without an NPI - executives, officers and owners of organizations and facilities - are never named on public pages. Pages say how many there are and in which roles; names and titles are for signed-in customers. The /leadership pages count them by role and place and never list them.",
    "- A facility's phone on its page is its published main line, not a person's number.",
    "- List counts are counts, refreshed nightly; a sample record on a list page is invented for illustration and describes no real person.",
    "- Use a record's displayed update date when available. A page-generation date is not evidence that every field was recently verified; do not invent missing dates.",
    "- A page that cannot read a figure leaves the figure out. An absent number means the platform did not answer, never zero.",
    "",
    "## Optional",
    "",
    link(
      "/pricing",
      "Pricing",
      "Current published plans and limits. Confirm trial eligibility, payment requirements, contact access and export allowances on the pricing and account billing pages; this index does not define commercial terms.",
    ),
    link("/help", "Help and FAQ", "how the product behaves, one page a question."),
    link("/privacy-choices", "Your Privacy Choices", "how a person opts out of the sale and sharing of their personal information, asks for deletion, or has specific fields removed. The Global Privacy Control signal is honored on its own."),
    link("/report-a-problem", "Report a problem", "the form for telling us a published record is wrong - a name, a specialty, an address, a phone - so it can be checked and corrected at the source rather than only on the page."),
    link("/remove-my-information", "Remove my information", "the request form itself. A confirmed request is reviewed by a person and then applied everywhere, and keeps applying through later refreshes."),
    link("/terms", "Terms of Service", "what a customer may and may not do with the data."),
    link("/privacy", "Privacy Policy", "what is collected, from whom, and the rights that attach to it."),
  ];
  return new Response(lines.join("\n") + "\n", {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

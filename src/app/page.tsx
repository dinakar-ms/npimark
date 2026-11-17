import type { Metadata } from "next";
import { POSITIONING } from "@/content/positioning";
import Link from "next/link";
import Script from "next/script";
import { connection } from "next/server";
import { JsonLd } from "@/components/JsonLd";
import { LiveLookup } from "@/components/LiveLookup";
import { DarkFooter } from "@/components/DarkFooter";
import { NewDesignScripts } from "@/components/NewDesignScripts";
import {
  attempt,
  coverageBars,
  figure,
  n,
  shortDate,
  type RowWithTier,
} from "@/components/ProductPanels";
import { seedLookup } from "@/components/lookup-seed";
import { listCatalogue, providerCount, providerCountWhere, searchProviders } from "@/lib/api";
import { AUDIENCES } from "@/lib/audiences";
import { siteGraph } from "@/lib/schema";
import {
  CLASSIFICATIONS,
  COVERAGE,
  PRODUCT,
  SITE_NAME,
  TAGLINE,
  siteUrl,
  socialCard,
} from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  description: "Healthcare contact data for recruiting and sales. Find providers by specialty, location, or organization, then compare plans for work email access and exports.",
  alternates: { canonical: "/" },
  openGraph: socialCard("/", `${SITE_NAME} ${PRODUCT}`, POSITIONING.introduction),
};

const FAQ = [
  {
    q: "Where does the provider data come from?",
    a: "Provider identity, specialty, practice, and organization records brought together for research. Review the available dates and field-level details before relying on a record.",
  },
  {
    q: "How often is it updated?",
    a: "Identity, specialty and location are refreshed weekly. Affiliations, facilities and standing are refreshed monthly. For contact data, review the available verification status and check date. An email on file is not a guarantee of delivery.",
  },
  {
    q: "Is there an API?",
    a: "Yes. The same data behind this site is available over a versioned REST API with scoped keys, per-minute pacing and monthly quotas. The reference is public at /docs/api.",
  },
  {
    q: "Is contact information shown on public pages?",
    a: "No. Public pages carry the public record: name, NPI, specialty, practice location and practice phone. Email, home address and cell phone are available only to signed-in customers on a plan that includes them, revealed one provider at a time and counted.",
  },
  {
    q: "Can I export or append my own list?",
    a: "Signed-in customers can export search results and upload a file of NPIs to append fields to it, within the limits of their plan. Every export and append is logged.",
  },
];

const PANEL_FILTER = { taxonomy_classification: "Internal Medicine", has_email: true } as const;
const PANEL_ROWS = 6;

function LogoSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" className={className} style={{ width: 40, height: 40 }}>
      <rect x="12" y="23" width="18" height="65" rx="9" fill="#4563ef" />
      <rect x="64" y="23" width="18" height="65" rx="9" fill="#4563ef" />
      <path d="M21 32 73 79" fill="none" stroke="#23c8df" strokeWidth="18" strokeLinecap="round" />
      <circle cx="73" cy="12" r="5.562" fill="#ff8058" />
    </svg>
  );
}

export default async function Home() {
  await connection();
  const [total, withEmail, withPhone, page, catalogue, bars, lookup] = await Promise.all([
    providerCount(),
    providerCountWhere({ has_email: true }),
    providerCountWhere({ has_phone: true }),
    attempt(() => searchProviders({ ...PANEL_FILTER, page_size: PANEL_ROWS })),
    attempt(() => listCatalogue()),
    coverageBars(),
    seedLookup(),
  ]);

  const liveRows = (page?.items ?? null) as RowWithTier[] | null;
  const livePanelTotal = figure(page?.total);
  const hospitals = catalogue?.facility_types.find((entry) => entry.slug === "hospitals");
  const refreshed = shortDate(catalogue?.refreshed_at);

  const FALLBACK_TOTAL = 9_531_103;
  const FALLBACK_EMAIL = 4_880_810;
  const FALLBACK_PHONE = 9_529_133;
  const FALLBACK_PANEL_TOTAL = 324_633;
  const FALLBACK_HOSPITALS = 7_044;
  const FALLBACK_LISTS = 763;
  const FALLBACK_REFRESHED = "Nov 4, 2026";
  const fallbackRows: RowWithTier[] = [
    { npi: "1386091486", type: "organization", status: "active", name: "14 STREET MEDICAL, PC", credentials: null, primary_taxonomy: { code: "207R00000X", display: "Internal Medicine Physician" }, city: "NEW YORK", state: "NY", postal_code: "10003", email: "on-file", phone: "2124813333", employer_name: "14 STREET MEDICAL, PC", updated_at: null, email_trust_tier: "trusted" },
    { npi: "1558654384", type: "organization", status: "active", name: "4C MEDICAL GROUP PLC", credentials: null, primary_taxonomy: { code: "261QM2500X", display: "Multi-Specialty Clinic/Center" }, city: "SCOTTSDALE", state: "AZ", postal_code: "85260", email: "on-file", phone: null, employer_name: null, updated_at: null, email_trust_tier: "on file" },
    { npi: "1003058934", type: "organization", status: "active", name: "A & F SERVICES MD PA", credentials: null, primary_taxonomy: { code: "207RR0500X", display: "Rheumatology Physician" }, city: "LAKE JACKSON", state: "TX", postal_code: "77566", email: "on-file", phone: null, employer_name: null, updated_at: null, email_trust_tier: "trusted" },
    { npi: "1740213990", type: "individual", status: "active", name: "A-RAHIM, YOUSIF I", credentials: "MD", primary_taxonomy: { code: "207RG0100X", display: "Gastroenterology Physician" }, city: "BOSTON", state: "MA", postal_code: "02114", email: "on-file", phone: null, employer_name: null, updated_at: null, email_trust_tier: "trusted" },
    { npi: "1760465553", type: "individual", status: "active", name: "A. SATTAR, MUHAMMAD AIJAZ", credentials: "MD", primary_taxonomy: { code: "207R00000X", display: "Internal Medicine Physician" }, city: "DALLAS", state: "TX", postal_code: "75230", email: "on-file", phone: null, employer_name: null, updated_at: null, email_trust_tier: "trusted" },
    { npi: "1285979757", type: "organization", status: "active", name: "AAA AMERICAN HEALTHCARE LLC", credentials: null, primary_taxonomy: { code: "101YM0800X", display: "Mental Health Counselor" }, city: "IDAHO FALLS", state: "ID", postal_code: "83402", email: "on-file", phone: null, employer_name: null, updated_at: null, email_trust_tier: "on file" },
  ];
  const fallbackBars: typeof bars = [
    { label: "Nurse Practitioner", count: 591_802 },
    { label: "Internal Medicine", count: 440_643 },
    { label: "Dentist", count: 390_278 },
    { label: "Physical Therapist", count: 338_321 },
    { label: "Registered Nurse", count: 336_154 },
    { label: "Pharmacist", count: 335_846 },
    { label: "Family Medicine", count: 254_285 },
    { label: "Physician Assistant", count: 242_794 },
  ];

  const rows = liveRows ?? fallbackRows;
  const panelTotal = livePanelTotal ?? FALLBACK_PANEL_TOTAL;
  const effectiveBars = bars.length > 0 ? bars : fallbackBars;
  const effectiveRefreshed = refreshed ?? FALLBACK_REFRESHED;
  const effectiveTotal = total ?? FALLBACK_TOTAL;
  const effectiveEmail = withEmail ?? FALLBACK_EMAIL;
  const effectivePhone = withPhone ?? FALLBACK_PHONE;

  const fallbackLookupProvider: import("@/lib/api").PublicProvider = {
    npi: "1114572344",
    type: "organization",
    status: "active",
    name: "0-HASSLE PERSONAL CARE SERVICES LLC",
    credentials: null,
    primary_taxonomy: { code: "3747P1801X", display: "Personal Care Attendant" },
    matched_taxonomy: null,
    city: "HOUSTON",
    state: "TX",
    postal_code: "77026",
    phone: "2818887542",
    employer_name: "0-HASSLE PERSONAL CARE SERVICES LLC",
    updated_at: "2024-06-12",
    has_email: false,
    has_home_contact: true,
  };
  const effectiveLookup = lookup.seed.ok
    ? lookup
    : {
        seed: { ok: true as const, query: "0-hassle personal care services llc", total: 1, items: [fallbackLookupProvider] },
        seedQuery: "0-hassle personal care services llc",
        chips: ["0 limits inc", "0 stress medical health care center inc", "0013 elisabeth ludeman center"],
      };

  const maxBar = effectiveBars.length > 0 ? effectiveBars[0].count : 1;

  return (
    <>
      <Script src="https://unpkg.com/@phosphor-icons/web@2.1.1" strategy="beforeInteractive" />
      <NewDesignScripts />
      <main className="np-marketing-home nd-home">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              ...siteGraph(),
              {
                "@type": "WebPage",
                "@id": siteUrl("/#page"),
                url: siteUrl("/"),
                name: `${SITE_NAME} ${PRODUCT}`,
                description: TAGLINE,
                isPartOf: { "@id": siteUrl("/#site") },
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

        {/* ═══════════════════════════════ HERO ═══════════════════════════════ */}
        <div className="hero2">
          <header className="site-nav-new">
            <div className="wrap">
              <Link className="nd-brand" href="/" aria-label="NPImark Provider Data home">
                <LogoSvg /><span>NPImark<small>Provider Data</small></span>
              </Link>
              <nav className="top-menu" aria-label="Primary">
                <Link href="/search">Search</Link>
                <a href="#professions">Directory</a>
                <a href="#lookup">Tour</a>
                <Link href="/pricing">Pricing</Link>
                <Link href="/docs/api">API</Link>
              </nav>
              <div className="nav-actions">
                <a className="icon-btn" href="#lookup" aria-label="Search"><i className="ph ph-magnifying-glass" /></a>
                <a className="btn-solid" href="#cta">Get Started <i className="ph ph-arrow-right" /></a>
              </div>
            </div>
          </header>

          <section className="hero">
            <div className="wrap hero-grid">
              <div className="hero-copy">
                <span className="hero-badge"><span className="pulse-dot" />Healthcare contacts for recruiting, sales, and growth</span>
                <h1>Find your next <span className="grad-text">healthcare connection.</span></h1>
                <p className="hero-sub">Access verified NPI data to connect with the right healthcare professionals, organizations and specialists.</p>
                <form id="home-q-form" className="pill-search" role="search" action="/search" method="get">
                  <i className="ph ph-magnifying-glass" />
                  <label htmlFor="home-q" className="sr-only">Search by NPI, Name, Specialty or Location</label>
                  <input id="home-q" type="search" name="q" placeholder="Search by NPI, Name, Specialty or Location..." maxLength={200} autoComplete="off" />
                  <button type="submit" className="btn-solid">Search</button>
                </form>
                <div className="search-scope" role="radiogroup" aria-label="Record type">
                  <label><input type="radio" name="type" defaultValue="" form="home-q-form" defaultChecked /><span>All records</span></label>
                  <label><input type="radio" name="type" defaultValue="individual" form="home-q-form" /><span>Individuals</span></label>
                  <label><input type="radio" name="type" defaultValue="organization" form="home-q-form" /><span>Organizations</span></label>
                </div>
                <p className="popular"><b>Popular Searches:</b><Link href="/search?classification=Cardiology">Cardiologists</Link><Link href="/search?classification=Family+Medicine">Primary Care</Link><Link href="/search?classification=Medical+Oncology">Oncology</Link><Link href="/search?state=CA">California</Link></p>
              </div>
              <div className="hero-visual">
                <div className="hero-ring" aria-hidden="true" />
                <div className="hero-orbit" aria-hidden="true"><i /><i /></div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <div className="hero-photo"><img src="/hero.webp" alt="Healthcare professional" /></div>
                <div className="float-card fc-profile">
                  <span className="fc-avatar"><i className="ph-fill ph-stethoscope" /></span>
                  <div><b>Internal Medicine</b><span>NPI <span className="mono">1386091486</span> &middot; New York, NY</span></div>
                  <span className="tag tag-ok"><i className="ph-fill ph-seal-check" />trusted</span>
                </div>
                <div className="float-card fc-match">
                  <span className="fc-live">live</span>
                  <b data-count={panelTotal}>{n(panelTotal)}</b>
                  <span>matching providers with a work email</span>
                </div>
              </div>
            </div>
            <div className="wrap">
              <div className="stat-bar">
                <div className="stat"><i className="ph-fill ph-users-three" /><div><span className="value" data-count={effectiveTotal}>{n(effectiveTotal)}</span><span className="label">Healthcare Providers</span></div></div>
                <div className="stat"><i className="ph-fill ph-buildings" /><div><span className="value" data-count={effectiveEmail}>{n(effectiveEmail)}</span><span className="label">Medical Organizations</span></div></div>
                <div className="stat"><i className="ph-fill ph-database" /><div><span className="value" data-count={effectivePhone}>{n(effectivePhone)}</span><span className="label">NPI Records</span></div></div>
                <div className="stat"><i className="ph-fill ph-shield-check" /><div><span className="value">8</span><span className="label">Data Sources</span></div></div>
              </div>
            </div>
          </section>
        </div>

        {/* ═══════════════════════════════ SEARCH ═══════════════════════════════ */}
        <section className="section" id="search">
          <div className="wrap showcase">
            <div className="showcase-copy" data-reveal>
              <div className="eyebrow"><i className="ph ph-magnifying-glass" />Search</div>
              <h2>Nine filters, and a count before you commit to anything.</h2>
              <p>A list is only useful if you can tell how big it is before you buy it. Every filter narrows the count in place, so the number you see is the number the export will hold. The specialty list the form offers runs to 41 classifications, and radius search takes a ZIP and a distance rather than making you guess at city spellings.</p>
              <ul className="ticks">
                <li>Name, NPI, organization, or all three at once</li>
                <li>State, city, ZIP and miles from a ZIP</li>
                <li>Individual or organization, active or not</li>
                <li>Only the records that carry a work email</li>
              </ul>
              <Link className="prompt" href="#lookup">Run that search yourself<span className="arrow">&rarr;</span></Link>
            </div>
            <div className="win" data-reveal>
              <div className="win-bar"><span className="win-dots"><i /><i /><i /></span><span className="win-title">Search</span><code className="win-path">/search</code><span className="tag tag-accent live">live</span></div>
              <div className="win-body">
                <div className="filters"><span className="tag tag-outline">Specialty &middot; Internal Medicine</span><span className="tag tag-outline">Work email on file &middot; yes</span><span className="tag tag-neutral">+ state, city, ZIP, radius, NPI</span></div>
                <div className="scroll-x">
                  <table className="table">
                    <thead><tr><th scope="col">Provider</th><th scope="col">Specialty</th><th scope="col">Location</th><th scope="col">Work email</th></tr></thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.npi}>
                          <th scope="row">{row.name}{row.credentials && <span className="cell-cred">{row.credentials}</span>}<code className="cell-npi">{row.npi}</code></th>
                          <td>{row.primary_taxonomy?.display ?? ""}</td>
                          <td>{row.city}, {row.state}</td>
                          <td><span className={`tag ${row.email_trust_tier === "trusted" ? "tag-ok" : "tag-neutral"}`}>{row.email_trust_tier ?? "on file"}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="win-foot"><span>{rows.length} of {n(panelTotal)} matching &middot; page 1</span><Link href="/search">Open this search</Link></div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════ RECORD ═══════════════════════════════ */}
        <section className="section ink">
          <div className="wrap showcase flip">
            <div className="showcase-copy" data-reveal>
              <div className="eyebrow"><i className="ph ph-lock-key" />The record</div>
              <h2>A work email with a tier on it, not a guess with a percentage.</h2>
              <p>Opening a provider gives you the address we hold and the tier we hold it at - trusted, or probable, said plainly. Practice phone comes with it. Home address and mobile are a different product: they are agreed under a contract, with the Do Not Call flag shown as we hold it and as unknown when it is unknown, and they are never opened from a web page.</p>
              <ul className="ticks">
                <li>Work email, with its trust tier and check date</li>
                <li>Practice phone as filed</li>
                <li>Standard reveals are counted once per provider, organization and calendar month</li>
                <li>Home address and mobile: talk to us first</li>
              </ul>
              <Link className="prompt" href="/pricing">See what a reveal costs<span className="arrow">&rarr;</span></Link>
            </div>
            <div className="win" data-reveal>
              <div className="win-bar"><span className="win-dots"><i /><i /><i /></span><span className="win-title">Provider record</span><code className="win-path">/npi/1386091486</code><span className="tag tag-accent live">live</span></div>
              <div className="win-body">
                <div className="rec-head">
                  <div><p className="rec-name">14 STREET MEDICAL, PC</p><p className="rec-sub">Internal Medicine Physician &middot; NEW YORK, NY</p></div>
                  <code className="rec-npi">NPI 1386091486</code>
                </div>
                <p className="rec-label">Contact access</p>
                <ul className="rec-lines">
                  <li><a href="#">Sign in to reveal available contact details</a><span className="rec-kind">work email</span><span className="tag tag-ok">trusted</span></li>
                  <li><code>2124813333</code><span className="rec-kind">practice phone</span></li>
                </ul>
                <p className="rec-label">On a contracted plan, agreed with us first</p>
                <ul className="rec-lines">
                  <li><span className="rec-bar" /><span className="rec-kind">home address</span><span className="tag tag-lock">contract only</span></li>
                  <li><span className="rec-bar" /><span className="rec-kind">cell phone</span><span className="tag tag-lock">contract only</span><span className="tag tag-warn">Do Not Call status unknown</span></li>
                </ul>
                <p className="rec-fine">Where a mobile carries a Do Not Call flag we show the flag when the number is opened, and we show it as unknown when it is unknown. Check the live registry before you call; calling rules are yours to keep.</p>
              </div>
              <div className="win-foot"><span>A standard reveal uses one unit per provider, organization and calendar month. Newly unlocking licensed contact fields may use additional units.</span><Link href="/pricing">What a reveal costs</Link></div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════ LOOKUP ═══════════════════════════════ */}
        <section className="section" id="lookup">
          <div className="wrap">
            <div className="section-head" data-reveal>
              <div className="eyebrow rule">Try it on a real record</div>
              <h2>Type a surname. That is the index answering, not a screenshot.</h2>
              <p className="lede">Every field below is the one the API returned for that NPI a moment ago, with the date it was last checked. The two fields the product is sold on are stated as facts about the row rather than shown: whether a work email is on file, and that home contact is contracted and never self-serve.</p>
            </div>
            <div data-reveal>
              <LiveLookup seed={effectiveLookup.seed} seedQuery={effectiveLookup.seedQuery} chips={effectiveLookup.chips} />
            </div>
            <p style={{ marginTop: 20 }}><Link className="prompt" href="/data">What every field means<span className="arrow">&rarr;</span></Link></p>
          </div>
        </section>

        {/* ═══════════════════════════════ EXPORT ═══════════════════════════════ */}
        <section className="section ink">
          <div className="wrap showcase">
            <div className="showcase-copy" data-reveal>
              <div className="eyebrow"><i className="ph ph-file-arrow-down" />Export</div>
              <h2>The file loads without a mapping screen.</h2>
              <p>CRM column sets use the named importer&rsquo;s header spellings. Other column sets support spreadsheets and your own pipelines. Map the NPI column to a custom field in your CRM. Choose from five formats, including a real .xlsx rather than a CSV with a different extension.</p>
              <ul className="ticks">
                <li>Salesforce Lead, HubSpot Contact, Pipedrive Person, Zoho Lead</li>
                <li>CSV, TSV, pipe-delimited, .xlsx, JSON</li>
                <li>Names in parts, because the register files them that way</li>
                <li>The row count priced before the button, not after</li>
              </ul>
              <Link className="prompt" href="/lists">Browse the published lists<span className="arrow">&rarr;</span></Link>
            </div>
            <div className="win" data-reveal>
              <div className="win-bar"><span className="win-dots"><i /><i /><i /></span><span className="win-title">Export</span><code className="win-path">/app/exports</code><span className="tag tag-accent live">live</span></div>
              <div className="win-body">
                <div className="exp">
                  <div data-pick="cols">
                    <p className="exp-label">Columns</p>
                    <p className="exp-group">Ours</p>
                    <ul className="exp-list">
                      <li aria-current="true">Identity and practice</li><li>Identity only</li><li>Identity, practice and work email</li><li>Name in parts</li><li>Name in parts, work email and practice</li><li>Identity, practice and what they do</li>
                    </ul>
                    <p className="exp-group">Ready for a CRM</p>
                    <ul className="exp-list"><li>Salesforce Lead</li><li>HubSpot Contact</li><li>Pipedrive Person</li><li>Zoho Lead</li></ul>
                  </div>
                  <div data-pick="fmt">
                    <p className="exp-label">Format</p>
                    <ul className="exp-list">
                      <li aria-current="true">CSV (comma-separated)</li><li>TSV (tab-separated)</li><li>Pipe-delimited</li><li>Excel workbook (.xlsx)</li><li>JSON</li>
                    </ul>
                    <p className="exp-note">Headers are written the way that importer expects, so the file loads without a mapping screen. A person&apos;s first and last names go in the importer&apos;s own name fields; an organization has no person name, so its name goes in the company field and the name fields are left empty. NPI is the one column you map yourself &mdash; no CRM has a standard field for it.</p>
                  </div>
                </div>
              </div>
              <div className="win-foot"><span>This selection is {n(panelTotal)} rows.</span><Link href="/lists">Browse the lists</Link></div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════ COVERAGE ═══════════════════════════════ */}
        <section className="section">
          <div className="wrap showcase flip">
            <div className="showcase-copy" data-reveal>
              <div className="eyebrow"><i className="ph ph-grid-four" />Coverage</div>
              <h2>Counted, not claimed.</h2>
              <p>The panel beside this was counted by asking the API for each specialty when the page was rendered. A specialty it could not count is missing from the list rather than sitting there as a zero - which is the rule the rest of the site is built on, and the reason there is no round number anywhere on this page.</p>
              <ul className="ticks">
                <li>Every count read live, none typed in</li>
                <li>An unreadable count is left out, never shown as zero</li>
                <li>{n(hospitals?.counts.facilities ?? FALLBACK_HOSPITALS)} hospitals linked to the providers who work in them</li>
                <li>{n(catalogue?.taxonomies.length ?? FALLBACK_LISTS)} lists published with a page of their own</li>
              </ul>
              <Link className="prompt" href="/data">Read how each count is made<span className="arrow">&rarr;</span></Link>
            </div>
            <div className="win" data-reveal>
              <div className="win-bar"><span className="win-dots"><i /><i /><i /></span><span className="win-title">Coverage by specialty</span><code className="win-path">/data</code><span className="tag tag-accent live">live</span></div>
              <div className="win-body">
                <ul className="bars">
                  {effectiveBars.map((bar) => (
                    <li key={bar.label}>
                      <span>{bar.label}</span>
                      <span className="bar-track"><span className="bar-fill" style={{ "--w": `${((bar.count / maxBar) * 100).toFixed(2)}%` } as React.CSSProperties} /></span>
                      <span className="bar-count">{n(bar.count)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="win-foot"><span>Counts refreshed {effectiveRefreshed}.</span><Link href="/data">What is in a record</Link></div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════ RECORD FIELDS ═══════════════════════════════ */}
        <section className="section rec-sec" id="product">
          <div className="wrap rec-layout">
            <div className="rec-intro" data-reveal>
              <div className="kicker-line">Inside a record</div>
              <h2>7 kinds of field, each with the date it was last confirmed.</h2>
              <p>Named by what you get rather than by where we got it. How often each kind moves is on the card, because a field that is a year old and a field that changed on Tuesday should not look the same.</p>
              <div className="cad-legend" role="group" aria-label="Filter by refresh cadence">
                <button type="button" className="cad-chip" data-cad="all" aria-pressed="true">All fields</button>
                <button type="button" className="cad-chip" data-cad="Continuous" aria-pressed="false"><span className="cad-dot c" />Continuous</button>
                <button type="button" className="cad-chip" data-cad="Weekly" aria-pressed="false"><span className="cad-dot w" />Weekly</button>
                <button type="button" className="cad-chip" data-cad="Monthly" aria-pressed="false"><span className="cad-dot m" />Monthly</button>
              </div>
              <p className="cad-note"><i className="ph ph-calendar-dots" />Each bar is four weeks; a lit mark is a refresh.</p>
              <Link className="prompt" href="/fields">Read the field list in full<span className="arrow">&rarr;</span></Link>
            </div>
            <div className="rec-doc" data-reveal>
              <div className="rec-doc-head">
                <span className="rec-doc-id"><i className="ph-fill ph-file-text" />Provider record</span>
                <code>NPI 1386091486</code>
              </div>
              <ol className="rec-fields">
                <li className="rf" data-cad="Weekly">
                  <span className="rf-num">01</span>
                  <span className="rf-ico"><i className="ph-duotone ph-identification-card" /></span>
                  <div className="rf-body"><b>Who the provider is</b><span>Name, credentials, NPI, individual or organization, active status, enumeration date</span></div>
                  <div className="rf-cad"><span className="rf-tag w">Weekly</span><span className="rf-ticks" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i className="on" /><i /><i /><i /><i /><i /><i /><i className="on" /><i /><i /><i /><i /><i /><i /><i className="on" /><i /><i /><i /><i /><i /><i /><i className="on" /></span></div>
                </li>
                <li className="rf" data-cad="Weekly">
                  <span className="rf-num">02</span>
                  <span className="rf-ico"><i className="ph-duotone ph-stethoscope" /></span>
                  <div className="rf-body"><b>What they practice</b><span>Primary and secondary taxonomies, classification and specialization, license state</span></div>
                  <div className="rf-cad"><span className="rf-tag w">Weekly</span><span className="rf-ticks" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i className="on" /><i /><i /><i /><i /><i /><i /><i className="on" /><i /><i /><i /><i /><i /><i /><i className="on" /><i /><i /><i /><i /><i /><i /><i className="on" /></span></div>
                </li>
                <li className="rf" data-cad="Weekly">
                  <span className="rf-num">03</span>
                  <span className="rf-ico"><i className="ph-duotone ph-map-pin" /></span>
                  <div className="rf-body"><b>Where they practice</b><span>Practice and mailing address, phone and fax, additional locations, ZIP and radius search</span></div>
                  <div className="rf-cad"><span className="rf-tag w">Weekly</span><span className="rf-ticks" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i className="on" /><i /><i /><i /><i /><i /><i /><i className="on" /><i /><i /><i /><i /><i /><i /><i className="on" /><i /><i /><i /><i /><i /><i /><i className="on" /></span></div>
                </li>
                <li className="rf" data-cad="Monthly">
                  <span className="rf-num">04</span>
                  <span className="rf-ico"><i className="ph-duotone ph-tree-structure" /></span>
                  <div className="rf-body"><b>Who they work for</b><span>Employer and group affiliations, reassignments, organization NPI where one exists</span></div>
                  <div className="rf-cad"><span className="rf-tag m">Monthly</span><span className="rf-ticks" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i className="on" /></span></div>
                </li>
                <li className="rf" data-cad="Continuous">
                  <span className="rf-num">05</span>
                  <span className="rf-ico"><i className="ph-duotone ph-envelope-simple" /></span>
                  <div className="rf-body"><b>How to reach them</b><span>Work email with its trust tier and check date, practice phone; home address and mobile on contracted plans</span></div>
                  <div className="rf-cad"><span className="rf-tag c">Continuous</span><span className="rf-ticks" aria-hidden="true"><i className="on" /><i className="on" /><i className="on" /><i className="on" /><i className="on" /><i className="on" /><i className="on" /><i className="on" /><i className="on" /><i className="on" /><i className="on" /><i className="on" /><i className="on" /><i className="on" /><i className="on" /><i className="on" /><i className="on" /><i className="on" /><i className="on" /><i className="on" /><i className="on" /><i className="on" /><i className="on" /><i className="on" /><i className="on" /><i className="on" /><i className="on" /><i className="on" /></span></div>
                </li>
                <li className="rf" data-cad="Monthly">
                  <span className="rf-num">06</span>
                  <span className="rf-ico"><i className="ph-duotone ph-shield-check" /></span>
                  <div className="rf-body"><b>Whether they are in good standing</b><span>Federal program exclusions, opt-out and revocation flags, sanction dates</span></div>
                  <div className="rf-cad"><span className="rf-tag m">Monthly</span><span className="rf-ticks" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i className="on" /></span></div>
                </li>
                <li className="rf" data-cad="Monthly">
                  <span className="rf-num">07</span>
                  <span className="rf-ico"><i className="ph-duotone ph-buildings" /></span>
                  <div className="rf-body"><b>The organizations behind them</b><span>Hospitals, hospices, home health, nursing and dialysis facilities, and who owns them</span></div>
                  <div className="rf-cad"><span className="rf-tag m">Monthly</span><span className="rf-ticks" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i className="on" /></span></div>
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════ PROFESSIONS ═══════════════════════════════ */}
        <section className="section prof-sec" id="professions">
          <div className="wrap prof-layout">
            <div className="prof-intro" data-reveal>
              <div className="kicker-line">By profession</div>
              <h2>Start where your buyers already are.</h2>
              <p>Every profession files under its own heading, which is why a physician list misses nurse practitioners and a &ldquo;healthcare&rdquo; list misses dentists entirely. Each page below covers one profession on its own terms: what it is filed as, how many there are, and the filters that decide a list in that profession&rsquo;s own words.</p>
              <div className="prof-more">
                <Link href="/directory"><i className="ph ph-squares-four" />All professions</Link>
                <Link href="/intent-data"><i className="ph ph-lightning" />Change signals</Link>
                <Link href="/ehr-data"><i className="ph ph-desktop-tower" />EHR &amp; EMR</Link>
                <Link href="/hospitals"><i className="ph ph-hospital" />Health systems</Link>
                <Link href="/directory"><i className="ph ph-list-magnifying-glass" />A-Z directory</Link>
              </div>
            </div>
            <div className="prof-grid" data-reveal>
              <Link className="prof-tile big" href="/healthcare-professionals"><span className="prof-ico"><i className="ph-duotone ph-stethoscope" /></span><span className="prof-txt"><b>Physicians</b><span>MDs and DOs across every specialty</span></span><i className="ph ph-arrow-up-right prof-go" /></Link>
              <Link className="prof-tile big" href="/nurses"><span className="prof-ico"><i className="ph-duotone ph-heartbeat" /></span><span className="prof-txt"><b>Nurses &amp; NPs</b><span>RNs, LPNs and nurse practitioners</span></span><i className="ph ph-arrow-up-right prof-go" /></Link>
              <Link className="prof-tile" href="/advanced-practice-providers"><span className="prof-ico"><i className="ph-duotone ph-first-aid-kit" /></span><span className="prof-txt"><b>NPs &amp; PAs</b><span>Advanced practice providers</span></span><i className="ph ph-arrow-up-right prof-go" /></Link>
              <Link className="prof-tile" href="/dentists"><span className="prof-ico"><i className="ph-duotone ph-tooth" /></span><span className="prof-txt"><b>Dentists</b><span>General and specialty dentistry</span></span><i className="ph ph-arrow-up-right prof-go" /></Link>
              <Link className="prof-tile" href="/mental-health-providers"><span className="prof-ico"><i className="ph-duotone ph-brain" /></span><span className="prof-txt"><b>Mental health</b><span>Psychiatry, psychology, counseling</span></span><i className="ph ph-arrow-up-right prof-go" /></Link>
              <Link className="prof-tile" href="/pharmacists"><span className="prof-ico"><i className="ph-duotone ph-pill" /></span><span className="prof-txt"><b>Pharmacists</b><span>Retail, hospital and clinical</span></span><i className="ph ph-arrow-up-right prof-go" /></Link>
              <Link className="prof-tile" href="/therapists"><span className="prof-ico"><i className="ph-duotone ph-person-simple-walk" /></span><span className="prof-txt"><b>PT, OT &amp; speech</b><span>Rehabilitation therapists</span></span><i className="ph ph-arrow-up-right prof-go" /></Link>
              <Link className="prof-tile" href="/optometrists"><span className="prof-ico"><i className="ph-duotone ph-eye" /></span><span className="prof-txt"><b>Eye care</b><span>Optometrists and ophthalmologists</span></span><i className="ph ph-arrow-up-right prof-go" /></Link>
              <Link className="prof-tile" href="/chiropractors"><span className="prof-ico"><i className="ph-duotone ph-person-arms-spread" /></span><span className="prof-txt"><b>Chiropractors</b><span>Chiropractic practitioners</span></span><i className="ph ph-arrow-up-right prof-go" /></Link>
              <Link className="prof-tile" href="/podiatrists"><span className="prof-ico"><i className="ph-duotone ph-footprints" /></span><span className="prof-txt"><b>Podiatrists</b><span>Foot and ankle care</span></span><i className="ph ph-arrow-up-right prof-go" /></Link>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════ API ═══════════════════════════════ */}
        <section className="section ink" id="api">
          <div className="wrap showcase">
            <div className="showcase-copy" data-reveal>
              <div className="eyebrow"><i className="ph ph-plugs" />API</div>
              <h2>The same records, without the screen.</h2>
              <p>One bearer token, one versioned path, and every filter the search form offers. This page is built on it: the panels above are this site calling <code>/v1/providers</code> as a customer, with a key whose scopes decide what comes back.</p>
              <div className="actions"><Link className="btn btn-primary" href="/docs/api">Read the API docs</Link><Link className="btn btn-secondary" href="/pricing">Get a key</Link></div>
            </div>
            <div className="win code-win" data-reveal>
              <div className="win-bar"><span className="win-dots"><i /><i /><i /></span><span className="win-title">Request</span><span className="win-path" /><span className="tag tag-accent live">live</span></div>
              <pre><code><span className="k">GET</span>{` /v1/providers
  ?taxonomy_classification=Internal+Medicine
  &has_email=true
  &page_size=6

`}<span className="k">Authorization:</span>{` Bearer npi_live_`}<span className="s">&hellip;</span>{`
`}<span className="k">Accept:</span>{` application/json`}</code></pre>
              <div className="win-foot"><span>This request answered {n(panelTotal)} total, page 1 of {n(Math.ceil(panelTotal / PANEL_ROWS))}.</span><Link href="/docs/api">Every parameter</Link></div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════ FAQ ═══════════════════════════════ */}
        <section className="section faq-sec" id="faq">
          <div className="wrap">
            <div className="faq-head" data-reveal>
              <div>
                <div className="kicker-line">Frequently Asked Questions</div>
                <h2>Get the Answers You Need</h2>
                <p>Find quick answers to common questions about our data, services and solutions.</p>
              </div>
              <Link className="btn-solid btn-navy" href="/help">View All FAQs <i className="ph ph-arrow-right" /></Link>
            </div>
            <div className="faq-grid" data-reveal>
              <div className="faq-col">
                {FAQ.slice(0, 3).map(({ q, a }) => (
                  <details key={q} className="faq-card">
                    <summary>{q}<span className="faq-plus" aria-hidden="true" /></summary>
                    <p>{a}</p>
                  </details>
                ))}
              </div>
              <div className="faq-col">
                {FAQ.slice(3).map(({ q, a }) => (
                  <details key={q} className="faq-card">
                    <summary>{q}<span className="faq-plus" aria-hidden="true" /></summary>
                    <p>{a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ═══════════════════════════════ CTA ═══════════════════════════════ */}
      <section className="nd-home next-step" id="cta" aria-labelledby="next-title">
        <div className="wrap">
          <div className="cta-band">
            <div className="cta-copy">
              <span className="cta-rule" aria-hidden="true" />
              <span className="cta-eyebrow">Your next step</span>
              <h2 id="next-title">Start with the providers you need to reach.</h2>
              <p>Explore the public records, check your target segment, then choose the account or API access that fits your workflow.</p>
              <div className="cta-actions">
                <Link className="btn-solid btn-green" href="/search">Find providers <i className="ph ph-arrow-up-right" /></Link>
                <Link className="cta-outline" href="/contact">Discuss your use case</Link>
              </div>
              <Link className="cta-ghost" href="/docs/api">Building an integration? Explore the API &rarr;</Link>
            </div>
            <svg className="cta-art" viewBox="0 0 320 220" aria-hidden="true">
              <defs>
                <linearGradient id="crossG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5b8cff" stopOpacity=".55" /><stop offset="1" stopColor="#23c8df" stopOpacity=".18" /></linearGradient>
                <filter id="glow"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
              </defs>
              <path d="M120 20h80a8 8 0 0 1 8 8v52h52a8 8 0 0 1 8 8v44a8 8 0 0 1-8 8h-52v52a8 8 0 0 1-8 8h-80a8 8 0 0 1-8-8v-52H60a8 8 0 0 1-8-8V88a8 8 0 0 1 8-8h52V28a8 8 0 0 1 8-8z" fill="url(#crossG)" stroke="#8fe6f3" strokeOpacity=".5" />
              <path className="ecg" d="M10 112h110l12-26 16 58 16-90 16 74 10-16h120" fill="none" stroke="#5be08a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />
            </svg>
          </div>
        </div>
      </section>

      <DarkFooter />
    </>
  );
}

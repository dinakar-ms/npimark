import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import Script from "next/script";
import { JsonLd } from "@/components/JsonLd";
import { DarkFooter } from "@/components/DarkFooter";
import { NewDesignScripts } from "@/components/NewDesignScripts";
import { ProviderTable } from "@/components/ProviderTable";
import {
  ApiError,
  getHealthSystem,
  searchProviders,
  toPublic,
  type PublicProvider,
} from "@/lib/api";
import { titleCase } from "@/lib/facilities";
import { systemPath } from "@/lib/lists";
import { allowSearch } from "@/lib/searchLimit";
import { websiteRef } from "@/lib/schema";
import {
  CLASSIFICATIONS,
  US_STATES,
  siteUrl,
  socialCard,
  stateName,
} from "@/lib/site";

export type SearchValues = {
  q?: string;
  state?: string;
  classification?: string;
  city?: string;
  postal_code?: string;
  type?: string;
  has_email?: string;
  system?: string;
};

const VISITOR_PAGE_SIZE = 25;
const VISITOR_MAX_PAGE = 2;

type Params = Record<string, string | string[] | undefined>;
type Props = { searchParams: Promise<Params> };

function one(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v.trim() ? v.trim() : undefined;
}

function readValues(params: Params): SearchValues & { page: number } {
  const page = Math.max(1, Number(one(params.page) ?? 1) || 1);
  return {
    q: one(params.q),
    state: one(params.state)?.toUpperCase().slice(0, 2),
    classification: one(params.classification),
    city: one(params.city),
    postal_code: one(params.postal_code)?.replace(/\D/g, "").slice(0, 5),
    type: one(params.type),
    has_email: one(params.has_email),
    system: one(params.system),
    page,
  };
}

function hasQuery(v: SearchValues): boolean {
  return Boolean(
    v.q ||
      v.state ||
      v.classification ||
      v.city ||
      v.postal_code ||
      v.type ||
      v.has_email ||
      v.system,
  );
}

async function systemName(slug: string | undefined): Promise<string | null> {
  if (!slug) return null;
  try {
    const found = await getHealthSystem(slug);
    return found.kind === "system" ? titleCase(found.system.name) : null;
  } catch {
    return null;
  }
}

function describe(v: SearchValues, system?: string | null): string {
  const parts: string[] = [];
  if (v.classification) parts.push(v.classification);
  if (v.type === "organization") parts.push("organizations");
  if (v.type === "individual") parts.push("individual providers");
  if (v.city) parts.push(`in ${v.city}`);
  if (v.state) parts.push(v.city ? stateName(v.state) ?? v.state : `in ${stateName(v.state) ?? v.state}`);
  if (v.postal_code) parts.push(`ZIP ${v.postal_code}`);
  if (v.q) parts.push(`matching "${v.q}"`);
  if (system) parts.push(`at ${system}`);
  else if (v.system) parts.push("at one health system");
  return parts.length ? parts.join(" ") : "all providers";
}

function headline(v: SearchValues, system?: string | null): string {
  const rest = describe({ ...v, classification: undefined }, system);
  const subject = v.classification ? `${v.classification} providers` : "Providers";
  return rest === "all providers" ? subject : `${subject} ${rest}`;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const values = readValues(await searchParams);
  const queried = hasQuery(values);
  const system = await systemName(values.system);
  return {
    title: queried
      ? `Providers: ${describe(values, system)}`
      : "Search US healthcare providers",
    description: queried
      ? `${headline(values, system)}. Verified records, refreshed weekly.`
      : "Search US healthcare providers by name, NPI, state, specialty and ZIP. Every field carries the date it was last confirmed.",
    alternates: { canonical: "/search" },
    openGraph: socialCard(
      "/search",
      "Search US healthcare providers",
      "Search US healthcare providers by name, NPI, state, specialty and ZIP.",
    ),
    robots: queried ? { index: false, follow: true } : undefined,
  };
}

function pageHref(values: SearchValues, page: number): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(values)) if (v) p.set(k, v);
  if (page > 1) p.set("page", String(page));
  const s = p.toString();
  return `/search${s ? `?${s}` : ""}`;
}

function LogoSvg() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" style={{ width: 40, height: 40 }}>
      <rect x="12" y="23" width="18" height="65" rx="9" fill="#4563ef" />
      <rect x="64" y="23" width="18" height="65" rx="9" fill="#4563ef" />
      <path d="M21 32 73 79" fill="none" stroke="#23c8df" strokeWidth="18" strokeLinecap="round" />
      <circle cx="73" cy="12" r="5.562" fill="#ff8058" />
    </svg>
  );
}

export default async function SearchPage({ searchParams }: Props) {
  const values = readValues(await searchParams);
  const queried = hasQuery(values);
  const system = await systemName(values.system);

  let rows: PublicProvider[] = [];
  let total = 0;
  let error: string | null = null;

  const beyondCap = values.page > VISITOR_MAX_PAGE;

  const address = queried && !beyondCap ? (await headers()).get("x-real-ip")?.trim() || null : null;
  const limit = queried && !beyondCap ? allowSearch(address) : { allowed: true as const };

  if (queried && !beyondCap && limit.allowed) {
    try {
      const page = await searchProviders(
        {
          q: values.q,
          state: values.state,
          taxonomy_classification: values.classification,
          city: values.city,
          postal_code: values.postal_code,
          type: values.type,
          has_email: values.has_email === "true" ? true : undefined,
          system: values.system,
          page: values.page,
          page_size: VISITOR_PAGE_SIZE,
        },
        { revalidate: 3600 },
      );
      rows = page.items.map(toPublic);
      total = page.total;
    } catch (e) {
      console.error("Public provider search failed", {
        status: e instanceof ApiError ? e.status : undefined,
      });
      error = "Provider search is temporarily unavailable. This does not mean there are no matching records. Please try again shortly or contact support.";
    }
  }

  const lastPage = Math.max(1, Math.ceil(total / VISITOR_PAGE_SIZE));
  const shownLast = Math.min(lastPage, VISITOR_MAX_PAGE);
  const capped = lastPage > VISITOR_MAX_PAGE;

  return (
    <>
      <main className="nd-search nd-home">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": siteUrl("/search#page"),
            name: "Search US healthcare providers",
            url: siteUrl("/search"),
            isPartOf: websiteRef(),
          }}
        />

        <div className="hero2 search-top">
          <header className="site-nav-new">
            <div className="wrap">
              <Link className="nd-brand" href="/" aria-label="NPImark Provider Data home">
                <LogoSvg /><span>NPImark<small>Provider Data</small></span>
              </Link>
              <nav className="top-menu" aria-label="Primary">
                <Link href="/search" aria-current="page">Search</Link>
                <Link href="/directory">Directory</Link>
                <Link href="/tour">Tour</Link>
                <Link href="/pricing">Pricing</Link>
                <Link href="/docs/api">API</Link>
              </nav>
              <div className="nav-actions">
                <Link className="icon-btn" href="/search" aria-label="Search"><i className="ph ph-magnifying-glass" /></Link>
                <Link className="btn-solid" href="/#cta">Get Started <i className="ph ph-arrow-right" /></Link>
              </div>
            </div>
          </header>

          <section className="sp-hero">
            <div className="wrap">
              <div className="sp-banner">
                <div className="sp-banner-art" aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/hero-search.png" alt="" />
                  <span className="sp-grid" />
                  <span className="sp-scan" />
                  <span className="sp-pin p1"><i /><b>Internal Medicine</b><em>Dallas, TX</em></span>
                  <span className="sp-pin p2"><i /><b>Pediatrics</b><em>Miami, FL</em></span>
                  <span className="sp-pin p3"><i /><b>General Acute Care Hospital</b><em>Boston, MA</em></span>
                </div>
                <div className="sp-banner-copy">
                  <div className="sp-kicker">Provider search <span aria-hidden="true">·</span> Public record</div>
                  <h1>
                    {queried
                      ? headline(values, system)
                      : <>Find any US <span className="sp-hl">healthcare provider</span></>}
                  </h1>
                  <p className="sp-sub">
                    Find providers by name, NPI, specialty or location. Browse public registry details;
                    available <Link href="/pricing">contact details</Link> require sign-in and an eligible plan, one provider at a time.
                  </p>
                </div>
              </div>

              {system && values.system && (
                <p className="sp-fine">
                  <i className="ph ph-info" />
                  Filtered to one health system.{" "}
                  <Link href={systemPath(values.system)}>Back to {system}</Link>.
                </p>
              )}

              <form className="sp-card" id="sp-form" role="search" action="/search" method="get">
                {values.system && <input type="hidden" name="system" value={values.system} />}
                <div className="sp-card-head">
                  <div>
                    <span className="sp-label">Build your search</span>
                    <h2>Who are you looking for?</h2>
                  </div>
                  <a href="/search" className="sp-clear"><i className="ph ph-arrow-counter-clockwise" />Clear filters</a>
                </div>

                <div className="sp-field sp-q">
                  <label htmlFor="sp-q">Name, organization or NPI</label>
                  <div className="sp-q-wrap"><i className="ph ph-magnifying-glass" /><input id="sp-q" name="q" type="search" defaultValue={values.q ?? ""} placeholder="e.g. Mayo Clinic, Patel, 1234567893" autoComplete="off" maxLength={200} /></div>
                </div>

                <div className="sp-row">
                  <div className="sp-field">
                    <label htmlFor="sp-state">State</label>
                    <select id="sp-state" name="state" defaultValue={values.state ?? ""}>
                      <option value="">Any state</option>
                      {US_STATES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                    </select>
                  </div>
                  <div className="sp-field">
                    <label htmlFor="sp-spec">Specialty</label>
                    <select id="sp-spec" name="classification" defaultValue={values.classification ?? ""}>
                      <option value="">Any specialty</option>
                      {CLASSIFICATIONS.map((name) => <option key={name} value={name}>{name}</option>)}
                    </select>
                  </div>
                  <div className="sp-field">
                    <label htmlFor="sp-city">City</label>
                    <input id="sp-city" name="city" type="text" defaultValue={values.city ?? ""} autoComplete="address-level2" />
                  </div>
                  <div className="sp-field">
                    <label htmlFor="sp-zip">ZIP</label>
                    <input id="sp-zip" name="postal_code" type="text" defaultValue={values.postal_code ?? ""} inputMode="numeric" pattern="[0-9]{3,5}" maxLength={5} placeholder="5 digits, or first 3" />
                  </div>
                  <div className="sp-field">
                    <label htmlFor="sp-type">Type</label>
                    <select id="sp-type" name="type" defaultValue={values.type ?? ""}>
                      <option value="">Individuals and organizations</option>
                      <option value="individual">Individuals</option>
                      <option value="organization">Organizations</option>
                    </select>
                  </div>
                  <div className="sp-field">
                    <label htmlFor="sp-contact">Contact</label>
                    <select id="sp-contact" name="has_email" defaultValue={values.has_email ?? ""}>
                      <option value="">Any</option>
                      <option value="true">Work email on file</option>
                      <option value="phone">Practice phone on file</option>
                    </select>
                  </div>
                  <button type="submit" className="btn-solid sp-submit"><i className="ph ph-magnifying-glass" />Search providers</button>
                </div>

                <p className="sp-fine"><i className="ph ph-info" />Start broad, then narrow by location or specialty. Contact availability does not guarantee access; plan and permission rules apply.</p>
              </form>

              {!queried && (
                <div className="sp-try"><span>Try:</span>
                  <Link className="sp-chip" href="/search?classification=Internal%20Medicine&state=TX">Internal Medicine in Texas</Link>
                  <Link className="sp-chip" href="/search?type=organization&classification=General%20Acute%20Care%20Hospital">Hospitals</Link>
                  <Link className="sp-chip" href="/search?classification=Nurse%20Practitioner&state=FL&has_email=true">Nurse practitioners in Florida with email</Link>
                  <Link className="sp-chip" href="/search?q=1234567893">NPI 1234567893</Link>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Results section */}
        {queried && error && (
          <section className="dir-body">
            <div className="wrap">
              <div className="sp-notice stop">{error}</div>
            </div>
          </section>
        )}

        {queried && !beyondCap && !limit.allowed && (
          <section className="dir-body">
            <div className="wrap">
              <div className="sp-notice warn" role="status">
                <b>That is a lot of searches in a short time.</b> Public search is limited per
                visitor so it stays available to everybody. Wait about{" "}
                {limit.retryAfterSeconds < 90
                  ? `${limit.retryAfterSeconds} seconds`
                  : `${Math.ceil(limit.retryAfterSeconds / 60)} minutes`}{" "}
                and try again — or <Link href="/sign-up">create an account</Link>, which searches
                the whole register without this limit.
              </div>
            </div>
          </section>
        )}

        {queried && beyondCap && (
          <section className="dir-body">
            <div className="wrap">
              <div className="sp-wall">
                <h2>Create an account to see the rest</h2>
                <p className="sp-sub" style={{ marginBottom: 12 }}>
                  Visitors can browse the first {VISITOR_MAX_PAGE * VISITOR_PAGE_SIZE} results of a
                  search. Your search is kept — sign up and it carries on from here.
                </p>
                <p style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                  <Link href="/sign-up" className="btn-solid">Create an account</Link>
                  <Link href={pageHref(values, VISITOR_MAX_PAGE)} className="btn-solid" style={{ background: "var(--nd-surface)", color: "var(--nd-text)" }}>
                    Back to page {VISITOR_MAX_PAGE}
                  </Link>
                </p>
                <p className="sp-fine" style={{ margin: 0 }}>
                  <i className="ph ph-info" />An account searches the whole register, saves searches, and opens contact details one provider at a time. The public record you see here stays free.
                </p>
              </div>
            </div>
          </section>
        )}

        {queried && !beyondCap && limit.allowed && !error && (
          <section className="dir-body sp-results">
            <div className="wrap">
              <div className="sp-results-head">
                <div>
                  <strong className="num">{total.toLocaleString("en-US")}</strong>{" "}
                  <span className="fine">
                    {total === 1 ? "provider" : "providers"} · showing{" "}
                    {Math.min(VISITOR_PAGE_SIZE, rows.length)} on page {values.page}
                  </span>
                </div>
                <Link href="/sign-up" className="btn-solid" style={{ fontSize: 13, height: 36, padding: "0 16px" }}>
                  Sign in for full results
                </Link>
              </div>

              <ProviderTable rows={rows} />

              <div className="sp-pager">
                {values.page > 1 && (
                  <Link href={pageHref(values, values.page - 1)} className="btn-solid" style={{ background: "var(--nd-surface)", color: "var(--nd-text)", fontSize: 13, height: 36, padding: "0 16px" }}>
                    Previous
                  </Link>
                )}
                <span className="num">
                  Page {values.page} of {shownLast}
                  {capped ? "+" : ""}
                </span>
                {values.page < shownLast ? (
                  <Link href={pageHref(values, values.page + 1)} className="btn-solid" style={{ fontSize: 13, height: 36, padding: "0 16px" }}>
                    Next
                  </Link>
                ) : (
                  capped && (
                    <Link href="/sign-up" className="btn-solid" style={{ fontSize: 13, height: 36, padding: "0 16px" }}>
                      Sign up for the rest
                    </Link>
                  )
                )}
              </div>

              {capped && (
                <p className="sp-fine" style={{ marginTop: 12 }}>
                  <i className="ph ph-info" />
                  Visitors can browse the first {VISITOR_MAX_PAGE * VISITOR_PAGE_SIZE} results of
                  a search. <Link href="/sign-up">Create an account</Link> for the full set,
                  saved searches and exports.
                </p>
              )}
            </div>
          </section>
        )}
      </main>

      {/* CTA */}
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
                <a className="cta-outline" href="#">Discuss your use case</a>
              </div>
              <Link className="cta-ghost" href="/docs/api">Building an integration? Explore the API →</Link>
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

      <NewDesignScripts />
      <Script src="https://unpkg.com/@phosphor-icons/web@2.1.1" strategy="beforeInteractive" />
    </>
  );
}

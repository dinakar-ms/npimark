import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { DarkFooter } from "@/components/DarkFooter";
import { NewDesignScripts } from "@/components/NewDesignScripts";
import { siteUrl, socialCard } from "@/lib/site";

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

export const metadata: Metadata = {
  title: "About — NPImark Provider Data",
  description:
    "Healthcare contact data for recruiting and sales. Find providers by specialty, location, or organization, then compare plans for work email access and exports.",
  alternates: { canonical: "/about" },
  openGraph: socialCard(
    "/about",
    "About — NPImark Provider Data",
    "Who we are, what we sell, and the three rules the product is built on.",
  ),
};

export default function AboutPage() {
  return (
    <>
      <main className="nd-about nd-home">
        <div className="hero2 ab-top">
          <header className="site-nav-new">
            <div className="wrap">
              <Link className="nd-brand" href="/" aria-label="NPImark Provider Data home">
                <LogoSvg /><span>NPImark<small>Provider Data</small></span>
              </Link>
              <nav className="top-menu" aria-label="Primary">
                <Link href="/search">Search</Link>
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

          <section className="ab-hero">
            <div className="wrap">
              <div className="ab-banner">
                <div className="ab-art" aria-hidden="true">
                  <img src="/hero-about.png" alt="" />
                  <span className="ab-grid" />
                  <span className="ab-ring r1" /><span className="ab-ring r2" /><span className="ab-ring r3" />
                  <span className="ab-orbit o1"><i className="ph-fill ph-stethoscope" />Individuals</span>
                  <span className="ab-orbit o2"><i className="ph-fill ph-buildings" />Organizations</span>
                  <span className="ab-count"><b>9,539,757</b><em>provider records in the platform today</em></span>
                </div>
                <div className="ab-copy">
                  <div className="sp-kicker">About</div>
                  <h1>A clearer view of the <span className="sp-hl">people behind healthcare.</span></h1>
                  <p className="sp-sub">NPImark helps recruiting teams, sales teams and healthcare organizations find US providers and understand where they practice. Search professional records, explore specialties and affiliations, and evaluate the data you need before choosing contact access or an API workflow.</p>
                  <p className="sp-sub">There are 9,539,757 provider records in the platform today, individuals and organizations, and search is open without an account - so the fastest way to judge any of this is to look up somebody you already know.</p>
                  <div className="ab-btns">
                    <Link className="ab-btn solid" href="/search"><i className="ph ph-magnifying-glass" />Search the records</Link>
                    <a className="ab-btn ghost" href="#">What is in the data</a>
                    <Link className="ab-btn ghost" href="/why-npi-mark">Why this rather than the alternatives</Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="ab-sec">
          <div className="wrap">
            <div className="ab-head">
              <div><div className="sp-kicker">Built around your work</div><h2>Different teams. One clear provider record.</h2></div>
              <p>Move from a broad market to a specific group of providers, with context you can inspect before you act.</p>
            </div>
            <div className="ab-teams">
              <Link className="ab-team t1" href="/directory">
                <span className="ab-team-top"><span className="ab-ic"><i className="ph-duotone ph-user-plus" /></span><span className="ab-num">01</span></span>
                <h3>Recruiting teams</h3>
                <p>Find clinicians by specialty and geography. Review practice locations and available affiliations before building a recruiting list.</p>
                <span className="ab-link">Explore specialties<i className="ph ph-arrow-right" /></span>
              </Link>
              <Link className="ab-team t2" href="/search">
                <span className="ab-team-top"><span className="ab-ic"><i className="ph-duotone ph-chart-line-up" /></span><span className="ab-num">02</span></span>
                <h3>Sales and growth teams</h3>
                <p>Research providers and healthcare organizations in your territory. Check segment coverage before choosing contact access.</p>
                <span className="ab-link">Check your market<i className="ph ph-arrow-right" /></span>
              </Link>
              <Link className="ab-team t3" href="/docs/api">
                <span className="ab-team-top"><span className="ab-ic"><i className="ph-duotone ph-buildings" /></span><span className="ab-num">03</span></span>
                <h3>Healthcare organizations</h3>
                <p>Look up providers by NPI, review available practice information, and explore an API workflow for your internal systems.</p>
                <span className="ab-link">Explore the API<i className="ph ph-arrow-right" /></span>
              </Link>
            </div>
          </div>
        </section>

        <section className="ab-sec ab-principle">
          <div className="wrap ab-split">
            <div className="ab-sticky">
              <div className="sp-kicker">The principle</div>
              <h2>Know what you are using. Know where to go next.</h2>
              <p>A useful provider database helps you make the next decision: who fits your criteria, which information is available, and what access your team needs. These principles guide that experience.</p>
              <p className="ab-fine">How each of these is enforced, and what a buyer{"'"}s security review asks about, is on <a href="#">security and trust</a>.</p>
            </div>
            <ol className="ab-steps">
              <li><span className="ab-step-n">1</span><div><h3>Start with identity and context</h3><p>Use NPI, specialty and practice location to find the right providers. Review available affiliations and field sources before adding a record to your workflow.</p></div></li>
              <li><span className="ab-step-n">2</span><div><h3>Choose contact access deliberately</h3><p>Provider research and contact reveals are separate actions. Inspect the professional record first, then use the contact access and allowance available to your account.</p></div></li>
              <li><span className="ab-step-n">3</span><div><h3>Understand the gaps</h3><p>A missing field is not a promise of coverage. Check the records in your own segment, review available dates and trust indicators, and distinguish unavailable information from fields that are withheld.</p></div></li>
            </ol>
          </div>
        </section>

        <section className="ab-sec">
          <div className="wrap">
            <div className="ab-head">
              <div><div className="sp-kicker">Our focus</div><h2>The scope of our platform.</h2></div>
              <p>Begin with the records and fields that matter to your team. The best evaluation is a representative sample of the work you actually need to do.</p>
            </div>
            <div className="ab-scope">
              <article className="ab-scope-card"><i className="ph-duotone ph-magnifying-glass" /><h3>US provider research</h3><p>The directory focuses on healthcare providers and organizations in the United States. Start with your actual specialty and geography to evaluate fit.</p></article>
              <article className="ab-scope-card"><i className="ph-duotone ph-lock-key" /><h3>Contact access has separate rules</h3><p>Public professional records do not grant unrestricted access to contact details. Availability, permissions and metering depend on the contact type and your account.</p></article>
              <article className="ab-scope-card"><i className="ph-duotone ph-stack" /><h3>Coverage varies by field</h3><p>Identity, specialty, affiliation and contact information can have different sources and update cycles. Evaluate the fields your team needs rather than relying on a single headline record count.</p></article>
              <article className="ab-scope-card"><i className="ph-duotone ph-scales" /><h3>Use rights matter</h3><p>Review the plan and terms for your intended workflow, including API access and exports. Contact our team if you need to clarify permitted use or contract requirements.</p></article>
            </div>
          </div>
        </section>

        <section className="ab-sec ab-who">
          <div className="wrap ab-who-grid">
            <div>
              <div className="sp-kicker">Who we are</div>
              <h2>Operated by Lorann LLC, in the United States.</h2>
              <p>NPI Mark is operated by Lorann LLC, a New York limited liability company, trading as NPI Mark, a United States company.</p>
              <p className="ab-fine">There are no stock photographs, no team gallery and no customer quotations on this site. The claims worth making about a provider database are the ones a buyer can check against a provider they already know, and everything on this page that cannot be checked that way is a fact the owner has confirmed.</p>
            </div>
            <address className="ab-addr">
              <span className="ab-addr-ic"><i className="ph-duotone ph-map-pin-area" /></span>
              <span className="ab-addr-k">Business mailing address</span>
              <span className="ab-addr-v">382 NE 191st St, Ste 463398<br />Miami, Florida 33179-3899<br />United States</span>
              <span className="ab-addr-tag"><i className="ph-fill ph-seal-check" />Lorann LLC · New York LLC</span>
            </address>
          </div>
        </section>

        <section className="ab-sec ab-touch-sec">
          <div className="wrap">
            <div className="ab-touch">
              <div className="ab-touch-head">
                <h2>Getting in touch.</h2>
                <p>Four routes, each for one thing: plans and contracts, support for customers, privacy and removal requests, and security reports. The <a href="#">contact page</a> lists them with what each is for.</p>
              </div>
              <div className="ab-routes">
                <div className="ab-route"><i className="ph-duotone ph-currency-circle-dollar" /><h3>Sales and plans</h3><p>Prices, what a plan includes, contract terms, and access to provider-matched home address and cell phone, which is contract-only.</p></div>
                <div className="ab-route"><i className="ph-duotone ph-lifebuoy" /><h3>Support for customers</h3><p>Your account, seats, billing, a search that is not returning what you expect, an export or append job that failed, and API keys.</p></div>
                <div className="ab-route"><i className="ph-duotone ph-shield-check" /><h3>Privacy and removal</h3><p>Opt out of the sale and sharing of your information, ask for it to be deleted, or have particular fields removed. You do not need an account, and we never charge for it.</p></div>
                <div className="ab-route"><i className="ph-duotone ph-bug" /><h3>Security reports</h3><p>A vulnerability in the site, the API or the application. Tell us what you found and how to reproduce it, and we will confirm we have it.</p></div>
              </div>
              <div className="ab-btns">
                <a className="ab-btn solid" href="#">Contact us</a>
                <Link className="ab-btn line" href="/report-a-problem">Remove my information</Link>
              </div>
            </div>
          </div>
        </section>
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

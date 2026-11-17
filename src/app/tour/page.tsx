import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { DarkFooter } from "@/components/DarkFooter";
import { NewDesignScripts } from "@/components/NewDesignScripts";
import { TourPlayer } from "@/components/TourPlayer";
import { socialCard } from "@/lib/site";

export const metadata: Metadata = {
  title: "A 32-second tour of NPImark",
  description: "See how to search physicians, understand their professional context, and reveal available contacts with your plan's allowance.",
  alternates: { canonical: "/tour" },
  openGraph: socialCard("/tour", "A quick tour of NPImark", "Search. Understand. Organize. Reveal."),
};

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

export default function TourPage() {
  return (
    <>
      <main className="nd-tour nd-home">
        <div className="hero2 tour-top">
          <header className="site-nav-new">
            <div className="wrap">
              <Link className="nd-brand" href="/" aria-label="NPImark Provider Data home">
                <LogoSvg /><span>NPImark<small>Provider Data</small></span>
              </Link>
              <nav className="top-menu" aria-label="Primary">
                <Link href="/search">Search</Link>
                <Link href="/directory">Directory</Link>
                <Link href="/tour" aria-current="page">Tour</Link>
                <Link href="/pricing">Pricing</Link>
                <Link href="/docs/api">API</Link>
              </nav>
              <div className="nav-actions">
                <Link className="icon-btn" href="/search" aria-label="Search"><i className="ph ph-magnifying-glass" /></Link>
                <Link className="btn-solid" href="/#cta">Get Started <i className="ph ph-arrow-right" /></Link>
              </div>
            </div>
          </header>

          <section className="tour-hero">
            <div className="wrap">
              <div className="tr-banner">
                <div className="tr-art" aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/hero-tour.png" alt="" />
                  <span className="tr-grid" />
                  <svg className="tr-path" viewBox="0 0 600 300" preserveAspectRatio="none"><path d="M40 230 C 140 230, 150 90, 250 110 S 380 230, 450 150 S 540 60, 570 70" /></svg>
                  <span className="tr-node n1"><i className="ph ph-magnifying-glass" /><b>Search</b></span>
                  <span className="tr-node n2"><i className="ph ph-identification-card" /><b>Understand</b></span>
                  <span className="tr-node n3"><i className="ph ph-list-checks" /><b>Organize</b></span>
                  <span className="tr-node n4"><i className="ph ph-envelope-open" /><b>Reveal</b></span>
                </div>
                <div className="tr-copy">
                  <div className="sp-kicker">Meet the platform</div>
                  <h1>From search to your <span className="sp-hl">next connection.</span></h1>
                  <p className="sp-sub">A short introduction to the people, organizations, and professional context you can explore.</p>
                  <a className="tr-watch" href="#player"><span><i className="ph-fill ph-play" /></span>Watch the 32-second tour</a>
                </div>
              </div>

              <TourPlayer />

              <details className="transcript">
                <summary><i className="ph ph-caret-right" />Read the full tour</summary>
                <ol>
                  <li><b>Start with the right specialty.</b><span>Search by name, NPI, specialty, or location. Narrow the results to the professional context that matters to your team.</span></li>
                  <li><b>See the professional picture.</b><span>Open a record to see specialty, practice location and the organization behind it. Practice location and affiliation are separate facts.</span></li>
                  <li><b>Build a focused list.</b><span>Keep the providers that fit, check the row count before you export, and choose the column set your CRM already expects.</span></li>
                  <li><b>Reveal contact details when you need them.</b><span>Signed-in customers on an eligible plan reveal available work emails one provider at a time, each with its trust tier and check date.</span></li>
                </ol>
              </details>

              <div className="tour-actions">
                <Link className="btn-solid" href="/search">Try a search</Link>
                <Link className="cta-outline dark" href="/directory">Browse the directory</Link>
              </div>
            </div>
          </section>
        </div>
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

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
  title: "IDN & health system intelligence — NPImark Provider Data",
  description:
    "Healthcare contact data for recruiting and sales. Find providers by specialty, location, or organization, then compare plans for work email access and exports.",
  alternates: { canonical: "/idn-data" },
  openGraph: socialCard(
    "/idn-data",
    "IDN & health system intelligence — NPImark Provider Data",
    "See the organization behind the provider.",
  ),
};

export default function IdnDataPage() {
  return (
    <>
      <main className="nd-idn nd-home">
        <div className="hero2 idn-top">
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

          <section className="idn-hero">
            <div className="wrap">
              <div className="idn-banner">
                <span className="idn-grid" aria-hidden="true" />
                <div className="idn-copy">
                  <div className="sp-kicker">IDN &amp; health system intelligence</div>
                  <h1>See the organization <span className="sp-hl">behind the provider.</span></h1>
                  <p className="sp-sub">Start with a health system, follow its member facilities, and build a clearer picture of the account. An integrated delivery network connects care settings under a coordinated organization; the relationships matter as much as the individual records.</p>
                  <div className="idn-btns">
                    <Link className="idn-btn solid" href="/systems">Explore health systems</Link>
                    <a className="idn-btn ghost" href="#">Discuss your coverage needs</a>
                  </div>
                </div>
                <aside className="idn-start">
                  <span className="idn-start-dot" />
                  <h2>Where to start</h2>
                  <p className="idn-start-sub">Explore health system records</p>
                  <ol>
                    <li><span>1</span>Find a health system by name or geography.</li>
                    <li><span>2</span>Review member facilities and the context of each relationship.</li>
                    <li><span>3</span>Use your workspace to research relevant people and plan the next conversation.</li>
                  </ol>
                </aside>
              </div>
            </div>
          </section>
        </div>

        <section className="idn-steps-sec">
          <div className="wrap">
            <ol className="idn-steps">
              <li><span className="idn-step-ic"><i className="ph-duotone ph-magnifying-glass" /><em>01</em></span><h3>Understand the account</h3><p>Review the system profile, its locations and available ownership information before planning outreach.</p></li>
              <li><span className="idn-step-ic"><i className="ph-duotone ph-tree-structure" /><em>02</em></span><h3>Follow the connections</h3><p>Move from a system to member facilities and inspect the relationships recorded on each profile.</p></li>
              <li><span className="idn-step-ic"><i className="ph-duotone ph-user-focus" /><em>03</em></span><h3>Find the relevant roles</h3><p>Explore leadership roles and business contacts in your workspace, subject to coverage and account access.</p></li>
            </ol>
          </div>
        </section>

        <section className="idn-sec idn-rel-sec">
          <div className="wrap idn-rel">
            <div className="idn-rel-left">
              <div className="sp-kicker">How to read a system</div>
              <h2>Relationships with context</h2>
              <div className="idn-map" aria-hidden="true" data-on="member">
                <svg className="idn-lines" viewBox="0 0 400 320" preserveAspectRatio="none">
                  <path className="ln member" d="M200 70 L80 170" /><path className="ln member" d="M200 70 L320 170" />
                  <path className="ln owner" d="M200 70 L200 170" />
                  <path className="ln clin" d="M80 170 L60 270" /><path className="ln clin" d="M80 170 L150 270" />
                  <path className="ln ehr" d="M320 170 L320 270" />
                </svg>
                <span className="nd sys" style={{ left: "50%", top: "22%" }}><i className="ph-fill ph-buildings" /><b>Health system</b></span>
                <span className="nd fac member" style={{ left: "20%", top: "53%" }}><i className="ph-fill ph-hospital" /><b>Hospital</b></span>
                <span className="nd fac owner" style={{ left: "50%", top: "53%" }}><i className="ph-fill ph-scales" /><b>Ownership</b></span>
                <span className="nd fac member" style={{ left: "80%", top: "53%" }}><i className="ph-fill ph-bed" /><b>Nursing home</b></span>
                <span className="nd sm clin" style={{ left: "15%", top: "84%" }}><i className="ph-fill ph-user" /><b>Clinician</b></span>
                <span className="nd sm clin" style={{ left: "37.5%", top: "84%" }}><i className="ph-fill ph-user" /><b>Clinician</b></span>
                <span className="nd sm ehr" style={{ left: "80%", top: "84%" }}><i className="ph-fill ph-desktop-tower" /><b>EHR</b></span>
              </div>
            </div>
            <ul className="idn-rel-list">
              <li data-k="member" tabIndex={0} className="on"><span className="idn-rel-ic"><i className="ph-duotone ph-link" /></span><div><h3>Health system membership</h3><p>A recorded connection between a facility and a system. Missing membership is not proof of independence.</p></div></li>
              <li data-k="owner" tabIndex={0}><span className="idn-rel-ic"><i className="ph-duotone ph-scales" /></span><div><h3>Ownership</h3><p>Review the ownership description and its scope. A system-level ownership category does not automatically apply to every member.</p></div></li>
              <li data-k="clin" tabIndex={0}><span className="idn-rel-ic"><i className="ph-duotone ph-stethoscope" /></span><div><h3>Clinician affiliations</h3><p>Use recorded links as research evidence. An affiliation alone does not establish employment or purchasing authority.</p></div></li>
              <li data-k="ehr" tabIndex={0}><span className="idn-rel-ic"><i className="ph-duotone ph-desktop-tower" /></span><div><h3>EHR / EMR</h3><p>Where available, review the technology and its evidence. An inferred system is not a confirmed installation.</p></div></li>
            </ul>
          </div>
        </section>

        <section className="idn-sec idn-faq-sec">
          <div className="wrap">
            <div className="idn-faq-card">
              <div className="idn-faq-head"><span className="idn-faq-ic"><i className="ph-duotone ph-chats-circle" /></span><h2>Before you get started</h2></div>
              <div className="idn-faq">
                <details><summary><span>Is every health system an IDN?</span><i className="ph ph-plus" /></summary><p>No. An integrated delivery network connects care settings under a coordinated organization. Start with the system profile and its member facilities, and review the relationships recorded on each one before treating a system as integrated.</p></details>
                <details><summary><span>Can I see CEOs, CFOs and procurement contacts?</span><i className="ph ph-plus" /></summary><p>Leadership roles and business contacts are available in your workspace, subject to coverage and account access. Public pages count leadership by role; signed-in customers see the named people.</p></details>
                <details><summary><span>Are counts guaranteed to match my target market?</span><i className="ph ph-plus" /></summary><p>No. Coverage varies by system, facility type and field. Check the records in your own segment before relying on a total, and talk to us about your coverage needs.</p></details>
              </div>
            </div>
          </div>
        </section>

        <section className="idn-sec idn-more-sec">
          <div className="wrap">
            <h2>Explore more of NPIMARK</h2>
            <div className="idn-more">
              <a href="#"><span className="idn-more-ic"><i className="ph-duotone ph-handshake" /></span><span>PBMs &amp; payer relationships</span><i className="ph ph-arrow-up-right idn-more-go" /></a>
              <a href="#"><span className="idn-more-ic"><i className="ph-duotone ph-robot" /></span><span>NPIMARK for AI assistants</span><i className="ph ph-arrow-up-right idn-more-go" /></a>
              <a href="#"><span className="idn-more-ic"><i className="ph-duotone ph-device-mobile" /></span><span>NPIMARK on mobile</span><i className="ph ph-arrow-up-right idn-more-go" /></a>
              <a href="#"><span className="idn-more-ic"><i className="ph-duotone ph-desktop-tower" /></span><span>EHR &amp; EMR intelligence</span><i className="ph ph-arrow-up-right idn-more-go" /></a>
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
      <script dangerouslySetInnerHTML={{ __html: `
        document.body.addEventListener('click', function(e) {
          var li = e.target.closest('.idn-rel-list li');
          if (!li) return;
          var map = document.querySelector('.idn-map');
          if (!map) return;
          document.querySelectorAll('.idn-rel-list li').forEach(function(el) { el.classList.remove('on'); });
          li.classList.add('on');
          map.setAttribute('data-on', li.getAttribute('data-k'));
        });
      `}} />
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { JsonLd } from "@/components/JsonLd";
import { DarkFooter } from "@/components/DarkFooter";
import { NewDesignScripts } from "@/components/NewDesignScripts";
import { FACILITY_KINDS, kindPath } from "@/lib/facilities";
import { DIRECTORY_SPECIALTIES, METROS, specialtyPath } from "@/lib/geo";
import { breadcrumb, websiteRef } from "@/lib/schema";
import { siteUrl, socialCard, stateName } from "@/lib/site";

export const revalidate = 86_400;

const ENTRY_SPECIALTY = DIRECTORY_SPECIALTIES[0];

const FACILITY_ICONS: Record<string, string> = {
  hospital: "ph-duotone ph-hospital",
  nursing_home: "ph-duotone ph-bed",
  home_health: "ph-duotone ph-house-line",
  hospice: "ph-duotone ph-hand-heart",
  dialysis: "ph-duotone ph-drop",
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

export const metadata: Metadata = {
  title: "Healthcare provider and facility directory",
  description:
    "Every active US healthcare provider and organization by name, and every certified hospital, nursing home, hospice, home health agency and dialysis center.",
  alternates: { canonical: "/directory" },
  openGraph: socialCard(
    "/directory",
    "Healthcare provider and facility directory",
    "Providers and organizations A to Z, and every certified facility by state and town.",
  ),
};

export default function DirectoryPage() {
  const byState = [...new Set(METROS.map((m) => m.state))].map(
    (state) => [state, METROS.filter((m) => m.state === state)] as const,
  );

  const AZ = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  return (
    <>
      <main className="nd-directory nd-home">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "CollectionPage",
                "@id": siteUrl("/directory#page"),
                name: "Healthcare provider and facility directory",
                url: siteUrl("/directory"),
                description: metadata.description as string,
                isPartOf: websiteRef(),
              },
              breadcrumb([{ name: "Directory", href: "/directory" }]),
            ],
          }}
        />

        <div className="hero2 dir-top">
          <header className="site-nav-new">
            <div className="wrap">
              <Link className="nd-brand" href="/" aria-label="NPImark Provider Data home">
                <LogoSvg /><span>NPImark<small>Provider Data</small></span>
              </Link>
              <nav className="top-menu" aria-label="Primary">
                <Link href="/search">Search</Link>
                <Link href="/directory" aria-current="page">Directory</Link>
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

          <section className="dir-hero">
            <div className="wrap">
              <nav className="crumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><i className="ph ph-caret-right" /><span aria-current="page">Directory</span></nav>
              <div className="sp-kicker">Browse the public record</div>
              <div className="dir-hero-grid">
                <div>
                  <h1>Healthcare provider and facility directory</h1>
                  <p className="sp-sub">Every active provider and organization with an NPI, and every certified facility still operating. Names, specialties, locations, size, ownership and published ratings are public; contact details and the people who run each organization are for signed-in customers.</p>
                </div>
                <form className="dir-search" role="search" action="/search" method="get">
                  <label htmlFor="dir-q">Know the name or NPI?</label>
                  <div className="pill-search">
                    <i className="ph ph-magnifying-glass" />
                    <input id="dir-q" type="search" name="q" placeholder="Provider, organization or NPI" autoComplete="off" maxLength={200} />
                    <button type="submit" className="btn-solid">Search providers</button>
                  </div>
                </form>
              </div>
            </div>
          </section>
        </div>

        <nav className="dir-tabs" aria-label="Directory sections">
          <div className="wrap"><div className="dir-tabs-in">
            <a href="#by-name"><i className="ph ph-text-aa" />By name</a>
            <a href="#facilities"><i className="ph ph-buildings" />Facilities</a>
            <a href="#leadership"><i className="ph ph-users-three" />Leadership</a>
            <a href="#by-metro"><i className="ph ph-map-trifold" />By metro</a>
          </div></div>
        </nav>

        <section className="dir-body">
          <div className="wrap">
            <div className="dir-pair">
              <div className="dir-card" id="by-name" data-reveal>
                <h2>By name</h2>
                <ul className="dir-list">
                  <li>
                    <Link href="/directory/providers"><span className="dr-ico"><i className="ph-duotone ph-user-list" /></span><b>Providers A–Z</b><i className="ph ph-arrow-right dr-go" /></Link>
                    <p>physicians, nurses, therapists, pharmacists and every other individual with an NPI.</p>
                  </li>
                  <li>
                    <Link href="/directory/organizations"><span className="dr-ico"><i className="ph-duotone ph-buildings" /></span><b>Organizations A–Z</b><i className="ph ph-arrow-right dr-go" /></Link>
                    <p>practices, clinics, hospitals, pharmacies, laboratories and suppliers.</p>
                  </li>
                </ul>
                <div className="az" aria-label="Jump to letter">
                  {AZ.map((l) => <Link key={l} href={`/directory/providers/${l.toLowerCase()}`}>{l}</Link>)}
                </div>
              </div>

              <div className="dir-card" id="facilities" data-reveal>
                <h2>Facilities by state and town</h2>
                <ul className="dir-list">
                  {FACILITY_KINDS.map((kind) => (
                    <li key={kind.type}>
                      <Link href={kindPath(kind)}><span className="dr-ico"><i className={FACILITY_ICONS[kind.type] ?? "ph-duotone ph-buildings"} /></span><b>{kind.plural}</b><i className="ph ph-arrow-right dr-go" /></Link>
                      <p>{kind.blurb}.</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="dir-card dir-lead" id="leadership" data-reveal>
              <div>
                <h2>Leadership by role</h2>
                <p>How many CEOs, CFOs, administrators, directors of nursing, board members and owners run each kind of facility, by state. Counted, never named – names are for signed-in customers.</p>
                <Link className="btn-solid btn-navy" href="/leadership">Leadership contacts by role <i className="ph ph-arrow-right" /></Link>
              </div>
              <div className="lead-roles" aria-hidden="true">
                <span><i className="ph-fill ph-crown-simple" />CEO</span>
                <span><i className="ph-fill ph-chart-line-up" />CFO</span>
                <span><i className="ph-fill ph-clipboard-text" />Administrator</span>
                <span><i className="ph-fill ph-first-aid" />Director of nursing</span>
                <span><i className="ph-fill ph-users-four" />Board member</span>
                <span><i className="ph-fill ph-key" />Owner</span>
              </div>
            </div>

            <div className="dir-card" id="by-metro" data-reveal>
              <div className="metro-head">
                <div>
                  <h2>Specialists by metro</h2>
                  <p>{DIRECTORY_SPECIALTIES.length} specialties across {METROS.length} metros. Open a metro for {ENTRY_SPECIALTY.toLowerCase()} there, and every other specialty in it.</p>
                </div>
                <label className="metro-filter"><i className="ph ph-magnifying-glass" /><input id="metro-q" type="search" placeholder="Filter states or cities" autoComplete="off" /></label>
              </div>
              <div className="metro-grid" id="metro-grid">
                {byState.map(([state, cities]) => (
                  <div key={state} className="metro" data-k={`${(stateName(state) ?? state).toLowerCase()} ${cities.map((c) => c.city.toLowerCase()).join(" ")}`}>
                    <h3>{stateName(state) ?? state}<span>{cities.length}</span></h3>
                    <div className="metro-cities">
                      {cities.map((metro) => (
                        <Link key={`${metro.city}-${metro.state}`} href={specialtyPath(ENTRY_SPECIALTY, metro)}>{metro.city}</Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="metro-empty" id="metro-empty" hidden>No metro matches that name.</p>
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
              <h2 id="next-title">Turn your research into a focused provider list.</h2>
              <p>Explore the public records, check your target segment, then choose the account or API access that fits your workflow.</p>
              <div className="cta-actions">
                <a className="btn-solid btn-green" href="#">Create your account <i className="ph ph-arrow-up-right" /></a>
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
        document.body.addEventListener('input', function(e) {
          if (e.target.id !== 'metro-q') return;
          var v = e.target.value.trim().toLowerCase(), n = 0;
          document.querySelectorAll('.metro').forEach(function(c) { var on = !v || c.dataset.k.includes(v); c.hidden = !on; if (on) n++; });
          var empty = document.getElementById('metro-empty');
          if (empty) empty.hidden = n > 0;
        });
      `}} />
    </>
  );
}

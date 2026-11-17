import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { DarkFooter } from "@/components/DarkFooter";
import { NewDesignScripts } from "@/components/NewDesignScripts";
import { socialCard } from "@/lib/site";

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
  title: "Why NPImark — NPImark Provider Data",
  description:
    "Healthcare contact data for recruiting and sales. Find providers by specialty, location, or organization, then compare plans for work email access and exports.",
  alternates: { canonical: "/why-npi-mark" },
  openGraph: socialCard(
    "/why-npi-mark",
    "Why NPImark — NPImark Provider Data",
    "Provider discovery, with a clear path to action.",
  ),
};

export default function WhyNpiMarkPage() {
  return (
    <>
      <main className="nd-why nd-home">
        <div className="hero2 wy-top">
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

          <section className="wy-hero">
            <div className="wrap">
              <div className="wy-banner">
                <div className="wy-art" aria-hidden="true">
                  <img src="/hero-why-NPI.png" alt="" />
                  <span className="wy-grid" />
                  <div className="wy-check">
                    <div className="wy-check-h"><i className="ph-fill ph-seal-check" />Record check</div>
                    <ul>
                      <li><span>Specialty</span><b><i className="ph-bold ph-check" />confirmed</b></li>
                      <li><span>Practice location</span><b><i className="ph-bold ph-check" />confirmed</b></li>
                      <li><span>Affiliation</span><b><i className="ph-bold ph-check" />dated</b></li>
                      <li><span>Work email</span><b className="lock"><i className="ph-bold ph-lock-simple" />metered</b></li>
                    </ul>
                  </div>
                </div>
                <div className="wy-copy">
                  <div className="sp-kicker">Why NPImark</div>
                  <h1>Provider discovery, with <span className="sp-hl">a clear path to action.</span></h1>
                  <p className="sp-sub">Start with a specific US provider segment, inspect the available records, and choose the contact and API access your team needs. NPImark brings discovery, coverage checks and account workflows together. Compare that focus with broader commercial intelligence and global reference-data platforms below.</p>
                  <a className="wy-jump" href="#compare">Compare platforms<i className="ph ph-arrow-down" /></a>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="wy-sec wy-tint" id="compare">
          <div className="wrap">
            <div className="wy-head">
              <div><div className="sp-kicker">Choose for the job you have</div><h2>NPImark, Definitive Healthcare or IQVIA?</h2></div>
              <p>Compare the specific product and dataset you need. These platforms have different scopes; this is a guide to evaluating fit, not a claim that one replaces every capability of another.</p>
            </div>
            <div className="wy-vend">
              <article className="wy-v us">
                <span className="wy-v-badge"><LogoSvg />Our focus</span>
                <h3>NPImark</h3>
                <p>US provider discovery organized around NPI, specialty, practice location and available affiliations. Public directory exploration leads into account-based lists, metered contact access and scoped API access.</p>
                <div className="wy-v-when"><b>Start here when</b><span>Your immediate job is to identify a provider segment and evaluate the records you can use.</span></div>
                <div className="wy-v-cta"><Link className="wy-btn solid" href="/search">Try provider search</Link></div>
              </article>
              <article className="wy-v">
                <span className="wy-v-k">Commercial intelligence</span>
                <h3>Definitive Healthcare</h3>
                <p>Its published portfolio includes healthcare organization and professional intelligence, affiliations, and medical and prescription claims products for commercial and market analysis.</p>
                <div className="wy-v-when"><b>Evaluate when</b><span>You need broader market intelligence or claims-led analysis alongside provider and organization research.</span></div>
                <div className="wy-v-cta"><a className="wy-ext" href="#" rel="noopener">Read their product overview<i className="ph ph-arrow-up-right" /></a></div>
              </article>
              <article className="wy-v">
                <span className="wy-v-k">Global reference data</span>
                <h3>IQVIA OneKey</h3>
                <p>IQVIA describes OneKey as a global healthcare professional and healthcare organization reference database. Evaluate OneKey separately from IQVIA{"'"}s other products and services.</p>
                <div className="wy-v-when"><b>Evaluate when</b><span>You need international HCP/HCO reference data and want to assess coverage for your countries and systems.</span></div>
                <div className="wy-v-cta"><a className="wy-ext" href="#" rel="noopener">Read the OneKey overview<i className="ph ph-arrow-up-right" /></a></div>
              </article>
            </div>
            <div className="wy-sample">
              <div className="wy-sample-ic"><i className="ph-duotone ph-flask" /></div>
              <div>
                <h3>Use the same sample to compare every vendor.</h3>
                <p>Choose a representative set of NPIs. Check specialty matches, current practice locations, affiliations, contact availability, source dates, permitted uses, API limits and total cost for your expected workflow. Coverage and rights vary by product and contract.</p>
                <div className="wy-btns">
                  <a className="wy-btn solid" href="#">Discuss your requirements</a>
                  <a className="wy-btn line" href="#">Review NPImark data coverage</a>
                  <Link className="wy-btn line" href="/pricing">See plans and allowances</Link>
                </div>
              </div>
            </div>
            <p className="wy-fine">Product descriptions reviewed October 18, 2026 using the vendors{"'"} linked product pages. No comparative pricing or accuracy claim is made. NPImark is not affiliated with or endorsed by Definitive Healthcare or IQVIA.</p>
          </div>
        </section>

        <section className="wy-sec">
          <div className="wrap">
            <div className="sp-kicker">What we actually sell</div>
            <h2 className="wy-h2-wide">Six things, and every one of them is checkable.</h2>
            <div className="wy-bento">
              <article className="wy-b b1"><span className="wy-b-ic"><i className="ph-duotone ph-calendar-check" /></span><h3>A date on every field, not on the file</h3><p>Identity and specialty are refreshed on one schedule, affiliations and licenses on another, a work email continuously - and each field says when it was last confirmed. You quote that date, decide what is fresh enough for what you are doing, and stop treating a record as uniformly current.</p></article>
              <article className="wy-b b2"><span className="wy-b-ic"><i className="ph-duotone ph-user-minus" /></span><h3>A removal that keeps working</h3><p>When somebody asks to be left alone it applies to search, pages, counts, exports, append and the API, for every customer, and it survives the weekly rebuild because the record is marked rather than deleted. It is also the reason we do not sell files: a removal cannot reach a copy somebody already owns.</p></article>
              <article className="wy-b b3"><span className="wy-b-ic"><i className="ph-duotone ph-envelope-simple-open" /></span><h3>Contact details metered and audited</h3><p>A work email is opened one record at a time against an allowance and written to an audit log. Home address and cell phone are contract-only, matched to the named provider, and never in an export or a list. You can see what your own team did, and so can we.</p></article>
              <article className="wy-b b4"><span className="wy-b-ic"><i className="ph-duotone ph-buildings" /></span><h3>The organizations, and who runs them</h3><p>Certified facilities with beds, ownership, chain and published ratings, the systems above them, and the named people who run them by role - counted in public, named for signed-in customers. This is the part a registry download does not contain and a generic database was never built for.</p></article>
              <article className="wy-b b5"><span className="wy-b-ic"><i className="ph-duotone ph-plugs-connected" /></span><h3>An API and an append tool, not a file drop</h3><p>Ask the question you have today rather than the one you anticipated when a file was cut. Append your own list and get the identifier, specialty, location and standing back against your own rows. Exports exist, with an allowance, for work that genuinely needs a file.</p></article>
              <article className="wy-b b6"><span className="wy-b-ic"><i className="ph-duotone ph-pill" /></span><h3>What they do, not only who they are</h3><p>The procedures a provider billed, code by code, and the drugs they prescribed, by brand and by generic — from published Medicare data for 2024. Searchable by name rather than by code, so {'"'}total knee replacement{'"'} and {'"'}Eliquis{'"'} are queries. It is Medicare fee-for-service only and covers about one in four clinicians nationally, and far more of the specialties that bill it most, which is less than a claims license and a great deal more than a specialty label. <a href="#">The limits are published</a>, per specialty, rather than discovered.</p></article>
              <article className="wy-b b7"><span className="wy-b-ic"><i className="ph-duotone ph-chart-bar" /></span><h3>Coverage you can check before you buy</h3><p>Counts per specialty and per state are published on the list pages - records, with a work email, with a trusted-tier email, with a practice phone. Check your own segment rather than taking a national total on trust.</p></article>
            </div>
            <div className="wy-live">
              <span className="wy-live-dot"><i />Live</span>
              <p>Read live from the same API a customer calls, as this page was served: <b>9,539,757</b> provider records, <b>48,353</b> certified facilities, <b>24</b> systems and chains with a page of their own, <b>142,874</b> leadership contacts counted by role.</p>
            </div>
          </div>
        </section>

        <section className="wy-sec wy-tint">
          <div className="wrap">
            <div className="sp-kicker">The alternatives</div>
            <h2 className="wy-h2-wide">What each one is good at, and what you take on with it.</h2>
            <div className="wy-alt">
              <div className="wy-tabs" role="tablist" aria-label="Alternatives">
                <button type="button" role="tab" className="wy-tab on" id="tab-0" aria-controls="alt-0" aria-selected="true"><i className="ph-duotone ph-download-simple" /><span>A public registry download</span><i className="ph ph-caret-right wy-tab-c" /></button>
                <button type="button" role="tab" className="wy-tab" id="tab-1" aria-controls="alt-1" aria-selected="false"><i className="ph-duotone ph-spider" /><span>A scraped list</span><i className="ph ph-caret-right wy-tab-c" /></button>
                <button type="button" role="tab" className="wy-tab" id="tab-2" aria-controls="alt-2" aria-selected="false"><i className="ph-duotone ph-address-book" /><span>A generic B2B contact database</span><i className="ph ph-caret-right wy-tab-c" /></button>
                <button type="button" role="tab" className="wy-tab" id="tab-3" aria-controls="alt-3" aria-selected="false"><i className="ph-duotone ph-receipt" /><span>A claims data vendor</span><i className="ph ph-caret-right wy-tab-c" /></button>
                <button type="button" role="tab" className="wy-tab" id="tab-4" aria-controls="alt-4" aria-selected="false"><i className="ph-duotone ph-wrench" /><span>Building it in-house</span><i className="ph ph-caret-right wy-tab-c" /></button>
              </div>
              <div className="wy-panels">
                <div className="wy-panel" role="tabpanel" id="alt-0" aria-labelledby="tab-0">
                  <h3><i className="ph-duotone ph-download-simple" />A public registry download</h3>
                  <div className="wy-good"><span className="wy-lab good"><i className="ph-bold ph-thumbs-up" />What it has going for it.</span><p>It is free, it covers the whole country, and it is the same public record we start from. If identity, specialty and a practice address for a known list of providers is genuinely all you need, download it and keep your money.</p></div>
                  <div className="wy-cost"><span className="wy-lab cost"><i className="ph-bold ph-warning" />What it costs you.</span>
                    <ul>
                      <li>The file has one date. A record does not tell you which of its fields was confirmed when, so every value is as old as the slowest part of the file.</li>
                      <li>There is no work email in it, and no way to tell a live address from one that was filed years ago and never revised.</li>
                      <li>Certified organizations, their beds, ownership, chain and published ratings are a different problem entirely, and the people who run them are not in any filing.</li>
                      <li>Somebody has to load it every week, reconcile the changes against what you already had, and keep doing that for as long as you use it. That work does not stop being work because the file was free.</li>
                      <li>Nobody has asked to be left out of it on your behalf. When a provider asks us to stop, that holds for every customer, and it keeps holding through the next refresh.</li>
                    </ul>
                  </div>
                </div>
                <div className="wy-panel" role="tabpanel" id="alt-1" aria-labelledby="tab-1" hidden>
                  <h3><i className="ph-duotone ph-spider" />A scraped list</h3>
                  <div className="wy-good"><span className="wy-lab good"><i className="ph-bold ph-thumbs-up" />What it has going for it.</span><p>It is cheap and it arrives immediately, and if you only need to test whether a market exists at all it will tell you that.</p></div>
                  <div className="wy-cost"><span className="wy-lab cost"><i className="ph-bold ph-warning" />What it costs you.</span>
                    <ul>
                      <li>Ask where each field came from and when it was confirmed. A scrape has no answer, because the answer was never collected - and the page it was taken from is not a filing anybody stands behind.</li>
                      <li>Ask what happens when somebody asks to be removed. There is no mechanism, so the answer is nothing, and the same details come back in the next copy of the list.</li>
                      <li>Ask who is liable for how it was collected and what you may do with it. On this platform that is in the terms, on a page, before you buy.</li>
                      <li>A list you cannot audit is a list you cannot defend, and it is your outreach that arrives at the wrong person, not the seller{"'"}s.</li>
                    </ul>
                  </div>
                </div>
                <div className="wy-panel" role="tabpanel" id="alt-2" aria-labelledby="tab-2" hidden>
                  <h3><i className="ph-duotone ph-address-book" />A generic B2B contact database</h3>
                  <div className="wy-good"><span className="wy-lab good"><i className="ph-bold ph-thumbs-up" />What it has going for it.</span><p>For reaching software buyers across every industry, a broad contact database is the right tool, and one of them is probably already in your stack. Some of them are very good at company hierarchies and at email.</p></div>
                  <div className="wy-cost"><span className="wy-lab cost"><i className="ph-bold ph-warning" />What it costs you.</span>
                    <ul>
                      <li>Healthcare specialty is not a job title. A clinician{"'"}s specialty here is the taxonomy they filed, with the classification it sits under, so asking for a classification matches every specialty beneath it - rather than matching whatever somebody typed into a profile.</li>
                      <li>The ten-digit identifier is the join key. It is what lets you append to your own file, deduplicate against it, and go back to the same provider next quarter and know it is the same person.</li>
                      <li>Ask whether the record tells you if a provider can be billed for at all - exclusions, opt-out and revocation flags. It is the cheapest disqualification there is, and it is on the record here before you spend anything.</li>
                      <li>Ask what it holds about the organization: whether it is certified, how many beds, who owns it, which chain it reports under, its published ratings, and who runs it by role.</li>
                      <li>Ask how a specialty count for your own segment is published before you buy. Coverage per specialty and per state is on the list pages here, so you can check your segment rather than take a total on trust.</li>
                    </ul>
                  </div>
                </div>
                <div className="wy-panel" role="tabpanel" id="alt-3" aria-labelledby="tab-3" hidden>
                  <h3><i className="ph-duotone ph-receipt" />A claims data vendor</h3>
                  <div className="wy-good"><span className="wy-lab good"><i className="ph-bold ph-thumbs-up" />What it has going for it.</span><p>On breadth of clinical activity they beat us and we are not going to pretend otherwise. All-payor claims see commercial, Medicaid and Medicare Advantage volume, not just Medicare fee-for-service; they see it for very nearly every practicing clinician rather than the roughly one in four whose Medicare volume is published; they carry years of history, so they can tell you a procedure count is rising; and they see it sooner. If your question is {'"'}who is doing more of this than last year, across all payors{'"'}, buy claims.</p></div>
                  <div className="wy-cost"><span className="wy-lab cost"><i className="ph-bold ph-warning" />What it costs you.</span>
                    <ul>
                      <li>We do hold what a provider bills and prescribes, and it is a real answer to {'"'}what do they do{'"'}: procedures by code and drugs by brand and generic, for 2024, filterable by name and readable per provider. 1,712,186 of 7,547,570 active individual providers (23%) have a published procedure line and 1,135,137 have a published prescribing row, measured 2026-11-10. That is the national share, and it is much higher in the specialties that bill Medicare Part B most - the data page publishes it per specialty, so you can check your own segment. Where that overlaps your target list, it does the job.</li>
                      <li>Ask what it costs and what you may do with it. Check the quoted price and whether the license permits your intended use of a derived list. Ours is published data, and what you may do with it is on a page before you buy.</li>
                      <li>Ask what you get for the clinicians the claims file is thin on, and what the contact data looks like. A claims record tells you what somebody did; it does not reliably tell you their current practice address, a confirmed work email, the organization they bill under or who runs it. That is the part of the job you would still be solving.</li>
                      <li>Ask whether a removal request reaches it. When a provider asks us to stop, it holds across search, pages, counts, exports, append and the API, for every customer, and it survives the next refresh.</li>
                      <li>The honest division: claims is the better answer to {'"'}who is doing more of this{'"'}, and we are the better answer to {'"'}who does this, who exactly are they, and how do I reach them{'"'}. Some teams need both; compare the licensed scope and total cost for your own workflow.</li>
                    </ul>
                  </div>
                </div>
                <div className="wy-panel" role="tabpanel" id="alt-4" aria-labelledby="tab-4" hidden>
                  <h3><i className="ph-duotone ph-wrench" />Building it in-house</h3>
                  <div className="wy-good"><span className="wy-lab good"><i className="ph-bold ph-thumbs-up" />What it has going for it.</span><p>It is a real option, and if you have a data team and need only identity and specialty, it is not a hard build. You would own it, and nobody would meter you.</p></div>
                  <div className="wy-cost"><span className="wy-lab cost"><i className="ph-bold ph-warning" />What it costs you.</span>
                    <ul>
                      <li>Identity is the easy part. Reconciling one provider across filings that disagree, and keeping that stable as they move practice, is where the time goes.</li>
                      <li>Work email cannot be read off a filing. It has to be confirmed, scored, and re-confirmed, and an unscored address has to fail rather than default to usable - which is the decision most in-house builds get wrong once and then live with.</li>
                      <li>Removals have to survive a rebuild. If your pipeline recreates the table each week, a deleted row comes back, and you will not notice until somebody writes to you a second time.</li>
                      <li>Then the parts nobody scopes: certified facility data, ownership and chains, leadership by role, an audit trail of who revealed what, and the ability to answer a customer asking where a field came from.</li>
                      <li>Keeping it current is the whole cost. The first load is a fortnight; the fifty-second load is the job.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="wy-sec wy-dark">
          <div className="wrap">
            <div className="wy-head">
              <div><div className="sp-kicker">When we are the wrong choice</div><h2>Four cases where the answer is not us.</h2></div>
              <p>A comparison page where the answer is always the seller is an advertisement. These are the requirements we cannot meet, and knowing them now is cheaper for both of us than finding out in week three.</p>
            </div>
            <div className="wy-wrong">
              <article className="wy-w"><span className="wy-w-ic"><i className="ph-duotone ph-user-circle-minus" /></span><h3>You need anything about patients</h3><p>There is none here, in any form, and there never will be. Not identified, not de-identified, not aggregated. If your question is about treatment, outcomes or claims at the patient level, this is the wrong platform and no plan changes that.</p></article>
              <article className="wy-w tall"><span className="wy-w-ic"><i className="ph-duotone ph-clock-counter-clockwise" /></span><h3>You need all-payor claims, or any history</h3><p>What we hold is published Medicare fee-for-service data for 2024 - one year, no earlier years - covering about one in four clinicians nationally, because low-volume providers are removed from the published file before we receive it. If you need commercial, Medicaid or Medicare Advantage volume, near-complete clinician coverage, or a trend across years, a claims licensee has it and we do not. Saying so costs us a deal occasionally and saves us the ones that would have gone wrong in month two.</p></article>
              <article className="wy-w"><span className="wy-w-ic"><i className="ph-duotone ph-shopping-bag" /></span><h3>You want consumer marketing data</h3><p>Provider records are not mixed with a consumer file, blended into a count or shipped inside a provider export. Provider-matched home address and cell phone exist under a signed contract with a stated permissible use, revealed one provider at a time, and are never in a list.</p></article>
              <article className="wy-w"><span className="wy-w-ic"><i className="ph-duotone ph-file-arrow-down" /></span><h3>You want to buy a file and resell it</h3><p>No plan carries redistribution or resale rights, exports are traceable to the export that produced them, and contact details are metered rather than handed over in bulk. If your model needs a file you own outright, we are not it.</p></article>
              <article className="wy-w"><span className="wy-w-ic"><i className="ph-duotone ph-hand-waving" /></span><h3>You need a handful of providers you can already name</h3><p>Search is open without an account, and a record page carries identity, specialty and practice location. If that is the whole job, do it for free and do not talk to us.</p></article>
            </div>
          </div>
        </section>

        <section className="wy-sec">
          <div className="wrap wy-faq-wrap">
            <div>
              <div className="sp-kicker">Questions</div>
              <h2>What people ask when they are comparing.</h2>
            </div>
            <div className="wy-faq">
              <details open><summary><span>Why not just use the free public file?</span><i className="ph ph-plus" /></summary><p>It is free and it is the same public record we start from. If identity, specialty and a practice address for a known list of providers is all you need, download it and keep your money. What it does not carry is a date on every field, a work email, the organizations and who runs them, or a removal that keeps holding through the next refresh.</p></details>
              <details><summary><span>Their data says what a doctor does. Yours only says who they are, doesn{"'"}t it?</span><i className="ph ph-plus" /></summary><p>We hold the procedures a provider billed, code by code, and the drugs they prescribed, by brand and by generic, from published Medicare data for 2024. It is Medicare fee-for-service only and covers about one in four clinicians nationally. If you need all-payor volume or years of history, a claims licensee has it and we do not.</p></details>
              <details><summary><span>How do I check your data is better than what I have now?</span><i className="ph ph-plus" /></summary><p>Check it on twenty providers you already know. Search is open without an account; look at the confirmed date on each field, and check the counts for your own specialty and state on the list pages rather than a national total.</p></details>
              <details><summary><span>Why is there no file of contact details to buy?</span><i className="ph ph-plus" /></summary><p>A removal cannot reach a copy somebody already owns. Work emails are opened one record at a time against an allowance and written to an audit log, and home address and cell phone are contract-only and never in an export or a list.</p></details>
              <details><summary><span>Is an API really better than a file?</span><i className="ph ph-plus" /></summary><p>It lets you ask the question you have today rather than the one you anticipated when a file was cut. Append your own list and get the identifier, specialty, location and standing back against your own rows. Exports exist, with an allowance, for work that genuinely needs a file.</p></details>
            </div>
          </div>
        </section>

        <section className="wy-sec wy-final-sec">
          <div className="wrap">
            <div className="wy-final">
              <div className="wy-final-art" aria-hidden="true">
                {Array.from({ length: 20 }, (_, i) => (
                  <span key={i} style={{ "--i": i } as React.CSSProperties}><i className="ph-fill ph-user" /></span>
                ))}
              </div>
              <div className="wy-final-copy">
                <h2>Check it on twenty providers you already know.</h2>
                <p>Search is open without an account and without a conversation. Look up people whose details you can verify, check the confirmed date on each field, and decide from that rather than from this page.</p>
                <div className="wy-btns">
                  <Link className="wy-btn solid" href="/search"><i className="ph ph-magnifying-glass" />Search providers</Link>
                  <a className="wy-btn line" href="#">What is in the data</a>
                  <Link className="wy-btn line" href="/pricing">Pricing</Link>
                </div>
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
      <script dangerouslySetInnerHTML={{ __html: `
        document.body.addEventListener('click', function(e) {
          var tab = e.target.closest('.wy-tab');
          if (!tab) return;
          var tabs = document.querySelectorAll('.wy-tab');
          var panels = document.querySelectorAll('.wy-panel');
          tabs.forEach(function(t) { t.classList.remove('on'); t.setAttribute('aria-selected', 'false'); });
          panels.forEach(function(p) { p.hidden = true; });
          tab.classList.add('on');
          tab.setAttribute('aria-selected', 'true');
          var panel = document.getElementById(tab.getAttribute('aria-controls'));
          if (panel) panel.hidden = false;
        });
      `}} />
    </>
  );
}

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
  title: "Healthcare provider and facility lists — NPImark Provider Data",
  description:
    "Healthcare contact data for recruiting and sales. Find providers by specialty, location, or organization, then compare plans for work email access and exports.",
  alternates: { canonical: "/lists" },
  openGraph: socialCard(
    "/lists",
    "Healthcare provider and facility lists — NPImark Provider Data",
    "Every list counted from the live register.",
  ),
};

export default function ListsPage() {
  return (
    <>
      <main className="nd-lists nd-home">
        <div className="hero2 ls-top">
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

          <section className="ls-hero">
            <div className="wrap">
              <nav className="ls-crumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><span aria-current="page">Lists</span></nav>
              <div className="ls-banner">
                <div className="ls-art" aria-hidden="true">
                  <img src="/hero-list.png" alt="" />
                  <span className="ls-grid" />
                  <div className="ls-meter">
                    <div className="ls-meter-h"><i className="ph-fill ph-funnel" />How each list is counted</div>
                    <div className="ls-funnel">
                      <div className="lf l1"><span>Records</span><b>100%</b></div>
                      <div className="lf l2"><span>With a work email</span></div>
                      <div className="lf l3"><span>Trusted-tier email</span></div>
                    </div>
                    <p>Illustrative. Real counts are in each table below.</p>
                  </div>
                </div>
                <div className="ls-copy">
                  <div className="sp-kicker">Lists · Counts refreshed 2026-11-11</div>
                  <h1>Healthcare provider and <span className="sp-hl">facility lists</span></h1>
                  <a className="ls-quote" href="#"><i className="ph ph-database" />Buy bulk data · Request a quote</a>
                  <p className="sp-sub">Every list below is counted from the live register: how many records it holds, how many carry a work email, and how many of those emails sit in the trusted tier. Pick a list to see it by state, what each record carries and a sample record.</p>
                  <div className="ls-btns">
                    <a className="ls-btn solid" href="#">Get a free sample</a>
                    <a className="ls-btn ghost" href="#">Build a custom list</a>
                  </div>
                  <p className="ls-note">Not sure which of these you need? The <a href="#">specialty and credential glossary</a> explains what each profession is, how its people qualify, and which list belongs to it.</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="ls-bar-wrap" id="ls-tools">
          <div className="wrap ls-tools">
            <label className="ls-filter"><i className="ph ph-magnifying-glass" /><input id="ls-q" type="search" placeholder="Filter lists, e.g. ambulance, hospice" autoComplete="off" /></label>
            <nav className="ls-jump" aria-label="Jump to a group">
              <a href="#facilities">Facilities</a>
              <a href="#agencies">Agencies</a>
              <a href="#physicians">Physicians</a>
              <a href="#behavioral-health">Behavioral Health</a>
              <a href="#dental">Dental</a>
              <a href="#nursing-service">Nursing</a>
              <a href="#pharmacy">Pharmacy</a>
              <a href="#suppliers">Suppliers</a>
              <a href="#transportation">Transportation</a>
            </nav>
          </div>
        </div>

        {/* ── Facilities ── */}
        <section className="ls-sec" id="facilities">
          <div className="wrap">
            <div className="ls-sec-head">
              <div><div className="sp-kicker">Facilities</div><h2><span className="ls-sec-ic"><i className="ph-duotone ph-buildings" /></span>Facility lists</h2></div>
              <div className="ls-sec-stats"><div><b>48,353</b><span>facilities</span></div><div><b>5</b><span>lists</span></div></div>
            </div>
            <div className="ls-fac">
              <a className="ls-fc" href="#" data-name="hospitals">
                <span className="ls-fc-top"><span className="ls-fc-ic"><i className="ph-duotone ph-hospital" /></span><i className="ph ph-arrow-up-right ls-fc-go" /></span>
                <h3>Hospitals</h3>
                <b className="ls-fc-n">7,044<em>facilities</em></b>
                <span className="ls-meterline"><span>With main phone</span><em>95%</em><span className="ls-track"><i style={{ width: "95%" }} /></span></span>
                <span className="ls-meterline lead"><span>With named leadership</span><em>72%</em><span className="ls-track"><i style={{ width: "72%" }} /></span></span>
              </a>
              <a className="ls-fc" href="#" data-name="nursing homes">
                <span className="ls-fc-top"><span className="ls-fc-ic"><i className="ph-duotone ph-bed" /></span><i className="ph ph-arrow-up-right ls-fc-go" /></span>
                <h3>Nursing homes</h3>
                <b className="ls-fc-n">14,690<em>facilities</em></b>
                <span className="ls-meterline"><span>With main phone</span><em>100%</em><span className="ls-track"><i style={{ width: "100%" }} /></span></span>
                <span className="ls-meterline lead"><span>With named leadership</span><em>97%</em><span className="ls-track"><i style={{ width: "97%" }} /></span></span>
              </a>
              <a className="ls-fc" href="#" data-name="home health agencies">
                <span className="ls-fc-top"><span className="ls-fc-ic"><i className="ph-duotone ph-house-line" /></span><i className="ph ph-arrow-up-right ls-fc-go" /></span>
                <h3>Home health agencies</h3>
                <b className="ls-fc-n">12,460<em>facilities</em></b>
                <span className="ls-meterline"><span>With main phone</span><em>100%</em><span className="ls-track"><i style={{ width: "100%" }} /></span></span>
                <span className="ls-meterline lead"><span>With named leadership</span><em>91%</em><span className="ls-track"><i style={{ width: "91%" }} /></span></span>
              </a>
              <a className="ls-fc" href="#" data-name="hospices">
                <span className="ls-fc-top"><span className="ls-fc-ic"><i className="ph-duotone ph-hand-heart" /></span><i className="ph ph-arrow-up-right ls-fc-go" /></span>
                <h3>Hospices</h3>
                <b className="ls-fc-n">6,669<em>facilities</em></b>
                <span className="ls-meterline"><span>With main phone</span><em>100%</em><span className="ls-track"><i style={{ width: "100%" }} /></span></span>
                <span className="ls-meterline lead"><span>With named leadership</span><em>87%</em><span className="ls-track"><i style={{ width: "87%" }} /></span></span>
              </a>
              <a className="ls-fc" href="#" data-name="dialysis centers">
                <span className="ls-fc-top"><span className="ls-fc-ic"><i className="ph-duotone ph-drop" /></span><i className="ph ph-arrow-up-right ls-fc-go" /></span>
                <h3>Dialysis centers</h3>
                <b className="ls-fc-n">7,490<em>facilities</em></b>
                <span className="ls-meterline"><span>With main phone</span><em>100%</em><span className="ls-track"><i style={{ width: "100%" }} /></span></span>
                <span className="ls-meterline lead"><span>With named leadership</span><em>11%</em><span className="ls-track"><i style={{ width: "11%" }} /></span></span>
              </a>
            </div>
            <div className="ls-also"><span>Also:</span>
              <Link href="/systems">Health systems and chains</Link>
              <a href="#">Healthcare leadership by role</a>
              <Link href="/directory">The full directory</Link>
            </div>
          </div>
        </section>

        {/* ── Agencies ── */}
        <section className="ls-sec" id="agencies" data-sec="">
          <div className="wrap">
            <div className="ls-sec-head">
              <div><div className="sp-kicker">Providers</div><h2><span className="ls-sec-ic"><i className="ph-duotone ph-briefcase-metal" /></span>Agencies</h2></div>
              <div className="ls-sec-stats"><div><b>311,081</b><span>records</span></div><div><b>15</b><span>lists</span></div><div><b>6,914</b><span>with email</span></div></div>
            </div>
            <div className="ls-table" role="table" aria-label="Agencies lists">
              <div className="ls-tr ls-th" role="row">
                <span role="columnheader">List</span>
                <button type="button" role="columnheader" className="ls-sort" data-k="1">Records<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="2">With email<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="3">Trusted-tier email<i className="ph ph-caret-up-down" /></button>
                <span role="columnheader" className="ls-cov-h">Email coverage</span>
              </div>
              <a className="ls-tr" role="row" href="#" data-g="0" data-name="home health" data-v="95298,1840,761"><span className="ls-name" role="cell">Home Health</span><span role="cell" className="ls-n">95,298</span><span role="cell" className="ls-n">1,840</span><span role="cell" className="ls-n">761</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "7.6%" }} /></span><em>1.9%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="1" data-name="community/behavioral health" data-v="70598,1325,927"><span className="ls-name" role="cell">Community/Behavioral Health</span><span role="cell" className="ls-n">70,598</span><span role="cell" className="ls-n">1,325</span><span role="cell" className="ls-n">927</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "7.6%" }} /></span><em>1.9%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="2" data-name="in home supportive care" data-v="48664,1225,332"><span className="ls-name" role="cell">In Home Supportive Care</span><span role="cell" className="ls-n">48,664</span><span role="cell" className="ls-n">1,225</span><span role="cell" className="ls-n">332</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "10%" }} /></span><em>2.5%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="3" data-name="case management" data-v="20618,507,319"><span className="ls-name" role="cell">Case Management</span><span role="cell" className="ls-n">20,618</span><span role="cell" className="ls-n">507</span><span role="cell" className="ls-n">319</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "10%" }} /></span><em>2.5%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="4" data-name="hospice care, community based" data-v="16397,131,108"><span className="ls-name" role="cell">Hospice Care, Community Based</span><span role="cell" className="ls-n">16,397</span><span role="cell" className="ls-n">131</span><span role="cell" className="ls-n">108</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "3.2%" }} /></span><em>0.8%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="5" data-name="local education agency (lea)" data-v="16226,226,162"><span className="ls-name" role="cell">Local Education Agency (LEA)</span><span role="cell" className="ls-n">16,226</span><span role="cell" className="ls-n">226</span><span role="cell" className="ls-n">162</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "5.6%" }} /></span><em>1.4%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="6" data-name="day training, developmentally disabled services" data-v="11626,303,100"><span className="ls-name" role="cell">Day Training, Developmentally Disabled Services</span><span role="cell" className="ls-n">11,626</span><span role="cell" className="ls-n">303</span><span role="cell" className="ls-n">100</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "10.4%" }} /></span><em>2.6%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="7" data-name="early intervention provider agency" data-v="9328,618,187"><span className="ls-name" role="cell">Early Intervention Provider Agency</span><span role="cell" className="ls-n">9,328</span><span role="cell" className="ls-n">618</span><span role="cell" className="ls-n">187</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "26.4%" }} /></span><em>6.6%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="8" data-name="public health or welfare" data-v="7877,168,132"><span className="ls-name" role="cell">Public Health or Welfare</span><span role="cell" className="ls-n">7,877</span><span role="cell" className="ls-n">168</span><span role="cell" className="ls-n">132</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "8.4%" }} /></span><em>2.1%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="9" data-name="nursing care" data-v="6752,326,216"><span className="ls-name" role="cell">Nursing Care</span><span role="cell" className="ls-n">6,752</span><span role="cell" className="ls-n">326</span><span role="cell" className="ls-n">216</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "19.2%" }} /></span><em>4.8%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="10" data-name="voluntary or charitable" data-v="2983,64,46"><span className="ls-name" role="cell">Voluntary or Charitable</span><span role="cell" className="ls-n">2,983</span><span role="cell" className="ls-n">64</span><span role="cell" className="ls-n">46</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "8.4%" }} /></span><em>2.1%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="11" data-name="foster care agency" data-v="2244,130,59"><span className="ls-name" role="cell">Foster Care Agency</span><span role="cell" className="ls-n">2,244</span><span role="cell" className="ls-n">130</span><span role="cell" className="ls-n">59</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "23.2%" }} /></span><em>5.8%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="12" data-name="supports brokerage" data-v="969,22,6"><span className="ls-name" role="cell">Supports Brokerage</span><span role="cell" className="ls-n">969</span><span role="cell" className="ls-n">22</span><span role="cell" className="ls-n">6</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "9.2%" }} /></span><em>2.3%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="13" data-name="home infusion" data-v="846,11,7"><span className="ls-name" role="cell">Home Infusion</span><span role="cell" className="ls-n">846</span><span role="cell" className="ls-n">11</span><span role="cell" className="ls-n">7</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "5.2%" }} /></span><em>1.3%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="14" data-name="program of all-inclusive care for the elderly (pace) provider organization" data-v="655,18,11"><span className="ls-name" role="cell">Program of All-Inclusive Care for the Elderly (PACE) Provider Organization</span><span role="cell" className="ls-n">655</span><span role="cell" className="ls-n">18</span><span role="cell" className="ls-n">11</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "10.8%" }} /></span><em>2.7%</em></span></a>
              <p className="ls-empty" hidden>No lists in this group match your filter.</p>
            </div>
          </div>
        </section>

        {/* ── Allopathic & Osteopathic Physicians ── */}
        <section className="ls-sec" id="physicians" data-sec="">
          <div className="wrap">
            <div className="ls-sec-head">
              <div><div className="sp-kicker">Providers</div><h2><span className="ls-sec-ic"><i className="ph-duotone ph-stethoscope" /></span>Allopathic &amp; Osteopathic Physicians</h2></div>
              <div className="ls-sec-stats"><div><b>1,834,689</b><span>records</span></div><div><b>35</b><span>lists</span></div><div><b>1,286,834</b><span>with email</span></div></div>
            </div>
            <div className="ls-table" role="table" aria-label="Allopathic & Osteopathic Physicians lists">
              <div className="ls-tr ls-th" role="row">
                <span role="columnheader">List</span>
                <button type="button" role="columnheader" className="ls-sort" data-k="1">Records<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="2">With email<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="3">Trusted-tier email<i className="ph ph-caret-up-down" /></button>
                <span role="columnheader" className="ls-cov-h">Email coverage</span>
              </div>
              <a className="ls-tr" role="row" href="#" data-g="0" data-name="internal medicine physicians" data-v="394000,294133,278363"><span className="ls-name" role="cell">Internal Medicine Physicians</span><span role="cell" className="ls-n">394,000</span><span role="cell" className="ls-n">294,133</span><span role="cell" className="ls-n">278,363</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>74.7%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="1" data-name="family medicine physicians" data-v="225712,159416,150914"><span className="ls-name" role="cell">Family Medicine Physicians</span><span role="cell" className="ls-n">225,712</span><span role="cell" className="ls-n">159,416</span><span role="cell" className="ls-n">150,914</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>70.6%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="2" data-name="pediatricians" data-v="129224,105598,99864"><span className="ls-name" role="cell">Pediatricians</span><span role="cell" className="ls-n">129,224</span><span role="cell" className="ls-n">105,598</span><span role="cell" className="ls-n">99,864</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>81.7%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="3" data-name="psychiatry & neurology" data-v="123337,94201,89576"><span className="ls-name" role="cell">Psychiatry &amp; Neurology</span><span role="cell" className="ls-n">123,337</span><span role="cell" className="ls-n">94,201</span><span role="cell" className="ls-n">89,576</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>76.4%</em></span></a>
              <a className="ls-tr sub" role="row" href="#" data-g="3" data-name="psychiatrists" data-v="73646,57306,54963"><span className="ls-name" role="cell"><i className="ph ph-arrow-elbow-down-right" />Psychiatrists</span><span role="cell" className="ls-n">73,646</span><span role="cell" className="ls-n">57,306</span><span role="cell" className="ls-n">54,963</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>77.8%</em></span></a>
              <a className="ls-tr sub" role="row" href="#" data-g="3" data-name="neurologists" data-v="28174,20607,19276"><span className="ls-name" role="cell"><i className="ph ph-arrow-elbow-down-right" />Neurologists</span><span role="cell" className="ls-n">28,174</span><span role="cell" className="ls-n">20,607</span><span role="cell" className="ls-n">19,276</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>73.1%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="4" data-name="emergency medicine physicians" data-v="86896,70973,66882"><span className="ls-name" role="cell">Emergency Medicine Physicians</span><span role="cell" className="ls-n">86,896</span><span role="cell" className="ls-n">70,973</span><span role="cell" className="ls-n">66,882</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>81.7%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="5" data-name="anesthesiologists" data-v="84985,65762,62345"><span className="ls-name" role="cell">Anesthesiologists</span><span role="cell" className="ls-n">84,985</span><span role="cell" className="ls-n">65,762</span><span role="cell" className="ls-n">62,345</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>77.4%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="6" data-name="obstetricians and gynecologists" data-v="77439,57022,53862"><span className="ls-name" role="cell">Obstetricians and Gynecologists</span><span role="cell" className="ls-n">77,439</span><span role="cell" className="ls-n">57,022</span><span role="cell" className="ls-n">53,862</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>73.6%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="7" data-name="radiologists" data-v="75396,58022,54775"><span className="ls-name" role="cell">Radiologists</span><span role="cell" className="ls-n">75,396</span><span role="cell" className="ls-n">58,022</span><span role="cell" className="ls-n">54,775</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>77.0%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="8" data-name="surgeons" data-v="66275,47242,44440"><span className="ls-name" role="cell">Surgeons</span><span role="cell" className="ls-n">66,275</span><span role="cell" className="ls-n">47,242</span><span role="cell" className="ls-n">44,440</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>71.3%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="9" data-name="orthopedic surgeons" data-v="53000,36228,34572"><span className="ls-name" role="cell">Orthopedic Surgeons</span><span role="cell" className="ls-n">53,000</span><span role="cell" className="ls-n">36,228</span><span role="cell" className="ls-n">34,572</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>68.4%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="10" data-name="ophthalmologists" data-v="37307,25089,23738"><span className="ls-name" role="cell">Ophthalmologists</span><span role="cell" className="ls-n">37,307</span><span role="cell" className="ls-n">25,089</span><span role="cell" className="ls-n">23,738</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>67.2%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="11" data-name="hospitalist" data-v="31626,26597,25131"><span className="ls-name" role="cell">Hospitalist</span><span role="cell" className="ls-n">31,626</span><span role="cell" className="ls-n">26,597</span><span role="cell" className="ls-n">25,131</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>84.1%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="12" data-name="general practice" data-v="30280,15269,14039"><span className="ls-name" role="cell">General Practice</span><span role="cell" className="ls-n">30,280</span><span role="cell" className="ls-n">15,269</span><span role="cell" className="ls-n">14,039</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>50.4%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="13" data-name="physical medicine & rehabilitation" data-v="29662,16085,14847"><span className="ls-name" role="cell">Physical Medicine &amp; Rehabilitation</span><span role="cell" className="ls-n">29,662</span><span role="cell" className="ls-n">16,085</span><span role="cell" className="ls-n">14,847</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>54.2%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="14" data-name="pathologists" data-v="27769,23367,22573"><span className="ls-name" role="cell">Pathologists</span><span role="cell" className="ls-n">27,769</span><span role="cell" className="ls-n">23,367</span><span role="cell" className="ls-n">22,573</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>84.1%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="15" data-name="dermatologists" data-v="27143,18282,17270"><span className="ls-name" role="cell">Dermatologists</span><span role="cell" className="ls-n">27,143</span><span role="cell" className="ls-n">18,282</span><span role="cell" className="ls-n">17,270</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>67.4%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="16" data-name="urologists" data-v="20288,14545,13715"><span className="ls-name" role="cell">Urologists</span><span role="cell" className="ls-n">20,288</span><span role="cell" className="ls-n">14,545</span><span role="cell" className="ls-n">13,715</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>71.7%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="17" data-name="otolaryngologists (ent)" data-v="19622,14645,14214"><span className="ls-name" role="cell">Otolaryngologists (ENT)</span><span role="cell" className="ls-n">19,622</span><span role="cell" className="ls-n">14,645</span><span role="cell" className="ls-n">14,214</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>74.6%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="18" data-name="neurosurgeons" data-v="12040,8323,7867"><span className="ls-name" role="cell">Neurosurgeons</span><span role="cell" className="ls-n">12,040</span><span role="cell" className="ls-n">8,323</span><span role="cell" className="ls-n">7,867</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>69.1%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="19" data-name="plastic surgeons" data-v="9671,5868,5496"><span className="ls-name" role="cell">Plastic Surgeons</span><span role="cell" className="ls-n">9,671</span><span role="cell" className="ls-n">5,868</span><span role="cell" className="ls-n">5,496</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>60.7%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="20" data-name="preventive medicine" data-v="9437,6262,5797"><span className="ls-name" role="cell">Preventive Medicine</span><span role="cell" className="ls-n">9,437</span><span role="cell" className="ls-n">6,262</span><span role="cell" className="ls-n">5,797</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>66.4%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="21" data-name="pain medicine" data-v="8971,3815,3619"><span className="ls-name" role="cell">Pain Medicine</span><span role="cell" className="ls-n">8,971</span><span role="cell" className="ls-n">3,815</span><span role="cell" className="ls-n">3,619</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>42.5%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="22" data-name="thoracic surgery (cardiothoracic vascular surgery)" data-v="8164,6073,5720"><span className="ls-name" role="cell">Thoracic Surgery (Cardiothoracic Vascular Surgery)</span><span role="cell" className="ls-n">8,164</span><span role="cell" className="ls-n">6,073</span><span role="cell" className="ls-n">5,720</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>74.4%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="23" data-name="allergists and immunologists" data-v="7368,4813,4553"><span className="ls-name" role="cell">Allergists and Immunologists</span><span role="cell" className="ls-n">7,368</span><span role="cell" className="ls-n">4,813</span><span role="cell" className="ls-n">4,553</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>65.3%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="24" data-name="colon & rectal surgery" data-v="3024,2272,2132"><span className="ls-name" role="cell">Colon &amp; Rectal Surgery</span><span role="cell" className="ls-n">3,024</span><span role="cell" className="ls-n">2,272</span><span role="cell" className="ls-n">2,132</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>75.1%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="25" data-name="oral & maxillofacial surgery" data-v="2082,932,827"><span className="ls-name" role="cell">Oral &amp; Maxillofacial Surgery</span><span role="cell" className="ls-n">2,082</span><span role="cell" className="ls-n">932</span><span role="cell" className="ls-n">827</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>44.8%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="26" data-name="medical genetics" data-v="1571,1208,1156"><span className="ls-name" role="cell">Medical Genetics</span><span role="cell" className="ls-n">1,571</span><span role="cell" className="ls-n">1,208</span><span role="cell" className="ls-n">1,156</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>76.9%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="27" data-name="neuromusculoskeletal medicine & omm" data-v="1548,1043,987"><span className="ls-name" role="cell">Neuromusculoskeletal Medicine &amp; OMM</span><span role="cell" className="ls-n">1,548</span><span role="cell" className="ls-n">1,043</span><span role="cell" className="ls-n">987</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>67.3%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="28" data-name="nuclear medicine" data-v="1476,1070,1007"><span className="ls-name" role="cell">Nuclear Medicine</span><span role="cell" className="ls-n">1,476</span><span role="cell" className="ls-n">1,070</span><span role="cell" className="ls-n">1,007</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>72.5%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="29" data-name="transplant surgery" data-v="1207,967,905"><span className="ls-name" role="cell">Transplant Surgery</span><span role="cell" className="ls-n">1,207</span><span role="cell" className="ls-n">967</span><span role="cell" className="ls-n">905</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>80.1%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="30" data-name="neuromusculoskeletal medicine, sports medicine" data-v="656,314,287"><span className="ls-name" role="cell">Neuromusculoskeletal Medicine, Sports Medicine</span><span role="cell" className="ls-n">656</span><span role="cell" className="ls-n">314</span><span role="cell" className="ls-n">287</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>47.9%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="31" data-name="phlebology" data-v="493,224,207"><span className="ls-name" role="cell">Phlebology</span><span role="cell" className="ls-n">493</span><span role="cell" className="ls-n">224</span><span role="cell" className="ls-n">207</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>45.4%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="32" data-name="integrative medicine" data-v="454,103,91"><span className="ls-name" role="cell">Integrative Medicine</span><span role="cell" className="ls-n">454</span><span role="cell" className="ls-n">103</span><span role="cell" className="ls-n">91</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "90%" }} /></span><em>22.7%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="33" data-name="electrodiagnostic medicine" data-v="397,15,10"><span className="ls-name" role="cell">Electrodiagnostic Medicine</span><span role="cell" className="ls-n">397</span><span role="cell" className="ls-n">15</span><span role="cell" className="ls-n">10</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "15%" }} /></span><em>3.8%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="34" data-name="independent medical examiner" data-v="241,114,97"><span className="ls-name" role="cell">Independent Medical Examiner</span><span role="cell" className="ls-n">241</span><span role="cell" className="ls-n">114</span><span role="cell" className="ls-n">97</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>47.3%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="35" data-name="clinical pharmacology" data-v="221,148,136"><span className="ls-name" role="cell">Clinical Pharmacology</span><span role="cell" className="ls-n">221</span><span role="cell" className="ls-n">148</span><span role="cell" className="ls-n">136</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>67.0%</em></span></a>
              <p className="ls-empty" hidden>No lists in this group match your filter.</p>
            </div>
          </div>
        </section>

        {/* ── Ambulatory Health Care Facilities ── */}
        <section className="ls-sec" id="ambulatory" data-sec="">
          <div className="wrap">
            <div className="ls-sec-head">
              <div><div className="sp-kicker">Providers</div><h2><span className="ls-sec-ic"><i className="ph-duotone ph-first-aid-kit" /></span>Ambulatory Health Care Facilities</h2></div>
              <div className="ls-sec-stats"><div><b>294,583</b><span>records</span></div><div><b>1</b><span>lists</span></div><div><b>5,147</b><span>with email</span></div></div>
            </div>
            <div className="ls-table" role="table" aria-label="Ambulatory Health Care Facilities lists">
              <div className="ls-tr ls-th" role="row">
                <span role="columnheader">List</span>
                <button type="button" role="columnheader" className="ls-sort" data-k="1">Records<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="2">With email<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="3">Trusted-tier email<i className="ph ph-caret-up-down" /></button>
                <span role="columnheader" className="ls-cov-h">Email coverage</span>
              </div>
              <a className="ls-tr" role="row" href="#" data-g="0" data-name="clinic/center" data-v="294583,5147,4208"><span className="ls-name" role="cell">Clinic/Center</span><span role="cell" className="ls-n">294,583</span><span role="cell" className="ls-n">5,147</span><span role="cell" className="ls-n">4,208</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "7%" }} /></span><em>1.7%</em></span></a>
              <a className="ls-tr sub" role="row" href="#" data-g="0" data-name="mental health" data-v="32151,0,0"><span className="ls-name" role="cell"><i className="ph ph-arrow-elbow-down-right" />Mental Health</span><span role="cell" className="ls-n">32,151</span><span role="cell" className="ls-n">—</span><span role="cell" className="ls-n">—</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "0%" }} /></span><em>—</em></span></a>
              <a className="ls-tr sub" role="row" href="#" data-g="0" data-name="dental" data-v="25874,0,0"><span className="ls-name" role="cell"><i className="ph ph-arrow-elbow-down-right" />Dental</span><span role="cell" className="ls-n">25,874</span><span role="cell" className="ls-n">—</span><span role="cell" className="ls-n">—</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "0%" }} /></span><em>—</em></span></a>
              <a className="ls-tr sub" role="row" href="#" data-g="0" data-name="physical therapy" data-v="20884,0,0"><span className="ls-name" role="cell"><i className="ph ph-arrow-elbow-down-right" />Physical Therapy</span><span role="cell" className="ls-n">20,884</span><span role="cell" className="ls-n">—</span><span role="cell" className="ls-n">—</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "0%" }} /></span><em>—</em></span></a>
              <a className="ls-tr sub" role="row" href="#" data-g="0" data-name="federally qualified health center (fqhc)" data-v="17809,0,0"><span className="ls-name" role="cell"><i className="ph ph-arrow-elbow-down-right" />Federally Qualified Health Center (FQHC)</span><span role="cell" className="ls-n">17,809</span><span role="cell" className="ls-n">—</span><span role="cell" className="ls-n">—</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "0%" }} /></span><em>—</em></span></a>
              <a className="ls-tr sub" role="row" href="#" data-g="0" data-name="primary care" data-v="17432,0,0"><span className="ls-name" role="cell"><i className="ph ph-arrow-elbow-down-right" />Primary Care</span><span role="cell" className="ls-n">17,432</span><span role="cell" className="ls-n">—</span><span role="cell" className="ls-n">—</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "0%" }} /></span><em>—</em></span></a>
              <a className="ls-tr sub" role="row" href="#" data-g="0" data-name="ambulatory surgical" data-v="13974,0,0"><span className="ls-name" role="cell"><i className="ph ph-arrow-elbow-down-right" />Ambulatory Surgical</span><span role="cell" className="ls-n">13,974</span><span role="cell" className="ls-n">—</span><span role="cell" className="ls-n">—</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "0%" }} /></span><em>—</em></span></a>
              <a className="ls-tr sub" role="row" href="#" data-g="0" data-name="urgent care" data-v="12126,0,0"><span className="ls-name" role="cell"><i className="ph ph-arrow-elbow-down-right" />Urgent Care</span><span role="cell" className="ls-n">12,126</span><span role="cell" className="ls-n">—</span><span role="cell" className="ls-n">—</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "0%" }} /></span><em>—</em></span></a>
              <a className="ls-tr sub" role="row" href="#" data-g="0" data-name="multi-specialty" data-v="11407,0,0"><span className="ls-name" role="cell"><i className="ph ph-arrow-elbow-down-right" />Multi-Specialty</span><span role="cell" className="ls-n">11,407</span><span role="cell" className="ls-n">—</span><span role="cell" className="ls-n">—</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "0%" }} /></span><em>—</em></span></a>
              <a className="ls-tr sub" role="row" href="#" data-g="0" data-name="end-stage renal disease (esrd) treatment" data-v="11330,0,0"><span className="ls-name" role="cell"><i className="ph ph-arrow-elbow-down-right" />End-Stage Renal Disease (ESRD) Treatment</span><span role="cell" className="ls-n">11,330</span><span role="cell" className="ls-n">—</span><span role="cell" className="ls-n">—</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "0%" }} /></span><em>—</em></span></a>
              <a className="ls-tr sub" role="row" href="#" data-g="0" data-name="adult mental health" data-v="10472,0,0"><span className="ls-name" role="cell"><i className="ph ph-arrow-elbow-down-right" />Adult Mental Health</span><span role="cell" className="ls-n">10,472</span><span role="cell" className="ls-n">—</span><span role="cell" className="ls-n">—</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "0%" }} /></span><em>—</em></span></a>
              <a className="ls-tr sub" role="row" href="#" data-g="0" data-name="health service" data-v="9309,0,0"><span className="ls-name" role="cell"><i className="ph ph-arrow-elbow-down-right" />Health Service</span><span role="cell" className="ls-n">9,309</span><span role="cell" className="ls-n">—</span><span role="cell" className="ls-n">—</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "0%" }} /></span><em>—</em></span></a>
              <a className="ls-tr sub" role="row" href="#" data-g="0" data-name="rural health" data-v="8859,0,0"><span className="ls-name" role="cell"><i className="ph ph-arrow-elbow-down-right" />Rural Health</span><span role="cell" className="ls-n">8,859</span><span role="cell" className="ls-n">—</span><span role="cell" className="ls-n">—</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "0%" }} /></span><em>—</em></span></a>
              <a className="ls-tr sub" role="row" href="#" data-g="0" data-name="adult day care" data-v="7677,0,0"><span className="ls-name" role="cell"><i className="ph ph-arrow-elbow-down-right" />Adult Day Care</span><span role="cell" className="ls-n">7,677</span><span role="cell" className="ls-n">—</span><span role="cell" className="ls-n">—</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "0%" }} /></span><em>—</em></span></a>
              <a className="ls-tr sub" role="row" href="#" data-g="0" data-name="rehabilitation, substance use disorder" data-v="7511,0,0"><span className="ls-name" role="cell"><i className="ph ph-arrow-elbow-down-right" />Rehabilitation, Substance Use Disorder</span><span role="cell" className="ls-n">7,511</span><span role="cell" className="ls-n">—</span><span role="cell" className="ls-n">—</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "0%" }} /></span><em>—</em></span></a>
              <a className="ls-tr sub" role="row" href="#" data-g="0" data-name="medical specialty" data-v="6275,0,0"><span className="ls-name" role="cell"><i className="ph ph-arrow-elbow-down-right" />Medical Specialty</span><span role="cell" className="ls-n">6,275</span><span role="cell" className="ls-n">—</span><span role="cell" className="ls-n">—</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "0%" }} /></span><em>—</em></span></a>
              <a className="ls-tr sub" role="row" href="#" data-g="0" data-name="rehabilitation" data-v="5723,0,0"><span className="ls-name" role="cell"><i className="ph ph-arrow-elbow-down-right" />Rehabilitation</span><span role="cell" className="ls-n">5,723</span><span role="cell" className="ls-n">—</span><span role="cell" className="ls-n">—</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "0%" }} /></span><em>—</em></span></a>
              <a className="ls-tr sub" role="row" href="#" data-g="0" data-name="radiology" data-v="4555,0,0"><span className="ls-name" role="cell"><i className="ph ph-arrow-elbow-down-right" />Radiology</span><span role="cell" className="ls-n">4,555</span><span role="cell" className="ls-n">—</span><span role="cell" className="ls-n">—</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "0%" }} /></span><em>—</em></span></a>
              <p className="ls-empty" hidden>No lists in this group match your filter.</p>
            </div>
          </div>
        </section>

        {/* ── Behavioral Health & Social Service Providers ── */}
        <section className="ls-sec" id="behavioral-health" data-sec="">
          <div className="wrap">
            <div className="ls-sec-head">
              <div><div className="sp-kicker">Providers</div><h2><span className="ls-sec-ic"><i className="ph-duotone ph-brain" /></span>Behavioral Health &amp; Social Service Providers</h2></div>
              <div className="ls-sec-stats"><div><b>2,284,897</b><span>records</span></div><div><b>10</b><span>lists</span></div><div><b>932,005</b><span>with email</span></div></div>
            </div>
            <div className="ls-table" role="table" aria-label="Behavioral Health & Social Service Providers lists">
              <div className="ls-tr ls-th" role="row">
                <span role="columnheader">List</span>
                <button type="button" role="columnheader" className="ls-sort" data-k="1">Records<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="2">With email<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="3">Trusted-tier email<i className="ph ph-caret-up-down" /></button>
                <span role="columnheader" className="ls-cov-h">Email coverage</span>
              </div>
              <a className="ls-tr" role="row" href="#" data-g="0" data-name="counselors" data-v="720682,431347,394247"><span className="ls-name" role="cell">Counselors</span><span role="cell" className="ls-n">720,682</span><span role="cell" className="ls-n">431,347</span><span role="cell" className="ls-n">394,247</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>59.9%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="1" data-name="behavior technician" data-v="609086,259433,241990"><span className="ls-name" role="cell">Behavior Technician</span><span role="cell" className="ls-n">609,086</span><span role="cell" className="ls-n">259,433</span><span role="cell" className="ls-n">241,990</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>42.6%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="2" data-name="social workers" data-v="508285,302881,273503"><span className="ls-name" role="cell">Social Workers</span><span role="cell" className="ls-n">508,285</span><span role="cell" className="ls-n">302,881</span><span role="cell" className="ls-n">273,503</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>59.6%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="3" data-name="psychologists" data-v="185335,103772,94061"><span className="ls-name" role="cell">Psychologists</span><span role="cell" className="ls-n">185,335</span><span role="cell" className="ls-n">103,772</span><span role="cell" className="ls-n">94,061</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>56.0%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="4" data-name="behavior analyst" data-v="129724,63582,58348"><span className="ls-name" role="cell">Behavior Analyst</span><span role="cell" className="ls-n">129,724</span><span role="cell" className="ls-n">63,582</span><span role="cell" className="ls-n">58,348</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>49.0%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="5" data-name="marriage & family therapist" data-v="112963,61391,56315"><span className="ls-name" role="cell">Marriage &amp; Family Therapist</span><span role="cell" className="ls-n">112,963</span><span role="cell" className="ls-n">61,391</span><span role="cell" className="ls-n">56,315</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>54.3%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="6" data-name="assistant behavior analyst" data-v="10319,4225,3821"><span className="ls-name" role="cell">Assistant Behavior Analyst</span><span role="cell" className="ls-n">10,319</span><span role="cell" className="ls-n">4,225</span><span role="cell" className="ls-n">3,821</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>40.9%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="7" data-name="clinical neuropsychologist" data-v="7062,5074,4716"><span className="ls-name" role="cell">Clinical Neuropsychologist</span><span role="cell" className="ls-n">7,062</span><span role="cell" className="ls-n">5,074</span><span role="cell" className="ls-n">4,716</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>71.9%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="8" data-name="psychoanalyst" data-v="1366,652,562"><span className="ls-name" role="cell">Psychoanalyst</span><span role="cell" className="ls-n">1,366</span><span role="cell" className="ls-n">652</span><span role="cell" className="ls-n">562</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>47.7%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="9" data-name="drama therapist" data-v="274,48,42"><span className="ls-name" role="cell">Drama Therapist</span><span role="cell" className="ls-n">274</span><span role="cell" className="ls-n">48</span><span role="cell" className="ls-n">42</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "70%" }} /></span><em>17.5%</em></span></a>
              <p className="ls-empty" hidden>No lists in this group match your filter.</p>
            </div>
          </div>
        </section>

        {/* ── Chiropractic Providers ── */}
        <section className="ls-sec" id="chiropractic" data-sec="">
          <div className="wrap">
            <div className="ls-sec-head">
              <div><div className="sp-kicker">Providers</div><h2><span className="ls-sec-ic"><i className="ph-duotone ph-person-arms-spread" /></span>Chiropractic Providers</h2></div>
              <div className="ls-sec-stats"><div><b>166,988</b><span>records</span></div><div><b>1</b><span>lists</span></div><div><b>26,062</b><span>with email</span></div></div>
            </div>
            <div className="ls-table" role="table" aria-label="Chiropractic Providers lists">
              <div className="ls-tr ls-th" role="row">
                <span role="columnheader">List</span>
                <button type="button" role="columnheader" className="ls-sort" data-k="1">Records<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="2">With email<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="3">Trusted-tier email<i className="ph ph-caret-up-down" /></button>
                <span role="columnheader" className="ls-cov-h">Email coverage</span>
              </div>
              <a className="ls-tr" role="row" href="#" data-g="0" data-name="chiropractors" data-v="166988,26062,17105"><span className="ls-name" role="cell">Chiropractors</span><span role="cell" className="ls-n">166,988</span><span role="cell" className="ls-n">26,062</span><span role="cell" className="ls-n">17,105</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "62%" }} /></span><em>15.6%</em></span></a>
              <p className="ls-empty" hidden>No lists in this group match your filter.</p>
            </div>
          </div>
        </section>

        {/* ── Dental Providers ── */}
        <section className="ls-sec" id="dental" data-sec="">
          <div className="wrap">
            <div className="ls-sec-head">
              <div><div className="sp-kicker">Providers</div><h2><span className="ls-sec-ic"><i className="ph-duotone ph-tooth" /></span>Dental Providers</h2></div>
              <div className="ls-sec-stats"><div><b>407,603</b><span>records</span></div><div><b>7</b><span>lists</span></div><div><b>272,548</b><span>with email</span></div></div>
            </div>
            <div className="ls-table" role="table" aria-label="Dental Providers lists">
              <div className="ls-tr ls-th" role="row">
                <span role="columnheader">List</span>
                <button type="button" role="columnheader" className="ls-sort" data-k="1">Records<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="2">With email<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="3">Trusted-tier email<i className="ph ph-caret-up-down" /></button>
                <span role="columnheader" className="ls-cov-h">Email coverage</span>
              </div>
              <a className="ls-tr" role="row" href="#" data-g="0" data-name="dentists" data-v="386747,264420,223969"><span className="ls-name" role="cell">Dentists</span><span role="cell" className="ls-n">386,747</span><span role="cell" className="ls-n">264,420</span><span role="cell" className="ls-n">223,969</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>68.4%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="1" data-name="dental hygienist" data-v="16917,6593,4800"><span className="ls-name" role="cell">Dental Hygienist</span><span role="cell" className="ls-n">16,917</span><span role="cell" className="ls-n">6,593</span><span role="cell" className="ls-n">4,800</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>39.0%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="2" data-name="dental assistant" data-v="2925,1045,788"><span className="ls-name" role="cell">Dental Assistant</span><span role="cell" className="ls-n">2,925</span><span role="cell" className="ls-n">1,045</span><span role="cell" className="ls-n">788</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>35.7%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="3" data-name="denturist" data-v="615,400,353"><span className="ls-name" role="cell">Denturist</span><span role="cell" className="ls-n">615</span><span role="cell" className="ls-n">400</span><span role="cell" className="ls-n">353</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>65.0%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="4" data-name="dental therapist" data-v="209,62,51"><span className="ls-name" role="cell">Dental Therapist</span><span role="cell" className="ls-n">209</span><span role="cell" className="ls-n">62</span><span role="cell" className="ls-n">51</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>29.7%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="5" data-name="advanced practice dental therapist" data-v="105,22,13"><span className="ls-name" role="cell">Advanced Practice Dental Therapist</span><span role="cell" className="ls-n">105</span><span role="cell" className="ls-n">22</span><span role="cell" className="ls-n">13</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "84%" }} /></span><em>21.0%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="6" data-name="dental laboratory technician" data-v="85,6,2"><span className="ls-name" role="cell">Dental Laboratory Technician</span><span role="cell" className="ls-n">85</span><span role="cell" className="ls-n">6</span><span role="cell" className="ls-n">2</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "28%" }} /></span><em>7.1%</em></span></a>
              <p className="ls-empty" hidden>No lists in this group match your filter.</p>
            </div>
          </div>
        </section>

        {/* ── Dietary & Nutritional Service Providers ── */}
        <section className="ls-sec" id="dietary" data-sec="">
          <div className="wrap">
            <div className="ls-sec-head">
              <div><div className="sp-kicker">Providers</div><h2><span className="ls-sec-ic"><i className="ph-duotone ph-apple" /></span>Dietary &amp; Nutritional Service Providers</h2></div>
              <div className="ls-sec-stats"><div><b>87,027</b><span>records</span></div><div><b>4</b><span>lists</span></div><div><b>27,058</b><span>with email</span></div></div>
            </div>
            <div className="ls-table" role="table" aria-label="Dietary & Nutritional Service Providers lists">
              <div className="ls-tr ls-th" role="row">
                <span role="columnheader">List</span>
                <button type="button" role="columnheader" className="ls-sort" data-k="1">Records<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="2">With email<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="3">Trusted-tier email<i className="ph ph-caret-up-down" /></button>
                <span role="columnheader" className="ls-cov-h">Email coverage</span>
              </div>
              <a className="ls-tr" role="row" href="#" data-g="0" data-name="registered dietitians" data-v="79951,25601,19573"><span className="ls-name" role="cell">Registered Dietitians</span><span role="cell" className="ls-n">79,951</span><span role="cell" className="ls-n">25,601</span><span role="cell" className="ls-n">19,573</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>32.0%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="1" data-name="nutritionist" data-v="6553,1360,952"><span className="ls-name" role="cell">Nutritionist</span><span role="cell" className="ls-n">6,553</span><span role="cell" className="ls-n">1,360</span><span role="cell" className="ls-n">952</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "83%" }} /></span><em>20.8%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="2" data-name="dietetic technician registered" data-v="312,39,18"><span className="ls-name" role="cell">Dietetic Technician Registered</span><span role="cell" className="ls-n">312</span><span role="cell" className="ls-n">39</span><span role="cell" className="ls-n">18</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "50%" }} /></span><em>12.5%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="3" data-name="dietary manager" data-v="211,58,47"><span className="ls-name" role="cell">Dietary Manager</span><span role="cell" className="ls-n">211</span><span role="cell" className="ls-n">58</span><span role="cell" className="ls-n">47</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>27.5%</em></span></a>
              <p className="ls-empty" hidden>No lists in this group match your filter.</p>
            </div>
          </div>
        </section>

        {/* ── Emergency Medical Service Providers ── */}
        <section className="ls-sec" id="emergency-medical" data-sec="">
          <div className="wrap">
            <div className="ls-sec-head">
              <div><div className="sp-kicker">Providers</div><h2><span className="ls-sec-ic"><i className="ph-duotone ph-siren" /></span>Emergency Medical Service Providers</h2></div>
              <div className="ls-sec-stats"><div><b>5,169</b><span>records</span></div><div><b>4</b><span>lists</span></div><div><b>663</b><span>with email</span></div></div>
            </div>
            <div className="ls-table" role="table" aria-label="Emergency Medical Service Providers lists">
              <div className="ls-tr ls-th" role="row">
                <span role="columnheader">List</span>
                <button type="button" role="columnheader" className="ls-sort" data-k="1">Records<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="2">With email<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="3">Trusted-tier email<i className="ph ph-caret-up-down" /></button>
                <span role="columnheader" className="ls-cov-h">Email coverage</span>
              </div>
              <a className="ls-tr" role="row" href="#" data-g="0" data-name="emt, paramedic" data-v="2145,68,24"><span className="ls-name" role="cell">EMT, Paramedic</span><span role="cell" className="ls-n">2,145</span><span role="cell" className="ls-n">68</span><span role="cell" className="ls-n">24</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "13%" }} /></span><em>3.2%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="1" data-name="emt, basic" data-v="2041,272,168"><span className="ls-name" role="cell">EMT, Basic</span><span role="cell" className="ls-n">2,041</span><span role="cell" className="ls-n">272</span><span role="cell" className="ls-n">168</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "53%" }} /></span><em>13.3%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="2" data-name="personal emergency response attendant" data-v="680,292,244"><span className="ls-name" role="cell">Personal Emergency Response Attendant</span><span role="cell" className="ls-n">680</span><span role="cell" className="ls-n">292</span><span role="cell" className="ls-n">244</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>42.9%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="3" data-name="emt, intermediate" data-v="303,31,14"><span className="ls-name" role="cell">EMT, Intermediate</span><span role="cell" className="ls-n">303</span><span role="cell" className="ls-n">31</span><span role="cell" className="ls-n">14</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "41%" }} /></span><em>10.2%</em></span></a>
              <p className="ls-empty" hidden>No lists in this group match your filter.</p>
            </div>
          </div>
        </section>

        {/* ── Eye and Vision Services Providers ── */}
        <section className="ls-sec" id="eye-vision" data-sec="">
          <div className="wrap">
            <div className="ls-sec-head">
              <div><div className="sp-kicker">Providers</div><h2><span className="ls-sec-ic"><i className="ph-duotone ph-eye" /></span>Eye and Vision Services Providers</h2></div>
              <div className="ls-sec-stats"><div><b>116,418</b><span>records</span></div><div><b>2</b><span>lists</span></div><div><b>68,763</b><span>with email</span></div></div>
            </div>
            <div className="ls-table" role="table" aria-label="Eye and Vision Services Providers lists">
              <div className="ls-tr ls-th" role="row">
                <span role="columnheader">List</span>
                <button type="button" role="columnheader" className="ls-sort" data-k="1">Records<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="2">With email<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="3">Trusted-tier email<i className="ph ph-caret-up-down" /></button>
                <span role="columnheader" className="ls-cov-h">Email coverage</span>
              </div>
              <a className="ls-tr" role="row" href="#" data-g="0" data-name="optometrists" data-v="100620,64147,53530"><span className="ls-name" role="cell">Optometrists</span><span role="cell" className="ls-n">100,620</span><span role="cell" className="ls-n">64,147</span><span role="cell" className="ls-n">53,530</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>63.8%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="1" data-name="technician/technologist" data-v="15798,4616,2976"><span className="ls-name" role="cell">Technician/Technologist</span><span role="cell" className="ls-n">15,798</span><span role="cell" className="ls-n">4,616</span><span role="cell" className="ls-n">2,976</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>29.2%</em></span></a>
              <p className="ls-empty" hidden>No lists in this group match your filter.</p>
            </div>
          </div>
        </section>

        {/* ── Hospital Units ── */}
        <section className="ls-sec" id="hospital-units" data-sec="">
          <div className="wrap">
            <div className="ls-sec-head">
              <div><div className="sp-kicker">Providers</div><h2><span className="ls-sec-ic"><i className="ph-duotone ph-bed" /></span>Hospital Units</h2></div>
              <div className="ls-sec-stats"><div><b>6,483</b><span>records</span></div><div><b>4</b><span>lists</span></div><div><b>125</b><span>with email</span></div></div>
            </div>
            <div className="ls-table" role="table" aria-label="Hospital Units lists">
              <div className="ls-tr ls-th" role="row">
                <span role="columnheader">List</span>
                <button type="button" role="columnheader" className="ls-sort" data-k="1">Records<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="2">With email<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="3">Trusted-tier email<i className="ph ph-caret-up-down" /></button>
                <span role="columnheader" className="ls-cov-h">Email coverage</span>
              </div>
              <a className="ls-tr" role="row" href="#" data-g="0" data-name="psychiatric unit" data-v="2435,59,44"><span className="ls-name" role="cell">Psychiatric Unit</span><span role="cell" className="ls-n">2,435</span><span role="cell" className="ls-n">59</span><span role="cell" className="ls-n">44</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "10%" }} /></span><em>2.4%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="1" data-name="medicare defined swing bed unit" data-v="1890,29,21"><span className="ls-name" role="cell">Medicare Defined Swing Bed Unit</span><span role="cell" className="ls-n">1,890</span><span role="cell" className="ls-n">29</span><span role="cell" className="ls-n">21</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "6%" }} /></span><em>1.5%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="2" data-name="rehabilitation unit" data-v="1784,28,17"><span className="ls-name" role="cell">Rehabilitation Unit</span><span role="cell" className="ls-n">1,784</span><span role="cell" className="ls-n">28</span><span role="cell" className="ls-n">17</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "6%" }} /></span><em>1.6%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="3" data-name="rehab substance use disorder unit" data-v="374,9,5"><span className="ls-name" role="cell">Rehab Substance Use Disorder Unit</span><span role="cell" className="ls-n">374</span><span role="cell" className="ls-n">9</span><span role="cell" className="ls-n">5</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "10%" }} /></span><em>2.4%</em></span></a>
              <p className="ls-empty" hidden>No lists in this group match your filter.</p>
            </div>
          </div>
        </section>

        {/* ── Hospitals ── */}
        <section className="ls-sec" id="hospitals" data-sec="">
          <div className="wrap">
            <div className="ls-sec-head">
              <div><div className="sp-kicker">Providers</div><h2><span className="ls-sec-ic"><i className="ph-duotone ph-hospital" /></span>Hospitals</h2></div>
              <div className="ls-sec-stats"><div><b>27,745</b><span>records</span></div><div><b>8</b><span>lists</span></div><div><b>1,786</b><span>with email</span></div></div>
            </div>
            <div className="ls-table" role="table" aria-label="Hospitals lists">
              <div className="ls-tr ls-th" role="row">
                <span role="columnheader">List</span>
                <button type="button" role="columnheader" className="ls-sort" data-k="1">Records<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="2">With email<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="3">Trusted-tier email<i className="ph ph-caret-up-down" /></button>
                <span role="columnheader" className="ls-cov-h">Email coverage</span>
              </div>
              <a className="ls-tr" role="row" href="#" data-g="0" data-name="general acute care hospital" data-v="20547,1401,1182"><span className="ls-name" role="cell">General Acute Care Hospital</span><span role="cell" className="ls-n">20,547</span><span role="cell" className="ls-n">1,401</span><span role="cell" className="ls-n">1,182</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "27%" }} /></span><em>6.8%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="1" data-name="psychiatric hospital" data-v="2430,140,121"><span className="ls-name" role="cell">Psychiatric Hospital</span><span role="cell" className="ls-n">2,430</span><span role="cell" className="ls-n">140</span><span role="cell" className="ls-n">121</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "23%" }} /></span><em>5.8%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="2" data-name="rehabilitation hospital" data-v="1374,47,26"><span className="ls-name" role="cell">Rehabilitation Hospital</span><span role="cell" className="ls-n">1,374</span><span role="cell" className="ls-n">47</span><span role="cell" className="ls-n">26</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "14%" }} /></span><em>3.4%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="3" data-name="long term care hospital" data-v="1077,31,23"><span className="ls-name" role="cell">Long Term Care Hospital</span><span role="cell" className="ls-n">1,077</span><span role="cell" className="ls-n">31</span><span role="cell" className="ls-n">23</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "12%" }} /></span><em>2.9%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="4" data-name="military hospital" data-v="924,59,49"><span className="ls-name" role="cell">Military Hospital</span><span role="cell" className="ls-n">924</span><span role="cell" className="ls-n">59</span><span role="cell" className="ls-n">49</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "26%" }} /></span><em>6.4%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="5" data-name="special hospital" data-v="863,67,57"><span className="ls-name" role="cell">Special Hospital</span><span role="cell" className="ls-n">863</span><span role="cell" className="ls-n">67</span><span role="cell" className="ls-n">57</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "31%" }} /></span><em>7.8%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="6" data-name="chronic disease hospital" data-v="409,40,35"><span className="ls-name" role="cell">Chronic Disease Hospital</span><span role="cell" className="ls-n">409</span><span role="cell" className="ls-n">40</span><span role="cell" className="ls-n">35</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "39%" }} /></span><em>9.8%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="7" data-name="religious nonmedical health care institution" data-v="121,1,0"><span className="ls-name" role="cell">Religious Nonmedical Health Care Institution</span><span role="cell" className="ls-n">121</span><span role="cell" className="ls-n">1</span><span role="cell" className="ls-n">0</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "3%" }} /></span><em>0.8%</em></span></a>
              <p className="ls-empty" hidden>No lists in this group match your filter.</p>
            </div>
          </div>
        </section>

        {/* ── Laboratories ── */}
        <section className="ls-sec" id="laboratories" data-sec="">
          <div className="wrap">
            <div className="ls-sec-head">
              <div><div className="sp-kicker">Providers</div><h2><span className="ls-sec-ic"><i className="ph-duotone ph-flask" /></span>Laboratories</h2></div>
              <div className="ls-sec-stats"><div><b>21,213</b><span>records</span></div><div><b>3</b><span>lists</span></div><div><b>238</b><span>with email</span></div></div>
            </div>
            <div className="ls-table" role="table" aria-label="Laboratories lists">
              <div className="ls-tr ls-th" role="row">
                <span role="columnheader">List</span>
                <button type="button" role="columnheader" className="ls-sort" data-k="1">Records<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="2">With email<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="3">Trusted-tier email<i className="ph ph-caret-up-down" /></button>
                <span role="columnheader" className="ls-cov-h">Email coverage</span>
              </div>
              <a className="ls-tr" role="row" href="#" data-g="0" data-name="clinical medical laboratory" data-v="19138,223,174"><span className="ls-name" role="cell">Clinical Medical Laboratory</span><span role="cell" className="ls-n">19,138</span><span role="cell" className="ls-n">223</span><span role="cell" className="ls-n">174</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "5%" }} /></span><em>1.2%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="1" data-name="physiological laboratory" data-v="1912,13,11"><span className="ls-name" role="cell">Physiological Laboratory</span><span role="cell" className="ls-n">1,912</span><span role="cell" className="ls-n">13</span><span role="cell" className="ls-n">11</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "3%" }} /></span><em>0.7%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="2" data-name="dental laboratory" data-v="163,2,1"><span className="ls-name" role="cell">Dental Laboratory</span><span role="cell" className="ls-n">163</span><span role="cell" className="ls-n">2</span><span role="cell" className="ls-n">1</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "5%" }} /></span><em>1.2%</em></span></a>
              <p className="ls-empty" hidden>No lists in this group match your filter.</p>
            </div>
          </div>
        </section>

        {/* ── Managed Care Organizations ── */}
        <section className="ls-sec" id="managed-care" data-sec="">
          <div className="wrap">
            <div className="ls-sec-head">
              <div><div className="sp-kicker">Providers</div><h2><span className="ls-sec-ic"><i className="ph-duotone ph-shield-plus" /></span>Managed Care Organizations</h2></div>
              <div className="ls-sec-stats"><div><b>12,661</b><span>records</span></div><div><b>4</b><span>lists</span></div><div><b>285</b><span>with email</span></div></div>
            </div>
            <div className="ls-table" role="table" aria-label="Managed Care Organizations lists">
              <div className="ls-tr ls-th" role="row">
                <span role="columnheader">List</span>
                <button type="button" role="columnheader" className="ls-sort" data-k="1">Records<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="2">With email<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="3">Trusted-tier email<i className="ph ph-caret-up-down" /></button>
                <span role="columnheader" className="ls-cov-h">Email coverage</span>
              </div>
              <a className="ls-tr" role="row" href="#" data-g="0" data-name="hmo" data-v="4599,127,102"><span className="ls-name" role="cell">HMO</span><span role="cell" className="ls-n">4,599</span><span role="cell" className="ls-n">127</span><span role="cell" className="ls-n">102</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "11%" }} /></span><em>2.8%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="1" data-name="ppo" data-v="3088,74,56"><span className="ls-name" role="cell">PPO</span><span role="cell" className="ls-n">3,088</span><span role="cell" className="ls-n">74</span><span role="cell" className="ls-n">56</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "10%" }} /></span><em>2.4%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="2" data-name="point of service" data-v="2697,52,24"><span className="ls-name" role="cell">Point of Service</span><span role="cell" className="ls-n">2,697</span><span role="cell" className="ls-n">52</span><span role="cell" className="ls-n">24</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "8%" }} /></span><em>1.9%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="3" data-name="epo" data-v="2277,32,23"><span className="ls-name" role="cell">EPO</span><span role="cell" className="ls-n">2,277</span><span role="cell" className="ls-n">32</span><span role="cell" className="ls-n">23</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "6%" }} /></span><em>1.4%</em></span></a>
              <p className="ls-empty" hidden>No lists in this group match your filter.</p>
            </div>
          </div>
        </section>

        {/* ── Nursing & Custodial Care Facilities ── */}
        <section className="ls-sec" id="nursing-facilities" data-sec="">
          <div className="wrap">
            <div className="ls-sec-head">
              <div><div className="sp-kicker">Providers</div><h2><span className="ls-sec-ic"><i className="ph-duotone ph-house-line" /></span>Nursing &amp; Custodial Care Facilities</h2></div>
              <div className="ls-sec-stats"><div><b>84,792</b><span>records</span></div><div><b>8</b><span>lists</span></div><div><b>2,021</b><span>with email</span></div></div>
            </div>
            <div className="ls-table" role="table" aria-label="Nursing & Custodial Care Facilities lists">
              <div className="ls-tr ls-th" role="row">
                <span role="columnheader">List</span>
                <button type="button" role="columnheader" className="ls-sort" data-k="1">Records<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="2">With email<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="3">Trusted-tier email<i className="ph ph-caret-up-down" /></button>
                <span role="columnheader" className="ls-cov-h">Email coverage</span>
              </div>
              <a className="ls-tr" role="row" href="#" data-g="0" data-name="skilled nursing facility" data-v="35691,1063,850"><span className="ls-name" role="cell">Skilled Nursing Facility</span><span role="cell" className="ls-n">35,691</span><span role="cell" className="ls-n">1,063</span><span role="cell" className="ls-n">850</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "12%" }} /></span><em>3.0%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="1" data-name="assisted living facility" data-v="30696,315,135"><span className="ls-name" role="cell">Assisted Living Facility</span><span role="cell" className="ls-n">30,696</span><span role="cell" className="ls-n">315</span><span role="cell" className="ls-n">135</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "4%" }} /></span><em>1.0%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="2" data-name="custodial care facility" data-v="7975,508,369"><span className="ls-name" role="cell">Custodial Care Facility</span><span role="cell" className="ls-n">7,975</span><span role="cell" className="ls-n">508</span><span role="cell" className="ls-n">369</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "25%" }} /></span><em>6.4%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="3" data-name="icf intellectual disabilities" data-v="6290,34,26"><span className="ls-name" role="cell">ICF Intellectual Disabilities</span><span role="cell" className="ls-n">6,290</span><span role="cell" className="ls-n">34</span><span role="cell" className="ls-n">26</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "2%" }} /></span><em>0.5%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="4" data-name="nursing facility/icf" data-v="2773,77,60"><span className="ls-name" role="cell">Nursing Facility/ICF</span><span role="cell" className="ls-n">2,773</span><span role="cell" className="ls-n">77</span><span role="cell" className="ls-n">60</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "11%" }} /></span><em>2.8%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="5" data-name="alzheimer center (dementia center)" data-v="606,10,6"><span className="ls-name" role="cell">Alzheimer Center (Dementia Center)</span><span role="cell" className="ls-n">606</span><span role="cell" className="ls-n">10</span><span role="cell" className="ls-n">6</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "7%" }} /></span><em>1.7%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="6" data-name="icf mental illness" data-v="461,7,5"><span className="ls-name" role="cell">ICF Mental Illness</span><span role="cell" className="ls-n">461</span><span role="cell" className="ls-n">7</span><span role="cell" className="ls-n">5</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "6%" }} /></span><em>1.5%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="7" data-name="hospice, inpatient" data-v="300,7,7"><span className="ls-name" role="cell">Hospice, Inpatient</span><span role="cell" className="ls-n">300</span><span role="cell" className="ls-n">7</span><span role="cell" className="ls-n">7</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "9%" }} /></span><em>2.3%</em></span></a>
              <p className="ls-empty" hidden>No lists in this group match your filter.</p>
            </div>
          </div>
        </section>

        {/* ── Nursing Service Providers ── */}
        <section className="ls-sec" id="nursing-service" data-sec="">
          <div className="wrap">
            <div className="ls-sec-head">
              <div><div className="sp-kicker">Providers</div><h2><span className="ls-sec-ic"><i className="ph-duotone ph-heart-half" /></span>Nursing Service Providers</h2></div>
              <div className="ls-sec-stats"><div><b>355,261</b><span>records</span></div><div><b>4</b><span>lists</span></div><div><b>288,333</b><span>with email</span></div></div>
            </div>
            <div className="ls-table" role="table" aria-label="Nursing Service Providers lists">
              <div className="ls-tr ls-th" role="row">
                <span role="columnheader">List</span>
                <button type="button" role="columnheader" className="ls-sort" data-k="1">Records<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="2">With email<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="3">Trusted-tier email<i className="ph ph-caret-up-down" /></button>
                <span role="columnheader" className="ls-cov-h">Email coverage</span>
              </div>
              <a className="ls-tr" role="row" href="#" data-g="0" data-name="registered nurses" data-v="258975,203788,137548"><span className="ls-name" role="cell">Registered Nurses</span><span role="cell" className="ls-n">258,975</span><span role="cell" className="ls-n">203,788</span><span role="cell" className="ls-n">137,548</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>78.7%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="1" data-name="licensed practical nurse" data-v="73991,64931,41608"><span className="ls-name" role="cell">Licensed Practical Nurse</span><span role="cell" className="ls-n">73,991</span><span role="cell" className="ls-n">64,931</span><span role="cell" className="ls-n">41,608</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>87.8%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="2" data-name="licensed vocational nurse" data-v="19896,17478,11236"><span className="ls-name" role="cell">Licensed Vocational Nurse</span><span role="cell" className="ls-n">19,896</span><span role="cell" className="ls-n">17,478</span><span role="cell" className="ls-n">11,236</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>87.8%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="3" data-name="licensed psychiatric technician" data-v="2399,2136,1867"><span className="ls-name" role="cell">Licensed Psychiatric Technician</span><span role="cell" className="ls-n">2,399</span><span role="cell" className="ls-n">2,136</span><span role="cell" className="ls-n">1,867</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>89.0%</em></span></a>
              <p className="ls-empty" hidden>No lists in this group match your filter.</p>
            </div>
          </div>
        </section>

        {/* ── Nursing Service Related Providers ── */}
        <section className="ls-sec" id="nursing-related" data-sec="">
          <div className="wrap">
            <div className="ls-sec-head">
              <div><div className="sp-kicker">Providers</div><h2><span className="ls-sec-ic"><i className="ph-duotone ph-hand-heart" /></span>Nursing Service Related Providers</h2></div>
              <div className="ls-sec-stats"><div><b>257,937</b><span>records</span></div><div><b>11</b><span>lists</span></div><div><b>44,652</b><span>with email</span></div></div>
            </div>
            <div className="ls-table" role="table" aria-label="Nursing Service Related Providers lists">
              <div className="ls-tr ls-th" role="row">
                <span role="columnheader">List</span>
                <button type="button" role="columnheader" className="ls-sort" data-k="1">Records<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="2">With email<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="3">Trusted-tier email<i className="ph ph-caret-up-down" /></button>
                <span role="columnheader" className="ls-cov-h">Email coverage</span>
              </div>
              <a className="ls-tr" role="row" href="#" data-g="0" data-name="technician" data-v="118013,6200,1296"><span className="ls-name" role="cell">Technician</span><span role="cell" className="ls-n">118,013</span><span role="cell" className="ls-n">6,200</span><span role="cell" className="ls-n">1,296</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "21%" }} /></span><em>5.3%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="1" data-name="home health aide" data-v="53624,10589,6211"><span className="ls-name" role="cell">Home Health Aide</span><span role="cell" className="ls-n">53,624</span><span role="cell" className="ls-n">10,589</span><span role="cell" className="ls-n">6,211</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "79%" }} /></span><em>19.7%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="2" data-name="doula" data-v="21744,9558,8513"><span className="ls-name" role="cell">Doula</span><span role="cell" className="ls-n">21,744</span><span role="cell" className="ls-n">9,558</span><span role="cell" className="ls-n">8,513</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>44.0%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="3" data-name="day training/habilitation specialist" data-v="16097,2564,2145"><span className="ls-name" role="cell">Day Training/Habilitation Specialist</span><span role="cell" className="ls-n">16,097</span><span role="cell" className="ls-n">2,564</span><span role="cell" className="ls-n">2,145</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "64%" }} /></span><em>15.9%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="4" data-name="homemaker" data-v="15363,1950,381"><span className="ls-name" role="cell">Homemaker</span><span role="cell" className="ls-n">15,363</span><span role="cell" className="ls-n">1,950</span><span role="cell" className="ls-n">381</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "51%" }} /></span><em>12.7%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="5" data-name="nurse's aide" data-v="14350,10275,8369"><span className="ls-name" role="cell">{"Nurse's Aide"}</span><span role="cell" className="ls-n">14,350</span><span role="cell" className="ls-n">10,275</span><span role="cell" className="ls-n">8,369</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>71.6%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="6" data-name="adult companion" data-v="12466,2799,2040"><span className="ls-name" role="cell">Adult Companion</span><span role="cell" className="ls-n">12,466</span><span role="cell" className="ls-n">2,799</span><span role="cell" className="ls-n">2,040</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "90%" }} /></span><em>22.4%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="7" data-name="chore provider" data-v="5004,397,99"><span className="ls-name" role="cell">Chore Provider</span><span role="cell" className="ls-n">5,004</span><span role="cell" className="ls-n">397</span><span role="cell" className="ls-n">99</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "32%" }} /></span><em>7.9%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="8" data-name="nursing home administrator" data-v="795,187,131"><span className="ls-name" role="cell">Nursing Home Administrator</span><span role="cell" className="ls-n">795</span><span role="cell" className="ls-n">187</span><span role="cell" className="ls-n">131</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "94%" }} /></span><em>23.5%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="9" data-name="religious nonmedical practitioner" data-v="284,83,58"><span className="ls-name" role="cell">Religious Nonmedical Practitioner</span><span role="cell" className="ls-n">284</span><span role="cell" className="ls-n">83</span><span role="cell" className="ls-n">58</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>29.2%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="10" data-name="religious nonmedical nursing personnel" data-v="197,50,31"><span className="ls-name" role="cell">Religious Nonmedical Nursing Personnel</span><span role="cell" className="ls-n">197</span><span role="cell" className="ls-n">50</span><span role="cell" className="ls-n">31</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>25.4%</em></span></a>
              <p className="ls-empty" hidden>No lists in this group match your filter.</p>
            </div>
          </div>
        </section>

        {/* ── Other Service Providers ── */}
        <section className="ls-sec" id="other-service" data-sec="">
          <div className="wrap">
            <div className="ls-sec-head">
              <div><div className="sp-kicker">Providers</div><h2><span className="ls-sec-ic"><i className="ph-duotone ph-squares-four" /></span>Other Service Providers</h2></div>
              <div className="ls-sec-stats"><div><b>458,476</b><span>records</span></div><div><b>29</b><span>lists</span></div><div><b>78,281</b><span>with email</span></div></div>
            </div>
            <div className="ls-table" role="table" aria-label="Other Service Providers lists">
              <div className="ls-tr ls-th" role="row">
                <span role="columnheader">List</span>
                <button type="button" role="columnheader" className="ls-sort" data-k="1">Records<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="2">With email<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="3">Trusted-tier email<i className="ph ph-caret-up-down" /></button>
                <span role="columnheader" className="ls-cov-h">Email coverage</span>
              </div>
              <a className="ls-tr" role="row" href="#" data-g="0" data-name="case manager/care coordinator" data-v="166686,15500,10961"><span className="ls-name" role="cell">Case Manager/Care Coordinator</span><span role="cell" className="ls-n">166,686</span><span role="cell" className="ls-n">15,500</span><span role="cell" className="ls-n">10,961</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "37%" }} /></span><em>9.3%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="1" data-name="specialist" data-v="92466,21997,17023"><span className="ls-name" role="cell">Specialist</span><span role="cell" className="ls-n">92,466</span><span role="cell" className="ls-n">21,997</span><span role="cell" className="ls-n">17,023</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "95%" }} /></span><em>23.8%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="2" data-name="community health worker" data-v="48599,16662,13727"><span className="ls-name" role="cell">Community Health Worker</span><span role="cell" className="ls-n">48,599</span><span role="cell" className="ls-n">16,662</span><span role="cell" className="ls-n">13,727</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>34.3%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="3" data-name="acupuncturist" data-v="43978,5673,3732"><span className="ls-name" role="cell">Acupuncturist</span><span role="cell" className="ls-n">43,978</span><span role="cell" className="ls-n">5,673</span><span role="cell" className="ls-n">3,732</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "52%" }} /></span><em>12.9%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="4" data-name="peer specialist" data-v="33803,2431,1844"><span className="ls-name" role="cell">Peer Specialist</span><span role="cell" className="ls-n">33,803</span><span role="cell" className="ls-n">2,431</span><span role="cell" className="ls-n">1,844</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "29%" }} /></span><em>7.2%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="5" data-name="contractor" data-v="12174,1517,439"><span className="ls-name" role="cell">Contractor</span><span role="cell" className="ls-n">12,174</span><span role="cell" className="ls-n">1,517</span><span role="cell" className="ls-n">439</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "50%" }} /></span><em>12.5%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="6" data-name="naturopath" data-v="8587,1632,1326"><span className="ls-name" role="cell">Naturopath</span><span role="cell" className="ls-n">8,587</span><span role="cell" className="ls-n">1,632</span><span role="cell" className="ls-n">1,326</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "76%" }} /></span><em>19.0%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="7" data-name="health & wellness coach" data-v="8492,1007,648"><span className="ls-name" role="cell">Health &amp; Wellness Coach</span><span role="cell" className="ls-n">8,492</span><span role="cell" className="ls-n">1,007</span><span role="cell" className="ls-n">648</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "47%" }} /></span><em>11.9%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="8" data-name="driver" data-v="8108,966,181"><span className="ls-name" role="cell">Driver</span><span role="cell" className="ls-n">8,108</span><span role="cell" className="ls-n">966</span><span role="cell" className="ls-n">181</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "48%" }} /></span><em>11.9%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="9" data-name="health educator" data-v="7729,1974,1482"><span className="ls-name" role="cell">Health Educator</span><span role="cell" className="ls-n">7,729</span><span role="cell" className="ls-n">1,974</span><span role="cell" className="ls-n">1,482</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>25.5%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="10" data-name="military health care provider" data-v="7421,1533,1316"><span className="ls-name" role="cell">Military Health Care Provider</span><span role="cell" className="ls-n">7,421</span><span role="cell" className="ls-n">1,533</span><span role="cell" className="ls-n">1,316</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "83%" }} /></span><em>20.7%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="11" data-name="midwife" data-v="7010,4016,3573"><span className="ls-name" role="cell">Midwife</span><span role="cell" className="ls-n">7,010</span><span role="cell" className="ls-n">4,016</span><span role="cell" className="ls-n">3,573</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>57.3%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="12" data-name="genetic counselor, ms" data-v="6834,2440,2009"><span className="ls-name" role="cell">Genetic Counselor, MS</span><span role="cell" className="ls-n">6,834</span><span role="cell" className="ls-n">2,440</span><span role="cell" className="ls-n">2,009</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>35.7%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="13" data-name="interpreter" data-v="4778,374,99"><span className="ls-name" role="cell">Interpreter</span><span role="cell" className="ls-n">4,778</span><span role="cell" className="ls-n">374</span><span role="cell" className="ls-n">99</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "31%" }} /></span><em>7.8%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="14" data-name="lactation consultant, non-rn" data-v="4220,657,360"><span className="ls-name" role="cell">Lactation Consultant, Non-RN</span><span role="cell" className="ls-n">4,220</span><span role="cell" className="ls-n">657</span><span role="cell" className="ls-n">360</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "62%" }} /></span><em>15.6%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="15" data-name="mechanotherapist" data-v="2150,290,122"><span className="ls-name" role="cell">Mechanotherapist</span><span role="cell" className="ls-n">2,150</span><span role="cell" className="ls-n">290</span><span role="cell" className="ls-n">122</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "54%" }} /></span><em>13.5%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="16" data-name="legal medicine" data-v="1953,685,621"><span className="ls-name" role="cell">Legal Medicine</span><span role="cell" className="ls-n">1,953</span><span role="cell" className="ls-n">685</span><span role="cell" className="ls-n">621</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>35.1%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="17" data-name="veterinarian" data-v="1731,1542,269"><span className="ls-name" role="cell">Veterinarian</span><span role="cell" className="ls-n">1,731</span><span role="cell" className="ls-n">1,542</span><span role="cell" className="ls-n">269</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>89.1%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="18" data-name="prevention professional" data-v="857,69,41"><span className="ls-name" role="cell">Prevention Professional</span><span role="cell" className="ls-n">857</span><span role="cell" className="ls-n">69</span><span role="cell" className="ls-n">41</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "32%" }} /></span><em>8.1%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="19" data-name="lodging" data-v="649,32,9"><span className="ls-name" role="cell">Lodging</span><span role="cell" className="ls-n">649</span><span role="cell" className="ls-n">32</span><span role="cell" className="ls-n">9</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "20%" }} /></span><em>4.9%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="20" data-name="reflexologist" data-v="583,66,27"><span className="ls-name" role="cell">Reflexologist</span><span role="cell" className="ls-n">583</span><span role="cell" className="ls-n">66</span><span role="cell" className="ls-n">27</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "45%" }} /></span><em>11.3%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="21" data-name="meals" data-v="541,5,0"><span className="ls-name" role="cell">Meals</span><span role="cell" className="ls-n">541</span><span role="cell" className="ls-n">5</span><span role="cell" className="ls-n">0</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "4%" }} /></span><em>0.9%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="22" data-name="medical genetics, ph.d." data-v="540,118,104"><span className="ls-name" role="cell">Medical Genetics, Ph.D.</span><span role="cell" className="ls-n">540</span><span role="cell" className="ls-n">118</span><span role="cell" className="ls-n">104</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "87%" }} /></span><em>21.9%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="23" data-name="midwife, lay" data-v="501,303,281"><span className="ls-name" role="cell">Midwife, Lay</span><span role="cell" className="ls-n">501</span><span role="cell" className="ls-n">303</span><span role="cell" className="ls-n">281</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>60.5%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="24" data-name="homeopath" data-v="447,64,41"><span className="ls-name" role="cell">Homeopath</span><span role="cell" className="ls-n">447</span><span role="cell" className="ls-n">64</span><span role="cell" className="ls-n">41</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "57%" }} /></span><em>14.3%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="25" data-name="naprapath" data-v="253,28,10"><span className="ls-name" role="cell">Naprapath</span><span role="cell" className="ls-n">253</span><span role="cell" className="ls-n">28</span><span role="cell" className="ls-n">10</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "44%" }} /></span><em>11.1%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="26" data-name="sleep specialist, ph.d." data-v="134,18,16"><span className="ls-name" role="cell">Sleep Specialist, Ph.D.</span><span role="cell" className="ls-n">134</span><span role="cell" className="ls-n">18</span><span role="cell" className="ls-n">16</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "54%" }} /></span><em>13.4%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="27" data-name="clinical ethicist" data-v="119,32,22"><span className="ls-name" role="cell">Clinical Ethicist</span><span role="cell" className="ls-n">119</span><span role="cell" className="ls-n">32</span><span role="cell" className="ls-n">22</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>26.9%</em></span></a>
              <p className="ls-empty" hidden>No lists in this group match your filter.</p>
            </div>
          </div>
        </section>

        {/* ── Pharmacy Service Providers ── */}
        <section className="ls-sec" id="pharmacy" data-sec="">
          <div className="wrap">
            <div className="ls-sec-head">
              <div><div className="sp-kicker">Providers</div><h2><span className="ls-sec-ic"><i className="ph-duotone ph-pill" /></span>Pharmacy Service Providers</h2></div>
              <div className="ls-sec-stats"><div><b>346,805</b><span>records</span></div><div><b>2</b><span>lists</span></div><div><b>322,588</b><span>with email</span></div></div>
            </div>
            <div className="ls-table" role="table" aria-label="Pharmacy Service Providers lists">
              <div className="ls-tr ls-th" role="row">
                <span role="columnheader">List</span>
                <button type="button" role="columnheader" className="ls-sort" data-k="1">Records<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="2">With email<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="3">Trusted-tier email<i className="ph ph-caret-up-down" /></button>
                <span role="columnheader" className="ls-cov-h">Email coverage</span>
              </div>
              <a className="ls-tr" role="row" href="#" data-g="0" data-name="pharmacists" data-v="334290,320507,293090"><span className="ls-name" role="cell">Pharmacists</span><span role="cell" className="ls-n">334,290</span><span role="cell" className="ls-n">320,507</span><span role="cell" className="ls-n">293,090</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>95.9%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="1" data-name="pharmacy technician" data-v="12515,2081,1534"><span className="ls-name" role="cell">Pharmacy Technician</span><span role="cell" className="ls-n">12,515</span><span role="cell" className="ls-n">2,081</span><span role="cell" className="ls-n">1,534</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "66%" }} /></span><em>16.6%</em></span></a>
              <p className="ls-empty" hidden>No lists in this group match your filter.</p>
            </div>
          </div>
        </section>

        {/* ── Physician Assistants & Advanced Practice Nursing Providers ── */}
        <section className="ls-sec" id="physician-assistants" data-sec="">
          <div className="wrap">
            <div className="ls-sec-head">
              <div><div className="sp-kicker">Providers</div><h2><span className="ls-sec-ic"><i className="ph-duotone ph-user-plus" /></span>Physician Assistants &amp; Advanced Practice Nursing Providers</h2></div>
              <div className="ls-sec-stats"><div><b>903,675</b><span>records</span></div><div><b>6</b><span>lists</span></div><div><b>805,129</b><span>with email</span></div></div>
            </div>
            <div className="ls-table" role="table" aria-label="Physician Assistants & Advanced Practice Nursing Providers lists">
              <div className="ls-tr ls-th" role="row">
                <span role="columnheader">List</span>
                <button type="button" role="columnheader" className="ls-sort" data-k="1">Records<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="2">With email<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="3">Trusted-tier email<i className="ph ph-caret-up-down" /></button>
                <span role="columnheader" className="ls-cov-h">Email coverage</span>
              </div>
              <a className="ls-tr" role="row" href="#" data-g="0" data-name="nurse practitioners" data-v="564506,500612,451193"><span className="ls-name" role="cell">Nurse Practitioners</span><span role="cell" className="ls-n">564,506</span><span role="cell" className="ls-n">500,612</span><span role="cell" className="ls-n">451,193</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>88.7%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="1" data-name="physician assistants" data-v="228543,205553,195628"><span className="ls-name" role="cell">Physician Assistants</span><span role="cell" className="ls-n">228,543</span><span role="cell" className="ls-n">205,553</span><span role="cell" className="ls-n">195,628</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>89.9%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="2" data-name="nurse anesthetist, crna" data-v="80860,74015,66183"><span className="ls-name" role="cell">Nurse Anesthetist, CRNA</span><span role="cell" className="ls-n">80,860</span><span role="cell" className="ls-n">74,015</span><span role="cell" className="ls-n">66,183</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>91.5%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="3" data-name="advanced practice midwife" data-v="14134,12536,11430"><span className="ls-name" role="cell">Advanced Practice Midwife</span><span role="cell" className="ls-n">14,134</span><span role="cell" className="ls-n">12,536</span><span role="cell" className="ls-n">11,430</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>88.7%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="4" data-name="clinical nurse specialist" data-v="10513,8821,7074"><span className="ls-name" role="cell">Clinical Nurse Specialist</span><span role="cell" className="ls-n">10,513</span><span role="cell" className="ls-n">8,821</span><span role="cell" className="ls-n">7,074</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>83.9%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="5" data-name="anesthesiologist assistant" data-v="5119,3592,3096"><span className="ls-name" role="cell">Anesthesiologist Assistant</span><span role="cell" className="ls-n">5,119</span><span role="cell" className="ls-n">3,592</span><span role="cell" className="ls-n">3,096</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>70.2%</em></span></a>
              <p className="ls-empty" hidden>No lists in this group match your filter.</p>
            </div>
          </div>
        </section>

        {/* ── Podiatric Medicine & Surgery ── */}
        <section className="ls-sec" id="podiatric" data-sec="">
          <div className="wrap">
            <div className="ls-sec-head">
              <div><div className="sp-kicker">Providers</div><h2><span className="ls-sec-ic"><i className="ph-duotone ph-sneaker-move" /></span>Podiatric Medicine &amp; Surgery</h2></div>
              <div className="ls-sec-stats"><div><b>39,404</b><span>records</span></div><div><b>2</b><span>lists</span></div><div><b>9,325</b><span>with email</span></div></div>
            </div>
            <div className="ls-table" role="table" aria-label="Podiatric Medicine & Surgery lists">
              <div className="ls-tr ls-th" role="row">
                <span role="columnheader">List</span>
                <button type="button" role="columnheader" className="ls-sort" data-k="1">Records<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="2">With email<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="3">Trusted-tier email<i className="ph ph-caret-up-down" /></button>
                <span role="columnheader" className="ls-cov-h">Email coverage</span>
              </div>
              <a className="ls-tr" role="row" href="#" data-g="0" data-name="podiatrists" data-v="39343,9305,6411"><span className="ls-name" role="cell">Podiatrists</span><span role="cell" className="ls-n">39,343</span><span role="cell" className="ls-n">9,305</span><span role="cell" className="ls-n">6,411</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "95%" }} /></span><em>23.7%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="1" data-name="assistant, podiatric" data-v="61,20,18"><span className="ls-name" role="cell">Assistant, Podiatric</span><span role="cell" className="ls-n">61</span><span role="cell" className="ls-n">20</span><span role="cell" className="ls-n">18</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>32.8%</em></span></a>
              <p className="ls-empty" hidden>No lists in this group match your filter.</p>
            </div>
          </div>
        </section>

        {/* ── Residential Treatment Facilities ── */}
        <section className="ls-sec" id="residential-treatment" data-sec="">
          <div className="wrap">
            <div className="ls-sec-head">
              <div><div className="sp-kicker">Providers</div><h2><span className="ls-sec-ic"><i className="ph-duotone ph-house" /></span>Residential Treatment Facilities</h2></div>
              <div className="ls-sec-stats"><div><b>43,693</b><span>records</span></div><div><b>7</b><span>lists</span></div><div><b>659</b><span>with email</span></div></div>
            </div>
            <div className="ls-table" role="table" aria-label="Residential Treatment Facilities lists">
              <div className="ls-tr ls-th" role="row">
                <span role="columnheader">List</span>
                <button type="button" role="columnheader" className="ls-sort" data-k="1">Records<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="2">With email<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="3">Trusted-tier email<i className="ph ph-caret-up-down" /></button>
                <span role="columnheader" className="ls-cov-h">Email coverage</span>
              </div>
              <a className="ls-tr" role="row" href="#" data-g="0" data-name="community based residential treatment facility, intellectual and/or developmental disabilities" data-v="13506,199,73"><span className="ls-name" role="cell">Community Based RTF, Intellectual and/or Developmental Disabilities</span><span role="cell" className="ls-n">13,506</span><span role="cell" className="ls-n">199</span><span role="cell" className="ls-n">73</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "6%" }} /></span><em>1.5%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="1" data-name="substance abuse rehabilitation facility" data-v="11429,164,121"><span className="ls-name" role="cell">Substance Abuse Rehabilitation Facility</span><span role="cell" className="ls-n">11,429</span><span role="cell" className="ls-n">164</span><span role="cell" className="ls-n">121</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "6%" }} /></span><em>1.4%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="2" data-name="community based residential treatment facility, mental illness" data-v="6060,87,54"><span className="ls-name" role="cell">Community Based RTF, Mental Illness</span><span role="cell" className="ls-n">6,060</span><span role="cell" className="ls-n">87</span><span role="cell" className="ls-n">54</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "6%" }} /></span><em>1.4%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="3" data-name="residential treatment facility, intellectual and/or developmental disabilities" data-v="6036,84,25"><span className="ls-name" role="cell">RTF, Intellectual and/or Developmental Disabilities</span><span role="cell" className="ls-n">6,036</span><span role="cell" className="ls-n">84</span><span role="cell" className="ls-n">25</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "6%" }} /></span><em>1.4%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="4" data-name="residential treatment facility, emotionally disturbed children" data-v="3512,52,37"><span className="ls-name" role="cell">RTF, Emotionally Disturbed Children</span><span role="cell" className="ls-n">3,512</span><span role="cell" className="ls-n">52</span><span role="cell" className="ls-n">37</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "6%" }} /></span><em>1.5%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="5" data-name="psychiatric residential treatment facility" data-v="2223,42,34"><span className="ls-name" role="cell">Psychiatric Residential Treatment Facility</span><span role="cell" className="ls-n">2,223</span><span role="cell" className="ls-n">42</span><span role="cell" className="ls-n">34</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "8%" }} /></span><em>1.9%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="6" data-name="residential treatment facility, physical disabilities" data-v="927,31,13"><span className="ls-name" role="cell">RTF, Physical Disabilities</span><span role="cell" className="ls-n">927</span><span role="cell" className="ls-n">31</span><span role="cell" className="ls-n">13</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "13%" }} /></span><em>3.3%</em></span></a>
              <p className="ls-empty" hidden>No lists in this group match your filter.</p>
            </div>
          </div>
        </section>

        {/* ── Respiratory, Developmental, Rehabilitative and Restorative Service Providers ── */}
        <section className="ls-sec" id="respiratory-rehab" data-sec="">
          <div className="wrap">
            <div className="ls-sec-head">
              <div><div className="sp-kicker">Providers</div><h2><span className="ls-sec-ic"><i className="ph-duotone ph-lungs" /></span>Respiratory, Developmental, Rehabilitative &amp; Restorative Service Providers</h2></div>
              <div className="ls-sec-stats"><div><b>808,152</b><span>records</span></div><div><b>25</b><span>lists</span></div><div><b>209,886</b><span>with email</span></div></div>
            </div>
            <div className="ls-table" role="table" aria-label="Respiratory, Developmental, Rehabilitative and Restorative Service Providers lists">
              <div className="ls-tr ls-th" role="row">
                <span role="columnheader">List</span>
                <button type="button" role="columnheader" className="ls-sort" data-k="1">Records<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="2">With email<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="3">Trusted-tier email<i className="ph ph-caret-up-down" /></button>
                <span role="columnheader" className="ls-cov-h">Email coverage</span>
              </div>
              <a className="ls-tr" role="row" href="#" data-g="0" data-name="physical therapists" data-v="325153,73739,53946"><span className="ls-name" role="cell">Physical Therapists</span><span role="cell" className="ls-n">325,153</span><span role="cell" className="ls-n">73,739</span><span role="cell" className="ls-n">53,946</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "91%" }} /></span><em>22.7%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="1" data-name="occupational therapists" data-v="171082,54643,40341"><span className="ls-name" role="cell">Occupational Therapists</span><span role="cell" className="ls-n">171,082</span><span role="cell" className="ls-n">54,643</span><span role="cell" className="ls-n">40,341</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>31.9%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="2" data-name="massage therapist" data-v="79211,8838,4293"><span className="ls-name" role="cell">Massage Therapist</span><span role="cell" className="ls-n">79,211</span><span role="cell" className="ls-n">8,838</span><span role="cell" className="ls-n">4,293</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "45%" }} /></span><em>11.2%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="3" data-name="physical therapy assistant" data-v="62240,26072,18997"><span className="ls-name" role="cell">Physical Therapy Assistant</span><span role="cell" className="ls-n">62,240</span><span role="cell" className="ls-n">26,072</span><span role="cell" className="ls-n">18,997</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>41.9%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="4" data-name="specialist/technologist" data-v="60295,10460,6746"><span className="ls-name" role="cell">Specialist/Technologist</span><span role="cell" className="ls-n">60,295</span><span role="cell" className="ls-n">10,460</span><span role="cell" className="ls-n">6,746</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "69%" }} /></span><em>17.3%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="5" data-name="occupational therapy assistant" data-v="42530,17308,12407"><span className="ls-name" role="cell">Occupational Therapy Assistant</span><span role="cell" className="ls-n">42,530</span><span role="cell" className="ls-n">17,308</span><span role="cell" className="ls-n">12,407</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>40.7%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="6" data-name="rehabilitation practitioner" data-v="21587,10042,8635"><span className="ls-name" role="cell">Rehabilitation Practitioner</span><span role="cell" className="ls-n">21,587</span><span role="cell" className="ls-n">10,042</span><span role="cell" className="ls-n">8,635</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>46.5%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="7" data-name="developmental therapist" data-v="17270,1781,713"><span className="ls-name" role="cell">Developmental Therapist</span><span role="cell" className="ls-n">17,270</span><span role="cell" className="ls-n">1,781</span><span role="cell" className="ls-n">713</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "41%" }} /></span><em>10.3%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="8" data-name="respiratory therapist, registered" data-v="6489,2375,1727"><span className="ls-name" role="cell">Respiratory Therapist, Registered</span><span role="cell" className="ls-n">6,489</span><span role="cell" className="ls-n">2,375</span><span role="cell" className="ls-n">1,727</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>36.6%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="9" data-name="music therapist" data-v="3719,289,155"><span className="ls-name" role="cell">Music Therapist</span><span role="cell" className="ls-n">3,719</span><span role="cell" className="ls-n">289</span><span role="cell" className="ls-n">155</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "31%" }} /></span><em>7.8%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="10" data-name="recreation therapist" data-v="2697,925,716"><span className="ls-name" role="cell">Recreation Therapist</span><span role="cell" className="ls-n">2,697</span><span role="cell" className="ls-n">925</span><span role="cell" className="ls-n">716</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>34.3%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="11" data-name="respiratory therapist, certified" data-v="2567,1004,804"><span className="ls-name" role="cell">Respiratory Therapist, Certified</span><span role="cell" className="ls-n">2,567</span><span role="cell" className="ls-n">1,004</span><span role="cell" className="ls-n">804</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>39.1%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="12" data-name="rehabilitation counselor" data-v="2545,1001,808"><span className="ls-name" role="cell">Rehabilitation Counselor</span><span role="cell" className="ls-n">2,545</span><span role="cell" className="ls-n">1,001</span><span role="cell" className="ls-n">808</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>39.3%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="13" data-name="prosthetist" data-v="2360,647,482"><span className="ls-name" role="cell">Prosthetist</span><span role="cell" className="ls-n">2,360</span><span role="cell" className="ls-n">647</span><span role="cell" className="ls-n">482</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>27.4%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="14" data-name="art therapist" data-v="1941,420,330"><span className="ls-name" role="cell">Art Therapist</span><span role="cell" className="ls-n">1,941</span><span role="cell" className="ls-n">420</span><span role="cell" className="ls-n">330</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "87%" }} /></span><em>21.6%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="15" data-name="orthotist" data-v="1344,529,420"><span className="ls-name" role="cell">Orthotist</span><span role="cell" className="ls-n">1,344</span><span role="cell" className="ls-n">529</span><span role="cell" className="ls-n">420</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>39.4%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="16" data-name="clinical exercise physiologist" data-v="884,223,156"><span className="ls-name" role="cell">Clinical Exercise Physiologist</span><span role="cell" className="ls-n">884</span><span role="cell" className="ls-n">223</span><span role="cell" className="ls-n">156</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>25.2%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="17" data-name="orthotic fitter" data-v="725,131,96"><span className="ls-name" role="cell">Orthotic Fitter</span><span role="cell" className="ls-n">725</span><span role="cell" className="ls-n">131</span><span role="cell" className="ls-n">96</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "72%" }} /></span><em>18.1%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="18" data-name="kinesiotherapist" data-v="649,336,257"><span className="ls-name" role="cell">Kinesiotherapist</span><span role="cell" className="ls-n">649</span><span role="cell" className="ls-n">336</span><span role="cell" className="ls-n">257</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>51.8%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="19" data-name="pedorthist" data-v="306,74,52"><span className="ls-name" role="cell">Pedorthist</span><span role="cell" className="ls-n">306</span><span role="cell" className="ls-n">74</span><span role="cell" className="ls-n">52</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "97%" }} /></span><em>24.2%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="20" data-name="mastectomy fitter" data-v="258,43,30"><span className="ls-name" role="cell">Mastectomy Fitter</span><span role="cell" className="ls-n">258</span><span role="cell" className="ls-n">43</span><span role="cell" className="ls-n">30</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "67%" }} /></span><em>16.7%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="21" data-name="dance therapist" data-v="218,12,6"><span className="ls-name" role="cell">Dance Therapist</span><span role="cell" className="ls-n">218</span><span role="cell" className="ls-n">12</span><span role="cell" className="ls-n">6</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "22%" }} /></span><em>5.5%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="22" data-name="recreational therapist assistant" data-v="154,59,47"><span className="ls-name" role="cell">Recreational Therapist Assistant</span><span role="cell" className="ls-n">154</span><span role="cell" className="ls-n">59</span><span role="cell" className="ls-n">47</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>38.3%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="23" data-name="pulmonary function technologist" data-v="93,12,7"><span className="ls-name" role="cell">Pulmonary Function Technologist</span><span role="cell" className="ls-n">93</span><span role="cell" className="ls-n">12</span><span role="cell" className="ls-n">7</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "52%" }} /></span><em>12.9%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="24" data-name="anaplastologist" data-v="54,3,2"><span className="ls-name" role="cell">Anaplastologist</span><span role="cell" className="ls-n">54</span><span role="cell" className="ls-n">3</span><span role="cell" className="ls-n">2</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "22%" }} /></span><em>5.6%</em></span></a>
              <p className="ls-empty" hidden>No lists in this group match your filter.</p>
            </div>
          </div>
        </section>

        {/* ── Respite Care Facility ── */}
        <section className="ls-sec" id="respite-care" data-sec="">
          <div className="wrap">
            <div className="ls-sec-head">
              <div><div className="sp-kicker">Providers</div><h2><span className="ls-sec-ic"><i className="ph-duotone ph-sun-horizon" /></span>Respite Care Facility</h2></div>
              <div className="ls-sec-stats"><div><b>5,706</b><span>records</span></div><div><b>1</b><span>lists</span></div><div><b>448</b><span>with email</span></div></div>
            </div>
            <div className="ls-table" role="table" aria-label="Respite Care Facility lists">
              <div className="ls-tr ls-th" role="row">
                <span role="columnheader">List</span>
                <button type="button" role="columnheader" className="ls-sort" data-k="1">Records<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="2">With email<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="3">Trusted-tier email<i className="ph ph-caret-up-down" /></button>
                <span role="columnheader" className="ls-cov-h">Email coverage</span>
              </div>
              <a className="ls-tr" role="row" href="#" data-g="0" data-name="respite care" data-v="5706,448,94"><span className="ls-name" role="cell">Respite Care</span><span role="cell" className="ls-n">5,706</span><span role="cell" className="ls-n">448</span><span role="cell" className="ls-n">94</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "31%" }} /></span><em>7.9%</em></span></a>
              <p className="ls-empty" hidden>No lists in this group match your filter.</p>
            </div>
          </div>
        </section>

        {/* ── Speech, Language and Hearing ── */}
        <section className="ls-sec" id="speech-hearing" data-sec="">
          <div className="wrap">
            <div className="ls-sec-head">
              <div><div className="sp-kicker">Providers</div><h2><span className="ls-sec-ic"><i className="ph-duotone ph-microphone" /></span>Speech, Language and Hearing</h2></div>
              <div className="ls-sec-stats"><div><b>277,460</b><span>records</span></div><div><b>6</b><span>lists</span></div><div><b>186,288</b><span>with email</span></div></div>
            </div>
            <div className="ls-table" role="table" aria-label="Speech, Language and Hearing lists">
              <div className="ls-tr ls-th" role="row">
                <span role="columnheader">List</span>
                <button type="button" role="columnheader" className="ls-sort" data-k="1">Records<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="2">With email<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="3">Trusted-tier email<i className="ph ph-caret-up-down" /></button>
                <span role="columnheader" className="ls-cov-h">Email coverage</span>
              </div>
              <a className="ls-tr" role="row" href="#" data-g="0" data-name="speech-language pathologists" data-v="220612,151832,137514"><span className="ls-name" role="cell">Speech-Language Pathologists</span><span role="cell" className="ls-n">220,612</span><span role="cell" className="ls-n">151,832</span><span role="cell" className="ls-n">137,514</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>68.8%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="1" data-name="audiologist" data-v="25479,18802,17397"><span className="ls-name" role="cell">Audiologist</span><span role="cell" className="ls-n">25,479</span><span role="cell" className="ls-n">18,802</span><span role="cell" className="ls-n">17,397</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>73.8%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="2" data-name="speech-language assistant" data-v="13451,4545,3430"><span className="ls-name" role="cell">Speech-Language Assistant</span><span role="cell" className="ls-n">13,451</span><span role="cell" className="ls-n">4,545</span><span role="cell" className="ls-n">3,430</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>33.8%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="3" data-name="hearing instrument specialist" data-v="12909,9513,8788"><span className="ls-name" role="cell">Hearing Instrument Specialist</span><span role="cell" className="ls-n">12,909</span><span role="cell" className="ls-n">9,513</span><span role="cell" className="ls-n">8,788</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>73.7%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="4" data-name="audiologist-hearing aid fitter" data-v="4891,1547,1318"><span className="ls-name" role="cell">Audiologist-Hearing Aid Fitter</span><span role="cell" className="ls-n">4,891</span><span role="cell" className="ls-n">1,547</span><span role="cell" className="ls-n">1,318</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>31.6%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="5" data-name="audiology assistant" data-v="118,49,36"><span className="ls-name" role="cell">Audiology Assistant</span><span role="cell" className="ls-n">118</span><span role="cell" className="ls-n">49</span><span role="cell" className="ls-n">36</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>41.5%</em></span></a>
              <p className="ls-empty" hidden>No lists in this group match your filter.</p>
            </div>
          </div>
        </section>

        {/* ── Student, Health Care ── */}
        <section className="ls-sec" id="student" data-sec="">
          <div className="wrap">
            <div className="ls-sec-head">
              <div><div className="sp-kicker">Providers</div><h2><span className="ls-sec-ic"><i className="ph-duotone ph-graduation-cap" /></span>Student, Health Care</h2></div>
              <div className="ls-sec-stats"><div><b>272,696</b><span>records</span></div><div><b>1</b><span>lists</span></div><div><b>94,273</b><span>with email</span></div></div>
            </div>
            <div className="ls-table" role="table" aria-label="Student, Health Care lists">
              <div className="ls-tr ls-th" role="row">
                <span role="columnheader">List</span>
                <button type="button" role="columnheader" className="ls-sort" data-k="1">Records<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="2">With email<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="3">Trusted-tier email<i className="ph ph-caret-up-down" /></button>
                <span role="columnheader" className="ls-cov-h">Email coverage</span>
              </div>
              <a className="ls-tr" role="row" href="#" data-g="0" data-name="student in organized health care education/training program" data-v="272696,94273,85069"><span className="ls-name" role="cell">Student in Organized Health Care Education/Training Program</span><span role="cell" className="ls-n">272,696</span><span role="cell" className="ls-n">94,273</span><span role="cell" className="ls-n">85,069</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>34.6%</em></span></a>
              <p className="ls-empty" hidden>No lists in this group match your filter.</p>
            </div>
          </div>
        </section>

        {/* ── Suppliers ── */}
        <section className="ls-sec" id="suppliers" data-sec="">
          <div className="wrap">
            <div className="ls-sec-head">
              <div><div className="sp-kicker">Providers</div><h2><span className="ls-sec-ic"><i className="ph-duotone ph-package" /></span>Suppliers</h2></div>
              <div className="ls-sec-stats"><div><b>224,160</b><span>records</span></div><div><b>13</b><span>lists</span></div><div><b>2,575</b><span>with email</span></div></div>
            </div>
            <div className="ls-table" role="table" aria-label="Suppliers lists">
              <div className="ls-tr ls-th" role="row">
                <span role="columnheader">List</span>
                <button type="button" role="columnheader" className="ls-sort" data-k="1">Records<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="2">With email<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="3">Trusted-tier email<i className="ph ph-caret-up-down" /></button>
                <span role="columnheader" className="ls-cov-h">Email coverage</span>
              </div>
              <a className="ls-tr" role="row" href="#" data-g="0" data-name="pharmacies" data-v="112146,1351,1227"><span className="ls-name" role="cell">Pharmacies</span><span role="cell" className="ls-n">112,146</span><span role="cell" className="ls-n">1,351</span><span role="cell" className="ls-n">1,227</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "5%" }} /></span><em>1.2%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="1" data-name="dme & medical supplies" data-v="72699,618,353"><span className="ls-name" role="cell">DME &amp; Medical Supplies</span><span role="cell" className="ls-n">72,699</span><span role="cell" className="ls-n">618</span><span role="cell" className="ls-n">353</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "3%" }} /></span><em>0.9%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="2" data-name="eyewear supplier" data-v="17266,155,128"><span className="ls-name" role="cell">Eyewear Supplier</span><span role="cell" className="ls-n">17,266</span><span role="cell" className="ls-n">155</span><span role="cell" className="ls-n">128</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "4%" }} /></span><em>0.9%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="3" data-name="prosthetic/orthotic supplier" data-v="9834,111,57"><span className="ls-name" role="cell">Prosthetic/Orthotic Supplier</span><span role="cell" className="ls-n">9,834</span><span role="cell" className="ls-n">111</span><span role="cell" className="ls-n">57</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "5%" }} /></span><em>1.1%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="4" data-name="non-pharmacy dispensing site" data-v="4363,62,49"><span className="ls-name" role="cell">Non-Pharmacy Dispensing Site</span><span role="cell" className="ls-n">4,363</span><span role="cell" className="ls-n">62</span><span role="cell" className="ls-n">49</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "6%" }} /></span><em>1.4%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="5" data-name="hearing aid equipment" data-v="3489,242,229"><span className="ls-name" role="cell">Hearing Aid Equipment</span><span role="cell" className="ls-n">3,489</span><span role="cell" className="ls-n">242</span><span role="cell" className="ls-n">229</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "28%" }} /></span><em>6.9%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="6" data-name="portable x-ray supplier" data-v="1340,10,5"><span className="ls-name" role="cell">Portable X-ray Supplier</span><span role="cell" className="ls-n">1,340</span><span role="cell" className="ls-n">10</span><span role="cell" className="ls-n">5</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "3%" }} /></span><em>0.7%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="7" data-name="home delivered meals" data-v="1059,10,5"><span className="ls-name" role="cell">Home Delivered Meals</span><span role="cell" className="ls-n">1,059</span><span role="cell" className="ls-n">10</span><span role="cell" className="ls-n">5</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "4%" }} /></span><em>0.9%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="8" data-name="emergency response system companies" data-v="547,6,1"><span className="ls-name" role="cell">Emergency Response System Companies</span><span role="cell" className="ls-n">547</span><span role="cell" className="ls-n">6</span><span role="cell" className="ls-n">1</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "4%" }} /></span><em>1.1%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="9" data-name="military pharmacy" data-v="469,3,3"><span className="ls-name" role="cell">Military Pharmacy</span><span role="cell" className="ls-n">469</span><span role="cell" className="ls-n">3</span><span role="cell" className="ls-n">3</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "3%" }} /></span><em>0.6%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="10" data-name="indian health service pharmacy" data-v="371,10,8"><span className="ls-name" role="cell">Indian Health Service Pharmacy</span><span role="cell" className="ls-n">371</span><span role="cell" className="ls-n">10</span><span role="cell" className="ls-n">8</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "11%" }} /></span><em>2.7%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="11" data-name="va pharmacy" data-v="293,6,6"><span className="ls-name" role="cell">VA Pharmacy</span><span role="cell" className="ls-n">293</span><span role="cell" className="ls-n">6</span><span role="cell" className="ls-n">6</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "8%" }} /></span><em>2.0%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="12" data-name="medical foods supplier" data-v="74,1,0"><span className="ls-name" role="cell">Medical Foods Supplier</span><span role="cell" className="ls-n">74</span><span role="cell" className="ls-n">1</span><span role="cell" className="ls-n">0</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "5%" }} /></span><em>1.4%</em></span></a>
              <p className="ls-empty" hidden>No lists in this group match your filter.</p>
            </div>
          </div>
        </section>

        {/* ── Technologists, Technicians & Other Technical Service Providers ── */}
        <section className="ls-sec" id="technologists" data-sec="">
          <div className="wrap">
            <div className="ls-sec-head">
              <div><div className="sp-kicker">Providers</div><h2><span className="ls-sec-ic"><i className="ph-duotone ph-cpu" /></span>Technologists, Technicians &amp; Other Technical Service Providers</h2></div>
              <div className="ls-sec-stats"><div><b>44,681</b><span>records</span></div><div><b>11</b><span>lists</span></div><div><b>6,319</b><span>with email</span></div></div>
            </div>
            <div className="ls-table" role="table" aria-label="Technologists, Technicians & Other Technical Service Providers lists">
              <div className="ls-tr ls-th" role="row">
                <span role="columnheader">List</span>
                <button type="button" role="columnheader" className="ls-sort" data-k="1">Records<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="2">With email<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="3">Trusted-tier email<i className="ph ph-caret-up-down" /></button>
                <span role="columnheader" className="ls-cov-h">Email coverage</span>
              </div>
              <a className="ls-tr" role="row" href="#" data-g="0" data-name="specialist/technologist, other" data-v="15807,4022,3220"><span className="ls-name" role="cell">Specialist/Technologist, Other</span><span role="cell" className="ls-n">15,807</span><span role="cell" className="ls-n">4,022</span><span role="cell" className="ls-n">3,220</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>25.4%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="1" data-name="technician, other" data-v="12920,799,309"><span className="ls-name" role="cell">Technician, Other</span><span role="cell" className="ls-n">12,920</span><span role="cell" className="ls-n">799</span><span role="cell" className="ls-n">309</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "25%" }} /></span><em>6.2%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="2" data-name="technician, pathology" data-v="5130,432,224"><span className="ls-name" role="cell">Technician, Pathology</span><span role="cell" className="ls-n">5,130</span><span role="cell" className="ls-n">432</span><span role="cell" className="ls-n">224</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "34%" }} /></span><em>8.4%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="3" data-name="radiologic technologist" data-v="4069,486,254"><span className="ls-name" role="cell">Radiologic Technologist</span><span role="cell" className="ls-n">4,069</span><span role="cell" className="ls-n">486</span><span role="cell" className="ls-n">254</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "48%" }} /></span><em>11.9%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="4" data-name="perfusionist" data-v="1627,53,17"><span className="ls-name" role="cell">Perfusionist</span><span role="cell" className="ls-n">1,627</span><span role="cell" className="ls-n">53</span><span role="cell" className="ls-n">17</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "13%" }} /></span><em>3.3%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="5" data-name="specialist/technologist, pathology" data-v="1518,211,117"><span className="ls-name" role="cell">Specialist/Technologist, Pathology</span><span role="cell" className="ls-n">1,518</span><span role="cell" className="ls-n">211</span><span role="cell" className="ls-n">117</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "56%" }} /></span><em>13.9%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="6" data-name="technician, health information" data-v="1439,66,45"><span className="ls-name" role="cell">Technician, Health Information</span><span role="cell" className="ls-n">1,439</span><span role="cell" className="ls-n">66</span><span role="cell" className="ls-n">45</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "18%" }} /></span><em>4.6%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="7" data-name="specialist/technologist, cardiovascular" data-v="956,102,54"><span className="ls-name" role="cell">Specialist/Technologist, Cardiovascular</span><span role="cell" className="ls-n">956</span><span role="cell" className="ls-n">102</span><span role="cell" className="ls-n">54</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "43%" }} /></span><em>10.7%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="8" data-name="specialist/technologist, health information" data-v="619,45,14"><span className="ls-name" role="cell">Specialist/Technologist, Health Information</span><span role="cell" className="ls-n">619</span><span role="cell" className="ls-n">45</span><span role="cell" className="ls-n">14</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "29%" }} /></span><em>7.3%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="9" data-name="radiology practitioner assistant" data-v="403,266,237"><span className="ls-name" role="cell">Radiology Practitioner Assistant</span><span role="cell" className="ls-n">403</span><span role="cell" className="ls-n">266</span><span role="cell" className="ls-n">237</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "100%" }} /></span><em>66.0%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="10" data-name="technician, cardiology" data-v="193,37,29"><span className="ls-name" role="cell">Technician, Cardiology</span><span role="cell" className="ls-n">193</span><span role="cell" className="ls-n">37</span><span role="cell" className="ls-n">29</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "77%" }} /></span><em>19.2%</em></span></a>
              <p className="ls-empty" hidden>No lists in this group match your filter.</p>
            </div>
          </div>
        </section>

        {/* ── Transportation Services ── */}
        <section className="ls-sec" id="transportation" data-sec="">
          <div className="wrap">
            <div className="ls-sec-head">
              <div><div className="sp-kicker">Providers</div><h2><span className="ls-sec-ic"><i className="ph-duotone ph-ambulance" /></span>Transportation Services</h2></div>
              <div className="ls-sec-stats"><div><b>68,185</b><span>records</span></div><div><b>8</b><span>lists</span></div><div><b>1,548</b><span>with email</span></div></div>
            </div>
            <div className="ls-table" role="table" aria-label="Transportation Services lists">
              <div className="ls-tr ls-th" role="row">
                <span role="columnheader">List</span>
                <button type="button" role="columnheader" className="ls-sort" data-k="1">Records<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="2">With email<i className="ph ph-caret-up-down" /></button>
                <button type="button" role="columnheader" className="ls-sort" data-k="3">Trusted-tier email<i className="ph ph-caret-up-down" /></button>
                <span role="columnheader" className="ls-cov-h">Email coverage</span>
              </div>
              <a className="ls-tr" role="row" href="#" data-g="0" data-name="non-emergency medical transport (van)" data-v="36476,1032,206"><span className="ls-name" role="cell">Non-emergency Medical Transport (VAN)</span><span role="cell" className="ls-n">36,476</span><span role="cell" className="ls-n">1,032</span><span role="cell" className="ls-n">206</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "11.2%" }} /></span><em>2.8%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="1" data-name="ambulance" data-v="20201,59,41"><span className="ls-name" role="cell">Ambulance</span><span role="cell" className="ls-n">20,201</span><span role="cell" className="ls-n">59</span><span role="cell" className="ls-n">41</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "2%" }} /></span><em>0.3%</em></span></a>
              <a className="ls-tr sub" role="row" href="#" data-g="1" data-name="land transport (ambulance)" data-v="12409,32,23"><span className="ls-name" role="cell"><i className="ph ph-arrow-elbow-down-right" />Land Transport (Ambulance)</span><span role="cell" className="ls-n">12,409</span><span role="cell" className="ls-n">32</span><span role="cell" className="ls-n">23</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "2%" }} /></span><em>0.3%</em></span></a>
              <a className="ls-tr sub" role="row" href="#" data-g="1" data-name="air transport (ambulance)" data-v="1314,6,5"><span className="ls-name" role="cell"><i className="ph ph-arrow-elbow-down-right" />Air Transport (Ambulance)</span><span role="cell" className="ls-n">1,314</span><span role="cell" className="ls-n">6</span><span role="cell" className="ls-n">5</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "2%" }} /></span><em>0.5%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="2" data-name="private vehicle" data-v="4051,281,48"><span className="ls-name" role="cell">Private Vehicle</span><span role="cell" className="ls-n">4,051</span><span role="cell" className="ls-n">281</span><span role="cell" className="ls-n">48</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "27.6%" }} /></span><em>6.9%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="3" data-name="secured medical transport (van)" data-v="1977,30,6"><span className="ls-name" role="cell">Secured Medical Transport (VAN)</span><span role="cell" className="ls-n">1,977</span><span role="cell" className="ls-n">30</span><span role="cell" className="ls-n">6</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "6%" }} /></span><em>1.5%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="4" data-name="taxi" data-v="1925,38,6"><span className="ls-name" role="cell">Taxi</span><span role="cell" className="ls-n">1,925</span><span role="cell" className="ls-n">38</span><span role="cell" className="ls-n">6</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "8%" }} /></span><em>2%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="5" data-name="transportation network company" data-v="1835,53,6"><span className="ls-name" role="cell">Transportation Network Company</span><span role="cell" className="ls-n">1,835</span><span role="cell" className="ls-n">53</span><span role="cell" className="ls-n">6</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "11.6%" }} /></span><em>2.9%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="6" data-name="transportation broker" data-v="1456,51,12"><span className="ls-name" role="cell">Transportation Broker</span><span role="cell" className="ls-n">1,456</span><span role="cell" className="ls-n">51</span><span role="cell" className="ls-n">12</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "14%" }} /></span><em>3.5%</em></span></a>
              <a className="ls-tr" role="row" href="#" data-g="7" data-name="bus" data-v="264,4,3"><span className="ls-name" role="cell">Bus</span><span role="cell" className="ls-n">264</span><span role="cell" className="ls-n">4</span><span role="cell" className="ls-n">3</span><span role="cell" className="ls-cov"><span className="ls-bar"><i style={{ width: "6%" }} /></span><em>1.5%</em></span></a>
              <p className="ls-empty" hidden>No lists in this group match your filter.</p>
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
        document.body.addEventListener('input', function(e) {
          if (e.target.id !== 'ls-q') return;
          var term = e.target.value.trim().toLowerCase();
          document.querySelectorAll('.ls-fc, .ls-tr:not(.ls-th)').forEach(function(el) {
            var name = (el.getAttribute('data-name') || el.textContent || '').toLowerCase();
            el.style.display = (!term || name.indexOf(term) !== -1) ? '' : 'none';
          });
          document.querySelectorAll('.ls-empty').forEach(function(p) {
            var sec = p.closest('.ls-sec');
            if (!sec) return;
            var vis = sec.querySelectorAll('.ls-tr:not(.ls-th):not([style*="display: none"])');
            p.hidden = vis.length > 0 || !term;
          });
        });
        document.body.addEventListener('click', function(e) {
          var btn = e.target.closest('.ls-sort');
          if (!btn) return;
          var k = parseInt(btn.getAttribute('data-k'));
          var table = btn.closest('.ls-table');
          if (!table) return;
          var rows = Array.from(table.querySelectorAll('.ls-tr:not(.ls-th)'));
          rows.sort(function(a, b) {
            var av = parseInt((a.getAttribute('data-v') || '').split(',')[k - 1]) || 0;
            var bv = parseInt((b.getAttribute('data-v') || '').split(',')[k - 1]) || 0;
            return bv - av;
          });
          rows.forEach(function(r) { table.appendChild(r); });
        });
      `}} />
    </>
  );
}

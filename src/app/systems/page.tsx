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
  title: "Health systems and chains — NPImark Provider Data",
  description:
    "Healthcare contact data for recruiting and sales. Find providers by specialty, location, or organization, then compare plans for work email access and exports.",
  alternates: { canonical: "/systems" },
  openGraph: socialCard(
    "/systems",
    "Health systems and chains — NPImark Provider Data",
    "Which hospitals, nursing homes and home health agencies belong to which system.",
  ),
};

export default function SystemsPage() {
  return (
    <>
      <main className="nd-systems nd-home">
        <div className="hero2 hs-top">
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

          <section className="hs-hero">
            <div className="wrap">
              <nav className="hs-crumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/lists">Lists</Link><span>/</span><span aria-current="page">Health systems</span></nav>
              <div className="hs-banner">
                <div className="hs-art" aria-hidden="true">
                  <span className="hs-grid" />
                  <div className="hs-net">
                    <span className="hs-hub"><i className="ph-fill ph-buildings" /></span>
                    <span className="hs-orb o1"><span className="hs-sat s1"><i className="ph-fill ph-hospital" /></span><span className="hs-sat s2"><i className="ph-fill ph-bed" /></span></span>
                    <span className="hs-orb o2"><span className="hs-sat s3"><i className="ph-fill ph-house-line" /></span><span className="hs-sat s4"><i className="ph-fill ph-hand-heart" /></span><span className="hs-sat s5"><i className="ph-fill ph-first-aid" /></span></span>
                    <span className="hs-orb o3" />
                  </div>
                  <span className="hs-tag t1"><b>Hospitals</b></span>
                  <span className="hs-tag t2"><b>Nursing homes</b></span>
                  <span className="hs-tag t3"><b>Home health</b></span>
                </div>
                <div className="hs-copy">
                  <div className="sp-kicker">707 systems and chains on record</div>
                  <h1>Health systems <span className="sp-hl">and chains</span></h1>
                  <p className="sp-sub">Which hospitals, nursing homes and home health agencies belong to which system, as the public record has it. Each system lists its member facilities, with a profile for every one we hold.</p>
                  <div className="hs-btns">
                    <a className="hs-btn solid" href="#">View contacts - sign up free</a>
                    <Link className="hs-btn ghost" href="/lists">Browse lists</Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="hs-sec" id="find">
          <div className="wrap">
            <div className="sp-kicker">Browse</div>
            <h2>Find a system</h2>
            <form className="hs-filter" id="hs-form">
              <label className="hs-f"><span>Headquarters state</span><select id="hs-st"><option value="">Any state</option><option>AZ</option><option>CA</option><option>FL</option><option>GA</option><option>IA</option><option>IL</option><option>KY</option><option>LA</option><option>MI</option><option>MN</option><option>MO</option><option>NC</option><option>NY</option><option>OH</option><option>PA</option><option>SD</option><option>TN</option><option>TX</option><option>UT</option><option>WA</option><option>WV</option></select></label>
              <label className="hs-f"><span>Ownership</span><select id="hs-own"><option value="">Any ownership</option><option value="F">For-profit/investor owned</option><option value="C">Church-operated</option><option value="N">Nonprofit</option></select></label>
              <label className="hs-f"><span>Kind</span><select id="hs-kind"><option>Systems and chains</option></select></label>
              <button type="submit" className="hs-go" id="hs-go"><i className="ph ph-funnel-simple" />Filter systems</button>
            </form>
            <div className="hs-table-wrap">
              <table className="hs-table">
                <thead><tr>
                  <th>System</th><th>Headquarters</th>
                  <th><button type="button" className="hs-sort on" data-k="0">Hospitals<i className="ph ph-caret-down" /></button></th>
                  <th><button type="button" className="hs-sort" data-k="1">Facilities (all kinds)<i className="ph ph-caret-up-down" /></button></th>
                  <th><button type="button" className="hs-sort" data-k="2">Certified beds<i className="ph ph-caret-up-down" /></button></th>
                  <th>States</th><th>Ownership</th>
                </tr></thead>
                <tbody id="hs-body">
                  <tr data-st="TN" data-own="F" data-v="162,224,45832"><td><a className="hs-name" href="#">HCA Healthcare</a></td><td className="hs-hq">Nashville, TN</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "100%" }} /></span><b>162</b></td><td className="hs-n">224</td><td className="hs-n">45,832</td><td className="hs-st">AK, CA, CO, FL, GA, ID +12</td><td><span className="hs-own o-F">For-profit/investor owned</span></td></tr>
                  <tr data-st="" data-own="" data-v="150,150,9640"><td><a className="hs-name" href="#">Encompass Health</a></td><td className="hs-hq">—</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "93%" }} /></span><b>150</b></td><td className="hs-n">150</td><td className="hs-n">9,640</td><td className="hs-st">AZ, CA, FL, GA, IA, ID +29</td><td><span className="hs-dash">—</span></td></tr>
                  <tr data-st="PA" data-own="F" data-v="147,150,19706"><td><a className="hs-name" href="#">Universal Health Services</a></td><td className="hs-hq">Norristown, PA</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "91%" }} /></span><b>147</b></td><td className="hs-n">150</td><td className="hs-n">19,706</td><td className="hs-st">AK, AL, AR, AZ, CA, CO +33</td><td><span className="hs-own o-F">For-profit/investor owned</span></td></tr>
                  <tr data-st="IL" data-own="C" data-v="146,306,24899"><td><a className="hs-name" href="#">CommonSpirit Health</a></td><td className="hs-hq">Chicago, IL</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "90%" }} /></span><b>146</b></td><td className="hs-n">306</td><td className="hs-n">24,899</td><td className="hs-st">AR, AZ, CA, CO, GA, IA +17</td><td><span className="hs-own o-C">Church-operated</span></td></tr>
                  <tr data-st="TN" data-own="F" data-v="123,237,11947"><td><a className="hs-name" href="#">Lifepoint Health</a></td><td className="hs-hq">Brentwood, TN</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "76%" }} /></span><b>123</b></td><td className="hs-n">237</td><td className="hs-n">11,947</td><td className="hs-st">AL, AR, AZ, FL, GA, IA +25</td><td><span className="hs-own o-F">For-profit/investor owned</span></td></tr>
                  <tr data-st="MO" data-own="C" data-v="119,206,28311"><td><a className="hs-name" href="#">Ascension Health</a></td><td className="hs-hq">Saint Louis, MO</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "73%" }} /></span><b>119</b></td><td className="hs-n">206</td><td className="hs-n">28,311</td><td className="hs-st">AL, CT, DC, FL, IL, IN +10</td><td><span className="hs-own o-C">Church-operated</span></td></tr>
                  <tr data-st="MI" data-own="C" data-v="103,220,23267"><td><a className="hs-name" href="#">Trinity Health</a></td><td className="hs-hq">Livonia, MI</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "64%" }} /></span><b>103</b></td><td className="hs-n">220</td><td className="hs-n">23,267</td><td className="hs-st">CA, CT, DE, FL, GA, IA +12</td><td><span className="hs-own o-C">Church-operated</span></td></tr>
                  <tr data-st="" data-own="" data-v="103,104,5847"><td><a className="hs-name" href="#">Select Medical</a></td><td className="hs-hq">—</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "64%" }} /></span><b>103</b></td><td className="hs-n">104</td><td className="hs-n">5,847</td><td className="hs-st">FL, GA, IA, IL, IN, KS +19</td><td><span className="hs-dash">—</span></td></tr>
                  <tr data-st="TX" data-own="F" data-v="79,83,16419"><td><a className="hs-name" href="#">Tenet Healthcare</a></td><td className="hs-hq">Dallas, TX</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "49%" }} /></span><b>79</b></td><td className="hs-n">83</td><td className="hs-n">16,419</td><td className="hs-st">AL, AZ, CA, FL, MA, MI +6</td><td><span className="hs-own o-F">For-profit/investor owned</span></td></tr>
                  <tr data-st="KY" data-own="F" data-v="74,80,7207"><td><a className="hs-name" href="#">ScionHealth</a></td><td className="hs-hq">Louisville, KY</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "46%" }} /></span><b>74</b></td><td className="hs-n">80</td><td className="hs-n">7,207</td><td className="hs-st">AL, AR, AZ, CA, CO, FL +22</td><td><span className="hs-own o-F">For-profit/investor owned</span></td></tr>
                  <tr data-st="TN" data-own="F" data-v="69,105,12034"><td><a className="hs-name" href="#">Community Health Systems</a></td><td className="hs-hq">Franklin, TN</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "43%" }} /></span><b>69</b></td><td className="hs-n">105</td><td className="hs-n">12,034</td><td className="hs-st">AK, AL, AR, AZ, FL, GA +9</td><td><span className="hs-own o-F">For-profit/investor owned</span></td></tr>
                  <tr data-st="WA" data-own="C" data-v="55,121,12409"><td><a className="hs-name" href="#">Providence</a></td><td className="hs-hq">Renton, WA</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "34%" }} /></span><b>55</b></td><td className="hs-n">121</td><td className="hs-n">12,409</td><td className="hs-st">AK, CA, MT, NM, OR, TN +2</td><td><span className="hs-own o-C">Church-operated</span></td></tr>
                  <tr data-st="MO" data-own="C" data-v="54,119,7189"><td><a className="hs-name" href="#">Mercy</a></td><td className="hs-hq">Chesterfield, MO</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "33%" }} /></span><b>54</b></td><td className="hs-n">119</td><td className="hs-n">7,189</td><td className="hs-st">AR, IL, IN, KS, MO, OH +2</td><td><span className="hs-own o-C">Church-operated</span></td></tr>
                  <tr data-st="NC" data-own="N" data-v="52,91,12632"><td><a className="hs-name" href="#">Advocate Health</a></td><td className="hs-hq">Charlotte, NC</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "32%" }} /></span><b>52</b></td><td className="hs-n">91</td><td className="hs-n">12,632</td><td className="hs-st">AL, GA, IL, IN, NC, SC +3</td><td><span className="hs-own o-N">Nonprofit</span></td></tr>
                  <tr data-st="CA" data-own="F" data-v="50,61,11054"><td><a className="hs-name" href="#">Prime Healthcare Services</a></td><td className="hs-hq">Ontario, CA</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "31%" }} /></span><b>50</b></td><td className="hs-n">61</td><td className="hs-n">11,054</td><td className="hs-st">AL, CA, FL, GA, IL, IN +10</td><td><span className="hs-own o-F">For-profit/investor owned</span></td></tr>
                  <tr data-st="FL" data-own="C" data-v="48,79,11518"><td><a className="hs-name" href="#">AdventHealth</a></td><td className="hs-hq">Altamonte Springs, FL</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "30%" }} /></span><b>48</b></td><td className="hs-n">79</td><td className="hs-n">11,518</td><td className="hs-st">CO, FL, GA, IL, IN, KS +4</td><td><span className="hs-own o-C">Church-operated</span></td></tr>
                  <tr data-st="SD" data-own="N" data-v="46,267,11528"><td><a className="hs-name" href="#">Sanford Health</a></td><td className="hs-hq">Sioux Falls, SD</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "28%" }} /></span><b>46</b></td><td className="hs-n">267</td><td className="hs-n">11,528</td><td className="hs-st">AR, AZ, CO, FL, HI, IA +16</td><td><span className="hs-own o-N">Nonprofit</span></td></tr>
                  <tr data-st="" data-own="" data-v="45,45,4603"><td><a className="hs-name" href="#">Acadia Healthcare</a></td><td className="hs-hq">—</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "28%" }} /></span><b>45</b></td><td className="hs-n">45</td><td className="hs-n">4,603</td><td className="hs-st">FL, GA, IL, IN, LA, MA +13</td><td><span className="hs-dash">—</span></td></tr>
                  <tr data-st="CA" data-own="N" data-v="38,85,10365"><td><a className="hs-name" href="#">Kaiser Permanente</a></td><td className="hs-hq">Oakland, CA</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "23%" }} /></span><b>38</b></td><td className="hs-n">85</td><td className="hs-n">10,365</td><td className="hs-st">CA, HI, OR, WA</td><td><span className="hs-own o-N">Nonprofit</span></td></tr>
                  <tr data-st="OH" data-own="C" data-v="38,76,8182"><td><a className="hs-name" href="#">Bon Secours Mercy Health</a></td><td className="hs-hq">Cincinnati, OH</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "23%" }} /></span><b>38</b></td><td className="hs-n">76</td><td className="hs-n">8,182</td><td className="hs-st">FL, IL, KY, NY, OH, SC +1</td><td><span className="hs-own o-C">Church-operated</span></td></tr>
                  <tr data-st="" data-own="" data-v="38,38,2010"><td><a className="hs-name" href="#">Pam Cubed</a></td><td className="hs-hq">—</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "23%" }} /></span><b>38</b></td><td className="hs-n">38</td><td className="hs-n">2,010</td><td className="hs-st">FL, IN, KS, LA, MA, MO +8</td><td><span className="hs-dash">—</span></td></tr>
                  <tr data-st="SD" data-own="C" data-v="36,95,2909"><td><a className="hs-name" href="#">Avera Health</a></td><td className="hs-hq">Sioux Falls, SD</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "22%" }} /></span><b>36</b></td><td className="hs-n">95</td><td className="hs-n">2,909</td><td className="hs-st">IA, MN, ND, NE, SD</td><td><span className="hs-own o-C">Church-operated</span></td></tr>
                  <tr data-st="MO" data-own="C" data-v="36,60,5667"><td><a className="hs-name" href="#">SSM Health</a></td><td className="hs-hq">Saint Louis, MO</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "22%" }} /></span><b>36</b></td><td className="hs-n">60</td><td className="hs-n">5,667</td><td className="hs-st">IL, MO, OK, WI</td><td><span className="hs-own o-C">Church-operated</span></td></tr>
                  <tr data-st="UT" data-own="N" data-v="33,46,4853"><td><a className="hs-name" href="#">Intermountain Healthcare</a></td><td className="hs-hq">Salt Lake City, UT</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "20%" }} /></span><b>33</b></td><td className="hs-n">46</td><td className="hs-n">4,853</td><td className="hs-st">CO, ID, MT, UT</td><td><span className="hs-own o-N">Nonprofit</span></td></tr>
                  <tr data-st="LA" data-own="N" data-v="32,64,4303"><td><a className="hs-name" href="#">Ochsner Health System</a></td><td className="hs-hq">New Orleans, LA</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "20%" }} /></span><b>32</b></td><td className="hs-n">64</td><td className="hs-n">4,303</td><td className="hs-st">AL, LA, MS</td><td><span className="hs-own o-N">Nonprofit</span></td></tr>
                  <tr data-st="AZ" data-own="N" data-v="31,50,6050"><td><a className="hs-name" href="#">Banner Health</a></td><td className="hs-hq">Phoenix, AZ</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "19%" }} /></span><b>31</b></td><td className="hs-n">50</td><td className="hs-n">6,050</td><td className="hs-st">AZ, CA, CO, NE, NV, WY</td><td><span className="hs-own o-N">Nonprofit</span></td></tr>
                  <tr data-st="TN" data-own="F" data-v="30,50,2220"><td><a className="hs-name" href="#">Quorum Health Corporation</a></td><td className="hs-hq">Brentwood, TN</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "19%" }} /></span><b>30</b></td><td className="hs-n">50</td><td className="hs-n">2,220</td><td className="hs-st">AL, AR, CA, CO, IA, IL +16</td><td><span className="hs-own o-F">For-profit/investor owned</span></td></tr>
                  <tr data-st="PA" data-own="N" data-v="30,63,8002"><td><a className="hs-name" href="#">UPMC</a></td><td className="hs-hq">Pittsburgh, PA</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "19%" }} /></span><b>30</b></td><td className="hs-n">63</td><td className="hs-n">8,002</td><td className="hs-st">MD, NY, PA</td><td><span className="hs-own o-N">Nonprofit</span></td></tr>
                  <tr data-st="TN" data-own="F" data-v="29,57,4075"><td><a className="hs-name" href="#">Ardent Health Services</a></td><td className="hs-hq">Brentwood, TN</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "18%" }} /></span><b>29</b></td><td className="hs-n">57</td><td className="hs-n">4,075</td><td className="hs-st">ID, KS, NJ, NM, OK, TX</td><td><span className="hs-own o-F">For-profit/investor owned</span></td></tr>
                  <tr data-st="IA" data-own="N" data-v="29,95,3713"><td><a className="hs-name" href="#">Unitypoint Health</a></td><td className="hs-hq">West Des Moines, IA</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "18%" }} /></span><b>29</b></td><td className="hs-n">95</td><td className="hs-n">3,713</td><td className="hs-st">IA, IL, WI</td><td><span className="hs-own o-N">Nonprofit</span></td></tr>
                  <tr data-st="" data-own="" data-v="29,41,1405"><td><a className="hs-name" href="#">Webster Equity Partners V</a></td><td className="hs-hq">—</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "18%" }} /></span><b>29</b></td><td className="hs-n">41</td><td className="hs-n">1,405</td><td className="hs-st">CO, DC, DE, ID, IN, LA +8</td><td><span className="hs-dash">—</span></td></tr>
                  <tr data-st="TX" data-own="N" data-v="28,31,4674"><td><a className="hs-name" href="#">Baylor Scott and White Health</a></td><td className="hs-hq">Dallas, TX</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "17%" }} /></span><b>28</b></td><td className="hs-n">31</td><td className="hs-n">4,674</td><td className="hs-st">TX</td><td><span className="hs-own o-N">Nonprofit</span></td></tr>
                  <tr data-st="TX" data-own="C" data-v="28,44,6239"><td><a className="hs-name" href="#">Christus Health</a></td><td className="hs-hq">Irving, TX</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "17%" }} /></span><b>28</b></td><td className="hs-n">44</td><td className="hs-n">6,239</td><td className="hs-st">LA, NM, TX</td><td><span className="hs-own o-C">Church-operated</span></td></tr>
                  <tr data-st="" data-own="" data-v="27,29,1191"><td><a className="hs-name" href="#">Epoch Parent Holdings</a></td><td className="hs-hq">—</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "17%" }} /></span><b>27</b></td><td className="hs-n">29</td><td className="hs-n">1,191</td><td className="hs-st">AZ, FL, ID, IN, MT, NM +6</td><td><span className="hs-dash">—</span></td></tr>
                  <tr data-st="CA" data-own="N" data-v="24,38,4454"><td><a className="hs-name" href="#">Sutter Health</a></td><td className="hs-hq">Sacramento, CA</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "15%" }} /></span><b>24</b></td><td className="hs-n">38</td><td className="hs-n">4,454</td><td className="hs-st">CA</td><td><span className="hs-own o-N">Nonprofit</span></td></tr>
                  <tr data-st="TX" data-own="N" data-v="24,30,5073"><td><a className="hs-name" href="#">Texas Health Resources</a></td><td className="hs-hq">Arlington, TX</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "15%" }} /></span><b>24</b></td><td className="hs-n">30</td><td className="hs-n">5,073</td><td className="hs-st">TX</td><td><span className="hs-own o-N">Nonprofit</span></td></tr>
                  <tr data-st="OH" data-own="N" data-v="24,29,6585"><td><a className="hs-name" href="#">Cleveland Clinic</a></td><td className="hs-hq">Cleveland, OH</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "15%" }} /></span><b>24</b></td><td className="hs-n">29</td><td className="hs-n">6,585</td><td className="hs-st">FL, OH</td><td><span className="hs-own o-N">Nonprofit</span></td></tr>
                  <tr data-st="CA" data-own="C" data-v="23,38,3650"><td><a className="hs-name" href="#">Adventist Health</a></td><td className="hs-hq">Roseville, CA</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "14%" }} /></span><b>23</b></td><td className="hs-n">38</td><td className="hs-n">3,650</td><td className="hs-st">CA, HI, OR</td><td><span className="hs-own o-C">Church-operated</span></td></tr>
                  <tr data-st="GA" data-own="N" data-v="23,26,4376"><td><a className="hs-name" href="#">Piedmont Healthcare</a></td><td className="hs-hq">Atlanta, GA</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "14%" }} /></span><b>23</b></td><td className="hs-n">26</td><td className="hs-n">4,376</td><td className="hs-st">GA</td><td><span className="hs-own o-N">Nonprofit</span></td></tr>
                  <tr data-st="TN" data-own="C" data-v="22,35,3894"><td><a className="hs-name" href="#">Baptist Memorial Health Care Corporation</a></td><td className="hs-hq">Memphis, TN</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "14%" }} /></span><b>22</b></td><td className="hs-n">35</td><td className="hs-n">3,894</td><td className="hs-st">AR, MS, TN</td><td><span className="hs-own o-C">Church-operated</span></td></tr>
                  <tr data-st="MN" data-own="N" data-v="22,33,4558"><td><a className="hs-name" href="#">Mayo Clinic Health System</a></td><td className="hs-hq">Rochester, MN</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "14%" }} /></span><b>22</b></td><td className="hs-n">33</td><td className="hs-n">4,558</td><td className="hs-st">AZ, FL, IA, MN, WI</td><td><span className="hs-own o-N">Nonprofit</span></td></tr>
                  <tr data-st="WV" data-own="N" data-v="22,46,3485"><td><a className="hs-name" href="#">West Virginia University Health System</a></td><td className="hs-hq">Morgantown, WV</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "14%" }} /></span><b>22</b></td><td className="hs-n">46</td><td className="hs-n">3,485</td><td className="hs-st">MD, OH, PA, VA, WV</td><td><span className="hs-own o-N">Nonprofit</span></td></tr>
                  <tr data-st="" data-own="" data-v="21,22,5345"><td><a className="hs-name" href="#">Nys Office of Mental Health</a></td><td className="hs-hq">—</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "13%" }} /></span><b>21</b></td><td className="hs-n">22</td><td className="hs-n">5,345</td><td className="hs-st">NY</td><td><span className="hs-dash">—</span></td></tr>
                  <tr data-st="NY" data-own="N" data-v="20,30,8754"><td><a className="hs-name" href="#">Northwell Health</a></td><td className="hs-hq">New Hyde Park, NY</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "12%" }} /></span><b>20</b></td><td className="hs-n">30</td><td className="hs-n">8,754</td><td className="hs-st">CT, NY</td><td><span className="hs-own o-N">Nonprofit</span></td></tr>
                  <tr data-st="MI" data-own="N" data-v="20,60,6325"><td><a className="hs-name" href="#">Corewell Health</a></td><td className="hs-hq">Grand Rapids, MI</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "12%" }} /></span><b>20</b></td><td className="hs-n">60</td><td className="hs-n">6,325</td><td className="hs-st">MI</td><td><span className="hs-own o-N">Nonprofit</span></td></tr>
                  <tr data-st="TX" data-own="F" data-v="20,22,4900"><td><a className="hs-name" href="#">Steward Health Care System</a></td><td className="hs-hq">Dallas, TX</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "12%" }} /></span><b>20</b></td><td className="hs-n">22</td><td className="hs-n">4,900</td><td className="hs-st">AZ, FL, LA, MA, PA, TX</td><td><span className="hs-own o-F">For-profit/investor owned</span></td></tr>
                  <tr data-st="IL" data-own="C" data-v="19,72,2811"><td><a className="hs-name" href="#">OSF Healthcare System</a></td><td className="hs-hq">Peoria, IL</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "12%" }} /></span><b>19</b></td><td className="hs-n">72</td><td className="hs-n">2,811</td><td className="hs-st">IL, MI</td><td><span className="hs-own o-C">Church-operated</span></td></tr>
                  <tr data-st="TN" data-own="N" data-v="19,35,3115"><td><a className="hs-name" href="#">Ballad Health</a></td><td className="hs-hq">Johnson City, TN</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "12%" }} /></span><b>19</b></td><td className="hs-n">35</td><td className="hs-n">3,115</td><td className="hs-st">TN, VA</td><td><span className="hs-own o-N">Nonprofit</span></td></tr>
                  <tr data-st="TX" data-own="N" data-v="17,24,1220"><td><a className="hs-name" href="#">Community Hospital Corporation</a></td><td className="hs-hq">Plano, TX</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "10%" }} /></span><b>17</b></td><td className="hs-n">24</td><td className="hs-n">1,220</td><td className="hs-st">AL, CO, IA, ID, KY, NC +2</td><td><span className="hs-own o-N">Nonprofit</span></td></tr>
                  <tr data-st="NC" data-own="N" data-v="17,21,3905"><td><a className="hs-name" href="#">Novant Health</a></td><td className="hs-hq">Winston Salem, NC</td><td className="hs-h"><span className="hs-hbar"><i style={{ width: "10%" }} /></span><b>17</b></td><td className="hs-n">21</td><td className="hs-n">3,905</td><td className="hs-st">NC, SC</td><td><span className="hs-own o-N">Nonprofit</span></td></tr>
                </tbody>
              </table>
              <p className="hs-none" id="hs-none" hidden>No systems on this page match those filters.</p>
            </div>
            <div className="hs-under">
              <p className="hs-fine">Ownership reflects the system{"'"}s general acute care hospitals, weighted by beds. {'"'}Facilities (all kinds){'"'} counts hospitals, nursing homes, home health and hospice agencies and other certified facilities together.</p>
              <div className="hs-pager"><span id="hs-count">1–50 of 707</span><a className="hs-next" href="#">Next 50<i className="ph ph-arrow-right" /></a></div>
            </div>
            <div className="hs-also"><span>Also:</span><Link href="/lists">Provider and facility lists</Link><a href="#">Healthcare leadership by role</a><Link href="/directory">The full directory</Link></div>
          </div>
        </section>

        <section className="hs-sec hs-tint">
          <div className="wrap">
            <div className="sp-kicker">Largest by hospitals</div>
            <h2>Where to start</h2>
            <div className="hs-start">
              <a className="hs-sc" href="#">
                <span className="hs-rank">#1</span>
                <span className="hs-sc-ic"><i className="ph-duotone ph-buildings" /></span>
                <h3>HCA Healthcare</h3>
                <p>162 member hospitals · 45,832 certified beds · 18 states · a for-profit, investor-owned system</p>
                <span className="hs-sc-foot"><span className="hs-own o-F">For-profit/investor owned</span><i className="ph ph-arrow-up-right" /></span>
              </a>
              <a className="hs-sc" href="#">
                <span className="hs-rank">#2</span>
                <span className="hs-sc-ic"><i className="ph-duotone ph-buildings" /></span>
                <h3>Encompass Health</h3>
                <p>150 member hospitals · 9,640 certified beds · 35 states</p>
                <span className="hs-sc-foot"><span /><i className="ph ph-arrow-up-right" /></span>
              </a>
              <a className="hs-sc" href="#">
                <span className="hs-rank">#3</span>
                <span className="hs-sc-ic"><i className="ph-duotone ph-buildings" /></span>
                <h3>Universal Health Services</h3>
                <p>147 member hospitals · 19,706 certified beds · 39 states · a for-profit, investor-owned system</p>
                <span className="hs-sc-foot"><span className="hs-own o-F">For-profit/investor owned</span><i className="ph ph-arrow-up-right" /></span>
              </a>
              <a className="hs-sc" href="#">
                <span className="hs-rank">#4</span>
                <span className="hs-sc-ic"><i className="ph-duotone ph-buildings" /></span>
                <h3>CommonSpirit Health</h3>
                <p>146 member hospitals · 24,899 certified beds · 23 states · a church-operated system</p>
                <span className="hs-sc-foot"><span className="hs-own o-C">Church-operated</span><i className="ph ph-arrow-up-right" /></span>
              </a>
            </div>
          </div>
        </section>

        <section className="hs-sec">
          <div className="wrap">
            <div className="hs-sell">
              <div className="hs-sell-copy">
                <h2>Selling to a system?</h2>
                <p>Signed-in customers see the named leadership behind each facility{"'"}s role counts, and can build the account list with their own filters.</p>
                <div className="hs-btns">
                  <a className="hs-btn solid" href="#">View contacts - sign up free</a>
                  <Link className="hs-btn line" href="/search">Search providers</Link>
                </div>
              </div>
              <div className="hs-org" aria-hidden="true">
                <div className="hs-org-top"><i className="ph-fill ph-buildings" /><span>System</span></div>
                <div className="hs-org-row">
                  <div className="hs-org-c"><i className="ph-fill ph-hospital" /><span>Facility</span><em><i className="ph-fill ph-user" />CEO</em><em><i className="ph-fill ph-user" />CFO</em></div>
                  <div className="hs-org-c"><i className="ph-fill ph-bed" /><span>Facility</span><em><i className="ph-fill ph-user" />Administrator</em><em><i className="ph-fill ph-user" />DON</em></div>
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
        function hsFilter() {
          var body = document.getElementById('hs-body');
          var none = document.getElementById('hs-none');
          if (!body) return;
          var st = (document.getElementById('hs-st') || {}).value || '';
          var own = (document.getElementById('hs-own') || {}).value || '';
          var rows = body.querySelectorAll('tr');
          var vis = 0;
          rows.forEach(function(r) {
            var rSt = r.getAttribute('data-st') || '';
            var rOwn = r.getAttribute('data-own') || '';
            var show = (!st || rSt === st) && (!own || rOwn === own);
            r.hidden = !show;
            if (show) vis++;
          });
          if (none) none.hidden = vis > 0;
        }
        document.body.addEventListener('submit', function(e) {
          if (e.target.id === 'hs-form') { e.preventDefault(); hsFilter(); }
        });
        document.body.addEventListener('click', function(e) {
          if (e.target.closest('#hs-go')) { hsFilter(); return; }
          var btn = e.target.closest('.hs-sort');
          if (!btn) return;
          var body = document.getElementById('hs-body');
          if (!body) return;
          var k = parseInt(btn.getAttribute('data-k'));
          var rows = Array.from(body.querySelectorAll('tr'));
          var asc = btn.classList.toggle('asc');
          document.querySelectorAll('.hs-sort').forEach(function(b) {
            if (b !== btn) { b.classList.remove('on','asc'); }
          });
          btn.classList.add('on');
          rows.sort(function(a, b) {
            var av = (a.getAttribute('data-v') || '').split(',');
            var bv = (b.getAttribute('data-v') || '').split(',');
            var ai = parseInt(av[k]) || 0;
            var bi = parseInt(bv[k]) || 0;
            return asc ? ai - bi : bi - ai;
          });
          rows.forEach(function(r) { body.appendChild(r); });
        });
      `}} />
    </>
  );
}

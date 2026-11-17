import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { CtaLink } from "@/components/CtaLink";
import { BillingToggle } from "@/components/BillingToggle";
import { DarkFooter } from "@/components/DarkFooter";
import { NewDesignScripts } from "@/components/NewDesignScripts";
import { getMe } from "@/lib/session";

export const dynamic = "force-dynamic";
import { ONE_IN_WORDS, YEAR } from "@/lib/claims";
import {
  ANNUAL,
  CONTRACT_ONLY,
  DAILY_CAP_RULE,
  INTRODUCTORY,
  NO_CHECKOUT,
  OVERAGE,
  PLANS,
  type Plan,
  count,
  dollars,
  priceLabel,
} from "@/lib/plans";

import { JsonLd } from "@/components/JsonLd";
import { BANDS, deepestBand, ladderLede } from "@/lib/reach";
import { offerNodes } from "@/lib/offers";
import { breadcrumb, publisherRef, websiteRef } from "@/lib/schema";
import { PRODUCT, SITE_NAME, siteUrl } from "@/lib/site";
import { salesHref, socialCard } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Contact plans from $99 a month, plus premium access under contract. Compare work email access and data allowances for exports, " +
    "the API and append alike. Monthly, cancel any time; introductory prices.",
  alternates: { canonical: "/pricing" },
  openGraph: socialCard(
    "/pricing",
    "Pricing",
    "Healthcare contact plans from $99 a month. Monthly, cancel any time. Searching is included on every plan.",
  ),
};

function lines(plan: Plan): { text: string; included: boolean }[] {
  return [
    {
      text: plan.dailyRows === null
        ? `${count(plan.rows)} data records a month — exports, API and append combined`
        : `${count(plan.rows)} data records a month — exports, API and append combined, up to ${count(plan.dailyRows)} a day`,
      included: true,
    },
    { text: `${count(plan.reveals)} work email unlocks a month — counted per provider`, included: true },
    { text: `${count(plan.apiCalls)} API calls a month`, included: true },
    {
      text: `${plan.seats} separate user ${plan.seats === 1 ? "account" : "accounts"} included, ${plan.alerts} standing ${plan.alerts === 1 ? "alert" : "alerts"}`,
      included: true,
    },
    { text: plan.append ? "Append your own files" : "No append", included: plan.append },
    {
      text: plan.premiumContacts
        ? "Premium contact access: cell phone and home address, under contract"
        : "Premium contact details not included",
      included: plan.premiumContacts,
    },
    { text: plan.commitment, included: true },
  ];
}

function yearlyPrice(plan: Plan): string {
  if (plan.priceCents === null) return "On request";
  if (plan.priceCents === 0) return "Free";
  const yearly = Math.round((plan.priceCents * 10) / 100);
  return plan.from ? `from $${yearly.toLocaleString("en-US")}` : `$${yearly.toLocaleString("en-US")}`;
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

export default async function PricingPage() {
  const me = await getMe();
  const trial = process.env.NPI_CARD_TRIAL_ENABLED === "true";
  const displayPlans = trial ? PLANS.filter(plan => plan.code !== "free") : PLANS;
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebPage",
              "@id": siteUrl("/pricing#page"),
              name: "Pricing",
              url: siteUrl("/pricing"),
              description: metadata.description as string,
              isPartOf: websiteRef(),
              mainEntity: { "@id": siteUrl("/pricing#offers") },
            },
            {
              "@type": "Service",
              "@id": siteUrl("/pricing#offers"),
              name: `${SITE_NAME} ${PRODUCT}`,
              serviceType: "Healthcare provider data",
              provider: publisherRef(),
              url: siteUrl("/pricing"),
              offers: offerNodes(displayPlans, siteUrl("/pricing")),
            },
            breadcrumb([
              { name: "Home", href: "/" },
              { name: "Pricing", href: "/pricing" },
            ]),
          ],
        }}
      />

      <main className="nd-pricing nd-home">
        <div className="hero2 pr-top">
          <header className="site-nav-new">
            <div className="wrap">
              <Link className="nd-brand" href="/" aria-label="NPImark Provider Data home">
                <LogoSvg /><span>NPImark<small>Provider Data</small></span>
              </Link>
              <nav className="top-menu" aria-label="Primary">
                <Link href="/search">Search</Link>
                <Link href="/directory">Directory</Link>
                <Link href="/tour">Tour</Link>
                <Link href="/pricing" aria-current="page">Pricing</Link>
                <Link href="/docs/api">API</Link>
              </nav>
              <div className="nav-actions">
                <Link className="icon-btn" href="/search" aria-label="Search"><i className="ph ph-magnifying-glass" /></Link>
                <Link className="btn-solid" href="/#cta">Get Started <i className="ph ph-arrow-right" /></Link>
              </div>
            </div>
          </header>

          <section className="pr-hero">
            <div className="wrap pr-hero-grid">
              <div>
                <div className="sp-kicker">Pricing</div>
                <h1>Choose the contact access your team needs.</h1>
                <p className="sp-sub">{ladderLede(displayPlans)}</p>
                <p className="pr-sub2">A work email unlock is called a reveal in your account. Data records are counted as rows; repeated deliveries and multiple records for one provider can each use the allowance. Review the usage details below.</p>
                <ol className="tiers">
                  {BANDS.map((band, index) => (
                    <li key={band.key} className={`tier t${index + 1}`}>
                      <span className="tier-num">{index + 1}</span>
                      <div>
                        <h2><i className={`ph-duotone ${index === 0 ? "ph-identification-card" : index === 1 ? "ph-envelope-simple" : "ph-lock-key"}`} />{band.name}</h2>
                        <p className="tier-a">{band.what}</p>
                        <p className="tier-b">{band.provenance}</p>
                        <p className="tier-c">{band.gate}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
              <aside className="ex-card" aria-label="Example provider profile">
                <div className="ex-head">
                  <span className="ex-av"><i className="ph-fill ph-user" /></span>
                  <div><b>Example, A. Clinician<span>MD</span></b><span>Internal Medicine · Dallas, TX</span></div>
                  <code>NPI 1234567893</code>
                </div>
                <div className="ex-sec">
                  <div className="ex-sec-h"><span className="tier-num sm">1</span>The public record<span className="tag tag-ok">Free</span></div>
                  <dl>
                    <div><dt>Name and credential</dt><dd>Example, A. Clinician</dd></div>
                    <div><dt>Specialty</dt><dd>Internal Medicine</dd></div>
                    <div><dt>Practice address</dt><dd>1 Example Plaza, Suite 400, Dallas, TX 75201</dd></div>
                    <div><dt>Practice phone</dt><dd className="mono">(214) 555-0147</dd></div>
                  </dl>
                </div>
                <div className="ex-sec">
                  <div className="ex-sec-h"><span className="tier-num sm">2</span>Work email access<span className="tag tag-accent">Plan allowance</span></div>
                  <dl>
                    <div><dt>Work email</dt><dd><span className="held" aria-label="Held" /></dd></div>
                    <div><dt>Deliverability grade</dt><dd><span className="held s" aria-label="Held" /></dd></div>
                    <div><dt>When it was last checked</dt><dd><span className="held m" aria-label="Held" /></dd></div>
                  </dl>
                </div>
                <div className="ex-sec">
                  <div className="ex-sec-h"><span className="tier-num sm">3</span>Home address and cell phone<span className="tag tag-lock">Under contract</span></div>
                  <dl>
                    <div><dt>Home address</dt><dd><span className="held lock" aria-label="Held" /></dd></div>
                    <div><dt>Cell phone</dt><dd><span className="held lock m" aria-label="Held" /></dd></div>
                  </dl>
                </div>
                <p className="ex-fine">An example public provider profile, available without signing in. The bars are fields that are not in this page at all — a held value is absent from the response, never printed and covered over.</p>
              </aside>
            </div>
          </section>
        </div>

        <section className="pr-plans" id="plans">
          <div className="wrap">
            <BillingToggle>
              <div className="plan-grid">
                {displayPlans.filter(p => p.code !== "free").map((plan) => {
                  const monthlyLabel = priceLabel(plan);
                  const yearlyLabel = yearlyPrice(plan);
                  const monthlyPeriod = plan.period;
                  const yearlyPeriod = plan.from ? "per month, annual agreement" : "per year, paid up front";
                  const isFeatured = plan.featured;
                  const isContract = plan.premiumContacts;

                  return (
                    <article key={plan.code} className={`plan${isFeatured ? " feat" : ""}${isContract ? " contract" : ""}`}>
                      <h2>{plan.name}</h2>
                      <div className="price">
                        <b data-m={monthlyLabel} data-y={yearlyLabel}>{monthlyLabel}</b>
                        <span data-pm={monthlyPeriod} data-py={yearlyPeriod}>{monthlyPeriod}</span>
                      </div>
                      <p className="reads"><span>Reads to</span>{deepestBand(plan).name}</p>
                      <p className="plan-d">{plan.tagline}</p>
                      <ul className="feat-list">
                        {lines(plan).map(({ text, included }) => (
                          <li key={text} className={included ? undefined : "no"}>
                            <i className={included ? "ph-bold ph-check" : "ph ph-minus"} />
                            <span>{text}</span>
                          </li>
                        ))}
                      </ul>
                      {isContract ? (
                        <CtaLink
                          event="pricing_cta_click"
                          href={salesHref(`${plan.name} plan`)}
                          className="btn-solid plan-cta"
                        >
                          Talk to us<i className="ph ph-arrow-right" />
                        </CtaLink>
                      ) : isFeatured ? (
                        <CtaLink
                          event="pricing_cta_click"
                          href={me ? `/app/billing?plan=${encodeURIComponent(plan.code)}#upgrade` : trial ? `/sign-up?plan=${encodeURIComponent(plan.code)}` : salesHref(`${plan.name} plan`)}
                          className="btn-solid plan-cta"
                        >
                          {me ? "Review upgrade" : trial ? "Start seven-day trial" : "Start seven-day trial"}<i className="ph ph-arrow-right" />
                        </CtaLink>
                      ) : (
                        <CtaLink
                          event="pricing_cta_click"
                          href={me ? `/app/billing?plan=${encodeURIComponent(plan.code)}#upgrade` : trial ? `/sign-up?plan=${encodeURIComponent(plan.code)}` : salesHref(`${plan.name} plan`)}
                          className="cta-outline dark plan-cta"
                        >
                          {me ? "Review upgrade" : trial ? "Start seven-day trial" : "Start seven-day trial"}<i className="ph ph-arrow-right" />
                        </CtaLink>
                      )}
                    </article>
                  );
                })}
              </div>
            </BillingToggle>

            <div className="buy">
              <h2>How buying works today</h2>
              <ul className="buy-list">
                <li><i className="ph-duotone ph-calendar-check" /><span><b>Monthly, cancel any time</b> on Starter, Professional and Scale. There is no annual commitment to sign and no minimum term. {ANNUAL}</span></li>
                <li><i className="ph-duotone ph-users" /><span>Seats are separate logins included in the plan price. Inviting users within that allowance does not add a per-seat charge.</span></li>
                <li><i className="ph-duotone ph-credit-card" /><span>{trial ? "A card is required for the seven-day trial. Review your selected plan and monthly renewal price in Billing before accepting. Cancel before the displayed end time to avoid renewal. Existing Free accounts retain their access." : NO_CHECKOUT}</span></li>
                <li><i className="ph-duotone ph-trend-up" /><span>{OVERAGE}</span></li>
                <li><i className="ph-duotone ph-clock-countdown" /><span>{DAILY_CAP_RULE}</span></li>
                <li><i className="ph-duotone ph-signature" /><span>{CONTRACT_ONLY}</span></li>
                <li><i className="ph-duotone ph-tag" /><span>{INTRODUCTORY}</span></li>
              </ul>
            </div>

            <div className="tri">
              <div className="tri-card yes">
                <h2><i className="ph-fill ph-check-circle" />What every plan gets</h2>
                <ul className="pr-ticks">
                  <li>The public record for every provider, refreshed as the sources publish.</li>
                  <li>Unlimited searches and saved searches. Searching is not metered on any plan, the free one included.</li>
                  <li>The API, with scoped keys per organization. Rows returned count against the same allowance an export spends, and every limit comes back in response headers — <Link href="/docs/api">the reference</Link>.</li>
                  <li>Suppression that applies to every search, page, count and file.</li>
                  <li>An audit trail of every reveal, export and append.</li>
                  <li>Sign-out everywhere, seat limits and owner-only billing.</li>
                </ul>
              </div>
              <div className="tri-card mid">
                <h2><i className="ph-fill ph-pill" />What a Medicare procedure or drug line costs</h2>
                <ul className="pr-ticks">
                  <li>Through the API, one published procedure line or one published prescribing line is <b>one row</b> — off the same monthly allowance an export spends. Thirty procedure lines for a surgeon are thirty rows.</li>
                  <li>On screen in the app it is <b>included</b>, like search.</li>
                  <li>In a file the summary of those lines — the highest-volume few, and the sizes — is a <b>column</b> and not a row: it widens the row the provider was already costing you. An export of ten thousand providers costs ten thousand rows with those columns and ten thousand without.</li>
                  <li>A provider whose Medicare volume was never published returns nothing and costs <b>no rows</b>. Since it covers about one in {ONE_IN_WORDS} clinicians, checking the other five in six is free of rows.</li>
                  <li>Finding a procedure or a drug by name — the pickers — costs no rows at all. A code and a drug name are vocabulary, not records.</li>
                  <li>Filtering a search on a procedure or a drug costs nothing extra: you pay for the providers the search returns, as always.</li>
                  <li>Published Medicare fee-for-service data for {YEAR}, and not all-payor claims — <Link href="/data">what it covers and does not</Link>.</li>
                </ul>
              </div>
              <div className="tri-card no">
                <h2><i className="ph-fill ph-prohibit" />What no plan gets</h2>
                <ul className="pr-ticks">
                  <li>Bulk contact lists without a reveal or a row allowance behind them.</li>
                  <li>A cheaper row through the API than through an export. It is one allowance, and asking for more rows than are left is refused rather than quietly shortened.</li>
                  <li>Home address or cell phone on a plan you can buy with a card. Those are on the contract tier only, never on a public page, and never over the API.</li>
                  <li>Redistribution or resale rights. Files are watermarked to the organization.</li>
                  <li>Patient data. There is none in the platform.</li>
                </ul>
              </div>
            </div>
            <p className="pr-foot">The four things a plan meters are rows, appended rows, API calls and reveals; what each one counts, and what is never counted, is in <Link href="/help/plans-and-limits">plans and limits</Link>. Unused allowance does not carry over.</p>
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

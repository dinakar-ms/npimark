import Link from "next/link";

export function AudienceWorkflows() {
  return <section className="section np-audience-section"><div className="wrap">
    <div className="section-head"><span className="eyebrow rule">Built around your work</span><h2>Different teams. One clear provider record.</h2><p className="lede">Move from a broad market to a specific group of providers, with context you can inspect before you act.</p></div>
    <div className="np-value-grid">
      {[
        ["01", "Recruiting teams", "Find clinicians by specialty and geography. Review practice locations and available affiliations before building a recruiting list.", "Explore specialties", "/lists"],
        ["02", "Sales and growth teams", "Research providers and healthcare organizations in your territory. Check segment coverage before choosing contact access.", "Check your market", "/directory"],
        ["03", "Healthcare organizations", "Look up providers by NPI, review available practice information, and explore an API workflow for your internal systems.", "Explore the API", "/docs/api"],
      ].map(([number,title,body,label,href]) => <article className="np-value-card" key={number}><span className="np-step-number">{number}</span><h3>{title}</h3><p>{body}</p><Link className="np-text-link" href={href}>{label} <span aria-hidden="true">→</span></Link></article>)}
    </div>
  </div></section>;
}

export function VendorComparison() {
  return <section className="section np-comparison" id="compare-platforms"><div className="wrap">
    <div className="section-head"><span className="eyebrow rule">Choose for the job you have</span><h2>NPImark, Definitive Healthcare or IQVIA?</h2><p className="lede">Compare the specific product and dataset you need. These platforms have different scopes; this is a guide to evaluating fit, not a claim that one replaces every capability of another.</p></div>
    <div className="np-value-grid">
      <article className="np-value-card np-value-featured"><span className="eyebrow">Our focus</span><h3>NPImark</h3><p>US provider discovery organized around NPI, specialty, practice location and available affiliations. Public directory exploration leads into account-based lists, metered contact access and scoped API access.</p><h4>Start here when</h4><p>Your immediate job is to identify a provider segment and evaluate the records you can use.</p><Link className="btn primary" href="/search">Try provider search</Link></article>
      <article className="np-value-card"><span className="eyebrow">Commercial intelligence</span><h3>Definitive Healthcare</h3><p>Its published portfolio includes healthcare organization and professional intelligence, affiliations, and medical and prescription claims products for commercial and market analysis.</p><h4>Evaluate when</h4><p>You need broader market intelligence or claims-led analysis alongside provider and organization research.</p><a className="np-text-link" href="https://www.definitivehc.com/data-products">Read their product overview ↗</a></article>
      <article className="np-value-card"><span className="eyebrow">Global reference data</span><h3>IQVIA OneKey</h3><p>IQVIA describes OneKey as a global healthcare professional and healthcare organization reference database. Evaluate OneKey separately from IQVIA’s other products and services.</p><h4>Evaluate when</h4><p>You need international HCP/HCO reference data and want to assess coverage for your countries and systems.</p><a className="np-text-link" href="https://www.iqvia.com/solutions/commercialization/data-and-information-management/onekey/onekey-hcp-reference-data">Read the OneKey overview ↗</a></article>
    </div>
    <div className="np-evaluation"><h3>Use the same sample to compare every vendor.</h3><p>Choose a representative set of NPIs. Check specialty matches, current practice locations, affiliations, contact availability, source dates, permitted uses, API limits and total cost for your expected workflow. Coverage and rights vary by product and contract.</p><div className="actions"><Link className="btn primary" href="/contact">Discuss your requirements</Link><Link className="btn" href="/data">Review NPImark data coverage</Link><Link className="btn" href="/pricing">See plans and allowances</Link></div></div>
    <p className="fine">Product descriptions reviewed October 18, 2026 using the vendors’ linked product pages. No comparative pricing or accuracy claim is made. NPImark is not affiliated with or endorsed by Definitive Healthcare or IQVIA.</p>
  </div></section>;
}

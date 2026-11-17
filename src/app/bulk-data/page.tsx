import type { Metadata } from "next";
import Link from "next/link";
import { CtaLink } from "@/components/CtaLink";
import BulkQuoteForm from "@/components/BulkQuoteForm";
import { socialCard } from "@/lib/site";

export const metadata: Metadata = {title: "Buy bulk healthcare data", description: "Request a custom quote for provider, facility, and healthcare business-contact lists. Discuss coverage, licensing, and delivery with NPIMARK.", alternates: {canonical: "/bulk-data"}, openGraph: socialCard("/bulk-data", "Buy bulk healthcare data", "The audience you need, with a scope your team can review.")};
export default async function BulkDataPage({searchParams}: {searchParams: Promise<Record<string,string|string[]|undefined>>}) {
  const params = await searchParams;
  const audience = typeof params.list === "string" ? params.list.replace(/[\x00-\x1f\x7f]/g," ").slice(0,200) : "";
  return <main className="np-company-page"><section className="hero short"><div className="wrap">
    <p className="eyebrow">Custom lists · Bulk licensing</p><h1>The right audience.<br/>At the scale you need.</h1>
    <p className="lede">Buying a larger list or planning a custom data project? Tell us who you want to reach, where they work, and which fields your team needs.</p>
    <div className="actions"><CtaLink event="bulk_data_cta_click" className="btn primary" href="#bulk-request">Request a bulk quote</CtaLink><Link className="btn" href="/lists">Explore available lists</Link></div>
  </div></section><section className="section"><div className="wrap">
    <div className="grid"><article className="card"><h2>Define your audience</h2><p>Specify provider specialties, facilities, health systems, or business roles such as finance, billing, IT, and procurement.</p></article>
    <article className="card"><h2>Review the scope</h2><p>We’ll confirm coverage, available fields, usage rights, and delivery options before quoting. Counts and contact availability depend on your selection.</p></article>
    <article className="card"><h2>Choose your delivery</h2><p>Discuss a file export or API access that fits your workflow. Personal contact fields require an eligible agreement and are not automatically included.</p></article></div>
    <div id="bulk-request"><BulkQuoteForm audience={audience}/></div>
    <p>Prefer to email us? <a href="mailto:sales@npimark.com">sales@npimark.com</a>. Already a customer? <Link href="/app/billing">Review your plan</Link>.</p>
  </div></section></main>;
}

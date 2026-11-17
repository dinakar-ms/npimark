import type { Metadata } from "next";
import Link from "next/link";
import { salesHref, socialCard } from "@/lib/site";
import styles from "./product.module.css";

const title = "Clinician Intelligence for healthcare teams";
export const dynamic = "force-dynamic";
const description = "Explore planned clinician verification, contact identity checks, and healthcare file matching from NPIMARK. Discuss a pilot for your team.";
export const metadata: Metadata = {
  title, description,
  alternates: { canonical: "/products/clinician-intelligence" },
  robots: { index: false, follow: true },
  openGraph: socialCard("/products/clinician-intelligence", title, description),
};

const workflows = [
  { number: "01", name: "Check the person behind the contact", text: "Review whether a contact belongs to the intended clinician before a file leaves your workflow.", items: ["Per-row identity findings and reasons", "Separate same-person, household, different-person and unknown results", "A release decision with unresolved rows held for review"] },
  { number: "02", name: "Bring credentials into one view", text: "Review professional identity and credential evidence without buying contact data.", items: ["NPI status and specialty classification", "Available license status and expiration dates", "Exclusion findings and evidence dates, with gaps made visible"] },
  { number: "03", name: "Make your existing candidate file more useful", text: "Start with an export from your ATS. Match clinicians using professional identifiers and supporting information.", items: ["A match result for each input row", "Eligible contact fields appended only after identity checks", "Matched, unmatched and unusable rows explained separately"] },
];

export default function ClinicianIntelligencePage() {
  const contact = salesHref("Clinician Intelligence pilot inquiry");
  return <main className={styles.page}>
    <section className={styles.hero}>
      <div>
        <p className={styles.kicker}>NPIMARK / Clinician Intelligence</p>
        <span className={styles.status}>In development · Discuss a pilot</span>
        <h1>Know who you’re<br />working with.</h1>
        <p className={styles.lead}>Professional credentials. Contact identity. Clear reasons to trust—or review—a match.</p>
        <p>We’re bringing these checks into a connected workflow for healthcare recruiting, credentialing and data teams.</p>
        <div className={styles.actions}><a className="btn primary lg" href={contact}>Discuss a pilot <span aria-hidden="true">↗</span></a><a className="btn" href="#workflows">Explore the workflows</a></div>
        <p className={styles.small}>These workflows are being developed. Scope, availability and access will be confirmed before any pilot.</p>
      </div>
      <aside className={styles.preview} aria-label="Illustrative review workflow">
        <div className={styles.previewTop}><span>THE REVIEW WORKSPACE</span><span>Illustration</span></div>
        <h2>A match is a starting point.<br />Evidence tells the story.</h2>
        <div className={styles.signal}><span>01 / Professional identity</span><strong>Identifiers + credentials</strong><p>Connect the record to the clinician.</p></div>
        <div className={styles.signal}><span>02 / Contact identity</span><strong>Agreement + uncertainty</strong><p>Show why a contact may belong to that person.</p></div>
        <div className={styles.signal}><span>03 / Delivery review</span><strong>Release or hold</strong><p>Keep unresolved conflicts out of the delivered file.</p></div>
        <p className={styles.small}>Concept preview. No live person or verification result is shown.</p>
      </aside>
    </section>

    <section id="workflows" className={styles.section}>
      <div className={styles.heading}><p className={styles.kicker}>Three connected workflows</p><h2>From a record to a decision you can explain.</h2></div>
      <div className={styles.cards}>{workflows.map(flow => <article className={styles.card} key={flow.number}>
        <span className={styles.number}>{flow.number}</span><p className={styles.small}>Planned capability</p><h3>{flow.name}</h3><p>{flow.text}</p><ul>{flow.items.map(item => <li key={item}>{item}</li>)}</ul>
      </article>)}</div>
    </section>

    <section className={`${styles.section} ${styles.evidence}`}>
      <div><p className={styles.kicker}>Evidence, with its limits</p><h2>See the confidence.<br />Keep the context.</h2><p>The proposed identity workflow combines independent matching signals and preserves their dates and reasons. A name that resembles an email address is supporting evidence—not proof of ownership or deliverability.</p></div>
      <div className={styles.tiers}>
        <article><h3>Two signals agree</h3><p>A stronger match tier, with the evidence retained. Agreement still needs measured accuracy; it is not a guarantee.</p></article>
        <article><h3>One signal supports a match</h3><p>A probable result, carrying its own confidence and review requirements.</p></article>
        <article><h3>Signals conflict or evidence is missing</h3><p>A review or unknown result. The planned delivery gate withholds unresolved conflicts rather than treating them as a pass.</p></article>
      </div>
    </section>

    <section className={styles.section}>
      <div className={styles.heading}><p className={styles.kicker}>Built around your team</p><h2>Choose the evidence your work needs.</h2></div>
      <div className={styles.cards}>
        <article className={styles.card}><h3>Recruiting</h3><p>Evaluate a candidate file, understand match coverage and review eligible contact additions. Start with a file export; a direct ATS integration is not part of the proposed pilot.</p></article>
        <article className={styles.card}><h3>Credentialing</h3><p>Review available professional status and dated findings. The planned verification response excludes contact details and does not replace your credentialing process.</p></article>
        <article className={styles.card}><h3>Data and engineering</h3><p>Plan for consistent verification responses through REST and MCP. The new verification tools are not publicly available; production MCP remains subject to pilot acceptance.</p><Link href="/docs/mcp">Read about the MCP pilot →</Link></article>
      </div>
    </section>

    <section className={styles.section} aria-labelledby="questions"><h2 id="questions">Before you start</h2>
      <div className={styles.faq}>
        <details><summary>Can we use these workflows today?</summary><p>This page describes work in development. Contact us to discuss a pilot and confirm the capabilities available for your use case. It does not activate a service or promise a release date.</p></details>
        <details><summary>Are personal contact fields included?</summary><p>No fields are automatically included. Availability, permitted use and an eligible agreement determine access to personal email, mobile or residential information. The planned credential verification tool returns no contact data.</p></details>
        <details><summary>Will NPIMARK contact candidates for us?</summary><p>No. This product supplies data and review findings. It does not send email, make calls, text candidates or schedule interviews on your behalf.</p></details>
        <details><summary>Does a clean result guarantee eligibility or accuracy?</summary><p>No. Findings reflect the evidence available and its dates. Missing coverage is not a clean result, and identity matching does not establish consent to contact someone. Your team reviews the evidence before acting.</p></details>
      </div>
    </section>

    <section className={styles.cta}><div><p className={styles.kicker}>Start with your use case</p><h2>What would you like to verify?</h2><p>Tell us your workflow, file size and the evidence you need. Please don’t email candidate files or personal records with your inquiry.</p></div><a className="btn primary lg" href={contact}>Discuss a pilot ↗</a></section>
    <p className={styles.small}>Looking for an existing data product? <Link href="/directory">Explore the directory</Link> or <Link href="/bulk-data">request a bulk-data quote</Link>.</p>
  </main>;
}

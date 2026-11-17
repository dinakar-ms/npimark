"use client";
import { useState } from "react";
import { bulkQuoteMailto } from "@/lib/bulkQuote";
import styles from "./HelpExperience.module.css";

export default function BulkQuoteForm({audience}: {audience: string}) {
  const [opened, setOpened] = useState(false);
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const value = (key: string) => String(data.get(key) ?? "");
    window.location.href = bulkQuoteMailto({name:value("name"),email:value("email"),organization:value("organization"),audience:value("audience"),geography:value("geography"),volume:value("volume"),use:value("use")});
    setOpened(true);
  }
  return <form className={styles.panel} onSubmit={submit}>
    <h2>Tell us what you need.</h2><p>We’ll help you define the audience, available fields, and delivery requirements.</p>
    <div className={styles.grid}>
      <div><label htmlFor="bulk-name">Your name</label><input id="bulk-name" name="name" autoComplete="name" required maxLength={120} /></div>
      <div><label htmlFor="bulk-email">Work email</label><input id="bulk-email" name="email" type="email" autoComplete="email" required maxLength={254} /></div>
      <div><label htmlFor="bulk-org">Organization</label><input id="bulk-org" name="organization" autoComplete="organization" required maxLength={160} /></div>
      <div><label htmlFor="bulk-audience">Audience or list</label><input id="bulk-audience" name="audience" defaultValue={audience} required maxLength={200} placeholder="Cardiologists, hospitals, or procurement leaders" /></div>
      <div><label htmlFor="bulk-geography">Geography</label><input id="bulk-geography" name="geography" required maxLength={200} placeholder="Nationwide, selected states, or cities" /></div>
      <div><label htmlFor="bulk-volume">Estimated record count</label><select id="bulk-volume" name="volume"><option>Not sure — please advise</option><option>Under 10,000</option><option>10,000–100,000</option><option>Over 100,000</option></select></div>
    </div>
    <label htmlFor="bulk-use">Intended use, required fields, and delivery format</label><textarea id="bulk-use" name="use" required maxLength={800} rows={4} placeholder="Describe your project. Do not include credentials or private contact records." />
    <p className="fine">This opens a draft in your email app. Review it and press Send there. Nothing is submitted or purchased by completing this form.</p>
    <button className="btn primary" type="submit">Prepare my quote request</button>
    {opened && <p role="status">An email draft was requested. If your email app did not open, email your requirements to <a href="mailto:sales@npimark.com">sales@npimark.com</a>. Your request is sent only when you send that email.</p>}
    <noscript><p>Email your requirements to <a href="mailto:sales@npimark.com">sales@npimark.com</a>.</p></noscript>
  </form>;
}

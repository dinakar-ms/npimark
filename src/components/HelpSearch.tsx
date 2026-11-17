"use client";
import { useState } from "react";
import Link from "next/link";
import { searchHelp } from "@/lib/helpKnowledge";
import styles from "./HelpExperience.module.css";

export default function HelpSearch() {
  const [query, setQuery] = useState("");
  const results = searchHelp(query);
  return <section className={styles.panel} aria-labelledby="help-search-title">
    <p className="eyebrow">NPIMARK Help Center</p>
    <h2 id="help-search-title">What would you like to do?</h2>
    <label htmlFor="help-search">Search how-to answers</label>
    <input id="help-search" type="search" maxLength={1500} value={query} onChange={e => setQuery(e.target.value)} placeholder="Try contact reveals, exports, or API keys" />
    <p className={styles.status} role="status">{results.length} matching answers</p>
    <div className={styles.grid}>{results.map(item => <details key={item.id} className={styles.answer}>
      <summary>{item.question}</summary><p>{item.answer}</p>
      <Link href={`/help/${item.article}`}>Read the full guide →</Link>
      <p className="fine">Content reviewed <time dateTime={item.reviewed}>{item.reviewed}</time></p>
    </details>)}</div>
    {!results.length && <p>No published answer matches yet. Try another phrase or <Link href="/contact">contact support</Link>.</p>}
    <p><Link href="/app/assistant#ask-help">Ask the assistant</Link> after signing in, or browse the guides below.</p>
  </section>;
}

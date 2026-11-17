"use client";
import { useState } from "react";
import Link from "next/link";
import type { HelpAnswer } from "@/lib/helpKnowledge";
import styles from "./HelpExperience.module.css";

export default function HelpChat({enabled}: {enabled: boolean}) {
  const [prompt, setPrompt] = useState("");
  const [answers, setAnswers] = useState<HelpAnswer[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (busy || !enabled) return;
    setBusy(true); setError(""); setAnswers(null);
    try {
      const response = await fetch("/api/app/help-assistant", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({prompt}), signal: AbortSignal.timeout(35000)});
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Help is unavailable.");
      setAnswers(body.answers);
    } catch (error) { setError(error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  }
  return <section id="ask-help" className={styles.panel} aria-labelledby="ask-help-title">
    <p className="eyebrow">Help with NPIMARK</p><h2 id="ask-help-title">A guide for your next step.</h2>
    <p>Ask how to use search, reveals, exports, your account, or API keys. AI finds relevant published answers and links to the full guides.</p>
    <form onSubmit={submit}>
      <label htmlFor="help-prompt">Your how-to question</label>
      <textarea id="help-prompt" rows={3} maxLength={1500} required disabled={busy} value={prompt} onChange={e => {setPrompt(e.target.value); setAnswers(null);}} placeholder="How do I export a list?" aria-describedby="help-privacy" />
      <p id="help-privacy" className="fine">Your question is sent to OpenAI. Do not include passwords, API keys, card numbers, or private contact information. This assistant cannot access your account details or perform actions.</p>
      <button className="btn primary" type="submit" disabled={!enabled || busy || !prompt.trim()}>{busy ? "Finding help…" : "Find an answer"}</button>
    </form>
    {!enabled && <p role="status">AI help is awaiting setup. <Link href="/help">Search the Help Center</Link> now.</p>}
    {error && <p role="alert">{error} <Link href="/help">Browse help</Link>.</p>}
    <div aria-live="polite" aria-busy={busy}>
      {answers?.length === 0 && <p>I couldn’t find a published answer to that question. <Link href="/contact">Contact support</Link> for help.</p>}
      {answers?.map(answer => <article key={answer.id} className={styles.answer}>
        <h3>{answer.question}</h3><p>{answer.answer}</p>
        <Link href={`/help/${answer.article}`}>Source: full help guide →</Link>
      </article>)}
    </div>
  </section>;
}

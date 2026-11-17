"use client";
import { useState } from "react";
import Link from "next/link";
import { CLASSIFICATIONS, US_STATES } from "@/lib/site";
import { planSearchUrl, validatePlan, type AssistantPlan } from "@/lib/assistantPlan";

const examples = ["Find dermatologists in Texas", "Find dentists in Seattle, Washington", "Find family medicine providers in Florida for HubSpot"];
export default function SearchAssistant({enabled}: {enabled: boolean}) {
  const [prompt, setPrompt] = useState("");
  const [plan, setPlan] = useState<AssistantPlan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  let searchUrl = "";
  try { if (plan?.status === "ready") searchUrl = planSearchUrl(plan); } catch { /* Empty edited plans cannot run. */ }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (busy || !enabled) return;
    setBusy(true); setError(""); setPlan(null);
    try {
      const response = await fetch("/api/app/assistant", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({prompt}), signal: AbortSignal.timeout(30000)});
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "The assistant is unavailable.");
      setPlan(validatePlan(result.plan));
    } catch (err) { setError(err instanceof Error ? err.message : "Please try again."); }
    finally { setBusy(false); }
  }
  return <div className="np-ai-grid">
    <section className="np-ai-card">
      <span className="tag">Search assistant · Preview</span>
      <h2>Who would you like to find?</h2>
      <p>Describe a specialty, practice location or provider name. We’ll prepare filters you can check and change.</p>
      <div className="np-ai-examples">{examples.map(example => <button className="btn sm" key={example} type="button" disabled={busy} onClick={() => {setPrompt(example); setPlan(null);}}>{example}</button>)}</div>
      <form onSubmit={submit}>
        <label htmlFor="ai-request">Your search request</label>
        <textarea id="ai-request" value={prompt} maxLength={1500} rows={5} required disabled={busy} onChange={event => {setPrompt(event.target.value); setPlan(null);}} placeholder="Find dermatologists in Texas" aria-describedby="ai-data-note" />
        <p id="ai-data-note" className="fine">Your request is sent to OpenAI. Provider records and revealed contacts are not attached. Do not enter passwords, API keys or private contact information.</p>
        <button className="btn primary" disabled={!enabled || busy || !prompt.trim()}>{busy ? "Preparing your filters…" : "Prepare my search"}</button>
      </form>
      {!enabled && <p className="notice" role="status">AI setup is pending. <Link href="/app/search">Use the search filters</Link> while it is being connected.</p>}
      {error && <p className="notice stop" role="alert">{error}</p>}
    </section>
    <section className="np-ai-card" aria-live="polite" aria-busy={busy}>
      <span className="tag">You’re in control</span><h2>Review before you search</h2>
      {!plan && <><p>Your suggested filters will appear here. No search, reveal, export or delivery is performed by the assistant.</p><ol><li>Describe your audience.</li><li>Review the proposed filters.</li><li>Open the search for live results and counts.</li></ol></>}
      {plan?.status === "clarify" && <p>{plan.clarification}</p>}
      {plan?.status === "ready" && <div className="np-ai-fields">
        <label htmlFor="ai-specialty">Specialty</label><select id="ai-specialty" value={plan.classification} onChange={e => setPlan({...plan, classification:e.target.value})}><option value="">Any specialty</option>{CLASSIFICATIONS.map(v => <option key={v}>{v}</option>)}</select>
        <label htmlFor="ai-state">State</label><select id="ai-state" value={plan.state} onChange={e => setPlan({...plan, state:e.target.value})}><option value="">Any state</option>{US_STATES.map(([code,name]) => <option value={code} key={code}>{name}</option>)}</select>
        <label htmlFor="ai-city">Practice city</label><input id="ai-city" maxLength={120} value={plan.city} onChange={e => setPlan({...plan, city:e.target.value})}/>
        <label htmlFor="ai-name">Provider or organization name</label><input id="ai-name" maxLength={200} value={plan.q} onChange={e => setPlan({...plan, q:e.target.value})}/>
        <p className="fine">Active records only. AI can misunderstand your request; check every filter. Results and availability come from the provider API.</p>
        {plan.destination !== "none" && <p>Preferred destination: <b>{plan.destination}</b>. Nothing has been sent.</p>}
        {searchUrl ? <Link className="btn primary" href={searchUrl}>Review live search results →</Link> : <p>Add at least one search filter.</p>}
      </div>}
    </section>
  </div>;
}

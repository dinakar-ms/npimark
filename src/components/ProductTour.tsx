"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const scenes = [
  { title: "Start with the right specialty.", text: "Search by name, NPI, specialty, or location. Narrow the results to the professional context that matters to your team.", label: "Search", detail: "Cardiology · Boston, MA", example: "Search filters → matching providers" },
  { title: "Understand the professional picture.", text: "Review the practice location and affiliation. If a secondary specialty matched your search, see that match alongside the primary specialty.", label: "Understand", detail: "Primary: Internal Medicine", example: "Matched specialty: Cardiovascular Disease" },
  { title: "Keep your work together.", text: "Sign in to organize your research and return to the profiles relevant to your work. Your account and role determine which actions are available.", label: "Organize", detail: "Your workspace", example: "Search · Lists · Exports · Usage" },
  { title: "Reveal with a clear allowance.", text: "Reveal available contacts using your organization's allowance. Reopening already revealed details in the same month uses no additional reveal units. Newly unlocking premium contact details may use extra units. Access depends on your plan and permissions.", label: "Reveal", detail: "One provider · organization-wide · monthly", example: "Contact fields depend on permissions and plan" },
] as const;

export function ProductTour() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => {
      if (step === scenes.length - 1) { setPlaying(false); setFinished(true); }
      else setStep(step + 1);
    }, 8000);
    return () => clearTimeout(timer);
  }, [playing, step]);
  const scene = scenes[step];
  return (
    <div className="np-tour">
      <div className="np-tour-bar"><strong>NPImark in 32 seconds</strong><span>Silent animated walkthrough</span></div>
      <div className="np-tour-stage">
        <div><span className="eyebrow">0{step + 1} / 04</span><h2>{scene.title}</h2><p>{scene.text}</p></div>
        <div className="np-tour-example" key={step}><span className="eyebrow">Illustrative workflow</span><div className="np-tour-query">{scene.detail}</div><strong>{scene.example}</strong><p>No real contact details are shown in this tour.</p></div>
      </div>
      <div className="np-tour-controls">
        <button className="btn primary" type="button" onClick={() => { if (finished) { setStep(0); setFinished(false); } setPlaying(!playing); }} aria-label={playing ? "Pause tour" : "Play tour"}>{playing ? "Pause" : finished ? "Replay" : "Play tour"}</button>
        <span className="fine">{finished ? 32 : step * 8} / 32 seconds</span>
        {scenes.map((item, i) => <button key={item.label} className={`btn sm ${step === i ? "primary" : ""}`} type="button" aria-pressed={step === i} onClick={() => { setPlaying(false); setFinished(false); setStep(i); }}>{i + 1}. {item.label}</button>)}
      </div>
      <details className="np-tour-transcript"><summary>Read the full tour</summary><ol>{scenes.map(item => <li key={item.label}><strong>{item.title}</strong> {item.text}</li>)}</ol></details>
      <p><Link href="/search" className="btn primary">Try a search</Link> <Link href="/directory" className="btn">Browse the directory</Link></p>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function LogoSvgSmall() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" style={{ width: 20, height: 20 }}>
      <rect x="12" y="23" width="18" height="65" rx="9" fill="#4563ef" />
      <rect x="64" y="23" width="18" height="65" rx="9" fill="#4563ef" />
      <path d="M21 32 73 79" fill="none" stroke="#23c8df" strokeWidth="18" strokeLinecap="round" />
      <circle cx="73" cy="12" r="5.562" fill="#ff8058" />
    </svg>
  );
}

const TOTAL = 32;
const PER = 8;

const SCENES = [
  {
    num: "01 / 04",
    title: "Start with the right specialty.",
    desc: "Search by name, NPI, specialty, or location. Narrow the results to the professional context that matters to your team.",
    art: "s1",
  },
  {
    num: "02 / 04",
    title: "See the professional picture.",
    desc: "Open a record to see specialty, practice location and the organization behind it. Practice location and affiliation are separate facts.",
    art: "s2",
  },
  {
    num: "03 / 04",
    title: "Build a focused list.",
    desc: "Keep the providers that fit, check the row count before you export, and choose the column set your CRM already expects.",
    art: "s3",
  },
  {
    num: "04 / 04",
    title: "Reveal contact details when you need them.",
    desc: "Signed-in customers on an eligible plan reveal available work emails one provider at a time, each with its trust tier and check date.",
    art: "s4",
  },
];

function SceneArt({ art, active }: { art: string; active: boolean }) {
  if (art === "s1") {
    return (
      <div className="scene-art">
        <span className="art-label">Illustrative workflow</span>
        <div className="art-card s1">
          <div className="a-input">
            <i className="ph ph-magnifying-glass" />
            <span className={`typed${active ? "" : ""}`}>Cardiology · Boston, MA</span>
            <span className="caret" />
          </div>
          <div className="a-chips">
            <span>Specialty · Cardiology</span>
            <span>State · MA</span>
            <span>Work email on file</span>
          </div>
          <div className="a-result">
            <b>Search filters → matching providers</b>
            <div className="a-bars"><i /><i /><i /></div>
          </div>
          <p className="a-fine">No real contact details are shown in this tour.</p>
        </div>
      </div>
    );
  }
  if (art === "s2") {
    return (
      <div className="scene-art">
        <span className="art-label">Illustrative workflow</span>
        <div className="art-card s2">
          <div className="a-rec">
            <span className="a-av"><i className="ph-fill ph-stethoscope" /></span>
            <div><b>Cardiovascular Disease Physician</b><span>Boston, MA · NPI •••• •••• ••</span></div>
          </div>
          <div className="a-link" aria-hidden="true" />
          <div className="a-rec org">
            <span className="a-av"><i className="ph-fill ph-buildings" /></span>
            <div><b>Affiliated organization</b><span>Practice location and affiliation are separate facts.</span></div>
          </div>
          <p className="a-fine">No real contact details are shown in this tour.</p>
        </div>
      </div>
    );
  }
  if (art === "s3") {
    return (
      <div className="scene-art">
        <span className="art-label">Illustrative workflow</span>
        <div className="art-card s3">
          <ul className="a-list">
            <li><i className="ph-fill ph-check-square" />Provider A · Cardiology</li>
            <li><i className="ph-fill ph-check-square" />Provider B · Cardiology</li>
            <li><i className="ph-fill ph-check-square" />Provider C · Cardiology</li>
          </ul>
          <div className="a-export">
            <span>Export · HubSpot Contact · CSV</span>
            <b className="a-count">3 rows</b>
          </div>
          <p className="a-fine">No real contact details are shown in this tour.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="scene-art">
      <span className="art-label">Illustrative workflow</span>
      <div className="art-card s4">
        <div className="a-reveal">
          <span className="a-kind">work email</span>
          <span className="a-mask">••••••@••••••.org</span>
          <span className="tag tag-ok a-tier">trusted</span>
        </div>
        <div className="a-reveal dim">
          <span className="a-kind">home address &amp; cell</span>
          <span className="tag tag-lock">contract only</span>
        </div>
        <p className="a-fine">No real contact details are shown in this tour.</p>
      </div>
    </div>
  );
}

export function TourPlayer() {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const tRef = useRef(0);
  const lastRef = useRef(0);
  const rafRef = useRef<number>(0);

  const cur = Math.min(3, Math.floor(t / PER));

  const tick = useCallback((now: number) => {
    const dt = (now - lastRef.current) / 1000;
    lastRef.current = now;
    const next = tRef.current + dt;
    if (next >= TOTAL) {
      tRef.current = TOTAL;
      setT(TOTAL);
      setPlaying(false);
      return;
    }
    tRef.current = next;
    setT(next);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (playing) {
      lastRef.current = performance.now();
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [playing, tick]);

  const handlePlay = () => {
    if (!playing && t >= TOTAL) {
      tRef.current = 0;
      setT(0);
    }
    setPlaying(!playing);
  };

  const handleStep = (i: number) => {
    const next = i * PER;
    tRef.current = next;
    setT(next);
    if (!playing) setPlaying(false);
  };

  const playLabel = playing ? "Pause" : t >= TOTAL ? "Replay tour" : t > 0 ? "Resume tour" : "Play tour";

  return (
    <div className="player" id="player" aria-roledescription="walkthrough">
      <div className="player-bar">
        <span className="player-title"><LogoSvgSmall />NPImark in 32 seconds</span>
        <span className="player-note"><i className="ph ph-speaker-slash" />Silent animated walkthrough</span>
      </div>
      <div className="stage">
        {SCENES.map((scene, i) => (
          <article
            key={i}
            className={`scene${i === cur ? " on" : ""}`}
            data-i={i}
            aria-hidden={i !== cur}
          >
            <div className="scene-copy">
              <span className="scene-num">{scene.num}</span>
              <h2>{scene.title}</h2>
              <p>{scene.desc}</p>
            </div>
            <SceneArt art={scene.art} active={i === cur} />
          </article>
        ))}
        <div className="progress" aria-hidden="true">
          <i style={{ width: `${(t / TOTAL) * 100}%` }} />
        </div>
      </div>
      <div className="controls">
        <button type="button" className="btn-solid" onClick={handlePlay}>
          <i className={playing ? "ph-fill ph-pause" : "ph-fill ph-play"} />
          <span>{playLabel}</span>
        </button>
        <span className="time">{Math.floor(t)} / {TOTAL} seconds</span>
        <div className="step-btns" role="tablist" aria-label="Tour steps">
          {["1. Search", "2. Understand", "3. Organize", "4. Reveal"].map((label, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              className={`step-btn${i === cur ? " on" : ""}`}
              data-i={i}
              aria-selected={i === cur}
              onClick={() => handleStep(i)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

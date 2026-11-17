'use client';
// Full document navigation after launch avoids an old prefetched holding response.
/* eslint-disable @next/next/no-html-link-for-pages */
import { useRef, useState } from 'react';
import type { LaunchReceipt } from '@/lib/launchGate';
import { openPublicSite } from './actions';
import styles from './launch.module.css';

export default function LaunchConsole({ enabled, ready, receipt }: { enabled: boolean; ready: boolean; receipt: LaunchReceipt | null }) {
  const [stage, setStage] = useState<'idle'|'confirm'|'countdown'|'opening'|'live'>(receipt ? 'live' : 'idle');
  const [count, setCount] = useState(5);
  const [error, setError] = useState('');
  const running = useRef(false);
  async function launch() {
    if (running.current) return;
    running.current = true;
    setError('');
    setStage('countdown');
    for (let n = 5; n > 0; n--) {
      setCount(n);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    setStage('opening');
    try {
      const result = await openPublicSite();
      if (!result.ok) { setError(result.message); setStage('idle'); }
      else setStage('live');
    } catch { setError('The connection was interrupted. Refresh to check whether opening completed.'); setStage('idle'); }
    finally { running.current = false; }
  }
  return <main className={styles.stage}>
    <div className={styles.glow} aria-hidden="true" />
    {stage === 'live' && <div className={styles.confetti} aria-hidden="true">{Array.from({length:24},(_,i)=><i key={i} style={{left:`${i*4.2}%`,animationDelay:`${i%5*.12}s`,background:['#23c8df','#4563ef','#ff8058'][i%3]}} />)}</div>}
    <section className={styles.card}>
      <div className={styles.brand}>NPIMARK<span /></div>
      <p className={styles.kicker}>THE NEXT CHAPTER STARTS HERE</p>
      <div aria-live="polite" aria-atomic="true">
        {stage === 'countdown' ? <><h1 className={styles.count}>{count}</h1><p>Opening the doors to healthcare intelligence.</p></> :
          stage === 'opening' ? <><h1>Opening the doors…</h1><p>Confirming public access.</p></> :
          stage === 'live' ? <><h1>We’re live.</h1><p>A clearer view of healthcare.<br />Welcome to NPIMARK.</p></> :
          <><h1>Ready for<br />what’s next?</h1><p>One moment. A new beginning.<br />Open NPIMARK to the world.</p></>}
      </div>
      {stage === 'live' ? <a className={styles.primary} href="/">Explore NPIMARK <span aria-hidden="true">↗</span></a> :
        stage === 'confirm' ? <div><p>Open public access now? This action is recorded and cannot be undone here.</p><button className={styles.primary} onClick={launch}>Start the 5-second countdown</button><button className={styles.secondary} onClick={()=>setStage('idle')}>Not yet</button></div> :
        stage === 'idle' ? <><button className={styles.primary} disabled={!enabled || !ready} onClick={()=>setStage('confirm')}>Launch NPIMARK <span aria-hidden="true">↗</span></button><p className={styles.note}>{!enabled ? 'Launch gate is not enabled. The current public access is unchanged.' : !ready ? 'Waiting for the team’s readiness approval.' : 'Readiness approved by the deployment team.'}</p></> : null}
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <p className={styles.footer}>Healthcare professionals. Organizations. Connections.</p>
    </section>
  </main>;
}

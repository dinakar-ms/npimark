"use client";
import {useState} from 'react';
import Link from 'next/link';
import type {DeliveryRow,DeliveryOutcome,Destination} from '@/lib/delivery';
type Preview={approval:string;label:string;destination:Destination;target:string;total:number;eligible:number;skipped:number;sample:DeliveryRow[];fields:string[]};
type Receipt=DeliveryOutcome&{receipt:string;repeated:boolean};
export type DeliveryOption={destination:Destination;name:string;label:string;configured:boolean};
export default function DeliveryWorkspace({connections,jobs,permitted,available}:{connections:DeliveryOption[];jobs:{id:string;label:string}[];permitted:boolean;available:boolean}){
  const [destination,setDestination]=useState<Destination>('hubspot');
  const [job,setJob]=useState(jobs[0]?.id||'');const [preview,setPreview]=useState<Preview|null>(null);
  const [receipt,setReceipt]=useState<Receipt|null>(null);const [confirmed,setConfirmed]=useState(false);
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  const connection=connections.find(c=>c.destination===destination);
  function reset(){setPreview(null);setReceipt(null);setConfirmed(false);setError('');}
  async function act(action:'prepare'|'send'){
    if(busy)return;setBusy(true);setError('');
    if(action==='prepare'){setPreview(null);setReceipt(null);setConfirmed(false);}
    try{
      const response=await fetch('/api/app/delivery',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,job,destination,approval:preview?.approval,confirm:confirmed}),signal:AbortSignal.timeout(60000)});
      const result=await response.json();if(!response.ok)throw new Error(result.error||'Delivery is unavailable.');
      if(action==='prepare')setPreview(result.preview);else{setReceipt(result.receipt);setConfirmed(false);}
    }catch(e){setError(e instanceof Error?e.message:'Unable to complete the request.');}
    finally{setBusy(false);}
  }
  return <>
    <div className="np-destination-grid">{connections.map(c=><button type="button" className={'np-destination'+(destination===c.destination?' chosen':'')} aria-pressed={destination===c.destination} disabled={busy} key={c.destination} onClick={()=>{setDestination(c.destination);reset();}}><b>{c.name}</b><span>{c.configured?c.label:'Connection setup required'}</span><span className="tag">{c.configured?'Configured · pilot':'Not connected'}</span></button>)}</div>
    {!permitted&&<p className="notice">You need export permission, a verified email and any required two-step verification to deliver records.</p>}
    {!available&&<p className="notice stop">Export history is unavailable. Refresh when the account service is available.</p>}
    <section className="np-delivery-card"><h2>Choose the audience you already exported</h2><p>Use a completed <b>Outreach JSON</b> export with 1–100 records from the last 24 hours. Existing export charges and access rules apply. This step does not reveal additional contacts.</p>
      <label htmlFor="delivery-export">Completed export</label><select id="delivery-export" value={job} disabled={busy} onChange={e=>{setJob(e.target.value);reset();}}><option value="">Choose an export</option>{jobs.map(j=><option key={j.id} value={j.id}>{j.label}</option>)}</select>
      <div className="np-delivery-actions"><button className="btn primary" type="button" disabled={busy||!permitted||!connection?.configured||!job} onClick={()=>act('prepare')}>{busy?'Working…':'Preview delivery'}</button><Link className="btn" href="/app/exports?preset=outreach&format=json">Create an export</Link><Link className="btn" href="/app/exports">Download CSV or Excel</Link></div>
      <p className="fine">Connection credentials are configured by your organization’s administrator. “Configured” does not mean the destination has passed a live connection test.</p>
    </section>
    {error&&<p className="notice stop" role="alert">{error} If a send timed out, repeat the same approved delivery to retrieve its receipt; do not create a new export to retry.</p>}
    {preview&&<section className="np-delivery-card" aria-live="polite"><span className="tag">Review before sending</span><h2>{preview.eligible} records → {preview.label}</h2><p>{preview.total} source records · {preview.skipped} skipped for missing required fields or duplicates.</p><p>Target: <b>{preview.target}</b></p><p>Fields: {preview.fields.join(', ')}. Empty fields are omitted. Home addresses and cell numbers are excluded.</p>
      <div className="np-delivery-table"><table><caption>First {preview.sample.length} eligible records</caption><thead><tr><th>NPI</th><th>Name</th><th>Work email</th><th>Employer</th></tr></thead><tbody>{preview.sample.map(r=><tr key={r.npi}><td>{r.npi}</td><td>{[r.firstName,r.lastName].filter(Boolean).join(' ')||'Not filed'}</td><td>{r.email||'Not included'}</td><td>{r.company||'Not filed'}</td></tr>)}</tbody></table></div>
      <p className="notice">{destination==='hubspot'||destination==='salesforce'?'Matching NPI records may be updated with the fields shown above. Existing destination automations may run.':destination==='instantly'?'Records will be added to the configured list. Existing or blocked leads may be skipped. NPImark does not start a campaign.':'Smartlead must report the campaign as paused or draft immediately before delivery. Keep it paused during import; NPImark does not start it. Another operator could change its status.'}</p>
      {!receipt&&<><label className="np-delivery-confirm"><input type="checkbox" checked={confirmed} disabled={busy} onChange={e=>setConfirmed(e.target.checked)}/> I have reviewed this audience and destination and authorize sending these records.</label><button type="button" className="btn primary" disabled={!confirmed||busy} onClick={()=>act('send')}>{busy?'Submitting…':`Send ${preview.eligible} records to ${connection?.name}`}</button></>}
    </section>}
    {receipt&&<section className="np-delivery-card" role="status"><h2>{receipt.status==='completed'?'Delivery confirmed':receipt.status==='partial'?'Partially delivered':'Delivery needs review'}</h2><p>{receipt.message}</p>{receipt.repeated&&<p>This is an existing attempt. No second send was made.</p>}<p className="fine">Receipt: <code>{receipt.receipt}</code></p><p>Keep this reference when contacting your administrator. Uncertain attempts are not automatically retried.</p></section>}
    <p className="fine">The Trade Desk and LiveRamp require separate partner connections; they are not enabled in this delivery pilot.</p>
  </>;
}

import 'server-only';
import {isAbsolute} from 'node:path';
import {connectionFor,mapExport,deliveryRequest,deliveryOutcome,type Connection,type Destination} from './delivery.ts';
import {digest,signApproval,verifyApproval,deliverOnce} from './deliveryState.ts';
import {getExports,exportFile,type Me} from './session';

export async function boundedJson(response:Response,limit:number):Promise<unknown>{
  const reader=response.body?.getReader();if(!reader)throw new Error('empty_response');
  let bytes=0,text='';const decoder=new TextDecoder();
  try{while(true){const {value,done}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>limit)throw new Error('response_too_large');text+=decoder.decode(value,{stream:true});}return JSON.parse(text+decoder.decode());}
  finally{await reader.cancel().catch(()=>{});}
}
export function deliverySettings(){
  const root=process.env.NPI_DELIVERY_STATE_DIR||'',key=process.env.NPI_DELIVERY_SIGNING_KEY||'';
  if(process.env.NPI_DELIVERIES_ENABLED!=='true'||!isAbsolute(root)||key.length<32)throw new Error('not_configured');
  return {root,key,connections:process.env.NPI_DESTINATION_CONNECTIONS||'{}'};
}
export function canDeliver(me:Me):boolean{return !!me.email_verified_at&&me.permissions.includes('providers.export')&&(!me.org.mfa_required||me.mfa_enabled);}
export async function recentDeliveryJobs(){
  const all=await getExports();const now=Date.now();
  return {available:all!==null,jobs:(all||[]).filter(j=>j.status==='succeeded'&&j.kind==='providers.export'&&j.result?.format==='json'&&j.result?.preset==='outreach'&&j.finished_at&&now-Date.parse(j.finished_at)<86400000).map(j=>({id:j.id,label:`${j.label||'Outreach export'} · ${j.result?.row_count??'?'} records · ${j.id.slice(0,8)}`}))};
}
async function load(me:Me,job:string,destination:string){
  if(!canDeliver(me))throw new Error('forbidden');
  const settings=deliverySettings();const connection=connectionFor(settings.connections,me.org.id,destination);
  if(!connection)throw new Error('not_configured');
  const jobs=await getExports();const record=jobs?.find(j=>j.id===job);
  if(!record||record.kind!=='providers.export'||record.status!=='succeeded'||record.result?.format!=='json'||record.result?.preset!=='outreach')throw new Error('export_unavailable');
  if(!record.finished_at||!Number.isFinite(Date.parse(record.finished_at))||Date.now()-Date.parse(record.finished_at)>86400000)throw new Error('export_stale');
  const file=await exportFile(job);if(!file)throw new Error('export_unavailable');
  const mapped=mapExport(await boundedJson(file,1024*1024),destination as Destination);
  if(!mapped.rows.length)throw new Error('no_eligible_rows');
  return {settings,connection,mapped};
}
export async function prepareDelivery(me:Me,job:string,destination:string){
  const {settings,connection,mapped}=await load(me,job,destination);
  const approval=signApproval({org:me.org.id,user:me.id,job,destination,connection:digest(connection),content:digest(mapped),expires:Date.now()+15*60*1000},settings.key);
  return {approval,label:connection.label,destination,total:mapped.total,eligible:mapped.rows.length,skipped:mapped.skipped,sample:mapped.rows.slice(0,5),target:connection.targetId||connection.instance||'Contacts',fields:destination==='instantly'?['Work email','First name','Last name','Employer']:['NPI','First name','Last name','Work email','Employer','Practice city','Practice state','Specialty']};
}
async function checkSmartlead(connection:Connection){
  if(connection.destination!=='smartlead')return;
  const response=await fetch(`https://server.smartlead.ai/api/v1/campaigns/?api_key=${encodeURIComponent(connection.token)}`,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error('campaign_unavailable');
  const body=await boundedJson(response,1024*1024);
  const campaign=Array.isArray(body)?body.find(c=>String(c?.id)===connection.targetId):null;
  if(!campaign||!['PAUSED','DRAFTED'].includes(campaign.status))throw new Error('campaign_not_paused');
}
export async function sendDelivery(me:Me,job:string,destination:string,approval:string){
  const settings=deliverySettings();const accepted=verifyApproval(approval,settings.key);
  if(accepted.org!==me.org.id||accepted.user!==me.id||accepted.job!==job||accepted.destination!==destination)throw new Error('invalid_approval');
  const {connection,mapped}=await load(me,job,destination);
  if(accepted.connection!==digest(connection)||accepted.content!==digest(mapped))throw new Error('preview_changed');
  await checkSmartlead(connection);
  // Token rotation does not permit repeating the same export to the same destination.
  const identity={org:me.org.id,job,destination,target:connection.targetId||connection.instance||'contacts',property:connection.npiProperty};
  return deliverOnce(settings.root,identity,me.id,async()=>{
    const outbound=deliveryRequest(connection,mapped.rows);
    const response=await fetch(outbound.url,{method:outbound.method,headers:outbound.headers,body:JSON.stringify(outbound.body),cache:'no-store',redirect:'error',signal:AbortSignal.timeout(25000)});
    const body=await boundedJson(response,1024*1024);
    return deliveryOutcome(connection.destination,response.status,body,mapped.rows.length);
  });
}

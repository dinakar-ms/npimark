import {getMe} from '@/lib/session';
import {redirectBase} from '@/lib/redirectBase';
import {UUID,DESTINATIONS,type Destination} from '@/lib/delivery';
import {boundedJson,canDeliver,prepareDelivery,sendDelivery} from '@/lib/deliveryServer';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
const errors:Record<string,string>={
  not_configured:'This destination is awaiting setup by your organization.',
  forbidden:'A verified email, export permission and required two-step verification are needed.',
  export_unavailable:'Choose a recent completed Outreach export in JSON format that your account can access.',
  export_stale:'Create a fresh export. Direct delivery requires an export completed within the last 24 hours.',
  export_size:'Use a file containing 1–100 rows for this delivery pilot.',
  no_eligible_rows:'No records meet this destination’s required fields.',
  export_shape:'This export has an unsupported structure. Create an Outreach JSON export.',
  campaign_not_paused:'Smartlead requires a paused or draft campaign. No records were sent.',
  campaign_unavailable:'The Smartlead campaign could not be checked. No records were sent.',
  preview_changed:'The export or connection changed. Prepare a new preview.',
  invalid_approval:'Prepare a new delivery preview before sending.',
  expired_approval:'This preview expired. Prepare a new one before sending.',
};
export async function POST(request:Request){
  if(request.headers.get('origin')!==new URL(redirectBase(request)).origin||request.headers.get('sec-fetch-site')==='cross-site')return reply({error:'Open this action from your NPImark workspace.'},403);
  if(!request.headers.get('content-type')?.startsWith('application/json'))return reply({error:'Invalid request.'},415);
  const me=await getMe();if(!me)return reply({error:'Sign in to continue.'},401);
  if(!canDeliver(me))return reply({error:errors.forbidden},403);
  let body:Record<string,unknown>;
  try{body=await boundedJson(new Response(request.body),8000) as Record<string,unknown>;}catch{return reply({error:'Invalid or oversized request.'},400);}
  if(!body||typeof body.job!=='string'||!UUID.test(body.job)||typeof body.destination!=='string'||!DESTINATIONS.includes(body.destination as Destination))return reply({error:'Choose an export and destination.'},400);
  try{
    if(body.action==='prepare')return reply({preview:await prepareDelivery(me,body.job,body.destination)});
    if(body.action==='send'&&body.confirm===true&&typeof body.approval==='string')return reply({receipt:await sendDelivery(me,body.job,body.destination,body.approval)});
    return reply({error:'Review and confirm the delivery first.'},400);
  }catch(error){return reply({error:errors[error instanceof Error?error.message:'']||'The delivery could not be completed. Check the destination before trying any other export.'},400);}
}

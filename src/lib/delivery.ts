/** Pure validation and mapping shared by server code and its contract tests. */
export const DESTINATIONS = ['hubspot', 'salesforce', 'smartlead', 'instantly'] as const;
export type Destination = typeof DESTINATIONS[number];
export type Connection = {
  destination: Destination; label: string; token: string;
  npiProperty?: string; instance?: string; apiVersion?: string; targetId?: string;
};
export type DeliveryRow = {npi:string;firstName:string;lastName:string;email:string;company:string;city:string;state:string;specialty:string};
export const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export function connectionFor(raw: string, org: string, destination: string): Connection | null {
  if (!DESTINATIONS.includes(destination as Destination)) return null;
  const config = JSON.parse(raw);
  const v = config?.[org]?.[destination];
  if (!v) return null;
  if (typeof v.token !== 'string' || !v.token.trim() || /[\r\n]/.test(v.token) || typeof v.label !== 'string' || !v.label.trim() || v.label.length>100) throw new Error('connection_invalid');
  const c: Connection = {destination:destination as Destination,label:v.label,token:v.token};
  if (destination === 'hubspot') {
    if (typeof v.npiProperty!=='string' || !/^[a-z][a-z0-9_]{0,99}$/.test(v.npiProperty) || ['email','firstname','lastname','company','city','state','jobtitle'].includes(v.npiProperty)) throw new Error('connection_invalid');
    c.npiProperty=v.npiProperty;
  } else if (destination === 'salesforce') {
    if (typeof v.npiProperty!=='string'|| !/^[A-Za-z][A-Za-z0-9_]{0,90}__c$/.test(v.npiProperty)
      || typeof v.instance!=='string' || !/^https:\/\/[a-z0-9-]+(?:\.sandbox)?\.my\.salesforce\.com$/.test(v.instance)
      || typeof v.apiVersion!=='string' || !/^v\d{2,3}\.0$/.test(v.apiVersion)) throw new Error('connection_invalid');
    c.npiProperty=v.npiProperty;c.instance=v.instance;c.apiVersion=v.apiVersion;
  } else {
    if (typeof v.targetId!=='string' || !(destination==='instantly'?UUID.test(v.targetId):/^[1-9]\d{0,14}$/.test(v.targetId))) throw new Error('connection_invalid');
    c.targetId=v.targetId;
  }
  return c;
}
export function mapExport(value: unknown, destination: Destination): {rows:DeliveryRow[];skipped:number;total:number} {
  if (!Array.isArray(value) || value.length<1 || value.length>100) throw new Error('export_size');
  const rows:DeliveryRow[]=[];const ids=new Set<string>();const emails=new Set<string>();
  for (const v of value) {
    if (!v || typeof v!=='object' || Array.isArray(v)) throw new Error('export_shape');
    const field=(key:string)=> {const text=v[key];if(text==null)return '';if(typeof text!=='string'||text.length>500||/[\x00-\x1f]/.test(text))throw new Error('export_shape');return text.trim();};
    const row:DeliveryRow={npi:field('NPI'),firstName:field('First name'),lastName:field('Last name'),email:field('Email'),company:field('Employer'),city:field('City'),state:field('State'),specialty:field('Specialty')};
    if(!/^\d{10}$/.test(row.npi))throw new Error('export_shape');
    if(row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email))row.email='';
    const emailDestination=destination==='instantly'||destination==='smartlead';
    if(ids.has(row.npi)||(emailDestination&&(!row.email||emails.has(row.email.toLowerCase())))
      ||(destination==='salesforce'&&(!row.lastName||!row.company))
      ||(destination==='hubspot'&&!row.firstName&&!row.lastName&&!row.email))continue;
    ids.add(row.npi);if(row.email)emails.add(row.email.toLowerCase());rows.push(row);
  }
  return {rows,skipped:value.length-rows.length,total:value.length};
}
const nonempty=(value:Record<string,string>)=>Object.fromEntries(Object.entries(value).filter(([,v])=>v!==''));
export function deliveryRequest(c:Connection,rows:DeliveryRow[]):{url:string;method:string;headers:Record<string,string>;body:unknown}{
  if(!rows.length||rows.length>100)throw new Error('export_size');
  const headers={'Content-Type':'application/json',Authorization:`Bearer ${c.token}`};
  if(c.destination==='hubspot')return {url:'https://api.hubapi.com/crm/v3/objects/contacts/batch/upsert',method:'POST',headers,body:{inputs:rows.map(r=>({id:r.npi,idProperty:c.npiProperty,objectWriteTraceId:r.npi,properties:nonempty({[c.npiProperty!]:r.npi,firstname:r.firstName,lastname:r.lastName,email:r.email,company:r.company,city:r.city,state:r.state,jobtitle:r.specialty})}))}};
  if(c.destination==='salesforce')return {url:`${c.instance}/services/data/${c.apiVersion}/composite/sobjects/Lead/${c.npiProperty}`,method:'PATCH',headers,body:{allOrNone:false,records:rows.map(r=>({attributes:{type:'Lead'},...nonempty({[c.npiProperty!]:r.npi,FirstName:r.firstName,LastName:r.lastName,Company:r.company,Email:r.email,City:r.city,State:r.state,Title:r.specialty})}))}};
  if(c.destination==='instantly')return {url:'https://api.instantly.ai/api/v2/leads/add',method:'POST',headers,body:{list_id:c.targetId,skip_if_in_workspace:true,leads:rows.map(r=>nonempty({email:r.email,first_name:r.firstName,last_name:r.lastName,company_name:r.company}))}};
  return {url:`https://server.smartlead.ai/api/v1/campaigns/${c.targetId}/leads?api_key=${encodeURIComponent(c.token)}`,method:'POST',headers:{'Content-Type':'application/json'},body:{lead_list:rows.map(r=>({...nonempty({email:r.email,first_name:r.firstName,last_name:r.lastName,company_name:r.company,location:[r.city,r.state].filter(Boolean).join(', ')}),custom_fields:{npi:r.npi,specialty:r.specialty}})),settings:{ignore_global_block_list:false,ignore_unsubscribe_list:false,ignore_community_bounce_list:false,ignore_duplicate_leads_in_other_campaign:false}}};
}
export type DeliveryOutcome={status:'completed'|'partial'|'needs_review';confirmed:number|null;message:string};
export function deliveryOutcome(destination:Destination,status:number,data:unknown,expected:number):DeliveryOutcome{
  const review:DeliveryOutcome={status:'needs_review',confirmed:null,message:'Check the destination before taking further action. Automatic retry is disabled.'};
  if(status<200||status>=300)return review;
  if(destination==='salesforce'&&Array.isArray(data)&&data.length===expected&&data.every(v=>typeof v?.success==='boolean')){
    const confirmed=data.filter(v=>v.success).length;
    return {status:confirmed===expected?'completed':'partial',confirmed,message:`${confirmed} of ${expected} records confirmed by Salesforce. Review any failures in Salesforce.`};
  }
  if(!data||typeof data!=='object'||Array.isArray(data))return review;
  const v=data as Record<string,unknown>;
  if(destination==='hubspot'&&v.status==='COMPLETE'&&Array.isArray(v.results)&&v.results.every(r=>typeof r?.id==='string')&&v.results.length<=expected){
    const confirmed=v.results.length;
    return {status:confirmed===expected?'completed':'partial',confirmed,message:`${confirmed} of ${expected} records confirmed by HubSpot. Review any failures in HubSpot.`};
  }
  if(destination==='instantly'&&v.status==='success'&&Number.isInteger(v.leads_uploaded)&&Number(v.leads_uploaded)>=0&&Number(v.leads_uploaded)<=expected){
    const confirmed=Number(v.leads_uploaded);
    return {status:confirmed===expected?'completed':'partial',confirmed,message:`${confirmed} of ${expected} records uploaded. Instantly may skip duplicates or blocked records.`};
  }
  // Smartlead's published guide does not promise per-row result fields. Never invent a success count.
  return review;
}

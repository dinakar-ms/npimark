import {createHash,createHmac,timingSafeEqual} from 'node:crypto';
import {mkdir,open,readFile,writeFile,rename} from 'node:fs/promises';
import {join} from 'node:path';
import type {DeliveryOutcome} from './delivery.ts';
export const digest=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export type Approval={org:string;user:string;job:string;destination:string;connection:string;content:string;expires:number};
export function signApproval(payload:Approval,key:string):string{
  if(key.length<32)throw new Error('signing_key_missing');
  const body=Buffer.from(JSON.stringify(payload)).toString('base64url');
  return body+'.'+createHmac('sha256',key).update(body).digest('base64url');
}
export function verifyApproval(token:string,key:string,now=Date.now()):Approval{
  if(key.length<32||token.length>4000)throw new Error('invalid_approval');
  const [body,signature,...rest]=token.split('.');
  if(!body||!signature||rest.length)throw new Error('invalid_approval');
  const expected=createHmac('sha256',key).update(body).digest();const supplied=Buffer.from(signature,'base64url');
  if(expected.length!==supplied.length||!timingSafeEqual(expected,supplied))throw new Error('invalid_approval');
  const payload=JSON.parse(Buffer.from(body,'base64url').toString('utf8'));
  if(!Number.isFinite(payload.expires)||payload.expires<now||payload.expires>now+15*60*1000)throw new Error('expired_approval');
  return payload;
}
/** The lock survives a crash. Never automatically repeat an uncertain external write. */
export async function deliverOnce(root:string,identity:unknown,actor:string,send:()=>Promise<DeliveryOutcome>):Promise<DeliveryOutcome&{receipt:string;repeated:boolean}>{
  const receipt=digest(identity);const dir=join(root,'deliveries');await mkdir(dir,{recursive:true});
  try{
    const lock=await open(join(dir,receipt+'.lock'),'wx');
    try{await lock.writeFile(JSON.stringify({actor,startedAt:new Date().toISOString()}));}finally{await lock.close();}
  }catch(error){
    if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error;
    try{return {...JSON.parse(await readFile(join(dir,receipt+'.json'),'utf8')),receipt,repeated:true};}
    catch{return {status:'needs_review',confirmed:null,message:'This delivery is in progress or its result is uncertain. Check the destination; it has not been sent again.',receipt,repeated:true};}
  }
  let result:DeliveryOutcome;
  try{result=await send();}catch{result={status:'needs_review',confirmed:null,message:'The destination did not return a reliable result. Check it before any further delivery. Automatic retry is disabled.'};}
  try{
    await writeFile(join(dir,receipt+'.tmp'),JSON.stringify({...result,finishedAt:new Date().toISOString()}),{flag:'wx'});
    await rename(join(dir,receipt+'.tmp'),join(dir,receipt+'.json'));
  }catch{result={status:'needs_review',confirmed:null,message:'The delivery receipt could not be saved. Check the destination. This delivery will not be repeated automatically.'};}
  return {...result,receipt,repeated:false};
}

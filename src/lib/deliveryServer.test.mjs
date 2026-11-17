import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mkdtemp,rm} from 'node:fs/promises';
import * as path from 'node:path';
import {tmpdir} from 'node:os';
import vm from 'node:vm';
import ts from 'typescript';
import * as mapping from './delivery.ts';
import * as receipts from './deliveryState.ts';
const job='00000000-0000-0000-0000-000000000001';
const me={id:'user',org:{id:'org',mfa_required:false},mfa_enabled:false,email_verified_at:'2026-01-01',permissions:['providers.export']};
const row={'NPI':'1234567893','First name':'Jane','Last name':'Doe','Email':'jane@example.test','Employer':'Practice','City':'Austin','State':'TX','Specialty':'Dermatology'};
function harness(root,overrides={}){
  const state={calls:[],rows:[row],job:{id:job,kind:'providers.export',status:'succeeded',finished_at:new Date().toISOString(),result:{format:'json',preset:'outreach'}}};
  const connections={org:{hubspot:{label:'CRM',token:'test-only',npiProperty:'npi_id'},smartlead:{label:'Paused campaign',token:'test-only',targetId:'12'}}};
  const env={NPI_DELIVERIES_ENABLED:'true',NPI_DELIVERY_STATE_DIR:root,NPI_DELIVERY_SIGNING_KEY:'x'.repeat(40),NPI_DESTINATION_CONNECTIONS:JSON.stringify(connections)};
  const imports={'server-only':{},'node:path':path,'./delivery.ts':mapping,'./deliveryState.ts':receipts,'./session':{getExports:async()=>[state.job],exportFile:async()=>overrides.denied?null:Response.json(state.rows)}};
  const testModule={exports:{}};
  const code=ts.transpileModule(readFileSync(new URL('./deliveryServer.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(code,{module:testModule,exports:testModule.exports,require:n=>imports[n],process:{env},Response,TextDecoder,AbortSignal,Buffer,Date,fetch:async(url,options)=>{
    state.calls.push({url,options});
    if(url.includes('/campaigns/?'))return Response.json([{id:12,status:overrides.campaignStatus||'PAUSED'}]);
    return Response.json({status:'COMPLETE',results:[{id:'123'}]});
  }});
  return {api:testModule.exports,state};
}
async function fixture(work){const root=await mkdtemp(path.join(tmpdir(),'npim-delivery-service-'));try{await work(root);}finally{await rm(root,{recursive:true,force:true});}}
test('prepare and confirmed send use authorized export, and repeats do not send twice',()=>fixture(async root=>{
  const h=harness(root),p=await h.api.prepareDelivery(me,job,'hubspot');
  assert.equal(h.state.calls.length,0);assert.equal(p.eligible,1);assert.equal(p.token,undefined);
  assert.equal((await h.api.sendDelivery(me,job,'hubspot',p.approval)).status,'completed');
  assert.equal((await h.api.sendDelivery(me,job,'hubspot',p.approval)).repeated,true);assert.equal(h.state.calls.length,1);
}));
test('revoked export permission, MFA requirement and denied download refuse delivery',()=>fixture(async root=>{
  const h=harness(root);
  for(const person of [{...me,permissions:[]},{...me,email_verified_at:null},{...me,org:{...me.org,mfa_required:true}}])await assert.rejects(h.api.prepareDelivery(person,job,'hubspot'));
  await assert.rejects(harness(root,{denied:true}).api.prepareDelivery(me,job,'hubspot'));
  assert.equal(h.state.calls.length,0);
}));
test('another user or organization cannot reuse a preview',()=>fixture(async root=>{
  const h=harness(root),p=await h.api.prepareDelivery(me,job,'hubspot');
  await assert.rejects(h.api.sendDelivery({...me,id:'different'},job,'hubspot',p.approval));
  await assert.rejects(h.api.sendDelivery({...me,org:{...me.org,id:'different'}},job,'hubspot',p.approval));
  assert.equal(h.state.calls.length,0);
}));
test('changed export content, old exports and wrong presets are rejected',()=>fixture(async root=>{
  const h=harness(root),p=await h.api.prepareDelivery(me,job,'hubspot');
  h.state.rows=[{...row,Email:'changed@example.test'}];await assert.rejects(h.api.sendDelivery(me,job,'hubspot',p.approval));
  h.state.job.result.preset='contact';await assert.rejects(h.api.prepareDelivery(me,job,'hubspot'));
  h.state.job.result.preset='outreach';h.state.job.finished_at='2020-01-01';await assert.rejects(h.api.prepareDelivery(me,job,'hubspot'));
  assert.equal(h.state.calls.length,0);
}));
test('Smartlead preflight refuses active campaigns before any write',()=>fixture(async root=>{
  const h=harness(root,{campaignStatus:'ACTIVE'}),p=await h.api.prepareDelivery(me,job,'smartlead');
  await assert.rejects(h.api.sendDelivery(me,job,'smartlead',p.approval));
  assert.equal(h.state.calls.length,1);assert.equal(h.state.calls[0].options.method,undefined);
}));
test('Smartlead paused campaign allows one import without reporting unverified row counts',()=>fixture(async root=>{
  const h=harness(root),p=await h.api.prepareDelivery(me,job,'smartlead');
  const result=await h.api.sendDelivery(me,job,'smartlead',p.approval);
  assert.equal(h.state.calls.length,2);assert.equal(h.state.calls[1].options.method,'POST');
  assert.equal(result.status,'needs_review');assert.equal(result.confirmed,null);
}));

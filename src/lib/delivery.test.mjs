import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {connectionFor,mapExport,deliveryRequest,deliveryOutcome} from './delivery.ts';
import {digest,signApproval,verifyApproval,deliverOnce} from './deliveryState.ts';
const rawRow={'NPI':'1234567893','First name':'Jane','Last name':'Doe','Email':'jane@example.test','Employer':'Clinic','City':'Austin','State':'TX','Specialty':'Dermatology','Cell phone':'PRIVATE','Home address':'PRIVATE'};
const hub={destination:'hubspot',label:'CRM',token:'test-only',npiProperty:'npi_id'};
test('connections are scoped to organization and reject unsafe Salesforce origins',()=>{
  assert.equal(connectionFor(JSON.stringify({a:{hubspot:hub}}),'b','hubspot'),null);
  for(const instance of ['http://tenant.my.salesforce.com','https://tenant.my.salesforce.com.evil.test','https://127.0.0.1','https://tenant.my.salesforce.com/path','https://user@tenant.my.salesforce.com'])assert.throws(()=>connectionFor(JSON.stringify({a:{salesforce:{...hub,npiProperty:'NPI__c',apiVersion:'v68.0',instance}}}),'a','salesforce'));
  assert.throws(()=>connectionFor(JSON.stringify({a:{hubspot:{...hub,npiProperty:'email'}}}),'a','hubspot'));
});
test('mapping strips all unapproved fields and skips missing requirements and duplicates',()=>{
  const mapped=mapExport([rawRow,{...rawRow},{...rawRow,NPI:'1003000126',Email:''}],'instantly');
  assert.equal(mapped.rows.length,1);assert.equal(mapped.skipped,2);assert.ok(!JSON.stringify(mapped).includes('PRIVATE'));
  assert.equal(mapExport([{...rawRow,Employer:''}],'salesforce').rows.length,0);
  assert.throws(()=>mapExport(Array(101).fill(rawRow),'hubspot'));
});
test('all four requests use allowlisted fields and do not enable campaigns or bypass suppression',()=>{
  const rows=mapExport([rawRow],'hubspot').rows;
  const connections=[hub,{...hub,destination:'salesforce',instance:'https://tenant.my.salesforce.com',apiVersion:'v68.0',npiProperty:'NPI__c'},{...hub,destination:'instantly',targetId:'00000000-0000-0000-0000-000000000001'},{...hub,destination:'smartlead',targetId:'12'}];
  for(const c of connections){const r=deliveryRequest(c,rows);assert.ok(!JSON.stringify(r.body).includes('PRIVATE'));assert.ok(!JSON.stringify(r.body).includes('test-only'));}
  const instant=deliveryRequest(connections[2],rows).body;
  assert.equal(instant.campaign_id,undefined);assert.equal(instant.skip_if_in_workspace,true);
  assert.ok(Object.values(deliveryRequest(connections[3],rows).body.settings).every(v=>v===false));
  assert.equal(deliveryRequest(connections[1],rows).body.records[0].NPI__c,rawRow.NPI);
});
test('empty fields do not erase existing destination fields',()=>{
  const r=deliveryRequest(hub,mapExport([{...rawRow,Email:'',Employer:''}],'hubspot').rows);
  assert.equal(r.body.inputs[0].properties.email,undefined);assert.equal(r.body.inputs[0].properties.company,undefined);
});
test('partial and uncertain results are not reported as completed',()=>{
  assert.equal(deliveryOutcome('salesforce',200,[{success:true},{success:false}],2).status,'partial');
  assert.equal(deliveryOutcome('hubspot',207,{status:'PENDING',results:[]},2).status,'needs_review');
  assert.equal(deliveryOutcome('instantly',200,{status:'success',leads_uploaded:1},2).status,'partial');
  assert.equal(deliveryOutcome('smartlead',200,{ok:true},2).confirmed,null);
  assert.equal(deliveryOutcome('hubspot',500,{},2).status,'needs_review');
});
test('approval tokens reject tampering and expiry',()=>{
  const key='x'.repeat(40),now=Date.now();
  const p={org:'a',user:'u',job:'j',destination:'hubspot',connection:'c',content:'d',expires:now+1000};
  const token=signApproval(p,key);assert.equal(verifyApproval(token,key,now).org,'a');
  assert.throws(()=>verifyApproval(token+'x',key,now));assert.throws(()=>verifyApproval(token,key,now+2000));
});
test('concurrent sends create one external attempt and retain a receipt without contact data',async()=>{
  const root=await mkdtemp(join(tmpdir(),'npim-delivery-'));
  try{
    let calls=0;const id={org:'a',job:'j',target:'crm'};
    const send=async()=>{calls++;return {status:'completed',confirmed:1,message:'Confirmed'};};
    await Promise.all(Array.from({length:20},()=>deliverOnce(root,id,'u',send)));
    assert.equal(calls,1);
    const repeat=await deliverOnce(root,id,'u',send);assert.equal(repeat.repeated,true);assert.equal(repeat.confirmed,1);
    assert.ok(!(await readFile(join(root,'deliveries',digest(id)+'.json'),'utf8')).includes(rawRow.Email));
  }finally{await rm(root,{recursive:true,force:true});}
});
test('a network timeout is recorded and cannot trigger an automatic resend',async()=>{
  const root=await mkdtemp(join(tmpdir(),'npim-delivery-'));
  try{
    let calls=0;const send=async()=>{calls++;throw new Error('secret URL must never be exposed');};
    const first=await deliverOnce(root,{job:'j'},'u',send),second=await deliverOnce(root,{job:'j'},'u',send);
    assert.equal(calls,1);assert.equal(first.status,'needs_review');assert.equal(second.repeated,true);assert.ok(!first.message.includes('secret'));
  }finally{await rm(root,{recursive:true,force:true});}
});

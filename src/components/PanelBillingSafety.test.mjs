import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
async function render(file, session, params={}) {
 const source=readFileSync(new URL(file,import.meta.url),'utf8');
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const mod={exports:{}};
 runInNewContext(code,{module:mod,exports:mod.exports,require(name){
  if(name==='next/link')return function TestLink({children,...props}) { return React.createElement('a',props,children); };
  if(name==='next/headers')return {cookies:async()=>({get:()=>undefined})};
  if(name==='@/lib/session')return {getMe:async()=>({org:{name:'Test'},permissions:[]}),getBilling:async()=>null,getPeople:async()=>[],getInvites:async()=>[],getAlerts:async()=>[],getTwoStepPolicy:async()=>null,...session};
  if(name==='@/lib/site')return {salesHref:()=>'/contact'};
  if(name==='@/components/UsagePanel')return {UsagePanel:()=>null};
  return require(name);
 }});
 return renderToStaticMarkup(await mod.exports.default({searchParams:Promise.resolve(params)}));
}
const billing='../app/app/billing/page.tsx', team='../app/app/team/page.tsx';

test('trial checkout requires consent to the displayed renewal price',async()=>{
 const html=await render(billing,{getBilling:async()=>({plan_name:'Free',status:'suspended',active:false,
 payments_enabled:true,can_manage_billing:true,trial_eligible:true,trial_consent_version:'seven-day-card-v1',
 purchasable_plans:[{code:'starter',name:'Starter',price_cents:9900}]})});
 assert.match(html,/seven-day trial with a card required/);
 assert.match(html,/\$99 per month/);
 assert.match(html,/<input(?=[^>]*name="consent_version")(?=[^>]*required)[^>]*>/);
 assert.match(html,/name="quoted_cents" value="9900"/);
 assert.match(html,/Using them up does not start a charge/);
});
test('early upgrade requires an active trial and billing management',async()=>{
 const data={plan_name:'Starter',status:'trialing',active:true,payments_enabled:true,
 can_manage_billing:true,has_billing_account:true,trial_price_cents:9900,trial_ends_at:'2026-11-01T12:15:30Z'};
 const html=await render(billing,{getBilling:async()=>data});
 assert.match(html,/<input(?=[^>]*name="consent")(?=[^>]*required)[^>]*>/);
 assert.match(html,/End trial and pay now/);
 assert.match(html,/UTC/);
 const denied=await render(billing,{getBilling:async()=>({...data,can_manage_billing:false})});
 assert.doesNotMatch(denied,/End trial and pay now/);
});
test('invoice links are hidden from viewers',async()=>{
 const data={plan_name:'Starter',status:'trialing',active:true,payments_enabled:true,
 can_manage_billing:false,has_billing_account:true,trial_invoice_url:'https://invoice.stripe.com/i/test'};
 assert.doesNotMatch(await render(billing,{getBilling:async()=>data}),/invoice.stripe.com/);
});
test('billing failure does not invent a plan, entitlement, or checkout control',async()=>{
 const html=await render(billing,{}, {checkout:'success'});
 assert.match(html,/could not be loaded/);
 assert.doesNotMatch(html,/unmanaged plan|API access:|\/billing\/checkout|confirmed your payment/);
});
test('existing billing account is not evidence that a return-link payment succeeded',async()=>{
 const html=await render(billing,{getBilling:async()=>({plan_name:'Existing',has_billing_account:true,active:true,purchasable_plans:[]})},{checkout:'success'});
 assert.match(html,/does not confirm a payment/);assert.doesNotMatch(html,/confirmed your payment|payment is with Stripe/);
});
test('cancel return does not promise that no payment occurred',async()=>{
 const html=await render(billing,{getBilling:async()=>({plan_name:'Existing',active:true})},{checkout:'cancelled'});
 assert.match(html,/billing history before trying again/);assert.doesNotMatch(html,/Nothing was charged/);
});
test('failed team fetch does not become zero seats',async()=>{
 const html=await render(team,{getPeople:async()=>null,getBilling:async()=>({max_users:3})});
 assert.match(html,/could not be read/);assert.doesNotMatch(html,/0 of 3 seats/);
});
test('viewer is not offered invitation or revoke controls',async()=>{
 const html=await render(team,{getInvites:async()=>[{id:'1',email:'test@example.com',expires_at:'2026-10-25'}]});
 assert.doesNotMatch(html,/Create invitation|Withdraw|action="\/api\/app\/invite"/);
});
test('team admin retains invitation controls',async()=>{
 const html=await render(team,{getMe:async()=>({org:{name:'Test'},permissions:['users.manage']})});
 assert.match(html,/Create invitation/);
});
test('failed invitation fetch is not a confirmed empty invitation list',async()=>{
 const html=await render(team,{getMe:async()=>({org:{name:'Test'},permissions:['users.manage']}),getPeople:async()=>[{id:'1',name:'Admin',email:'test@example.com'}],getInvites:async()=>null,getBilling:async()=>({max_users:3})});
 assert.match(html,/invitation count unavailable/);assert.doesNotMatch(html,/only person on this account/);
});

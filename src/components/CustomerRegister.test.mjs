import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
async function render({permissions=['settings.manage'],data={items:[],total:0,page:1,page_size:25},params={},signedIn=true,onFetch=()=>{}}={}) {
 const source=readFileSync(new URL('../app/app/owner/customers/page.tsx',import.meta.url),'utf8');
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const mod={exports:{}};
 runInNewContext(code,{module:mod,exports:mod.exports,URLSearchParams,require(name){
  if(name==='next/link')return function TestLink({children,...props}) {return React.createElement('a',props,children);};
  if(name==='next/navigation')return {notFound(){throw Error('NOT_FOUND');},redirect(){throw Error('SIGN_IN');}};
  if(name==='@/lib/session')return {getMe:async()=>signedIn?{permissions}:null,getCustomerRegister:async params=>{onFetch(params);return data;}};
  return require(name);
 }});
 return renderToStaticMarkup(await mod.exports.default({searchParams:Promise.resolve(params)}));
}
test('customer admin cannot read the register',async()=>{
 let reads=0;await assert.rejects(render({permissions:['users.manage'],onFetch:()=>reads++}),/NOT_FOUND/);assert.equal(reads,0);
});
test('signed-out visitor cannot read the register',async()=>{await assert.rejects(render({signedIn:false}),/SIGN_IN/);});
test('failed register is not reported as zero customers',async()=>{
 const html=await render({data:null});assert.match(html,/could not be loaded/);assert.doesNotMatch(html,/0 matching/);
});
test('empty successful register reports measured zero',async()=>{
 assert.match(await render(),/0 matching user accounts/);
});
test('customer emails and recorded trial dates render escaped, without estimating dates',async()=>{
 const html=await render({data:{items:[{user_id:'1',name:'<script>alert(1)</script>',email:'owner@example.com',organization:'Example',role:'admin',user_status:'active',signed_up_at:'2026-10-19T12:00:00Z',trial_ends_on:null,last_login_at:null,plan_name:'Growth',subscription_status:'trialing'}],total:26,page:1,page_size:25},params:{q:'Example',segment:'trialing'}});
 assert.match(html,/owner@example.com/);assert.match(html,/Not recorded/);assert.match(html,/Next/);assert.match(html,/segment=trialing/);assert.doesNotMatch(html,/<script>/);
});
test('invalid filters normalize and page is bounded before backend request',async()=>{
 await render({params:{segment:'invalid',page:'999999',q:'x'.repeat(150)},onFetch:params=>{assert.equal(params.get('segment'),'all');assert.equal(params.get('page'),'10000');assert.equal(params.get('q').length,120);}});
});


test('summary separates organizations from users and does not claim revenue',async()=>{
 const html=await render({data:{items:[],total:0,page:1,page_size:25,summary:{organizations:7,users:19,free:2,paid_plan:3,trialing:1,past_due:1,cancelled:0,suspended:0,unassigned:0}}});
 assert.match(html,/Customer overview/);assert.match(html,/Active non-Free organizations/);
 assert.match(html,/>19</);assert.match(html,/Plan assignment is not proof of payment/);
 assert.doesNotMatch(html,/Revenue|MRR/);
});

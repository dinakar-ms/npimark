import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const req=createRequire(import.meta.url);
function loader(signedIn=false, trial=false) {
 const mocks={
  'server-only':{},
  '@/lib/schema':{breadcrumb:()=>({}),publisherRef:()=>({}),websiteRef:()=>({})},
  'next/link':({children,...props})=>React.createElement('a',props,children),
  'next/headers':{cookies:async()=>({get:()=>undefined})},
  '@/lib/session':{getMe:async()=>signedIn?{id:'test'}:null},
  '@/components/Turnstile':()=>null,
  '@/components/JsonLd':{JsonLd:()=>null},
  '@/components/CtaLink':{CtaLink:({children,...props})=>{delete props.event;return React.createElement('a',props,children);}},
  '@/components/ProviderRecord':{ProviderRecord:()=>null},
  '@/lib/site':{SITE_NAME:'NPIMARK',PRODUCT:'Data',siteUrl:p=>'https://example.test'+p,socialCard:()=>({}),salesHref:()=>'/contact'},
 };
 const cache={};
 function load(file) {
  if(cache[file])return cache[file];
  const source=readFileSync(new URL(file,import.meta.url),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={exports:{}};
  runInNewContext(code,{module:mod,exports:mod.exports,process:{env:{NPI_CARD_TRIAL_ENABLED:String(trial)}},require(name){
   if(name in mocks)return mocks[name];
   if(name.endsWith('.module.css'))return new Proxy({}, {get:(_target,key)=>String(key)});
   if(name.startsWith('@/'))return load('../'+name.slice(2)+'.ts');
   if(name.startsWith('./'))return load(file.slice(0,file.lastIndexOf('/')+1)+name.slice(2)+'.ts');
   return req(name);
  }});return cache[file]=mod.exports;
 }
 return load;
}
test('signed-in pricing points to billing for every self-serve paid plan',async()=>{
 const load=loader(true);const html=renderToStaticMarkup(await load('../app/pricing/page.tsx').default());
 for(const code of ['starter','professional','scale'])assert.ok(html.includes(`/app/billing?plan=${code}#upgrade`));
 assert.ok(!html.includes('/app/billing?plan=contact'));
 assert.match(html,/separate user accounts included/);
});
test('anonymous trial pricing preserves plan in signup link',async()=>{
 const html=renderToStaticMarkup(await loader(false,true)('../app/pricing/page.tsx').default());
 assert.ok(html.includes('/sign-up?plan=starter'));
 assert.ok(!html.includes('/sign-up?plan=contact'));
});
test('signup preserves supported selection without collecting card numbers',async()=>{
 const html=renderToStaticMarkup(await loader(false,true)('../app/sign-up/page.tsx').default({searchParams:Promise.resolve({plan:'scale'})}));
 assert.match(html,/<input[^>]*checked=""[^>]*value="scale"/);
 assert.match(html,/securely in Stripe/);
 assert.ok(!html.includes('name="card_number"'));
});

test('signup shows exactly three paid choices while billing is off without promising activation',async()=>{
 const html=renderToStaticMarkup(await loader(false,false)('../app/sign-up/page.tsx').default({searchParams:Promise.resolve({})}));
 assert.equal((html.match(/type="radio"/g)||[]).length,3);
 for(const code of ['starter','professional','scale'])assert.ok(html.includes(`value="${code}"`));
 assert.ok(!html.includes('value="contact"'));
 assert.match(html,/does not charge your card or start a subscription/);
 assert.ok(!html.includes('checked=""'));
});
test('plan navigation rejects unknown, Free, contract, arrays and external URL values',()=>{
 const choose=loader()('../lib/selectedPlan.ts').selectedPlan;
 for(const bad of ['free','contact','https://evil.test','//evil.test','missing',['starter'],null])assert.equal(choose(bad),null);
 assert.equal(choose('starter'),'starter');
});

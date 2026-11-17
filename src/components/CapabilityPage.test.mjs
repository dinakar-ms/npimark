import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
function load(relative, mocks={}) {
  const source=readFileSync(new URL(relative,import.meta.url),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  const mod={exports:{}};
  runInNewContext(code,{module:mod,exports:mod.exports,require:name=>Object.hasOwn(mocks,name)?mocks[name]:require(name),process,Response});
  return mod.exports;
}
const {CAPABILITIES}=load('../content/capabilities.ts');
const page=load('./CapabilityPage.tsx',{
  '@/content/capabilities':{CAPABILITIES},
  'next/link':({children,...props})=>React.createElement('a',props,children),
  '@/components/JsonLd':load('./JsonLd.tsx'),
  '@/lib/site':{siteUrl:p=>'https://npimark.com'+p,socialCard:(url,title,description)=>({url,title,description})},
  './CapabilityPage.module.css':{},
});
for(const [key,value] of Object.entries(CAPABILITIES)) test(`${key}: renders accessible content, actual CTAs and matching metadata`,()=>{
  const html=renderToStaticMarkup(React.createElement(page.CapabilityPage,{name:key}));
  assert.equal((html.match(/<h1>/g)||[]).length,1);
  assert.ok(html.includes(value.primary[1]));
  assert.ok(html.includes(value.secondary[1]));
  assert.equal((html.match(/<details>/g)||[]).length,3);
  const metadata=page.capabilityMetadata(key);
  assert.equal(metadata.alternates.canonical,value.path);
  assert.equal(metadata.description,value.description);
  const structured=JSON.parse(html.match(/application\/ld\+json">([^<]+)<\/script>/)[1]);
  assert.equal(structured.url,'https://npimark.com'+value.path);
  assert.equal(structured['@type'],'WebPage'); // Not a fictitious downloadable product.
});
test('unreleased capabilities have visible limits, not installation or download promises',()=>{
  // The PBM status used to read 'not currently offered', which covered both the formulary and
  // the PBM relationship graph. Plan formulary coverage is now held, so that phrase became
  // false; the limit that still holds - and the one this page exists to state - is that there
  // is no PBM relationship or rebate data. Asserted on that, not on the old wording.
  assert.match(CAPABILITIES.pbm.status,/no PBM relationship data/i);
  // And no row may claim the PBM side is available, however the status is phrased.
  const pbmRows=CAPABILITIES.pbm.rows.map(([k,v])=>`${k} ${v}`).join(' ');
  assert.match(pbmRows,/PBM relationships and rebates/);
  assert.match(pbmRows,/Not held/);
  assert.match(CAPABILITIES.mobile.status,/no public app-store release/);
  assert.match(CAPABILITIES.mcp.status,/availability/);
  for(const p of Object.values(CAPABILITIES)) {
    assert.doesNotMatch(JSON.stringify(p),/apps\.apple\.com|play\.google\.com|npi_live_/);
  }
});
test('robots defaults closed, permits public crawl only when enabled and protects launch route',async()=>{
  const saved=process.env.SITE_INDEXABLE;
  try {
    const {default:robots}=load('../app/robots.ts',{'next/server':{connection:async()=>{}}});
    delete process.env.SITE_INDEXABLE;
    assert.equal((await robots()).rules[0].disallow,'/');
    process.env.SITE_INDEXABLE='true';
    const r=await robots();
    // Looked up by agent, not by index: the file carries a second group for the crawlers that
    // walk the provider profiles, and a positional assertion silently checks the wrong rule.
    const all=r.rules.find(g=>g.userAgent==='*');
    assert.ok(all,'there is a rule for every agent');
    assert.equal(all.allow,'/');
    for(const path of ['/launch-control','/app','/api/','/reset-password']) assert.ok(all.disallow.includes(path));
    const paced=r.rules.find(g=>Array.isArray(g.userAgent)&&g.userAgent.includes('ClaudeBot'));
    assert.ok(paced,'the heaviest crawlers are given a pace');
    assert.ok(paced.crawlDelay>0,'and that pace is a delay');
  } finally {if(saved===undefined) delete process.env.SITE_INDEXABLE; else process.env.SITE_INDEXABLE=saved;}
});

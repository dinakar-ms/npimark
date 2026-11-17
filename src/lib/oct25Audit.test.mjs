import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const require = createRequire(import.meta.url);
function load(path, env = {}, mocks = {}) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  }}).outputText;
  const mod = {exports: {}};
  runInNewContext(code, {module: mod, exports: mod.exports, process: {env}, URL,
    require: name => Object.hasOwn(mocks,name) ? mocks[name] : require(name)});
  return mod.exports;
}
test('CI without a site origin emits absolute public URLs, never localhost', () => {
  const {siteUrl} = load('./site.ts');
  assert.equal(siteUrl('/pricing'), 'https://npimark.com/pricing');
  assert.equal(siteUrl('/#org'), 'https://npimark.com/#org');
  assert.equal(load('./site.ts', {SITE_BASE_URL:'https://stg.npimark.com/'}).siteUrl('/help'), 'https://stg.npimark.com/help');
});
test('named crawlers get every wildcard exclusion, including token paths', async () => {
  const {default: robots} = load('../app/robots.ts', {SITE_INDEXABLE:'true', SITE_BASE_URL:'https://npimark.com'}, {'next/server': {connection:async()=>{}}});
  const result = await robots();
  assert.deepEqual([...result.rules[0].disallow], [...result.rules[1].disallow]);
  for (const p of ['/reset-password','/verify-email','/invite/','/launch-control']) assert.ok(result.rules[1].disallow.includes(p));
  assert.equal(result.rules[1].crawlDelay, 10);
});
test('staging remains closed to all crawlers', async () => {
  const {default: robots} = load('../app/robots.ts', {}, {'next/server': {connection:async()=>{}}});
  const result = await robots();
  assert.equal(result.rules.length,1);
  assert.equal(result.rules[0].disallow,'/');
});
test('unapproved legal documents retain draft status without exposing counsel notes', () => {
  const {LegalDocument} = load('../components/LegalDocument.tsx', {}, {
    './LegalDocument.module.css':{document:'legal-document'},
    'next/link':({children,...props})=>React.createElement('a',props,children),
    '@/content/legal/removal': {TARGET_DAYS:30},
    '@/content/legal/version': {TERMS_VERSION:'test', legalPagesApproved:()=>false, privacyEmail:()=>null, supportEmail:()=>null},
  });
  const html=renderToStaticMarkup(React.createElement(LegalDocument,{eyebrow:'Legal',doc:{title:'Terms',summary:'Public summary [LAWYER: secret summary]',sections:[{id:'one',heading:'Scope',blocks:['Public wording [LAWYER: internal fact]','[LAWYER: entire internal block]',['Public item','[LAWYER: hidden list item]']]}]}}));
  assert.match(html,/Draft - under legal review/);
  assert.match(html,/Public wording/);
  assert.doesNotMatch(html,/LAWYER|secret summary|internal fact|internal block|hidden list item|lawyer-note/);
});
test('phone navigation renders working native links before hydration', () => {
  const {NavLinks} = load('../components/NavLinks.tsx', {}, {
    'next/link':({children,...props})=>React.createElement('a',props,children),
    'next/navigation':{usePathname:()=>'/pricing'},
    '@/lib/site':{NAV:[{href:'/search',label:'Search'},{href:'/pricing',label:'Pricing'}]},
    '@/components/AccountActions':{AccountActions:({className})=>React.createElement('div',{className},React.createElement('a',{href:'/sign-in'},'Sign in'),React.createElement('a',{href:'/sign-up'},'Get started'))},
  });
  const html=renderToStaticMarkup(React.createElement(NavLinks));
  assert.match(html,/<details class="nav-fallback">/);
  assert.match(html,/<summary>Menu<\/summary>/);
  assert.match(html,/aria-label="Mobile navigation"/);
});
test('dynamic directory previews describe the page, with a complete share image', () => {
  const site=load('./site.ts');
  const {completeSocialMetadata}=load('./socialMetadata.ts',{}, {'./site':site});
  const result=completeSocialMetadata({title:'Hospitals in Texas',description:'Texas hospital directory.',alternates:{canonical:'/hospitals/tx'}});
  assert.equal(result.openGraph.url,'https://npimark.com/hospitals/tx');
  assert.equal(result.openGraph.title,'Hospitals in Texas');
  assert.equal(result.twitter.title,'Hospitals in Texas');
  assert.equal(result.openGraph.images[0].url,'https://npimark.com/opengraph-image');
});
test('profile metadata keeps its type and gains the missing image', () => {
  const {completeSocialMetadata}=load('./socialMetadata.ts',{}, {'./site':load('./site.ts')});
  const result=completeSocialMetadata({title:'Example provider',alternates:{canonical:'/npi/123'},openGraph:{type:'profile'}});
  assert.equal(result.openGraph.type,'profile');
  assert.ok(result.twitter.images.length);
});
test('recovery metadata does not acquire an invented canonical or social URL', () => {
  const {completeSocialMetadata}=load('./socialMetadata.ts',{}, {'./site':load('./site.ts')});
  const metadata={title:'Temporarily unavailable',robots:{index:false}};
  assert.equal(completeSocialMetadata(metadata),metadata);
});

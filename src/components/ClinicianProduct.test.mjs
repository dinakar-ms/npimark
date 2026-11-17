import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const req=createRequire(import.meta.url);
const source=readFileSync(new URL('../app/products/clinician-intelligence/page.tsx',import.meta.url),'utf8');
const mod={exports:{}};
runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,{module:mod,exports:mod.exports,require(name){
 if(name==='next/link')return function Link({children,...props}){return React.createElement('a',props,children);};
 if(name==='@/lib/site')return {salesHref:subject=>'mailto:sales@npimark.com?subject='+encodeURIComponent(subject),socialCard:()=>({})};
 if(name.endsWith('.module.css'))return {__esModule:true,default:new Proxy({},{get:(_,key)=>String(key)})};
 return req(name);
}});
const html=renderToStaticMarkup(React.createElement(mod.exports.default));
test('development product preview never claims general availability or exposes customer audit data',()=>{
 assert.equal(mod.exports.metadata.robots.index,false);
 assert.match(html,/In development/);
 assert.match(html,/Concept preview/);
 assert.match(html,/does not send email/);
 assert.match(html,/verification tool returns no contact data/);
 for(const term of ['ChenMed','Hippo','36,897','97.7%','IndividualId','DATA_ROOT','Take2'])assert.ok(!html.includes(term),term);
 assert.equal((html.match(/Planned capability/g)||[]).length,3);
 assert.ok(!/<form|type="file"/.test(html));
});
test('pilot links go to the approved sales mailbox without personal data',()=>{
 assert.equal((html.match(/mailto:sales@npimark.com/g)||[]).length,2);
 assert.match(html,/href="#workflows"/);
 assert.match(html,/href="\/bulk-data"/);
});
if(process.env.PRODUCT_PREVIEW_PATH){
 const css=readFileSync(new URL('../app/products/clinician-intelligence/product.module.css',import.meta.url),'utf8');
 writeFileSync(process.env.PRODUCT_PREVIEW_PATH,'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NPIMARK Clinician Intelligence — design preview</title><style>body{margin:0;font-family:Arial,sans-serif}*{box-sizing:border-box}a{color:#086858}.btn{display:inline-block;padding:14px 20px;border:1px solid #b6c9bf;border-radius:9px;text-decoration:none;font-weight:600}.primary{background:#184d3b;color:white}'+css+'</style></head><body>'+html+'</body></html>','utf8');
}

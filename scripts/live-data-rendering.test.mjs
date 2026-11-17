import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {auditLiveData} from './live-data-rendering.mjs';
const api='import { count } from "@/lib/api";\n';
function audit(files,floor=1){
 const root=mkdtempSync(join(tmpdir(),'npi-render-'));
 try{for(const [file,code] of Object.entries(files)){mkdirSync(dirname(join(root,file)),{recursive:true});writeFileSync(join(root,file),code);}
 return auditLiveData(root,floor);
 }finally{rmSync(root,{recursive:true,force:true});}
}
test('the old homepage fails even with ISR and a connection comment',()=>{
 assert.equal(audit({'page.tsx':api+'// await connection()\nexport const revalidate=3600; export default async function Page(){return count();}'}).errors.length,1);
});
test('a leading awaited connection imported under an alias passes',()=>{
 assert.equal(audit({'page.tsx':api+'import {connection as request} from "next/server";export default async function Page(){await request();return count();}'}).errors.length,0);
});
test('unused imports and late conditional or unawaited boundaries fail',()=>{
 for(const body of ['return count();','connection();return count();','if(true)await connection();return count();','const result=await count();await connection();return result;'])
 assert.equal(audit({'page.tsx':api+'import {connection} from "next/server";export default async function Page(){'+body+'}'}).errors.length,1);
});
test('dynamic segment passes until a page or ancestor supplies static params',()=>{
 const page=api+'export default async function Page(){return count();}';
 assert.equal(audit({'facility/[slug]/page.tsx':page}).errors.length,0);
 for(const extra of [{'facility/[slug]/page.tsx':page+'export function generateStaticParams(){return []}'},{'facility/[slug]/page.tsx':page,'facility/layout.tsx':'export {generateStaticParams} from "./params";'}])
 assert.equal(audit(extra).errors.length,1);
});
test('reading searchParams passes but merely declaring it does not',()=>{
 assert.equal(audit({'page.tsx':api+'export default async function Page({searchParams}){const values=readValues(await searchParams);return count(values);}'}).errors.length,0);
 assert.equal(audit({'page.tsx':api+'export default async function Page({searchParams}){return count();}'}).errors.length,1);
 for(const expr of ['async()=>await searchParams','false && await searchParams','true ? {} : await searchParams'])
 assert.equal(audit({'page.tsx':api+'export default async function Page({searchParams}){const ignored='+expr+';return count();}'}).errors.length,1);
});
test('static forcing in an ancestor fails and dynamic forcing passes',()=>{
 const page=api+'export default async function Page(){return count();}';
 assert.equal(audit({'[slug]/page.tsx':page,'layout.tsx':'export const dynamic="force-static"'}).errors.length,1);
 assert.equal(audit({'page.tsx':page,'layout.tsx':'export const dynamic="force-dynamic"'}).errors.length,0);
});
test('floor assertion catches a broken discovery pattern and type-only imports do not count',()=>{
 const result=audit({'page.tsx':'import type {Provider} from "@/lib/api"; export default function Page(){return null;}'});
 assert.equal(result.inspected.length,0);assert.match(result.errors[0],/expected at least 1/);
});
test('relative imports and JavaScript pages are inspected',()=>{
 assert.equal(audit({'page.jsx':'import {count} from "../lib/api";export default function Page(){return count();}'}).inspected.length,1);
});
test('a searchParams await after another initializer or argument does not protect a fetch',()=>{
 for(const body of ['const result=count(), values=await searchParams;','const values=readValues(count(),await searchParams);','const values=(count(),await searchParams);'])
 assert.equal(audit({'page.tsx':api+'export default async function Page({searchParams}){'+body+'return null;}'}).errors.length,1);
});
test('an unparseable source fails rather than passing by discovery alone',()=>{
 const result=audit({'page.tsx':api+'export default async function Page( { '});
 assert.ok(result.errors.some(e=>e.includes('syntax could not be parsed')));
});

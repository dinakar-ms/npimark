import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as filters from './searchFilters.ts';
import * as selection from './selectionQuery.ts';
const presetModule={exports:{}};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('./exportPresets.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:presetModule,exports:presetModule.exports,require:()=>({NO_VOLUME_IN_A_FILE:'',ONE_IN_WORDS:''})});
const presets=presetModule.exports;
function harness(result={ok:true}){
 const calls=[];const testModule={exports:{}};
 const imports={'next/server':{NextResponse:{redirect:(url,status)=>new Response(null,{status,headers:{location:String(url)}})}},'@/lib/searchFilters':filters,'@/lib/exportPresets':presets,'@/lib/selectionQuery':selection,'@/lib/redirectBase':{redirectBase:()=> 'https://npimark.test'},'@/lib/session':{startExport:async(...args)=>{calls.push(args);return result;}}};
 const source=readFileSync(new URL('../app/api/app/export/route.ts',import.meta.url),'utf8');
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:testModule,exports:testModule.exports,require:n=>imports[n],URL});
 return {calls,post:entries=>testModule.exports.POST(new Request('https://npimark.test/api/app/export',{method:'POST',body:new URLSearchParams(entries)}))};
}
test('export rejects invalid, empty and oversized machine selections before queueing',async()=>{
 for(const entries of [[['npi','bad']],[['npis','']],[['npi','1234567893'],['npi','bad']],Array.from({length:501},(_,i)=>['npi',String(1000000000+i)])]){
  const h=harness(),r=await h.post(entries);assert.equal(h.calls.length,0);assert.match(r.headers.get('location'),/error=validation_error/);
 }
});
test('export legacy selection preserves exact IDs plus all other search filters',async()=>{
 const h=harness(),r=await h.post([['npis','1234567893,1003000126'],['state','TX'],['city','Austin'],['preset','outreach'],['format','json']]);
 assert.equal(r.status,303);assert.equal(h.calls.length,1);assert.deepEqual(h.calls[0][0].npi,['1234567893','1003000126']);assert.equal(h.calls[0][0].city,'Austin');assert.equal(h.calls[0][0].state,'TX');assert.equal(h.calls[0][1],'outreach');assert.equal(h.calls[0][2],'json');
});
test('empty-result pasted selection cannot become an unrestricted export',async()=>{
 const h=harness();await h.post([['npi_list','NPI\ninvalid']]);assert.equal(h.calls.length,0);
 const good=harness();await good.post([['npi_list','NPI\n1234567893']]);assert.deepEqual(good.calls[0][0].npi,['1234567893']);
});
test('ordinary filtered export remains available; upstream denial never reports queued',async()=>{
 const h=harness({ok:false,code:'quota_exceeded'}),r=await h.post([['state','TX'],['return_to','https://evil.test/']]);
 assert.equal(h.calls.length,1);assert.equal(h.calls[0][0].state,'TX');assert.equal(r.headers.get('location'),'https://npimark.test/app/exports?error=quota_exceeded');
});

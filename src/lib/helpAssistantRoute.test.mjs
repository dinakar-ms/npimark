import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {readHelpPrompt, HelpRequestError} from './boundedHelpRequest.ts';
const source=readFileSync(new URL('../app/api/app/help-assistant/route.ts',import.meta.url),'utf8');
function harness(overrides={}){
  const state={calls:0,reservations:0};
  const me={id:'user',org:{id:'org',mfa_required:false},mfa_enabled:false,email_verified_at:'2026-10-25T00:00:00Z'};
  const env={OPENAI_API_KEY:'test-only',NPI_AI_MODEL:'configured-model',NPI_HELP_AI_ENABLED:'true',NPI_AI_STATE_DIR:'/unused',...overrides.env};
  const imports={
    '@/lib/boundedHelpRequest':{readHelpPrompt, HelpRequestError},
    '@/lib/session':{getMe:async()=>Object.hasOwn(overrides,'me')?overrides.me:me},
    '@/lib/helpAssistant':{answerHelp:async()=>{state.calls++;return [];}},
    '@/lib/assistantBudget':{reserveAssistantCall:async()=>{state.reservations++;return overrides.budget??true;}},
    '@/lib/redirectBase':{redirectBase:()=> 'https://npimark.test'},
  };
  const testModule={exports:{}};
  vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,
    {exports:testModule.exports,module:testModule,require:name=>imports[name],process:{env},URL,Response,TextDecoder});
  const request=(headers={},body=JSON.stringify({prompt:'Find dentists in Texas'}))=>new Request('https://npimark.test/api/app/assistant',{method:'POST',headers:{origin:'https://npimark.test','content-type':'application/json',...headers},body});
  return {post:testModule.exports.POST,request,state};
}
test('assistant rejects cross-origin requests before session/model work',async()=>{
  const h=harness();const r=await h.post(h.request({origin:'https://evil.test'}));
  assert.equal(r.status,403);assert.equal(h.state.calls,0);assert.equal(h.state.reservations,0);
});
test('assistant requires session and organization MFA',async()=>{
  for(const me of [null,{org:{mfa_required:true},mfa_enabled:false}]){
    const h=harness({me});assert.ok([401,403].includes((await h.post(h.request())).status));assert.equal(h.state.calls,0);
  }
});
test('assistant fails closed when unconfigured or over budget',async()=>{
  for(const [options,status] of [[{env:{NPI_HELP_AI_ENABLED:'false'}},503],[{budget:false},429]]){
    const h=harness(options);assert.equal((await h.post(h.request())).status,status);assert.equal(h.state.calls,0);
  }
});
test('assistant bounds request bytes and prompt characters before calling model',async()=>{
  for(const [body,status] of [[JSON.stringify({prompt:'a'.repeat(1600)}),400],['a'.repeat(9000),413]]){
    const h=harness();assert.equal((await h.post(h.request({},body))).status,status);assert.equal(h.state.calls,0);assert.equal(h.state.reservations,0);
  }
});
test('assistant success is private and spends exactly one model reservation',async()=>{
  const h=harness(),r=await h.post(h.request());assert.equal(r.status,200);
  assert.equal(r.headers.get('cache-control'),'private, no-store');assert.equal(h.state.calls,1);assert.equal(h.state.reservations,1);
});


test('invalid JSON is a client error and spends no AI allowance',async()=>{
 const h=harness(); const r=await h.post(h.request({},'{'));
 assert.equal(r.status,400);assert.equal(h.state.reservations,0);assert.equal(h.state.calls,0);
});
test('lookalike content types are refused',async()=>{
 const h=harness();const r=await h.post(h.request({'content-type':'application/json-fake'}));
 assert.equal(r.status,415);assert.equal(h.state.calls,0);
});

test('unverified accounts cannot consume AI allowance',async()=>{
 const h=harness({me:{org:{id:'org',mfa_required:false},mfa_enabled:false,email_verified_at:null}});
 assert.equal((await h.post(h.request())).status,403);assert.equal(h.state.reservations,0);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validatePlan, planSearchUrl, preparePlan } from './assistantPlan.ts';
import { reserveAssistantCall } from './assistantBudget.ts';

const plan = {status:'ready',clarification:'',classification:'Dermatology',state:'TX',city:'',q:'',destination:'none'};
test('plans produce only local search links with supported filters', () => {
  assert.equal(planSearchUrl(plan), '/app/search?status=active&classification=Dermatology&state=TX');
  const link = planSearchUrl({...plan,q:'A & B?reveal=true'});
  assert.equal(new URL(link,'https://example.test').searchParams.get('reveal'), null);
});
test('invalid or widened model plans are rejected rather than silently dropping constraints', () => {
  for (const change of [{state:'XX'}, {classification:'Made up'}, {destination:'https://evil.test'}, {reveal:true}, {city:'<script>'}, {q:'a'.repeat(201)}]) {
    assert.throws(() => validatePlan({...plan,...change}), /invalid_plan/);
  }
  assert.throws(() => validatePlan({...plan,classification:'',state:''}));
  assert.throws(() => planSearchUrl({...plan,status:'clarify',clarification:'Which state?'}));
});
test('model transport has no action tools or provider records and uses strict output', async () => {
  let calls = 0;
  const result = await preparePlan('Find dermatologists in Texas',{key:'test-key',model:'configured-model'},async (url,init) => {
    calls++;
    assert.equal(url,'https://api.openai.com/v1/responses');
    const body = JSON.parse(init.body);
    assert.equal(body.store,false);
    assert.equal(body.tools,undefined);
    assert.equal(body.text.format.strict,true);
    assert.equal(body.model,'configured-model');
    assert.deepEqual(body.input,[{role:'user',content:'Find dermatologists in Texas'}]);
    return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(plan)}]}]});
  });
  assert.deepEqual(result,plan); assert.equal(calls,1);
});
test('refusals, partial responses and malformed output never become runnable plans', async () => {
  for (const response of [
    {status:'incomplete',output:[]},
    {status:'completed',output:[{content:[{type:'refusal'}]}]},
    {status:'completed',output:[{content:[{type:'output_text',text:'not json'}]}]},
  ]) await assert.rejects(preparePlan('Search',{key:'x',model:'x'},async () => Response.json(response)));
});
test('concurrent requests share the organization budget; other organizations are separate', async () => {
  const root = await mkdtemp(join(tmpdir(),'npimark-ai-test-'));
  try {
    const now = new Date('2026-10-18T12:00:00Z');
    const results = await Promise.all(Array.from({length:30},()=>reserveAssistantCall(root,'org-a',now)));
    assert.equal(results.filter(Boolean).length,20);
    assert.equal(await reserveAssistantCall(root,'org-b',now),true);
    assert.equal(await reserveAssistantCall(root,'org-a',new Date('2026-10-19T00:00:00Z')),true);
  } finally { await rm(root,{recursive:true,force:true}); }
});

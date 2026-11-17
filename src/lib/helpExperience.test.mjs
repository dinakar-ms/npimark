import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {HELP_ANSWERS, searchHelp} from './helpKnowledge.ts';
import {selectedAnswers, answerHelp} from './helpAssistant.ts';
import {readHelpPrompt} from './boundedHelpRequest.ts';
import {bulkQuoteMailto} from './bulkQuote.ts';

test('knowledge answers cite real public guides, with unique stable IDs',()=>{
  assert.equal(new Set(HELP_ANSWERS.map(a=>a.id)).size,HELP_ANSWERS.length);
  for(const a of HELP_ANSWERS) {
    assert.match(a.article,/^[a-z-]+$/);
    assert.ok(existsSync(new URL(`../app/help/${a.article}/page.tsx`,import.meta.url)));
    assert.match(a.reviewed,/^\d{4}-\d{2}-\d{2}$/);
  }
});
test('help search recognizes user vocabulary and has an honest empty state',()=>{
  assert.equal(searchHelp('download csv')[0].id,'export');
  assert.equal(searchHelp('api keys')[0].id,'keys');
  assert.equal(searchHelp('zzzzzzunmatched').length,0);
  assert.equal(searchHelp('').length,HELP_ANSWERS.length);
});
test('model cannot inject prose, URLs, unknown IDs or duplicate answers',()=>{
  for(const value of [null,[],{ids:['made-up']},{ids:['keys','keys']},{ids:['keys'],answer:'send a password'}, {ids:['keys','team','trust','search']}, {ids:[{}]}]) assert.throws(()=>selectedAnswers(value));
  assert.deepEqual(selectedAnswers({ids:[]}),[]);
  assert.equal(selectedAnswers({ids:['keys']})[0].answer,HELP_ANSWERS.find(a=>a.id==='keys').answer);
});
test('model request never includes account records, stores no response, and only returns authored answers',async()=>{
  let request;
  const result=await answerHelp('How do I export?',{key:'test',model:'configured'},async(url,options)=>{
    request=JSON.parse(options.body); assert.equal(url,'https://api.openai.com/v1/responses');
    return Response.json({status:'completed',output:[{content:[{type:'output_text',text:'{"ids":["export"]}'}]}]});
  });
  assert.equal(request.store,false); assert.equal(request.tools,undefined);
  assert.equal(result[0].id,'export'); assert.equal(request.input.length,1);
});
test('incomplete, refused and failed model calls do not become confident answers',async()=>{
  for(const value of [{status:'incomplete',output:[]},{status:'completed',output:[{content:[{type:'refusal'}]}]}, {status:'completed',output:[{content:[{type:'output_text',text:'{"ids":["forged"]}'}]}]}]) {
    await assert.rejects(()=>answerHelp('help',{key:'test',model:'configured'},async()=>Response.json(value)));
  }
  await assert.rejects(()=>answerHelp('help',{key:'test',model:'configured'},async()=>new Response('',{status:500})));
});
const req=body=>new Request('https://npimark.test',{method:'POST',body});
test('request parsing rejects malformed, oversized and wrong-shaped input before model work',async()=>{
  for(const [body,status] of [['{',400],['null',400],['[]',400],['{"prompt":5}',400],[JSON.stringify({prompt:'a'.repeat(1501)}),400],['x'.repeat(8001),413]])
    await assert.rejects(()=>readHelpPrompt(req(body)),e=>e.status===status);
  assert.equal(await readHelpPrompt(req('{"prompt":"  help  "}')),'help');
});
test('a stalled request is bounded by a timeout',async()=>{
  const stream=new ReadableStream({start(){}});
  await assert.rejects(()=>readHelpPrompt(new Request('https://npimark.test',{method:'POST',body:stream,duplex:'half'}),10),e=>e.status===408);
});
test('bulk quote stays addressed to sales and encodes hostile form content as body text',()=>{
  const url=new URL(bulkQuoteMailto({name:'A\r\nB',email:'a@example.com',organization:'Co',audience:'Dentists & CFOs?bcc=bad@example.com',geography:'NY',volume:'1000',use:'CSV'}));
  assert.equal(url.pathname,'sales@npimark.com'); assert.equal(url.searchParams.has('bcc'),false);
  assert.match(url.searchParams.get('body'),/Dentists & CFOs\?bcc=bad@example.com/);
  assert.equal(url.searchParams.get('subject'),'NPIMARK bulk data quote');
});

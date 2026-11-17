import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readIdentity} from './sessionIdentity.ts';
test('missing cookie and rejected session are signed out',async()=>{
  assert.equal(await readIdentity(null,()=>{throw new Error('must not call')}),null);
  assert.equal(await readIdentity('test',async()=>new Response('',{status:401})),null);
});
test('forbidden, rate limiting, and service errors never become signed out',async()=>{
  for(const status of [403,429,500,502,503]) await assert.rejects(readIdentity('test',async()=>new Response('',{status})),/temporarily unavailable/);
});
test('network and malformed success responses fail closed',async()=>{
  await assert.rejects(readIdentity('test',async()=>{throw new Error('network')}));
  for(const payload of [null,{}, {id:'u'}]) await assert.rejects(readIdentity('test',async()=>Response.json(payload)));
});
test('valid identity is preserved independently of subscription',async()=>{
  const me={id:'u',org:{id:'o'},plan:'free'};
  assert.deepEqual(await readIdentity('test',async()=>Response.json(me)),me);
});

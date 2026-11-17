import {test} from 'node:test';
import assert from 'node:assert/strict';
import {downloadResponse} from './downloadResponse.ts';
const id='12345678-1234-1234-1234-123456789012', origin='https://npimark.com';
test('download streams bytes with attachment fallback and no shared caching',async()=>{
 const response=downloadResponse(new Response('name\nTest',{headers:{'content-type':'text/csv','content-length':'999'}}),id,origin,null);
 assert.equal(await response.text(),'name\nTest');
 assert.match(response.headers.get('content-disposition'),/attachment; filename=.*csv/);
 assert.equal(response.headers.get('cache-control'),'private, no-store');
 assert.equal(response.headers.get('content-length'),null);
});
test('valid original filename survives',()=>{
 const response=downloadResponse(new Response('bytes',{headers:{'content-disposition':'attachment; filename="list.xlsx"'}}),id,origin,null);
 assert.equal(response.headers.get('content-disposition'),'attachment; filename="list.xlsx"');
});
test('only missing or expired session asks for sign-in',()=>{
 for(const response of [null,new Response(null,{status:401})]) assert.match(downloadResponse(response,id,origin,null).headers.get('location'),/sign-in/);
 for(const status of [403,404,409,410]) assert.equal(downloadResponse(new Response(null,{status}),id,origin,'append').headers.get('location'),origin+'/app/append?error=download-unavailable');
});
test('transient failures return to safe exports or append page, never supplied external URL',()=>{
 for(const status of [429,500,503]) assert.equal(downloadResponse(new Response(null,{status}),id,origin,'https://evil.example').headers.get('location'),origin+'/app/exports?error=download-retry');
});

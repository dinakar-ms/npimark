import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectionQuery } from './selectionQuery.ts';
import { searchFilters, formReader } from './searchFilters.ts';

const ids=['1234567893','1003000126'];
const readers=params=>[
  name=>Array.isArray(params[name])?params[name][0]:params[name],
  name=>params[name]===undefined?[]:Array.isArray(params[name])?params[name]:[params[name]],
];

test('repeated NPI URL survives site filtering and export form round trip with exactly the selected NPIs',()=>{
  const url=new URL('/app/search?npi=1234567893&npi=1003000126&npi=1234567893','https://npimark.com');
  const params={};
  for(const key of new Set(url.searchParams.keys()))params[key]=url.searchParams.getAll(key);
  const normalized=selectionQuery(params);
  assert.equal(normalized.ok,true);
  const filters=searchFilters(...readers(normalized.params));
  assert.deepEqual(filters.npi,ids);
  assert.equal('npis' in filters,false);
  const form=new FormData();
  for(const [key,values] of Object.entries(filters))
    for(const value of Array.isArray(values)?values:[values])form.append(key,value);
  assert.deepEqual(searchFilters(...formReader(form)),filters);
});

test('legacy links and comma-separated canonical links preserve the same selection',()=>{
  for(const input of [{npis:ids.join(',')},{npi:ids.join(',')},{npi:[ids[0]],npis:ids.join(',')}]){
    const result=selectionQuery({...input,state:'NY'});
    assert.equal(result.ok,true);
    assert.deepEqual(result.params,{npi:ids,state:'NY'});
    assert.deepEqual(searchFilters(...readers(result.params)).npi,ids);
  }
});

test('invalid or oversized explicit selections refuse to run rather than widening or truncating',()=>{
  for(const input of [{npi:''},{npis:'bad'},{npi:[ids[0],'bad']},{npis:ids[0]+','},{npi:[]},{npi:'１'.repeat(10)},
    {npi:ids[0],npis:'bad'},{npi:Array.from({length:501},(_,i)=>String(1000000000+i))}])
    assert.deepEqual(selectionQuery(input),{ok:false});
});

test('ordinary searches are unchanged and input is not mutated',()=>{
  const input={npis:ids.join(','),page:'2'};
  selectionQuery(input);
  assert.equal(input.npis,ids.join(','));
  assert.deepEqual(selectionQuery({q:'Jane'}),{ok:true,params:{q:'Jane'}});
});

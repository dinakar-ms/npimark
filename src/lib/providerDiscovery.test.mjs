import test from 'node:test';
import assert from 'node:assert/strict';
import {providerDiscoveryLinks} from './providerDiscovery.ts';
const provider={type:'individual',name:'Example',status:'active',city:'Albuquerque',state:'NM',primary_taxonomy:{display:'Internal Medicine'}};
test('provider profile links to a published specialty/city route, not a blocked search URL',()=>{
 assert.deepEqual(providerDiscoveryLinks(provider),[
  {name:'Provider directory',href:'/directory/providers'},
  {name:'Internal Medicine in Albuquerque, NM',href:'/specialty/internal-medicine/nm/albuquerque'}]);
});
test('unknown taxonomy, unknown city, and inactive records never invent directory pages',()=>{
 for(const change of [{primary_taxonomy:{display:'Student in an Organized Health Care Education/Training Program'}},{city:'Unknown City'},{status:'inactive'},{primary_taxonomy:null},{city:null},{state:null}])
  assert.equal(providerDiscoveryLinks({...provider,...change}).length,1);
});
test('organizations retain their own directory and do not become physicians',()=>{
 assert.deepEqual(providerDiscoveryLinks({...provider,type:'organization'}),[{name:'Organization directory',href:'/directory/organizations'}]);
});

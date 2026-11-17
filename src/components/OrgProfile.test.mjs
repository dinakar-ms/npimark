import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
const compiled=ts.transpileModule(readFileSync(new URL('./OrgProfile.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
const mod={exports:{}};
runInNewContext(compiled,{module:mod,exports:mod.exports,URLSearchParams,require(name){
 if(name==='next/link')return function TestLink({children,href,...props}){return React.createElement('a',{href,...props},children);};
 if(name==='@/lib/facilities')return {ROLE_LABELS:{},titleCase:s=>s||'',facilityName:f=>f.name||f.ccn,facilityLabel:f=>f.facility_type,facilityPath:f=>'/facility/'+f.ccn};
 if(name==='@/lib/lists')return {fmt:n=>String(n),systemPath:s=>'/systems/'+s};
 return require(name);
}});
const render=(name,props)=>renderToStaticMarkup(React.createElement(mod.exports[name],props));
const empty={npi:null,affiliated_providers:0,affiliation_basis:[],by_specialty:[],examples:[],ehr_system:null,ehr_basis:null,practice_locations:0,facility_count:1,facilities:[],system:null,similar:[]};
test('zero leadership offers no contact-unlock promise; unavailable is distinct',()=>{
 const none=render('LeadershipPanel',{leadership:{total:0,by_role:[]}});
 assert.match(none,/No named leadership contacts/);assert.doesNotMatch(none,/btn primary|sign-up/);
 const unknown=render('LeadershipPanel',{leadership:null});assert.match(unknown,/information is unavailable/);assert.doesNotMatch(unknown,/No named leadership contacts/);
});
test('available leadership points to the exact workspace record',()=>{
 assert.match(render('LeadershipPanel',{leadership:{total:1,by_role:[]},workspaceHref:'/app/facility/05113F'}),/href="\/app\/facility\/05113F"/);
});
test('missing profile differs from an empty successful profile',()=>{
 assert.match(render('OrgProfileSections',{name:'Example',profile:null,showFacilities:false}),/could not be loaded/);
 const html=render('OrgProfileSections',{name:'Example',profile:empty,showFacilities:false});
 assert.match(html,/No organization NPI/);assert.match(html,/not a count of everyone/);assert.doesNotMatch(html,/could not be loaded/);
});
test('review link includes only valid displayed IDs and deduplicates without broadening',()=>{
 const profile={...empty,affiliated_providers:50,affiliation_basis:['billing'],by_specialty:[{label:'Cardiology',slug:'cardiology',count:50}],examples:[{npi:'1234567893',name:'One',email:'private@example.invalid'},{npi:'1234567893',name:'One'},{npi:'1003000126',name:'Two'}]};
 const html=render('OrgProfileSections',{name:'Example',profile,showFacilities:false});
 assert.match(html,/\/app\/search\?npi=1234567893&amp;npi=1003000126/);
 assert.match(html,/Review these 2 providers/);assert.doesNotMatch(html,/npis=|private@example|\/lists\/cardiology/);
 assert.match(html,/not the complete audience/);
});
test('EHR inference is not presented as a confirmed installation or a majority of every provider',()=>{
 const profile={...empty,ehr_system:'Example EHR',ehr_basis:'affiliated_providers'};
 const html=render('OrgProfileSections',{name:'Example',profile,showFacilities:false});
 assert.match(html,/linked providers with a known EHR/);assert.match(html,/not a confirmed facility installation/);
 const faq=mod.exports.profileFaq('Example',profile,null);
 assert.match(faq[0].a,/not a confirmed facility installation/);assert.doesNotMatch(faq[0].a,/most of its/);
});
test('unknown EHR evidence and peer relationships remain qualified',()=>{
 const html=render('OrgProfileSections',{name:'Example',profile:{...empty,ehr_system:'Example EHR',similar:[{ccn:'05113F',name:'Peer',facility_type:'hospital'}]},showFacilities:false});
 assert.match(html,/relationship source is not available/);assert.match(html,/not evidence of common ownership/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
function compile(file){
 const code=ts.transpileModule(readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const mod={exports:{}};
 runInNewContext(code,{module:mod,exports:mod.exports,require(name){
  if(name==='next/link')return function TestLink({children,...props}){return React.createElement('a',props,children);};
  if(name==='@/lib/facilities')return {ROLE_LABELS:{executive:'Executive'},titleCase:s=>s||''};
  if(name==='@/lib/lists')return {systemPath:s=>'/systems/'+s};
  return require(name);
 }});return mod.exports;
}
const {PublicDecisionNetwork,WorkspaceDecisionNetwork}=compile('./DecisionNetwork.tsx');
const {publicDecisionNetwork}=compile('../lib/decisionNetwork.ts');
const system={slug:'example',name:'Example system',kind:'health_system',hq_city:null,hq_state:null,beds:100,states:['TX'],organization_npis:[],ownership:'Nonprofit',multistate:false,counts:{hospitals:2,nursing_homes:3,home_health:0,facilities:5,groups:0,organizations:1,providers:7,outpatient_centers:null}};
const network={links:[{system,member:{name:'Example facility',ccn:'450001',city:'Austin',state:'TX',member_kind:'hospital',member_type:null,facility_type:'hospital',beds:100,corp_parent_name:'Example parent',corp_parent_type:'Corporate owner'}}],ownership_note:'Ownership describes the system, not each facility.',truncated:false};
const pub={name:'Example facility',network,leadership:{total:2,by_role:[{role:'executive',count:2},{role:'finance',count:2}]},workspaceHref:'/app/facility/450001'};
const render=(component,props)=>renderToStaticMarkup(React.createElement(component,props));
test('missing, empty, and suggestion-only networks render absolutely nothing publicly',()=>{
 for(const value of [null,undefined,{...network,links:[]},{...network,links:[{...network.links[0],suggestion:true}]}])assert.equal(render(PublicDecisionNetwork,{...pub,network:value}),'');
});
test('missing workspace network does not invent an independent account',()=>{
 assert.equal(render(WorkspaceDecisionNetwork,{name:'Example',network:null,owners:[],people:[]}),'');
});
test('system ownership qualifier stays beside ownership and counts are labeled correctly',()=>{
 const html=render(PublicDecisionNetwork,pub);
 assert.match(html,/5 facilities · 2 hospitals · 7 linked providers/);
 assert.match(html,/Example parent/);assert.match(html,/Ownership describes the system, not each facility/);
 assert.match(html,/Group-purchasing membership is not available/);
});
test('overlapping role counts are not added to make a larger people total',()=>{
 const html=render(PublicDecisionNetwork,pub);
 assert.match(html,/2 named contacts on file/);assert.doesNotMatch(html,/4 named contacts/);
});
test('public rendering cannot print internal evidence or injected named contacts',()=>{
 const html=render(PublicDecisionNetwork,{...pub,network:{...network,links:[{...network.links[0],link_method:'SECRET_METHOD',confidence:.6}]},people:[{name:'SECRET_PERSON',phone:'SECRET_PHONE'}]});
 assert.doesNotMatch(html,/SECRET_|Internal match|confidence/);
});
test('public adapter strips nested internal fields, timestamps, and provider rows',()=>{
 const raw={...network,links:[{...network.links[0],confidence:.6,source_key:'SECRET',system:{...system,ahrq_system_id:'SECRET',loaded_at:'SECRET',counts:{...system.counts,ahrq_restricted:12},provider_idns:['SECRET']},member:{...network.links[0].member,corp_parent_id:'SECRET',name_fold:'SECRET'}}]};
 const text=JSON.stringify(publicDecisionNetwork(raw));
 assert.doesNotMatch(text,/SECRET|confidence|restricted|provider_idns|_fold/);
});
test('workspace uses only names, titles and roles; reveal fields never render',()=>{
 const html=render(WorkspaceDecisionNetwork,{name:'Example',network,owners:[{owner_name:'Example owner',role:'Managing member',private_equity:true,reit:false}],people:[{id:7,name:'Alex Example',title:'Chief operating officer',role:'executive',phone:'SECRET_PHONE',source_label:'SECRET_SOURCE'}],peopleTotal:31,peoplePage:1,pageHref:p=>'/app/organization/1234567893?leadership_page='+p});
 assert.match(html,/Alex Example/);assert.match(html,/Chief operating officer/);assert.match(html,/Reported private equity/);
 assert.match(html,/1 contacts shown of 31/);assert.match(html,/leadership_page=2/);
 assert.doesNotMatch(html,/SECRET_|Reported REIT|\/reveal|<form/);
});
test('internal suggestions remain explicitly suggestions, not buying scores',()=>{
 const html=render(WorkspaceDecisionNetwork,{name:'Example',network:{...network,links:[{...network.links[0],suggestion:true,link_method:'legal_name',confidence:.6}]},people:null,owners:null});
 assert.match(html,/Suggested relationship/);assert.match(html,/not purchase propensity/);
 assert.match(html,/Leadership could not be loaded/);
});

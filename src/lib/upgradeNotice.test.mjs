import {test} from 'node:test';
import assert from 'node:assert/strict';
import {upgradeNotice} from './upgradeNotice.ts';
const paid={plan_code:'starter',active:true,api_access:true,limits:{append_rows:{limit:100},export_rows:{limit:null}}};
test('only confirmed plan limits get upgrade prompts',()=>{
 assert.equal(upgradeNotice('/app/append',null),null);
 assert.equal(upgradeNotice('/app/append',paid),null);
 assert.equal(upgradeNotice('/app/exports',paid),null);
 assert.match(upgradeNotice('/app/append',{...paid,limits:{append_rows:{limit:0}}}),/does not include/);
 assert.match(upgradeNotice('/app/keys',{...paid,api_access:false}),/API access/);
});
test('Free workspace gets upgrade options without changing auth or permissions',()=>{
 for(const path of ['/app/find','/app/campaigns','/app/integrations']) assert.match(upgradeNotice(path,{...paid,plan_code:'free'}),/Free plan/);
 for(const path of ['/app/billing','/app/security','/app/team','/app/owner/customers']) assert.equal(upgradeNotice(path,{...paid,plan_code:'free'}),null);
 assert.equal(upgradeNotice('/appended',paid),null);
});

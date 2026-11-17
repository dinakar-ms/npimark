import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { commitLaunch, readLaunch, launchEnabled, launchOperator, launchExempt } from './launchGate.ts';

test('launch gate defaults, authorization, durable one-time commit and corrupt state', async () => {
  const keys = ['NPI_LAUNCH_GATE','NPI_LAUNCH_READY','NPI_LAUNCH_OPERATOR_IDS','NPI_LAUNCH_STATE_DIR'];
  const before = Object.fromEntries(keys.map(k => [k,process.env[k]]));
  const dir = await mkdtemp(join(tmpdir(),'npim-launch-'));
  try {
    keys.forEach(k => delete process.env[k]);
    assert.equal(launchEnabled(), false);
    assert.equal(launchOperator('mike'), false);
    assert.equal(await readLaunch(), null);
    process.env.NPI_LAUNCH_STATE_DIR = dir;
    process.env.NPI_LAUNCH_GATE = 'enabled';
    process.env.NPI_LAUNCH_OPERATOR_IDS = 'mike, owner';
    await assert.rejects(commitLaunch('mike')); // Readiness cannot be bypassed.
    process.env.NPI_LAUNCH_READY = 'approved';
    await assert.rejects(commitLaunch('stranger'));
    assert.equal(await readLaunch(), null);
    const receipts = await Promise.all(Array.from({length:12},(_,i)=>commitLaunch(i%2?'mike':'owner')));
    for (const receipt of receipts) assert.deepEqual(receipt, receipts[0]);
    assert.deepEqual(JSON.parse(await readFile(join(dir,'launched.json'),'utf8')),receipts[0]);
    assert.deepEqual(await commitLaunch('mike'),receipts[0]);
    await writeFile(join(dir,'launched.json'),'broken');
    assert.equal(await readLaunch(),null);
    await assert.rejects(commitLaunch('mike')); // Never overwrite a damaged audit receipt.
    assert.equal(await readFile(join(dir,'launched.json'),'utf8'),'broken');
  } finally {
    for (const key of keys) { if(before[key]===undefined) delete process.env[key]; else process.env[key]=before[key]; }
    await rm(dir,{recursive:true,force:true});
  }
});
test('closed gate retains only narrow operational and privacy routes',()=>{
  for(const path of ['/launch-control','/sign-in','/sign-in/code','/api/auth/mfa','/api/ready','/privacy']) assert.equal(launchExempt(path),true);
  for(const path of ['/','/app','/app/search','/api/auth/sign-up','/api/app/providers','/launch-control/anything','/robots.txt','/sitemap.xml']) assert.equal(launchExempt(path),false);
});

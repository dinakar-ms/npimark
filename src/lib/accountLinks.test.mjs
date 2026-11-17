import assert from 'node:assert/strict';
import { test } from 'node:test';
import { accountLinks } from './accountLinks.ts';

test('a signed-out visitor is offered sign in and sign up, sign up as the one primary action', () => {
  const links = accountLinks(false);
  assert.deepEqual(links.map((l) => l.href), ['/sign-in', '/sign-up']);
  assert.deepEqual(links.filter((l) => l.primary).map((l) => l.label), ['Get started']);
});
test('a signed-in customer is never offered sign in again', () => {
  const links = accountLinks(true);
  assert.ok(links.every((l) => !/sign-in|sign-up/.test(l.href)));
  assert.deepEqual(links.map((l) => l.label), ['Open app', 'Account']);
  assert.equal(links.filter((l) => l.primary).length, 1);
});

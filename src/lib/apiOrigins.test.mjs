import assert from 'node:assert/strict';
import { test } from 'node:test';
import { publicApiBase, accountApiOrigin } from './apiOrigins.ts';

test('staging data URL keeps exactly one /api prefix', () => {
  assert.equal(publicApiBase('https://stg.list-smarter.com/api/', undefined) + '/providers', 'https://stg.list-smarter.com/api/v1/providers');
});
test('production data URL uses the edge /v1 path', () => {
  assert.equal(publicApiBase('https://api.npimark.com', undefined) + '/providers', 'https://api.npimark.com/v1/providers');
});
test('legacy internal origins retain their original /api/v1 behavior', () => {
  assert.equal(publicApiBase(undefined, 'http://api:8000'), 'http://api:8000/api/v1');
  assert.equal(publicApiBase(undefined, 'https://stg.list-smarter.com/api'), 'https://stg.list-smarter.com/api/v1');
});
test('account origin is independent of the public customer edge', () => {
  assert.equal(accountApiOrigin('https://stg.list-smarter.com/api', 'https://api.npimark.com') + '/api/auth/csrf', 'https://stg.list-smarter.com/api/auth/csrf');
  assert.equal(accountApiOrigin(undefined, 'http://api:8000'), 'http://api:8000');
});
test('missing or unsafe configuration fails before any request', () => {
  assert.throws(() => publicApiBase(undefined, undefined));
  for (const url of ['file:///tmp/x', 'https://name:secret@example.com', 'https://example.com?key=x', 'https://example.com/#fragment']) {
    assert.throws(() => publicApiBase(url, undefined));
  }
});

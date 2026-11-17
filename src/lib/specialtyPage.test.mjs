import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
const route = '../app/specialty/[specialty]/[state]/[city]/page.tsx';
const next404 = new Error('NEXT_NOT_FOUND');
function load(file, mocks) {
  const compiled = ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const mod = { exports: {} };
  runInNewContext(compiled, { module: mod, exports: mod.exports, URLSearchParams, URL, process,
    console: { error() {} }, require(name) { return mocks[name] ?? require(name); } });
  return mod.exports;
}
function setup(searchProviders) {
  const mocks = {
    'next/link': ({ children, href, ...props }) => React.createElement('a', { href, ...props }, children),
    'next/navigation': { notFound() { throw next404; }, unstable_rethrow(e) { if (e === next404) throw e; } },
    '@/lib/api': { searchProviders, toPublic: row => ({ ...row, email: undefined }) },
    '@/lib/geo': load('./geo.ts', {}),
    '@/lib/schema': { websiteRef: () => ({ '@id': 'https://example.test/#website' }) },
    '@/lib/site': { siteUrl: p => 'https://example.test' + p, stateName: () => 'New Mexico' },
    '@/components/JsonLd': { JsonLd: () => null },
  };
  mocks['@/lib/socialMetadata'] = load('./socialMetadata.ts', {'./site': load('./site.ts', {})});
  mocks['@/components/DirectoryFallback'] = load('../components/DirectoryFallback.tsx', mocks);
  mocks['@/content/positioning'] = load('../content/positioning.ts', {});
  return load(route, mocks);
}
const props = { params: Promise.resolve({ specialty: 'internal-medicine', state: 'nm', city: 'albuquerque' }) };
const row = { npi: '1234567893', name: 'Example Clinician', primary_taxonomy: { display: 'Other specialty' }, matched_taxonomy: { display: 'Internal Medicine' }, city: 'Albuquerque', state: 'NM' };

test('API failure renders a visible recovery page and noindex metadata', async () => {
  const page = setup(async () => { throw new Error('upstream secret diagnostic'); });
  const html = renderToStaticMarkup(await page.default(props));
  assert.match(html, /Directory data is temporarily unavailable/);
  assert.match(html, /does not mean there are no matching records/);
  assert.match(html, /Contact support/);
  assert.doesNotMatch(html, /upstream secret diagnostic/);
  assert.equal((await page.generateMetadata(props)).robots.index, false);
  assert.equal(page.revalidate, 0);
});

test('invalid combinations and confirmed zero matches retain 404 behavior', async () => {
  let calls = 0;
  const page = setup(async () => { calls++; return { total: 0, items: [] }; });
  await assert.rejects(page.default({ params: Promise.resolve({ specialty: 'unknown', state: 'nm', city: 'albuquerque' }) }), e => e === next404);
  assert.equal(calls, 0);
  await assert.rejects(page.default(props), e => e === next404);
});

test('successful results retain city filters and show the matching specialty', async () => {
  const page = setup(async filters => {
    assert.equal(filters.city, 'Albuquerque');
    assert.equal(filters.taxonomy_classification, 'Internal Medicine');
    return { total: filters.has_email ? 1 : 2, items: [row] };
  });
  const html = renderToStaticMarkup(await page.default(props));
  assert.match(html, /Example Clinician/);
  assert.match(html, /Also listed: Internal Medicine/);
  assert.match(html, /classification=Internal\+Medicine&amp;state=NM&amp;city=Albuquerque/);
  assert.match(html, /email on file/);
  assert.doesNotMatch(html, /verified work email|refreshed weekly/);
});

test('optional email failure does not hide providers or invent coverage', async () => {
  const page = setup(async filters => {
    if (filters.has_email) throw new Error('count unavailable');
    return { total: 1, items: [row] };
  });
  assert.match(renderToStaticMarkup(await page.default(props)), /Example Clinician/);
  assert.doesNotMatch((await page.generateMetadata(props)).description, /email on file/);
});

test('malformed main response is unavailable, never a zero-results claim', async () => {
  for (const result of [{ total: 2, items: [] }, { total: -1, items: [] }, { total: 1, items: null }]) {
    const page = setup(async () => result);
    assert.match(renderToStaticMarkup(await page.default(props)), /temporarily unavailable/);
  }
});

test('out-of-range contact count cannot produce coverage over 100 percent', async () => {
  const page = setup(async filters => ({ total: filters.has_email ? 2 : 1, items: [row] }));
  assert.doesNotMatch((await page.generateMetadata(props)).description, /email on file|200%/);
});

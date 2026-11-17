import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

function load() {
  const source = readFileSync(new URL("./analytics.ts", import.meta.url), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = { exports: {} };
  runInNewContext(code, { module: mod, exports: mod.exports, process: { env: {} } });
  return mod.exports;
}

const a = load();

test("the measurement id is checked by shape, so a pasted quote or a GTM id loads nothing", () => {
  assert.equal(a.ga4MeasurementId("G-CD1PKX1FGN"), "G-CD1PKX1FGN");
  assert.equal(a.ga4MeasurementId("  G-CD1PKX1FGN\n"), "G-CD1PKX1FGN");
  assert.equal(a.ga4MeasurementId("GTM-ABCDEF"), null);
  assert.equal(a.ga4MeasurementId('"G-CD1PKX1FGN"'), null);
  assert.equal(a.ga4MeasurementId(""), null);
  assert.equal(a.ga4MeasurementId(undefined), null);
});

test("only the production hostnames may feed the production property", () => {
  assert.equal(a.productionHost("npimark.com"), true);
  assert.equal(a.productionHost("WWW.NPIMARK.COM"), true);
  assert.equal(a.productionHost("stg.npimark.com"), false);
  assert.equal(a.productionHost("localhost"), false);
  assert.equal(a.productionHost("app.list-smarter.com"), false);
});

test("marketing pages report a fixed title; everything with a person or a token in it stays silent", () => {
  assert.equal(a.reportableTitle("/"), "Home");
  assert.equal(a.reportableTitle("/pricing"), "Pricing");
  assert.equal(a.reportableTitle("/pricing/"), "Pricing");
  for (const silent of [
    "/npi/1234567893",
    "/directory/physicians/tx/austin",
    "/search?q=smith",
    "/search",
    "/app",
    "/app/lists",
    "/sign-in",
    "/sign-up",
    "/reset-password/abc",
    "/verify-email/abc",
    "/invite/abc",
    "/remove-my-information",
    "/privacy-choices",
    "/test-your-list/token",
    "/pricing/anything",
  ]) {
    assert.equal(a.reportableTitle(silent), null, silent);
  }
});

test("the location sent is origin plus path, never a query string or fragment", () => {
  assert.equal(a.sanitisedLocation("https://npimark.com", "/pricing/"), "https://npimark.com/pricing");
  assert.equal(a.sanitisedLocation("https://npimark.com", "/"), "https://npimark.com/");
});

test("consent is one of two words; anything else is no choice", () => {
  assert.equal(a.parseConsent("granted"), "granted");
  assert.equal(a.parseConsent("denied"), "denied");
  assert.equal(a.parseConsent("yes"), null);
  assert.equal(a.parseConsent(null), null);
  assert.equal(a.parseConsent(undefined), null);
});

test("withdrawal removes exactly the cookies GA4 sets for the property", () => {
  // Arrays made inside the vm context have their own Array prototype, so compare by value.
  assert.deepEqual(Array.from(a.analyticsCookieNames("G-CD1PKX1FGN")), ["_ga", "_ga_CD1PKX1FGN"]);
});

test("the tag URL is the documented one and the id is URL-encoded", () => {
  assert.equal(a.tagScriptUrl("G-CD1PKX1FGN"), "https://www.googletagmanager.com/gtag/js?id=G-CD1PKX1FGN");
});

test("the CTA events are fixed names and none claims a conversion", () => {
  assert.deepEqual(Array.from(Object.keys(a.CTA_EVENTS)), ["pricing_cta_click", "bulk_data_cta_click"]);
  for (const name of Object.values(a.CTA_EVENTS)) {
    assert.doesNotMatch(name, /sign_up|purchase|subscri/);
  }
});

test("a CTA click is one window event carrying the CTA's name, and nothing without a window", () => {
  const dispatched = [];
  const source = readFileSync(new URL("./analytics.ts", import.meta.url), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = { exports: {} };
  class FakeCustomEvent {
    constructor(type, init) {
      this.type = type;
      this.detail = init?.detail;
    }
  }
  runInNewContext(code, {
    module: mod,
    exports: mod.exports,
    process: { env: {} },
    CustomEvent: FakeCustomEvent,
    window: { dispatchEvent: (e) => dispatched.push(e) },
  });
  mod.exports.reportCta("pricing_cta_click");
  assert.equal(dispatched.length, 1);
  assert.equal(dispatched[0].type, mod.exports.CTA_EVENT_NAME);
  assert.equal(dispatched[0].detail, "pricing_cta_click");
  assert.equal(mod.exports.isCtaEvent("pricing_cta_click"), true);
  assert.equal(mod.exports.isCtaEvent("purchase"), false);
  assert.equal(mod.exports.isCtaEvent("constructor"), false);
  // The module loaded without a window (the server) reports into nothing and does not throw.
  a.reportCta("bulk_data_cta_click");
});

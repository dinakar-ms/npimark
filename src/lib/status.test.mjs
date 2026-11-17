// Run with `npm test` (node --test; Node strips the types from the imported .ts file).
//
// The status page's whole value rests on one promise: it renders honestly at the moment the
// platform is not answering. Every way that promise can be broken is silent in a page render -
// a half-understood body rendering as four blank rows that look fine, a proxy's error page
// parsed as a status, a thrown error taking the page down, a missing environment variable doing
// the same - so they are checked here instead.
//
// `parseStatus` is exported and `lib/status.ts` carries no `server-only` guard precisely so this
// file can import it: the module holds no credential, because `/api/status` takes none.
import assert from "node:assert/strict";
import { test } from "node:test";
import { STATE_WORDS, momentInUtc, parseStatus, platformStatus } from "./status.ts";

const WELL = {
  state: "operating",
  checked_at: "2026-09-24T17:04:00Z",
  services: [
    {
      key: "search",
      name: "Search and provider records",
      what: "Finding providers.",
      state: "operating",
      since: "2026-09-24T11:00:00Z",
      last_operating_at: null,
    },
  ],
};

test("a well-formed body comes back whole", () => {
  const parsed = parseStatus(WELL);
  assert.equal(parsed.state, "operating");
  assert.equal(parsed.checked_at, "2026-09-24T17:04:00Z");
  assert.equal(parsed.services.length, 1);
  assert.equal(parsed.services[0].key, "search");
});

test("anything that is not recognisably a status is null, never a half-page", async () => {
  // A proxy's error page, an edge that is up while the API behind it is not, a body from some
  // future version of the endpoint. Each of these rendered as "nothing is wrong" would be worse
  // than the outage it was hiding.
  for (const body of [
    null,
    undefined,
    "maintenance in progress",
    42,
    [],
    {},
    { state: "operating" },
    { state: "operating", services: [] },
    { state: "fine", services: [WELL.services[0]] },
    { services: WELL.services },
    { state: "operating", services: [{ key: "search" }] },
    { state: "operating", services: [{ ...WELL.services[0], state: "ok" }] },
    { state: "operating", services: [{ ...WELL.services[0], name: 7 }] },
    { state: "operating", services: ["search"] },
  ]) {
    assert.equal(parseStatus(body), null, `${JSON.stringify(body)} should not parse`);
  }
});

test("an unparseable timestamp drops the timestamp rather than the whole answer", () => {
  // The state is the useful half. Losing a page because a date was malformed would be the
  // tail wagging the dog.
  const parsed = parseStatus({
    ...WELL,
    checked_at: "not a date",
    services: [{ ...WELL.services[0], since: "nonsense", last_operating_at: 5 }],
  });
  assert.equal(parsed.state, "operating");
  assert.equal(parsed.checked_at, null);
  assert.equal(parsed.services[0].since, null);
  assert.equal(parsed.services[0].last_operating_at, null);
});

test("a missing base URL is answered with null, not with a thrown error", async () => {
  // lib/api.ts throws on this, deliberately, because a directory page with no API is a bug. This
  // page must degrade to "we cannot say" instead: a misconfigured environment must not be able to
  // take down the page people read during an outage.
  const before = process.env.NPI_API_BASE_URL;
  delete process.env.NPI_API_BASE_URL;
  try {
    assert.equal(await platformStatus(), null);
  } finally {
    if (before !== undefined) process.env.NPI_API_BASE_URL = before;
  }
});

test("a platform that cannot be reached is null rather than an exception", async () => {
  // The case the page exists for. An address nothing is listening on is the closest a unit test
  // gets to the API container being gone.
  const before = process.env.NPI_API_BASE_URL;
  process.env.NPI_API_BASE_URL = "http://127.0.0.1:1/";
  try {
    assert.equal(await platformStatus(), null);
  } finally {
    if (before === undefined) delete process.env.NPI_API_BASE_URL;
    else process.env.NPI_API_BASE_URL = before;
  }
});

test("every state has a word and a chip, so no row can render unlabelled", () => {
  for (const state of ["operating", "degraded", "down", "unknown"]) {
    assert.ok(STATE_WORDS[state].label.length > 0);
    assert.ok(STATE_WORDS[state].tag.startsWith("tag"));
  }
  // "Not confirmed" wears the plain chip: not knowing must not be dressed as a fault, and must
  // not be dressed as health either.
  assert.equal(STATE_WORDS.unknown.tag, "tag");
  assert.notEqual(STATE_WORDS.unknown.label, STATE_WORDS.operating.label);
});

test("times are printed in UTC, to the minute, whatever the server's clock is set to", () => {
  const printed = momentInUtc("2026-09-24T17:04:00Z");
  assert.match(printed, /September 24, 2026 at 17:04 UTC/);
  assert.equal(momentInUtc(null), null);
  assert.equal(momentInUtc("not a date"), null);
});

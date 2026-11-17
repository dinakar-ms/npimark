// Run with `npm test` (node --test; Node strips the types from the imported .ts files).
import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";

import { PER_HOUR, PER_MINUTE, allowSearch, resetSearchLimit } from "./searchLimit.ts";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

beforeEach(() => resetSearchLimit());

test("an unknown visitor is never counted and never refused", () => {
  // No address means the container was reached directly rather than through the public edge,
  // which only the host and the internal network can do. Counting every unknown visitor into one
  // bucket would close public search for everybody the first time the header went missing.
  for (let i = 0; i < PER_MINUTE * 3; i += 1) {
    assert.equal(allowSearch(null).allowed, true);
  }
});

test("a burst is allowed up to the limit and refused after it", () => {
  const now = Date.now();
  for (let i = 0; i < PER_MINUTE; i += 1) {
    assert.equal(allowSearch("198.51.100.7", now).allowed, true, `search ${i + 1}`);
  }
  const refused = allowSearch("198.51.100.7", now);
  assert.equal(refused.allowed, false);
  assert.equal(refused.window, "minute");
  assert.ok(refused.retryAfterSeconds > 0 && refused.retryAfterSeconds <= 60);
});

test("the minute window slides rather than resetting on the clock", () => {
  // A fixed window on the clock lets somebody take the limit twice in two seconds, either side of
  // the boundary. This counts the last sixty seconds, whenever they were.
  const start = Date.now();
  for (let i = 0; i < PER_MINUTE; i += 1) allowSearch("203.0.113.9", start);
  assert.equal(allowSearch("203.0.113.9", start + 59_000).allowed, false);
  assert.equal(allowSearch("203.0.113.9", start + 61_000).allowed, true);
});

test("one address running out does not affect another", () => {
  const now = Date.now();
  for (let i = 0; i < PER_MINUTE; i += 1) allowSearch("198.51.100.7", now);
  assert.equal(allowSearch("198.51.100.7", now).allowed, false);
  assert.equal(allowSearch("198.51.100.8", now).allowed, true);
});

test("the hourly ceiling holds even when every minute is under its own limit", () => {
  // The shape a patient crawler takes: well inside the burst limit, all day. Ten a minute for
  // twelve minutes is 120, which is the hour's worth.
  const start = Date.now();
  let at = start;
  let allowed = 0;
  for (let minute = 0; minute < 30; minute += 1) {
    at = start + minute * MINUTE;
    for (let i = 0; i < 10; i += 1) {
      if (allowSearch("192.0.2.44", at).allowed) allowed += 1;
    }
  }
  assert.equal(allowed, PER_HOUR, "the hour caps what the minute limit would let through");
});

test("an address that stops searching ages out entirely", () => {
  const start = Date.now();
  for (let i = 0; i < PER_HOUR; i += 1) allowSearch("192.0.2.44", start);
  assert.equal(allowSearch("192.0.2.44", start).allowed, false);
  // An hour and a second later there is nothing left to count, so the map does not grow for ever
  // either - `prune` drops the address rather than keeping an empty list under it.
  assert.equal(allowSearch("192.0.2.44", start + HOUR + 1000).allowed, true);
});

test("the wait it reports is when a slot actually frees up", () => {
  const start = Date.now();
  for (let i = 0; i < PER_MINUTE; i += 1) allowSearch("198.51.100.7", start);
  const refused = allowSearch("198.51.100.7", start + 20_000);
  assert.equal(refused.allowed, false);
  // 40 seconds until the oldest of the twenty falls out of the window.
  assert.equal(refused.retryAfterSeconds, 40);
  assert.equal(allowSearch("198.51.100.7", start + 20_000 + 40_000 + 1).allowed, true);
});

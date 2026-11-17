// Run with `npm test` (node --test; Node strips the types from the imported .ts files).
//
// The Global Privacy Control hook is a compliance promise the Privacy Policy already makes, and
// every way it can be wrong is silent: a signal dropped, a signal invented for somebody we cannot
// name, one standing opt-out posted as a stream of them, or a platform hiccup taking somebody's
// account page down with it. None of those shows up in a page render, so they are checked here.
//
// `lib/gpc.ts` takes its sender as an argument precisely so this file can count the calls without
// a network, a server or a mock of `fetch`.
import assert from "node:assert/strict";
import { test } from "node:test";
import { forgetGpcPosts, recordGpcOptOutForSignedInVisitor } from "./gpc.ts";

const VISITOR = { accountId: "acct_1", email: "dana@example.com" };
const DAY = 24 * 60 * 60 * 1000;

/** A sender that counts what it was asked to send and answers however the test wants. */
function recorder(answer = true) {
  const sent = [];
  return {
    sent,
    send: async (visitor) => {
      sent.push(visitor);
      if (answer instanceof Error) throw answer;
      return answer;
    },
  };
}

test("an anonymous visitor sends nothing at all", async () => {
  forgetGpcPosts();
  const { sent, send } = recorder();
  const result = await recordGpcOptOutForSignedInVisitor(null, send);
  assert.equal(sent.length, 0, "nothing may be posted about a visitor we cannot name");
  assert.equal(result.recorded, false);
  assert.match(result.reason, /anonymous/);
});

test("a signed-in visitor's signal is posted, with the account id and nothing else", async () => {
  forgetGpcPosts();
  const { sent, send } = recorder();
  const result = await recordGpcOptOutForSignedInVisitor(VISITOR, send);
  assert.equal(result.recorded, true);
  assert.deepEqual(sent, [{ accountId: "acct_1", email: "dana@example.com" }]);
});

test("once a session, not once a page view", async () => {
  forgetGpcPosts();
  const { sent, send } = recorder();
  await recordGpcOptOutForSignedInVisitor(VISITOR, send, 1_000);
  const again = await recordGpcOptOutForSignedInVisitor(VISITOR, send, 2_000);
  const third = await recordGpcOptOutForSignedInVisitor(VISITOR, send, 3_000);
  assert.equal(sent.length, 1, "a signed-in visitor hits the /app layout on every request");
  assert.equal(again.recorded, false);
  assert.match(again.reason, /already recorded/);
  assert.equal(third.recorded, false);
});

test("the signal is re-asserted after a day", async () => {
  forgetGpcPosts();
  const { sent, send } = recorder();
  await recordGpcOptOutForSignedInVisitor(VISITOR, send, 1_000);
  await recordGpcOptOutForSignedInVisitor(VISITOR, send, 1_000 + DAY + 1);
  assert.equal(sent.length, 2);
});

test("one account being recorded does not silence another", async () => {
  forgetGpcPosts();
  const { sent, send } = recorder();
  await recordGpcOptOutForSignedInVisitor(VISITOR, send);
  await recordGpcOptOutForSignedInVisitor({ accountId: "acct_2", email: "sam@example.com" }, send);
  assert.deepEqual(
    sent.map((v) => v.accountId),
    ["acct_1", "acct_2"],
  );
});

test("a refusal is not remembered, so the next page tries again", async () => {
  forgetGpcPosts();
  const refused = recorder(false);
  const first = await recordGpcOptOutForSignedInVisitor(VISITOR, refused.send);
  assert.equal(first.recorded, false);
  await recordGpcOptOutForSignedInVisitor(VISITOR, refused.send);
  assert.equal(refused.sent.length, 2, "a signal the platform never took is still owed");
});

test("a sender that throws does not reject, and does not stop the page", async () => {
  forgetGpcPosts();
  const broken = recorder(new Error("connection refused"));
  const result = await recordGpcOptOutForSignedInVisitor(VISITOR, broken.send);
  assert.equal(result.recorded, false);
  assert.match(result.reason, /could not be reached/);
  // And it is still owed: the failure was not remembered as a success.
  const retry = recorder();
  await recordGpcOptOutForSignedInVisitor(VISITOR, retry.send);
  assert.equal(retry.sent.length, 1);
});

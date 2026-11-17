// Run with `npm test` (node --test; Node strips the types from the imported .ts file).
//
// Two of these test the function. The other three test the things that would make the function
// pointless while it still passed its own unit tests: a variable nobody knows the name of, a
// question with no variable documented, and a page that bakes the environment at build time.
// Each of those three fails silently in production — the page goes on printing the question and
// nothing anywhere says why — which is the failure this file exists to make loud.
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { answerFor, answerKey } from "./answers.ts";

const local = (relative) =>
  new URL(relative, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

const COMPANY_SOURCE = readFileSync(local("./company.ts"), "utf8");
const ENV_EXAMPLE = readFileSync(local("../../../infra/site.env.example"), "utf8");
const APP = local("../app/");

/** The fact ids declared in company.ts, read from the source. */
const factIds = [...COMPANY_SOURCE.matchAll(/fact\(\s*"([^"]+)"/g)].map((match) => match[1]);

test("a fact id becomes one predictable variable name", () => {
  assert.ok(factIds.length >= 9, `expected the nine company facts, found ${factIds.length}`);
  assert.equal(answerKey("legal-entity"), "COMPANY_LEGAL_ENTITY");
  assert.equal(answerKey("data-broker-registration"), "COMPANY_DATA_BROKER_REGISTRATION");
  assert.equal(answerKey("founded"), "COMPANY_FOUNDED");
  // Every id maps to a name that is a legal shell variable, or the owner cannot set it at all.
  for (const id of factIds) {
    assert.match(answerKey(id), /^COMPANY_[A-Z0-9_]+$/, id);
  }
  // And no two facts may share a variable: one would silently answer the other.
  const keys = factIds.map(answerKey);
  assert.equal(new Set(keys).size, keys.length, "two facts derive the same variable name");
});

test("the environment answers, and a blank one never un-answers", () => {
  const env = { COMPANY_OFFICE: "1 Example Plaza, New York" };
  assert.equal(answerFor("office", "", env), "1 Example Plaza, New York");
  // The environment wins over a committed answer: a wrong fact on a live page is a one-minute fix.
  assert.equal(answerFor("office", "the old address", env), "1 Example Plaza, New York");
  // Blank and whitespace-only are "no answer here", not "the answer is nothing".
  assert.equal(answerFor("office", "the committed answer", {}), "the committed answer");
  assert.equal(answerFor("office", "kept", { COMPANY_OFFICE: "" }), "kept");
  assert.equal(answerFor("office", "kept", { COMPANY_OFFICE: "   \t " }), "kept");
  // Surrounding whitespace is trimmed; a value is never published with a stray newline.
  assert.equal(answerFor("office", "", { COMPANY_OFFICE: " 2 Example Row \n" }), "2 Example Row");
  // The sentinel passes straight through for company.ts to interpret.
  assert.equal(answerFor("founded", "", { COMPANY_FOUNDED: "publish nothing" }), "publish nothing");
});

test("every question's variable is documented where the owner will look for it", () => {
  const missing = factIds.filter((id) => !ENV_EXAMPLE.includes(`${answerKey(id)}=`));
  assert.deepEqual(
    missing,
    [],
    "add these to infra/site.env.example with the question as a comment — an undocumented " +
      "variable is one the owner cannot find, and a mistyped one is a silent no-op",
  );
});

test("the env example documents no variable that no fact answers", () => {
  const declared = [...ENV_EXAMPLE.matchAll(/^(COMPANY_[A-Z0-9_]+)=/gm)].map((match) => match[1]);
  const keys = new Set(factIds.map(answerKey));
  const orphans = declared.filter((key) => !keys.has(key));
  assert.deepEqual(orphans, [], "these answer nothing: a renamed fact left its variable behind");
});

/** Every page.tsx under src/app. */
function pages(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) out.push(...pages(path));
    else if (entry === "page.tsx") out.push(path);
  }
  return out;
}

test("a page that renders a company fact is rendered per request", () => {
  // `fact()` reads process.env in a getter, so a statically rendered page would freeze whatever
  // was set when the image was built. The answer would then appear only after a rebuild, which is
  // the deploy this mechanism exists to avoid — and nothing would look wrong in the meantime.
  const faults = [];
  for (const path of pages(APP)) {
    const source = readFileSync(path, "utf8");
    const readsFacts =
      source.includes('from "@/content/company"') ||
      source.includes('from "@/components/OwnerNotes"');
    if (!readsFacts) continue;
    const route = "/" + path.slice(APP.length).replace(/\\/g, "/").replace(/\/?page\.tsx$/, "");
    const perRequest =
      source.includes("await connection()") || source.includes('dynamic = "force-dynamic"');
    if (!perRequest) faults.push(route);
  }
  assert.deepEqual(
    faults,
    [],
    "these render company facts but not per request: add `await connection()` so the " +
      "environment is read when the page is served, not when it was built",
  );
});

#!/usr/bin/env node
/**
 * A route handler must not build a redirect from `request.url`.
 *
 * Inside the container Next binds to 0.0.0.0:3000, so `request.url` is `http://0.0.0.0:3000/...`
 * and every redirect built from it sends the browser to an address it refuses with
 * ERR_ADDRESS_INVALID. Twenty-four call sites across twenty-one files did this, and the two that
 * mattered most were `api/auth/[action]` - so every sign-in and sign-up ended on an invalid
 * address - and `api/app/verify`, the handler behind the link in the verification email.
 *
 * Nothing caught it. It typechecks, it lints, the tests pass, and in `next dev` it is correct,
 * because there `request.url` really is the address the browser used. It only fails where there is
 * a proxy in front, which is to say only in production. It was found by the owner hitting it four
 * times in one evening.
 *
 * So this is a grep that runs in lint, like `no-trackers` and `a11y-static` beside it. Use
 * `redirectBase(request)` from `@/lib/redirectBase`, which prefers `SITE_BASE_URL` and falls back
 * to `request.url` for local development - the one place that fallback is right.
 *
 * `new URL(request.url)` with a single argument is fine and is not flagged: that parses the
 * incoming request to read its query string, which is what it is for.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = dirname(dirname(fileURLToPath(import.meta.url)));
const SRC = join(SITE, "src");

/** The helper itself names the bad pattern in its own docstring, explaining why. */
const ALLOWED = ["src/lib/redirectBase.ts"];

function sources(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) sources(path, out);
    else if (name.endsWith(".ts") || name.endsWith(".tsx")) out.push(path);
  }
  return out;
}

/**
 * Every mention of `request.url`, so the check can look at each one.
 *
 * Matching the call around it does not work: `safeReturn(String(form.get("return_to") ?? ""),
 * request.url)` nests three sets of brackets, and a regex that tries to span them silently matches
 * nothing - which is what the first version of this file did. It passed on a tree where five of
 * these were still present. So the rule is inverted: find the mentions, and allow the one shape
 * that is legitimate.
 */
const MENTION = /request\.url/g;
/** The only correct use: parsing the incoming request to read its query string. */
const PARSING = /new URL\(\s*request\.url\s*\)/;

const problems = [];
for (const path of sources(SRC)) {
  const where = relative(SITE, path).replaceAll("\\", "/");
  if (ALLOWED.includes(where)) continue;
  const text = readFileSync(path, "utf8");
  text.split("\n").forEach((line, i) => {
    // A comment explaining the rule is not a breach of it.
    if (/^\s*(\*|\/\/)/.test(line)) return;
    MENTION.lastIndex = 0;
    if (!MENTION.test(line)) return;
    // One line may hold both a parse and a redirect; strip the legitimate shape and look again.
    if (/request\.url/.test(line.replace(PARSING, ""))) {
      problems.push(`${where}:${i + 1}  ${line.trim()}`);
    }
  });
}

if (problems.length > 0) {
  console.error(
    `no-request-url-redirects: ${problems.length} place${problems.length === 1 ? "" : "s"} ` +
      "build a redirect from request.url, which is http://0.0.0.0:3000 inside the container:\n",
  );
  for (const p of problems) console.error(`  ${p}`);
  console.error(
    "\nUse redirectBase(request) from @/lib/redirectBase. It prefers SITE_BASE_URL and falls back\n" +
      "to request.url, which is correct in `next dev` and nowhere else.",
  );
  process.exit(1);
}

console.log("no-request-url-redirects: no redirect is built from request.url.");

/**
 * Every refusal the platform's sign-up endpoint can answer with reaches the form as words.
 *
 * The sign-up form posts to `app/api/auth/[action]/route.ts`, which turns the API's error `code`
 * into a short slug and redirects to `/sign-up?error=<slug>`; the page looks the slug up in its
 * `ERRORS` table. A code the route does not know becomes "failed" - "That didn't work" - which is
 * how a new refusal goes out silently: the API says exactly what is wrong and the visitor is told
 * nothing. So this reads both files and checks the whole chain for each code the endpoint raises.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const APP = join(dirname(fileURLToPath(import.meta.url)), "..", "app");
const route = readFileSync(join(APP, "api", "auth", "[action]", "route.ts"), "utf8");
const page = readFileSync(join(APP, "sign-up", "page.tsx"), "utf8");

/** code -> slug, from the `if (code === "x") return "y";` lines of `reason()`. */
const slugs = new Map(
  [...route.matchAll(/if \(code === "([a-z_]+)"\) return "([a-z-]+)";/g)].map((m) => [m[1], m[2]]),
);

/** slug -> message, from the page's ERRORS table (keys quoted or bare, value on the same or next line). */
const messages = new Map(
  [...page.matchAll(/^\s*"?([a-z-]+)"?:\s*\n?\s*"([^"]+)",/gm)].map((m) => [m[1], m[2]]),
);

// What POST /api/auth/sign-up refuses with before anything is created (backend/app/api/auth.py).
const SIGN_UP_CODES = [
  "terms_not_accepted",
  "disposable_email",
  "work_email_required",
  "email_taken",
  "rate_limited",
  "signup_unavailable",
];

test("every sign-up refusal code has its own message on the form", () => {
  for (const code of SIGN_UP_CODES) {
    const slug = slugs.get(code);
    assert.ok(slug, `route.ts has no slug for ${code}, so the form would say "That didn't work"`);
    assert.ok(messages.has(slug), `sign-up/page.tsx has no message for ?error=${slug} (${code})`);
  }
});

test("a temporary inbox is told what the API says, not the free-mail message", () => {
  assert.equal(slugs.get("disposable_email"), "temp-email");
  assert.notEqual(slugs.get("disposable_email"), slugs.get("work_email_required"));
  assert.equal(
    messages.get("temp-email"),
    "Please sign up with your work email address. Temporary inbox addresses can't be used.",
  );
});

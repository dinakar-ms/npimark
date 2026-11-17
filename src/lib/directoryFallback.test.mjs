/**
 * The recovery page must keep carrying the marker monitoring reads.
 *
 * Since the four data-page families answer a refused read with a recovery state instead of an HTTP
 * 500, a 200 no longer means the page worked. `app/monitoring/checks.py` fetches a data page and
 * fails when this marker is in the body, which is the only way a check can tell the two 200s
 * apart.
 *
 * Nothing in this repository makes that dependency visible from the component's own file, so this
 * test is the dependency. It also pins the `noindex`, because the two travel together: the marker
 * says "this is the recovery page" and the noindex is why that page must never be cached.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const COMPONENT = join(HERE, "..", "components", "DirectoryFallback.tsx");
/** The Python check's own copy of the name. Read, not retyped. */
const CHECKS = join(HERE, "..", "..", "..", "backend", "app", "monitoring", "checks.py");

test("the recovery page carries the monitoring marker and refuses indexing", () => {
  const source = readFileSync(COMPONENT, "utf8");
  assert.match(
    source,
    /export const UNAVAILABLE_MARKER = "([^"]+)"/,
    "DirectoryFallback no longer exports UNAVAILABLE_MARKER. Monitoring reads it to tell a " +
      "recovery page from a working one, because both answer HTTP 200.",
  );
  const name = source.match(/export const UNAVAILABLE_MARKER = "([^"]+)"/)[1];
  assert.ok(
    source.includes(`<meta name={UNAVAILABLE_MARKER}`),
    `UNAVAILABLE_MARKER is declared but no meta tag uses it, so ${name} never reaches the HTML ` +
      "and the check that looks for it would report every outage as healthy.",
  );
  assert.ok(
    source.includes('<meta name="robots" content="noindex" />'),
    "the recovery page no longer refuses indexing. It is served on URLs we want indexed, so " +
      "without this a crawler records the outage as the page.",
  );
});

test("the marker is the same string the monitoring check looks for", () => {
  // Two languages, no shared constant possible, so the agreement is asserted instead. Getting this
  // wrong gives a check that passes through every outage and fails nothing - the worst shape.
  const name = readFileSync(COMPONENT, "utf8").match(
    /export const UNAVAILABLE_MARKER = "([^"]+)"/,
  )[1];
  let checks;
  try {
    checks = readFileSync(CHECKS, "utf8");
  } catch {
    // The site is built and tested without the backend beside it in some containers; a missing
    // file is not a failure of this contract, and the backend's own test asserts the other half.
    return;
  }
  // The full assignment, not a substring. `includes(name)` passed when the Python constant was
  // renamed to `npim-directory-renamed`, because the old name is a prefix of the new one - a
  // mutation test caught that, which is the only reason this line is not still wrong.
  assert.match(
    checks,
    new RegExp(`^UNAVAILABLE_MARKER = "${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"$`, "m"),
    `backend/app/monitoring/checks.py does not declare UNAVAILABLE_MARKER as exactly "${name}". ` +
      "The site emits that marker and the check looks for it; if the name changed on one side, " +
      "change it on both - otherwise the check passes through every outage and fails nothing.",
  );
});

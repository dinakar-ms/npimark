/**
 * A sitemap whose whole content is one API call must not answer 200 with nothing.
 *
 * On 19 October 2026 all twelve `/facility/sitemap/<n>.xml` chunks returned HTTP 200 with zero
 * URLs, for hours, while `/sitemap-index.xml` advertised all twelve. The read was failing - the
 * site's row allowance was spent - and a `catch { return [] }` turned "we could not read this"
 * into "we hold no facility profiles". Those are opposite claims and a crawler acts on the
 * second one.
 *
 * This is a source check rather than a request test on purpose: the failure needs the API to be
 * refusing to reproduce, which is not a state a unit test should have to arrange. What can be
 * asserted cheaply and forever is that the swallow is not there.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const APP = join(dirname(fileURLToPath(import.meta.url)), "..", "app");

/** Sitemaps whose entire body is one call, so a caught failure is a false claim, not degradation. */
const SINGLE_SOURCE = ["facility/sitemap.ts", "lists/sitemap.ts"];

test("a single-source sitemap does not turn a failed read into an empty file", () => {
  for (const relative of SINGLE_SOURCE) {
    const source = readFileSync(join(APP, relative), "utf8");
    // Any catch that yields an empty list, however it is spelled: `catch { return [] }`,
    // `catch (e) { return []; }`, `.catch(() => [])`.
    const swallows =
      /catch\s*(\([^)]*\))?\s*\{[^{}]*return\s*\[\s*\]/.test(source) ||
      /\.catch\s*\(\s*\(\s*[^)]*\)\s*=>\s*\[\s*\]\s*\)/.test(source);
    assert.equal(
      swallows,
      false,
      `${relative} answers an unreadable upstream with an empty sitemap. A 500 tells a crawler ` +
        "to ask again; an empty 200 tells it these pages are gone. If this file ever grows a " +
        "second independent source, move it out of SINGLE_SOURCE and say why in the comment.",
    );
  }
});

test("the mixed sitemap is deliberately allowed to drop one failing family", () => {
  // The inverse guard, so nobody "fixes" the consistency by making `sitemap.ts` throw. It carries
  // several independent families; one of them failing must not take the other six thousand URLs
  // down with it. If this assertion ever fails because the catches were removed, that was a
  // decision worth making on purpose rather than by tidying.
  const source = readFileSync(join(APP, "sitemap.ts"), "utf8");
  assert.match(
    source,
    /catch/,
    "sitemap.ts no longer degrades per family. Partial degradation there is the intended design: " +
      "it is one file built from several independent calls.",
  );
});

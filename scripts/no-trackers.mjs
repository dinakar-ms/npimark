/**
 * The guard that keeps this site free of tracking and advertising code.
 *
 * Why it is a test and not a promise
 * ----------------------------------
 * The Privacy Policy and the footer both state, in so many words, that we set only essential
 * cookies and load no advertising or tracking scripts. InfoDepots is a registered data broker, so
 * that sentence is a representation to regulators, not marketing copy. One "just add the tag for a
 * week" pull request would make it false, and nobody would notice from a diff. So the claim is
 * pinned here: if a known tracker's name appears anywhere under src/, this fails.
 *
 * Allow-list
 * ----------
 * Cloudflare Turnstile (challenges.cloudflare.com) is one third-party script the browser loads,
 * only on the forms, and it is disclosed in the Privacy Policy. It is not a tracker and is allowed
 * by name.
 *
 * Google Analytics 4 is the one measured exception, added 28 October 2026: it is disclosed in the
 * Privacy Policy ("Analytics, only if you allow it") and in the footer line, it loads nothing until
 * the visitor presses Allow, and only the files named in ANALYTICS_FILES may mention it - the
 * module that holds the rules, the consent bar that is the only loader, the switch on
 * /privacy-choices, and the test. A tracker name anywhere else under src/ still fails the build.
 * If another third party is genuinely needed, it goes in the policy text and in ALLOWED here, in
 * the same commit, deliberately.
 *
 * Runs with `npm run lint` (and on its own with `npm test`). No dependencies: node only.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const root = join(here, "..");
const src = join(root, "src");

/** Names that mean somebody is being tracked, profiled or advertised to. */
const BANNED = [
  "googletagmanager",
  "google-analytics",
  "gtag(",
  "facebook.net",
  "fbq(",
  "hotjar",
  "clarity.ms",
  "segment.com/analytics",
  "cdn.segment.com",
  "posthog",
  "plausible",
  "doubleclick",
  "snap.licdn.com",
  "_linkedin_partner_id",
  "linkedin insight",
  "mixpanel",
  "fullstory",
];

/** The third parties we do load, and say so. */
const ALLOWED = ["challenges.cloudflare.com"];

/** The consent-gated analytics integration: these files, and no others, may name Google's tag. */
const ANALYTICS_FILES = [
  "src/lib/analytics.ts",
  "src/lib/analytics.test.mjs",
  "src/components/AnalyticsConsent.tsx",
  "src/components/AnalyticsPreferences.tsx",
];

const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".css", ".json", ".md", ".txt"];

function files(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      out.push(...files(path));
    } else if (EXTENSIONS.some((ext) => name.endsWith(ext))) {
      out.push(path);
    }
  }
  return out;
}

/** Where the allow-listed names sit in this file, so a banned name inside one is not a hit. */
function allowedSpans(lower) {
  const spans = [];
  for (const ok of ALLOWED) {
    for (let at = lower.indexOf(ok); at >= 0; at = lower.indexOf(ok, at + ok.length)) {
      spans.push([at, at + ok.length]);
    }
  }
  return spans;
}

const hits = [];
for (const path of files(src)) {
  if (ANALYTICS_FILES.includes(relative(root, path).split(sep).join("/"))) continue;
  const text = readFileSync(path, "utf8");
  const lower = text.toLowerCase();
  const allowed = allowedSpans(lower);
  for (const banned of BANNED) {
    let from = 0;
    for (;;) {
      const at = lower.indexOf(banned, from);
      if (at < 0) break;
      from = at + banned.length;
      if (allowed.some(([start, end]) => at >= start && at < end)) continue;
      const line = text.slice(0, at).split("\n").length;
      hits.push(`${relative(root, path).split(sep).join("/")}:${line}  ${banned}`);
    }
  }
}

if (hits.length > 0) {
  console.error(
    "Tracking or advertising code found under site/src. The Privacy Policy and the site footer\n" +
      "both say we load none, and we are a registered data broker, so this is a promise we keep:\n",
  );
  for (const hit of hits) console.error(`  ${hit}`);
  console.error(
    "\nIf a third party is genuinely needed, disclose it in src/content/legal/privacy.ts and add\n" +
      "it to ALLOWED in scripts/no-trackers.mjs in the same commit.",
  );
  process.exit(1);
}

console.log(
  `no-trackers: ${BANNED.length} patterns, none found under site/src outside the ${ANALYTICS_FILES.length} consent-gated analytics files.`,
);

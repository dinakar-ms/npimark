// Two layout rules that a type-checker cannot state, each from a bug that shipped.
//
// Both are about a class being used somewhere its CSS was not written for. Nothing catches that:
// `className="ps-grid"` compiles, lints and renders - just not the way the author expected, and
// usually only at a width nobody tested. Both of these were found on 2026-10-03 by measuring the
// pages in a browser, because neither produced an error anywhere.
//
// Run by `npm run lint` and `npm test`.

import { readFileSync } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "src";

/** Every .tsx under src, with its text. */
function pages(dir = ROOT, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) pages(path, out);
    else if (path.endsWith(".tsx")) out.push([path.replaceAll("\\", "/"), readFileSync(path, "utf8")]);
  }
  return out;
}

const problems = [];

for (const [path, src] of pages()) {
  // ---- rule 1: a <select> may not live in a .searchbar -------------------------------
  //
  // `.searchbar` is the pill built around one input that grows. It does not wrap, and it has no
  // rule for a select - so a select keeps `min-width: auto` and will not shrink below its longest
  // option. A list named "Cardiology - Texas - Q4 (1,234)" pushed that row past a phone screen.
  // `.pickbar` is the one for a row of controls: it wraps, and everything in it may shrink.
  for (const form of src.matchAll(/<(form|div)\b[^>]*className="[^"]*\bsearchbar\b[^"]*"[^>]*>/g)) {
    const after = src.slice(form.index, src.indexOf("</" + form[1] + ">", form.index));
    if (/<select\b/.test(after)) {
      const line = src.slice(0, form.index).split("\n").length;
      problems.push(
        `${path}:${line}  a <select> inside .searchbar - use .pickbar, which wraps and lets a ` +
          `select shrink. .searchbar is the single-input pill and will run off a phone.`,
      );
    }
  }

  // ---- rule 3: no app page sets its own font size ------------------------------------
  //
  // The site's h1 is a marketing size - 62px at a laptop width - so every app page that wanted a
  // heading wrote `style={{ fontSize: "clamp(...)" }}` to escape it. Thirteen pages did, and they
  // did not agree: twelve used one clamp and /app used another. That is a type scale drifting by
  // repetition rather than by decision, and nothing caught it because each page was individually
  // reasonable.
  //
  // `.app-shell` now states the scale once. This keeps it the only place that does.
  // Only the signed-in area. The marketing pages set their own sizes on purpose - they are
  // individually composed, and the first version of this rule flagged 56 of them, which is what
  // a guard looks like when it is written one scope too wide.
  for (const m of path.startsWith("src/app/app/") ? src.matchAll(/style=\{\{[^}]*fontSize/g) : []) {
    const line = src.slice(0, m.index).split("\n").length;
    problems.push(
      `${path}:${line}  an inline fontSize in an app page - the scale is set once, on .app-shell ` +
        `in globals.css. If a heading is the wrong size there, change it there.`,
    );
  }

  // ---- rule 2: .ps-grid belongs to the provider search screen only --------------------
  //
  // Its first column is a fixed 290px, because it is the filter rail beside the results. Used as
  // a general card grid it puts one 290px card beside one elastic one - which on the campaign
  // builder made four equal destinations render as two narrow and two wide above 1000px, and
  // looked fine below that only because the rail layout collapses to one column there.
  if (/className="[^"]*\bps-grid\b/.test(src) && !path.endsWith("app/search/page.tsx")) {
    const line = src.slice(0, src.search(/className="[^"]*\bps-grid\b/)).split("\n").length;
    problems.push(
      `${path}:${line}  .ps-grid outside the provider search screen - it is the rail layout ` +
        `(a fixed 290px first column), not a card grid. Use .pick-cards, or a grid of your own.`,
    );
  }
}

if (problems.length > 0) {
  console.error("layout-rules: " + problems.length + " problem(s)\n");
  for (const p of problems) console.error("  " + p);
  process.exit(1);
}

console.log(
  "layout-rules: no .searchbar holds a select, .ps-grid is only on the search screen, and no " +
    "app page sets its own font size.",
);

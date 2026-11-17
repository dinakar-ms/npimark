#!/usr/bin/env node
/**
 * The accessibility failures a grep can prove, checked on every lint run.
 *
 * This is deliberately not a browser audit: it looks for the three defects that are always
 * wrong no matter how the page renders, and it is tuned to have no false positives, because a
 * check that cries wolf gets commented out.
 *
 *   1. `<img>` with no `alt` - a screen reader then reads the file name.
 *   2. A form control with no name: no `<label for>`, no wrapping `<label>`, no `aria-label`.
 *   3. A link or button whose children are only an icon - nothing to announce and nothing to
 *      say in a list of links.
 *
 * Anything it cannot decide, it leaves alone. A control whose children include an expression
 * (`{label}`) might carry text at runtime, so it is never flagged; a control that carries a
 * `title` is named, if awkwardly. Run: `node scripts/a11y-static.mjs` (part of `npm run lint`).
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = dirname(dirname(fileURLToPath(import.meta.url)));
const SRC = join(SITE, "src");

/** Every .tsx under src, which is where markup lives. */
function sources(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) sources(path, out);
    else if (name.endsWith(".tsx")) out.push(path);
  }
  return out;
}

const line = (src, index) => src.slice(0, index).split("\n").length;

/** The text of one opening tag starting at `index`, quotes and braces respected. */
function openingTag(src, index) {
  let depth = 0;
  let quote = "";
  for (let i = index; i < src.length; i += 1) {
    const c = src[i];
    if (quote) {
      if (c === quote) quote = "";
      continue;
    }
    if (c === '"' || c === "'" || c === "`") quote = c;
    else if (c === "{") depth += 1;
    else if (c === "}") depth -= 1;
    else if (c === ">" && depth === 0) return src.slice(index, i + 1);
  }
  return src.slice(index);
}

/** True when `tag` carries `name` as an attribute (`name=`, or bare for booleans). */
function has(tag, name) {
  return new RegExp(`(?:^|[\\s{])${name}(?=[=\\s/>}])`).test(tag);
}

/** Every opening tag of `element` in `src`, as [index, text]. */
function tags(src, element) {
  const found = [];
  const re = new RegExp(`<${element}(?=[\\s/>])`, "g");
  let m;
  while ((m = re.exec(src))) found.push([m.index, openingTag(src, m.index)]);
  return found;
}

/** Whether position `at` sits inside a <label> element. */
function insideLabel(src, at) {
  const before = src.slice(0, at);
  const opens = (before.match(/<label(?=[\s/>])/g) ?? []).length;
  const closes = (before.match(/<\/label>/g) ?? []).length;
  return opens > closes;
}

const NAMED = ["aria-label", "aria-labelledby", "title"];
const named = (tag) => NAMED.some((a) => has(tag, a));

/** Control types that are their own label, or carry no name of their own. */
const SELF_LABELLING = /type=["'](?:hidden|submit|button|reset|image)["']/;

const problems = [];
const report = (file, index, src, message) =>
  problems.push(`${relative(SITE, file).replace(/\\/g, "/")}:${line(src, index)}  ${message}`);

for (const file of sources(SRC)) {
  const src = readFileSync(file, "utf8");

  // 1. An image with no alternative text. `alt=""` is a decision and passes.
  for (const [index, tag] of tags(src, "img")) {
    if (!has(tag, "alt")) report(file, index, src, "<img> has no alt attribute");
  }

  // 2. A form control with no accessible name.
  for (const element of ["input", "select", "textarea"]) {
    for (const [index, tag] of tags(src, element)) {
      if (element === "input" && SELF_LABELLING.test(tag)) continue;
      // `hidden` keeps the control out of the accessibility tree, so it needs no name. The
      // sign-in forms use one to tell a password manager which account a password belongs to.
      if (has(tag, "hidden")) continue;
      if (named(tag)) continue;
      if (insideLabel(src, index)) continue;
      const id = /\sid=(?:"([^"]*)"|\{([^}]*)\})/.exec(tag);
      if (!id) {
        report(file, index, src, `<${element}> has no label, id or aria-label`);
        continue;
      }
      const wanted = id[1] !== undefined ? `"${id[1]}"` : `{${id[2]}}`;
      const htmlFor = new RegExp(`htmlFor=${wanted.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
      if (!htmlFor.test(src)) {
        report(file, index, src, `<${element} id=${wanted}> has no <label htmlFor> in this file`);
      }
    }
  }

  // 3. A link or button whose whole content is an icon.
  for (const element of ["a", "button", "Link"]) {
    for (const [index, tag] of tags(src, element)) {
      if (tag.endsWith("/>") || named(tag)) continue;
      const start = index + tag.length;
      const end = src.indexOf(`</${element}>`, start);
      if (end < 0) continue;
      const children = src.slice(start, end);
      // Anything that could be text at runtime - a word, an entity, an expression - names it.
      const withoutTags = children.replace(/<[^>]*>/g, "");
      if (/[^\s]/.test(withoutTags)) continue;
      // Only an element (an inline <svg> or an <IconFoo />) is left: that is an icon alone.
      if (/<[A-Za-z]/.test(children)) {
        report(file, index, src, `<${element}> has only an icon for content and no aria-label`);
      }
    }
  }
}

if (problems.length > 0) {
  console.error(`a11y-static: ${problems.length} problem${problems.length === 1 ? "" : "s"}`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}
console.log("a11y-static: no image, form-label or icon-only-control problems");

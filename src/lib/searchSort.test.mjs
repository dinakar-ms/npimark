// Run with `npm test` (node --test; Node strips the types from the imported .ts files).
import assert from "node:assert/strict";
import { test } from "node:test";

import { DEFAULT_SORT, SORTS, nextSort, readSort, sortHref } from "./searchSort.ts";

test("a bare field name is ascending, a leading minus is descending", () => {
  assert.deepEqual(readSort("name"), { field: "name", descending: false });
  assert.deepEqual(readSort("-updated_at"), { field: "updated_at", descending: true });
});

test("a field the platform does not sort by falls back to the default, not to an empty page", () => {
  // The reason this is an allow-list: `sort=employer_name` reaches the API as a field name it
  // does not know, which is a 422, which arrives on the page as nothing matched. A hand-edited
  // URL should show the first page of results in the default order instead.
  for (const raw of ["employer_name", "-employer_name", "'; drop table", "", undefined]) {
    assert.deepEqual(readSort(raw), DEFAULT_SORT, `expected the default for ${String(raw)}`);
  }
});

test("a lone minus is not a field", () => {
  assert.deepEqual(readSort("-"), DEFAULT_SORT);
});

test("clicking the column you are on reverses it; clicking another starts it ascending", () => {
  const byName = { field: "name", descending: false };
  assert.equal(nextSort(byName, "name"), "-name");
  assert.equal(nextSort({ field: "name", descending: true }, "name"), "name");
  assert.equal(nextSort(byName, "city"), "city");
});

test("the header's link keeps everything the page is already showing", () => {
  const here = "q=cardiology&state=TX&page=3&sort=name";
  const url = new URL(sortHref(here, { field: "name", descending: false }, "city"), "https://x");
  assert.equal(url.searchParams.get("q"), "cardiology");
  assert.equal(url.searchParams.get("state"), "TX");
  assert.equal(url.searchParams.get("page"), "3");
});

test("the order is replaced, never appended - two sorts would mean the first one wins", () => {
  // `here` always carries the current ordering, so appending would produce `sort=name&sort=city`,
  // which the platform reads as `name`: every header would look clickable and change nothing.
  const here = "q=cardiology&sort=name";
  const href = sortHref(here, { field: "name", descending: false }, "city");
  assert.equal(href.match(/sort=/g).length, 1);
  assert.equal(new URL(href, "https://x").searchParams.get("sort"), "city");
});

test("reversing the column you are on round-trips through readSort", () => {
  // The loop a person actually does: click a header, then click it again.
  let sort = readSort(undefined);
  const next = () => {
    const href = sortHref("q=x", sort, "city");
    sort = readSort(new URL(href, "https://x").searchParams.get("sort"));
  };
  next();
  assert.deepEqual(sort, { field: "city", descending: false });
  next();
  assert.deepEqual(sort, { field: "city", descending: true });
  next();
  assert.deepEqual(sort, { field: "city", descending: false });
});

test("every sortable field names a column header", () => {
  // A field with no header is a field nobody can reach, and a header for a field the platform
  // does not declare is a 422 waiting to happen. Both directions are checked where they can be:
  // this half is the one this file can see.
  for (const [field, header] of Object.entries(SORTS)) {
    assert.ok(header.length > 0, `${field} has no header`);
    assert.deepEqual(readSort(field), { field, descending: false });
    assert.deepEqual(readSort(`-${field}`), { field, descending: true });
  }
});

import { NextResponse } from "next/server";
import { formReader, searchFilters } from "@/lib/searchFilters";
import {
  addSearchToList,
  addToList,
  createList,
  deleteList,
  removeFromList,
} from "@/lib/session";
import { redirectBase } from "@/lib/redirectBase";

/**
 * Create, delete and change the membership of a customer's lists.
 *
 * Plain form posts that redirect, like every other action on this site, so they work with no
 * JavaScript and a refresh cannot post twice.
 *
 * Where it sends the browser afterwards is the only interesting part. A list is almost always
 * built from somewhere else - a search, a list page, a provider - and dropping somebody back on
 * /app/lists after they ticked eight rows on page three of a search would lose the search. So
 * `return_to` carries where they were, and is checked here rather than trusted: only a path on
 * this site, which is what stops a form on another site using this endpoint as a redirector.
 */

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;
const NPI = /^\d{10}$/;

/**
 * Where to send the browser back to.
 *
 * A relative path on this site or nothing. Rejecting anything that starts with `//` matters as
 * much as rejecting `https://`: a browser reads `//evil.example` as a protocol-relative URL to
 * another host, so a check for a leading slash alone is an open redirect.
 */
function destination(raw: unknown, base: string): URL {
  const path = typeof raw === "string" ? raw : "";
  if (path.startsWith("/") && !path.startsWith("//")) {
    try {
      return new URL(path, base);
    } catch {
      // A path the URL parser refuses is not one to send a browser to.
    }
  }
  return new URL("/app/lists", base);
}

/** The NPIs the form ticked. Capped: a form is not a bulk loader, and the Append tool takes files. */
const MAX_PER_POST = 1000;

function npisFrom(form: FormData): string[] {
  const seen = new Set<string>();
  for (const value of form.getAll("npi")) {
    const npi = String(value).trim();
    if (NPI.test(npi)) seen.add(npi);
    if (seen.size >= MAX_PER_POST) break;
  }
  return [...seen];
}

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const base = redirectBase(request);
  const action = String(form.get("action") ?? "");
  const back = destination(form.get("return_to"), base);

  if (action === "delete") {
    const id = String(form.get("id") ?? "");
    if (!UUID.test(id)) {
      back.searchParams.set("error", "not_found");
      return NextResponse.redirect(back, 303);
    }
    const done = await deleteList(id);
    // Deleting the list you are standing on cannot redirect back to it.
    const after = back.pathname.startsWith(`/app/lists/${id}`)
      ? new URL("/app/lists", base)
      : back;
    after.searchParams.set(done ? "deleted" : "error", done ? "1" : "failed");
    return NextResponse.redirect(after, 303);
  }

  if (action === "remove") {
    const id = String(form.get("id") ?? "");
    const npis = npisFrom(form);
    if (!UUID.test(id)) {
      back.searchParams.set("error", "not_found");
      return NextResponse.redirect(back, 303);
    }
    if (npis.length === 0) {
      back.searchParams.set("error", "nothing-chosen");
      return NextResponse.redirect(back, 303);
    }
    const done = await removeFromList(id, npis);
    if (!done) back.searchParams.set("error", "failed");
    else back.searchParams.set("removed", String(npis.length));
    return NextResponse.redirect(back, 303);
  }

  // Everyone the search matches, not the rows this page rendered. The form carries the search's
  // own filters - the same hidden fields the export form uses, built from the one list - so the
  // set added is the set the row count above the button was counted from.
  //
  // It needs a list that already exists: creating one *and* filling it from a search in a single
  // post would make an accidental double-submit create two large lists, and the name is the only
  // thing distinguishing them.
  if (action === "add-all") {
    const chosen = String(form.get("destination_list_id") ?? "");
    if (!UUID.test(chosen)) {
      back.searchParams.set("error", "needs-list-for-all");
      return NextResponse.redirect(back, 303);
    }
    const [read, readAll] = formReader(form);
    const filters = searchFilters(read, readAll);
    // A search nobody narrowed is the whole register. The platform caps what one call adds, but
    // the honest refusal is here, before 25,000 strangers are on somebody's list.
    const narrowed = Object.keys(filters).filter((name) => name !== "status");
    if (narrowed.length === 0) {
      back.searchParams.set("error", "needs-a-narrower-search");
      return NextResponse.redirect(back, 303);
    }
    const result = await addSearchToList(chosen, filters as Record<string, string | string[]>);
    if (!result.ok) {
      back.searchParams.set("error", result.code);
      return NextResponse.redirect(back, 303);
    }
    back.searchParams.set("added", String(result.data.added));
    back.searchParams.set("already", String(result.data.already));
    if (result.data.capped) back.searchParams.set("capped", String(result.data.cap));
    back.searchParams.set("list", chosen);
    return NextResponse.redirect(back, 303);
  }

  // Adding to a list, and creating one on the way if that is what was chosen. One form does both
  // because that is one decision to the person using it: "put these somewhere", new or existing.
  if (action === "add") {
    const npis = npisFrom(form);
    if (npis.length === 0) {
      back.searchParams.set("error", "nothing-chosen");
      return NextResponse.redirect(back, 303);
    }
    const chosen = String(form.get("list_id") ?? "");
    const name = String(form.get("name") ?? "").trim();

    if (chosen === "new" || (!UUID.test(chosen) && name)) {
      if (!name) {
        back.searchParams.set("error", "needs-name");
        return NextResponse.redirect(back, 303);
      }
      const made = await createList({ name, npis });
      if (!made.ok) {
        back.searchParams.set("error", made.code === "conflict" ? "conflict" : made.code);
        return NextResponse.redirect(back, 303);
      }
      back.searchParams.set("added", String(made.data.member_count));
      back.searchParams.set("list", made.data.id);
      return NextResponse.redirect(back, 303);
    }

    if (!UUID.test(chosen)) {
      back.searchParams.set("error", "needs-list");
      return NextResponse.redirect(back, 303);
    }
    const before = npis.length;
    const result = await addToList(chosen, npis);
    if (!result.ok) {
      back.searchParams.set("error", result.code);
      return NextResponse.redirect(back, 303);
    }
    // What to claim. The platform returns the list's new total, not how many of these were new,
    // so saying "8 added" when six were already there would be wrong. The count of what was sent
    // is the honest number, and the list's own total is on the list page.
    back.searchParams.set("added", String(before));
    back.searchParams.set("list", chosen);
    return NextResponse.redirect(back, 303);
  }

  // Creating an empty list from the lists page.
  if (action === "create") {
    const name = String(form.get("name") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    if (!name) {
      back.searchParams.set("error", "needs-name");
      return NextResponse.redirect(back, 303);
    }
    const made = await createList({ name, description, npis: npisFrom(form) });
    if (!made.ok) {
      back.searchParams.set("error", made.code === "conflict" ? "conflict" : made.code);
      return NextResponse.redirect(back, 303);
    }
    return NextResponse.redirect(new URL(`/app/lists/${made.data.id}`, base), 303);
  }

  back.searchParams.set("error", "failed");
  return NextResponse.redirect(back, 303);
}

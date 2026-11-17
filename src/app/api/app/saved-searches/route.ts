import { NextResponse } from "next/server";
import { formReader, searchFilters } from "@/lib/searchFilters";
import { createSavedSearch, deleteSavedSearch } from "@/lib/session";
import { redirectBase } from "@/lib/redirectBase";

/**
 * Keep a search by name, and forget one.
 *
 * Plain form posts that redirect, like every other action on this site.
 *
 * The filters are read with `searchFilters` - the one list - rather than forwarded as whatever the
 * form happened to carry. That matters more here than anywhere else, because a saved search is
 * the only thing on this site that stores a filter set and reads it back *days* later: a name the
 * platform does not accept would be refused at save time rather than discovered on the morning
 * somebody tried to re-run it.
 */

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;

function back(raw: unknown, base: string): URL {
  const path = typeof raw === "string" ? raw : "";
  if (path.startsWith("/") && !path.startsWith("//")) {
    try {
      return new URL(path, base);
    } catch {
      // A path the URL parser refuses is not one to send a browser to.
    }
  }
  return new URL("/app/search", base);
}

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const base = redirectBase(request);
  const here = back(form.get("return_to"), base);
  const action = String(form.get("action") ?? "save");

  if (action === "delete") {
    const id = String(form.get("id") ?? "");
    if (!UUID.test(id)) {
      here.searchParams.set("saved_error", "not_found");
      return NextResponse.redirect(here, 303);
    }
    const done = await deleteSavedSearch(id);
    here.searchParams.set(done ? "forgot" : "saved_error", done ? "1" : "failed");
    return NextResponse.redirect(here, 303);
  }

  const name = String(form.get("name") ?? "").trim();
  if (!name) {
    here.searchParams.set("saved_error", "needs-name");
    return NextResponse.redirect(here, 303);
  }

  const [read, readAll] = formReader(form);
  const params = searchFilters(read, readAll);
  // A search with nothing on it is not worth a name, and saving one would put a row called
  // "Everyone" in front of somebody who then wonders what it was for. `status` is always present.
  if (Object.keys(params).filter((key) => key !== "status").length === 0) {
    here.searchParams.set("saved_error", "nothing-to-save");
    return NextResponse.redirect(here, 303);
  }

  const made = await createSavedSearch({
    name,
    params: params as Record<string, string | string[]>,
  });
  if (!made.ok) {
    here.searchParams.set("saved_error", made.code === "conflict" ? "conflict" : made.code);
    return NextResponse.redirect(here, 303);
  }
  here.searchParams.set("kept", made.data.name);
  return NextResponse.redirect(here, 303);
}

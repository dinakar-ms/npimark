import { NextResponse } from "next/server";
import { formatOrDefault, presetOrDefault } from "@/lib/exportPresets";
import { formReader, searchFilters } from "@/lib/searchFilters";
import { startExport } from "@/lib/session";
import { redirectBase } from "@/lib/redirectBase";
import { selectionQuery } from "@/lib/selectionQuery";

/**
 * Queue an export — from the form on /app/exports, and from the Export control on /app/search and
 * /app/alerts.
 *
 * The column preset and the format are posted as *ids* and checked here against the lists the site
 * offers, so a caller cannot ask for something the product does not offer by editing the form. The
 * columns each preset means are the API's, resolved there; this handler never names a column. The
 * API validates the ids again — this is the cheaper of the two refusals, not a replacement for it.
 *
 * `return_to` is where the browser lands afterwards, so exporting from a search does not throw away
 * the search. It is only ever a path on this site: anything else is dropped and the customer goes
 * to /app/exports, because a redirect that follows whatever it was handed is an open redirect.
 */

export const dynamic = "force-dynamic";

/**
 * Which filters can be carried, and in what shapes, is `lib/searchFilters.ts` - the same module the
 * search screen builds its request with. It used to be three separate lists in this file, and they
 * were twelve filters short of what the screen offered: a search narrowed to Austin with trusted
 * emails exported the whole of Texas, billed by the row.
 *
 * The claims filters are also the ones the `claims` preset answers to. A search narrowed to the
 * providers who bill a procedure used to produce a file that could not say so; the preset carries
 * the published-volume summary, and it arrives here as an id like every other preset, so nothing in
 * this handler names a column in order to reach it.
 */

/** A path on this site, or null. Never an absolute URL, and never a protocol-relative one. */
function safeReturn(raw: unknown): string | null {
  const value = String(raw ?? "");
  return /^\/app\/[A-Za-z0-9/_\-?&=,.%]*$/.test(value) && !value.startsWith("/app//")
    ? value
    : null;
}

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const preset = presetOrDefault(form.get("preset"));
  const format = formatOrDefault(form.get("format"));
  const back = new URL(safeReturn(form.get("return_to")) ?? "/app/exports", redirectBase(request));

  // Machine selections must never turn into an unrestricted, billable export.
  // Normalize legacy links and reject malformed/oversized selections before the API call.
  const selection = selectionQuery({
    ...(form.has("npi") ? { npi: form.getAll("npi").map(String) } : {}),
    ...(form.has("npis") ? { npis: form.getAll("npis").map(String) } : {}),
  });
  if (!selection.ok) {
    back.searchParams.set("error", "validation_error");
    return NextResponse.redirect(back, 303);
  }
  if (selection.params.npi) {
    form.delete("npi");
    form.delete("npis");
    const selected = Array.isArray(selection.params.npi) ? selection.params.npi : [selection.params.npi];
    for (const npi of selected) form.append("npi", npi);
  }

  // Every filter the search screen offers, read back through the same module it sent them with, so
  // the file is the search that was counted. This handler used to keep its own list and it was
  // twelve filters short of the screen's - see lib/searchFilters.ts for what that cost.
  //
  // Still an allow-list, and still re-validated: this is a POST, so the body is whatever arrived,
  // and nothing reaches the API in a shape it would refuse. What this handler does *not* decide is
  // whether the caller may use a filter - the API refuses out loud, and a second opinion here is how
  // two answers drift apart.
  const filters = searchFilters(...formReader(form));
  if (String(form.get("npi_list") ?? "").trim() && !filters.npi) {
    back.searchParams.set("error", "validation_error");
    return NextResponse.redirect(back, 303);
  }

  const result = await startExport(filters, preset, format);
  if (!result.ok) {
    back.searchParams.set("error", result.code || "failed");
    return NextResponse.redirect(back, 303);
  }
  back.searchParams.set("queued", "1");
  return NextResponse.redirect(back, 303);
}

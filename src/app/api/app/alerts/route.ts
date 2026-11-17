import { NextResponse } from "next/server";
import { ALERT_EVENT_LABELS, createAlert, deleteAlert, setAlertActive } from "@/lib/session";
import { redirectBase } from "@/lib/redirectBase";

/**
 * Save, pause, resume and delete standing alerts - the forms on /app/search and /app/alerts.
 *
 * Plain form posts that redirect, like every other action on this site, so they work with no
 * JavaScript and a refresh cannot post twice.
 *
 * The filters a new alert captures are named here, one by one, rather than forwarded as whatever
 * the form happened to hold, under the names the API's provider search uses. The API validates them
 * again with the search's own code; this is the cheaper of the two refusals, not a replacement for
 * it.
 *
 * These four were "the four the search page offers" when that was the whole of it. The page offers
 * around twenty-five now, and an alert still watches these four - deliberately, for the moment,
 * rather than by oversight: a standing watch is not a search somebody is looking at, so widening it
 * is a product decision and not a carry-through fix. Two things would need deciding first. A
 * residence filter here would be a standing query over licensed consumer data, running on a
 * schedule against no allowance. And an alert silently narrowed by a place or reachability filter
 * that was set once, months ago, is worse than one that watches too much. Until then the note beside
 * the form on /app/search says which four it is, so the screen does not claim otherwise.
 */

export const dynamic = "force-dynamic";

const CADENCES = new Set(["daily", "weekly"]);

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const action = String(form.get("action") ?? "create");
  const back = new URL("/app/alerts", redirectBase(request));

  if (action === "pause" || action === "resume" || action === "delete") {
    const id = String(form.get("id") ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      back.searchParams.set("error", "not_found");
      return NextResponse.redirect(back, 303);
    }
    const done =
      action === "delete" ? await deleteAlert(id) : await setAlertActive(id, action === "resume");
    if (!done) {
      back.searchParams.set("error", "failed");
    } else if (action === "delete") {
      back.searchParams.set("deleted", "1");
    } else {
      back.searchParams.set("updated", "1");
      back.searchParams.set("alert", id);
    }
    return NextResponse.redirect(back, 303);
  }

  const filters: Record<string, string> = {};
  const q = String(form.get("q") ?? "").trim();
  const state = String(form.get("state") ?? "").trim();
  const classification = String(form.get("classification") ?? "").trim();
  const type = String(form.get("type") ?? "").trim();
  if (q) filters.q = q.slice(0, 200);
  if (state) filters.state = state;
  if (classification) filters.taxonomy_classification = classification;
  if (type) filters.type = type;

  const eventTypes = form
    .getAll("event_types")
    .map(String)
    .filter((value) => value in ALERT_EVENT_LABELS);
  const cadence = String(form.get("cadence") ?? "weekly");
  const name = String(form.get("name") ?? "").trim().slice(0, 120);

  if (!name || eventTypes.length === 0) {
    back.searchParams.set("error", "needs-name-and-events");
    return NextResponse.redirect(back, 303);
  }

  const result = await createAlert({
    name,
    filters,
    event_types: eventTypes,
    cadence: CADENCES.has(cadence) ? cadence : "weekly",
  });
  if (!result.ok) {
    back.searchParams.set("error", result.code || "failed");
    return NextResponse.redirect(back, 303);
  }
  back.searchParams.set("saved", "1");
  back.searchParams.set("alert", result.data.id);
  return NextResponse.redirect(back, 303);
}

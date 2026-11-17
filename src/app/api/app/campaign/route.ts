import { NextResponse } from "next/server";
import { destination } from "@/lib/campaign";
import { formatOrDefault, presetOrDefault } from "@/lib/exportPresets";
import { formReader, searchFilters } from "@/lib/searchFilters";
import { startActivationExport, startExport } from "@/lib/session";
import { redirectBase } from "@/lib/redirectBase";

/**
 * The last step of the campaign builder: hand the audience to the channel.
 *
 * Three of the four destinations are an ordinary export with the preset that suits them, and the
 * fourth is the activation job. This route exists rather than four forms pointing at two existing
 * endpoints because the *choice* has to be made in one place: a destination that silently fell
 * back to the default preset would hand somebody a file their sequencer cannot map, and they would
 * find out after uploading it.
 *
 * The filters are read with `searchFilters` - the one list - exactly as the export route does, so
 * the campaign's audience is the search that was counted on the screen. `list_id` is a filter like
 * any other, which is what lets a campaign be built from a list without this route knowing what a
 * list is.
 */

export const dynamic = "force-dynamic";

function back(raw: unknown, base: string): URL {
  const path = typeof raw === "string" ? raw : "";
  if (path.startsWith("/") && !path.startsWith("//")) {
    try {
      return new URL(path, base);
    } catch {
      // A path the URL parser refuses is not one to send a browser to.
    }
  }
  return new URL("/app/campaigns", base);
}

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const base = redirectBase(request);
  const here = back(form.get("return_to"), base);

  const chosen = destination(String(form.get("destination") ?? ""));
  if (!chosen) {
    here.searchParams.set("error", "needs-destination");
    return NextResponse.redirect(here, 303);
  }

  const [read, readAll] = formReader(form);
  const filters = searchFilters(read, readAll);

  // An audience has to be *an* audience. Without this, a destination chosen on an empty form would
  // queue the whole register - the most expensive possible accident, and one the row estimate on
  // the screen would not have warned about because there was no screen.
  const narrowed = Object.keys(filters).filter((name) => name !== "status");
  if (narrowed.length === 0) {
    here.searchParams.set("error", "needs-audience");
    return NextResponse.redirect(here, 303);
  }

  if (chosen.id === "activation") {
    // The platform refuses a residence filter on this file and says why: it is built from provider
    // data only. Refused here too, in the same words, rather than sending it to be refused - the
    // screen would otherwise show a validation error from an endpoint the customer never chose.
    const residence = ["has_home_address", "has_cell_phone", "home_state", "practice_home_relation"];
    if (residence.some((name) => name in filters)) {
      here.searchParams.set("error", "activation-residence");
      return NextResponse.redirect(here, 303);
    }
    const onlyTrusted = String(form.get("only_trusted_emails") ?? "true") !== "false";
    const queued = await startActivationExport(
      filters as Record<string, string | string[]>,
      onlyTrusted,
    );
    if (!queued.ok) {
      here.searchParams.set("error", queued.code);
      return NextResponse.redirect(here, 303);
    }
    return NextResponse.redirect(new URL("/app/exports?queued=1", base), 303);
  }

  // A destination with a preset of its own uses it; the CRM destination lets the form choose
  // between the four shaped sets, because which CRM is the customer's to say.
  const preset = chosen.preset ?? presetOrDefault(form.get("preset"));
  const format = formatOrDefault(form.get("format"));
  const queued = await startExport(filters as Record<string, string | string[]>, preset, format);
  if (!queued.ok) {
    here.searchParams.set("error", queued.code);
    return NextResponse.redirect(here, 303);
  }
  return NextResponse.redirect(new URL("/app/exports?queued=1", base), 303);
}

import { NextResponse } from "next/server";
import { apiPost } from "@/lib/session";
import { redirectBase } from "@/lib/redirectBase";

/**
 * Stops - or restores - one kind of optional email, for whoever holds the token.
 *
 * Two callers, one handler:
 *
 * * the button on /email-preferences, which posts `token`, `want` and `redirect=1` and wants a page
 *   back, so it is answered with a 303 to that page carrying the outcome;
 * * a mail client's own one-click button (RFC 8058), which posts `List-Unsubscribe=One-Click` to
 *   this URL with the token in the query string and wants a bare 2xx. It is never redirected: mail
 *   clients do not follow, and some treat a 3xx as a failure.
 *
 * A POST, and only a POST, because mail scanners and link previewers fetch every URL they are sent
 * and a GET that unsubscribed would take people off mail they never asked to stop. The token is the
 * whole credential; the API verifies its signature and decides what it may change, so nothing here
 * has to be trusted.
 */

export const dynamic = "force-dynamic";

/** The kinds a token may name. Anything else is refused before the API is asked. */
const KINDS = ["alert_digests", "allowance_warnings"];

function back(request: Request, token: string, state: string) {
  const url = new URL("/email-preferences", redirectBase(request));
  if (token) url.searchParams.set("token", token);
  url.searchParams.set("state", state);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData().catch(() => new FormData());
  const field = (name: string) => String(form.get(name) ?? "").trim();
  const query = new URL(request.url).searchParams;
  const token = (field("token") || (query.get("token") ?? "")).trim().slice(0, 200);
  const wantsPage = field("redirect") === "1";
  const on = field("want") === "on";

  if (!token) {
    return wantsPage
      ? back(request, "", "missing")
      : new NextResponse("No token.", { status: 400 });
  }

  // Turning it back on names the kind explicitly, so the kind is read out of the token. The API
  // checks the signature over that same pair, so a token with the kind edited verifies as nothing.
  const kind = token.split(".")[1];
  if (on && !KINDS.includes(kind)) {
    return wantsPage ? back(request, token, "invalid") : new NextResponse("No.", { status: 400 });
  }

  const result = on
    ? await apiPost<unknown>("/api/email-preferences", { token, [kind]: true }).catch(() => null)
    : await apiPost<unknown>("/api/email-preferences/unsubscribe", { token }).catch(() => null);

  if (!wantsPage) {
    // One-click. 2xx means "done"; anything else and the client will show its own failure.
    return new NextResponse(result?.ok ? "Done." : "Could not do that.", {
      status: result?.ok ? 200 : 502,
    });
  }
  if (result?.ok) return back(request, token, on ? "on" : "off");
  return back(request, token, result && result.status === 404 ? "invalid" : "failed");
}

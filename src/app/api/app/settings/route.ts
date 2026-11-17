import { NextResponse } from "next/server";
import {
  getMe,
  renamePerson,
  setEmailPreferences,
  type ApiResult,
} from "@/lib/session";
import { redirectBase } from "@/lib/redirectBase";

/**
 * The settings a person changes about themselves: their display name, the optional mail they get,
 * and ending every session they hold.
 *
 * Plain form posts answered with a redirect, like the rest of the signed-in site, so there is no
 * client JavaScript in the account pages and a refresh cannot repost anything that matters.
 *
 * Signing out everywhere is the one action here that takes the session away from the person asking
 * for it, which is the point: a session that survived would be the one they wanted gone. So it
 * clears this site's cookie itself rather than leaving a dead token in the jar, and lands on the
 * sign-in page rather than on a settings page that would immediately bounce.
 *
 * The API decides who may do what. A name change needs `users.manage` there, so somebody without it
 * gets a refusal here rather than a field that silently does nothing - and the page does not show
 * them the field in the first place.
 */

export const dynamic = "force-dynamic";

const PAGE = "/app/settings";
const EMAIL_PAGE = "/app/settings/email";

function back(request: Request, page: string, params: Record<string, string>) {
  const url = new URL(page, redirectBase(request));
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return NextResponse.redirect(url, 303);
}

function signedOut(request: Request) {
  return NextResponse.redirect(new URL("/sign-in?error=signed-out", redirectBase(request)), 303);
}

/** The one error code a page can say something specific about, or a generic failure. */
function reason(result: Extract<ApiResult<unknown>, { ok: false }>): string {
  if (result.code === "forbidden") return "forbidden";
  if (result.code === "validation_error") return "name-invalid";
  return "failed";
}

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const action = String(form.get("action") ?? "");
  const me = await getMe();
  if (!me) return signedOut(request);

  if (action === "name") {
    const name = String(form.get("name") ?? "").trim();
    if (!name) return back(request, PAGE, { error: "name-missing" });
    const result = await renamePerson(me.id, name);
    if (result.ok) return back(request, PAGE, { notice: "name-changed" });
    if (result.status === 401) return signedOut(request);
    return back(request, PAGE, { error: reason(result) });
  }

  if (action === "email-preferences") {
    // An unchecked checkbox is simply absent from the form, so both switches are sent every time
    // rather than only the ones that are on - otherwise switching one off would be indistinguishable
    // from leaving it alone.
    const result = await setEmailPreferences({
      alert_digests: form.get("alert_digests") !== null,
      allowance_warnings: form.get("allowance_warnings") !== null,
    });
    if (result.ok) return back(request, EMAIL_PAGE, { notice: "saved" });
    if (result.status === 401) return signedOut(request);
    return back(request, EMAIL_PAGE, { error: "failed" });
  }

  return new NextResponse("Not found", { status: 404 });
}

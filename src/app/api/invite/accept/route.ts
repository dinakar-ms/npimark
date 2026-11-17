import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { apiPost, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";
import { redirectBase } from "@/lib/redirectBase";

/**
 * Accepts an invitation: creates the account and signs the new person in.
 *
 * A POST only, because a GET is fetched by mail scanners and link previewers and an invitation can
 * be used once - the page at /invite/[token] reads the invitation and puts the token in a hidden
 * field behind a button, exactly as /reset-password and the removal confirmation do.
 *
 * The password exists in this process for one request and is written nowhere. `apiPost` fetches a
 * CSRF token and sends it as both cookie and header, the way every other form here reaches the
 * API, and the session the API issues is kept in an httpOnly cookie of this origin rather than
 * handed to the browser as a cross-origin one.
 *
 * Failures come back as a redirect carrying a code rather than a rendered error, so a refresh
 * cannot repost the password and the URL never carries what was typed.
 */

export const dynamic = "force-dynamic";

function back(request: Request, token: string, error?: string) {
  const url = new URL(`/invite/${encodeURIComponent(token)}`, redirectBase(request));
  if (error) url.searchParams.set("error", error);
  return NextResponse.redirect(url, 303);
}

/** The API's refusal, in the words the page has for it. */
function reason(code: string, status: number): string {
  // Not enough seats for this invitation any more - the plan shrank under it. The invitation is
  // not spent by the refusal, so the page says the link still works and to come back once there is
  // room. It does not suggest getting a colleague removed: that is an admin's call, not the
  // invitee's, and telling them otherwise is how a refusal becomes a support ticket.
  if (code === "seat_limit" || code === "max_users") return "seat_limit";
  if (code === "user_exists") return "user_exists";
  if (code === "validation_error") return "password-weak";
  if (code === "rate_limited") return "too-many";
  if (
    code === "invite_expired" ||
    code === "invite_used" ||
    code === "invite_revoked" ||
    code === "invite_not_found"
  ) {
    return "expired";
  }
  if (status >= 500) return "failed";
  return "failed";
}

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const token = String(form.get("token") ?? "").trim().slice(0, 200);
  if (!token) return NextResponse.redirect(new URL("/sign-in", redirectBase(request)), 303);

  const name = String(form.get("name") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!name) return back(request, token, "name-missing");
  // Checked here as well as by the API only because the API never sees the second box.
  if (password !== String(form.get("confirm") ?? "")) return back(request, token, "mismatch");

  const result = await apiPost<{ status: string }>(
    `/api/auth/invites/${encodeURIComponent(token)}/accept`,
    { name, password },
  );
  if (!result.ok) return back(request, token, reason(result.code, result.status));

  if (result.sessionToken) {
    (await cookies()).set(SESSION_COOKIE, result.sessionToken, sessionCookieOptions());
  }
  const welcome = new URL("/app", redirectBase(request));
  welcome.searchParams.set("welcome", "1");
  return NextResponse.redirect(welcome, 303);
}

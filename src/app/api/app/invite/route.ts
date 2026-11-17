import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { inviteColleague, revokeInvite } from "@/lib/session";
import { redirectBase } from "@/lib/redirectBase";

/**
 * Invite a colleague, or withdraw an invitation.
 *
 * The API emails the invitation now, and the link still comes back in a short-lived httpOnly cookie
 * for the team page to show once. Both, deliberately: an install with no SMTP host sends nothing,
 * and an email that did go can still fail to arrive, so an admin always has something to pass on
 * rather than a form that claims to have sent something nobody received.
 */

export const dynamic = "force-dynamic";

const INVITE_COOKIE = "npim_new_invite";

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const back = new URL("/app/team", redirectBase(request));
  const action = String(form.get("action") ?? "invite");
  const jar = await cookies();

  if (action === "dismiss") {
    jar.delete(INVITE_COOKIE);
    return NextResponse.redirect(back, 303);
  }

  if (action === "revoke") {
    const done = await revokeInvite(String(form.get("id") ?? ""));
    back.searchParams.set(done ? "revoked" : "error", done ? "1" : "revoke-failed");
    return NextResponse.redirect(back, 303);
  }

  const email = String(form.get("email") ?? "").trim();
  const role = String(form.get("role") ?? "").trim();
  const name = String(form.get("name") ?? "").trim();
  if (!email || !role) {
    back.searchParams.set("error", "needs-email-and-role");
    return NextResponse.redirect(back, 303);
  }

  const result = await inviteColleague(email, role, name);
  if (!result.ok) {
    back.searchParams.set("error", result.code || "failed");
    return NextResponse.redirect(back, 303);
  }

  jar.set(INVITE_COOKIE, JSON.stringify({ email, url: result.data.invite_url }), {
    httpOnly: true,
    sameSite: "lax",
    secure: (process.env.SITE_BASE_URL ?? "").startsWith("https://"),
    path: "/app/team",
    maxAge: 900,
  });
  return NextResponse.redirect(back, 303);
}

export { INVITE_COOKIE };

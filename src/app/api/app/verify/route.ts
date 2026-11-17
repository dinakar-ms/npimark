import { NextResponse } from "next/server";
import { verifyEmail } from "@/lib/session";
import { redirectBase } from "@/lib/redirectBase";

/**
 * Spends the verification token, then sends the visitor somewhere that says what happened.
 *
 * A POST, and only a POST: see the page's own comment for why the link itself cannot do this.
 */

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const token = String(form.get("token") ?? "").trim();
  const back = new URL("/verify-email", redirectBase(request));

  if (!token) {
    back.searchParams.set("state", "missing");
    return NextResponse.redirect(back, 303);
  }

  const outcome = await verifyEmail(token);
  // 410 is the API's answer for a token that is no longer one, which is the common case here:
  // somebody pressed the button twice, or asked for a newer link first.
  back.searchParams.set("state", outcome.ok ? "ok" : outcome.code === "verification_invalid" ? "invalid" : "failed");
  return NextResponse.redirect(back, 303);
}

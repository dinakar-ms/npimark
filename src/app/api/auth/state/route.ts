import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * Is this browser signed in? Answered from the presence of our session cookie, nothing more.
 *
 * The public pages are prerendered and read no request, so their header cannot know whether the
 * visitor has a session; this is what the header asks after the page has loaded. Cookie presence
 * is enough: sign-out clears it, and an expired one only means the "Open app" link lands on the
 * sign-in page, which is where it would have gone anyway. Never cached, never shared.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const jar = await cookies();
  const signed_in = Boolean(jar.get(SESSION_COOKIE)?.value);
  return NextResponse.json({ signed_in }, { headers: { "Cache-Control": "private, no-store" } });
}

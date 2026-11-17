import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { FIRST_RUN_DISMISSED } from "@/lib/session";
import { redirectBase } from "@/lib/redirectBase";

/**
 * Hiding the getting-started checklist.
 *
 * A cookie, not a row in the customer's data. "I have read this panel" is a fact about a browser,
 * and putting it in the tenant's tables would mean a migration, a column that means nothing to
 * anybody else, and an organisation-wide switch for a decision one person made. The honest cost is
 * that the panel reappears on another device for somebody who has not dismissed it there, which is
 * also what happens when the work itself is still unfinished - and once the six things are done,
 * the panel goes for good without any cookie at all.
 *
 * Not httpOnly, deliberately not: there is nothing in it. It says only that a panel was dismissed.
 */

export const dynamic = "force-dynamic";

/**
 * Where a dismissal may send somebody, and nowhere else.
 *
 * "Skip the guide and start searching" has to hide the panel *and* move them on, which means this
 * handler takes a destination - and a destination from a form field is an open redirect unless it
 * is checked against a list. A list rather than a "must start with /app" rule, because the rule
 * admits `/app/../evil` and the list admits nothing anybody has to reason about.
 */
const ONWARD: Record<string, string> = {
  search: "/app/search",
};

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  if (String(form.get("action") ?? "") !== "dismiss") {
    return new NextResponse("Not found", { status: 404 });
  }
  const onward = ONWARD[String(form.get("then") ?? "")] ?? "/app";

  const jar = await cookies();
  jar.set(FIRST_RUN_DISMISSED, "1", {
    httpOnly: false,
    sameSite: "lax",
    secure: (process.env.SITE_BASE_URL ?? "").startsWith("https://"),
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return NextResponse.redirect(new URL(onward, redirectBase(request)), 303);
}

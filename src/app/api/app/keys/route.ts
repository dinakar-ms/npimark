import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createKey, revokeKey } from "@/lib/session";
import { redirectBase } from "@/lib/redirectBase";

/**
 * Issue and revoke API keys.
 *
 * The secret exists once, in the create response, and must reach the customer's screen without
 * being written anywhere it outlives that. So it travels in a short-lived httpOnly cookie rather
 * than a query string: a URL ends up in browser history, in a shared screenshot, and in any
 * proxy log between here and them. The keys page reads the cookie, shows the secret, and the
 * customer dismisses it - which is what clears it.
 *
 * `httpOnly` matters even though the page prints the value: it keeps the secret out of reach of
 * any script on the page, so an XSS bug cannot harvest a key that is mid-issue.
 */

export const dynamic = "force-dynamic";

const NEW_KEY_COOKIE = "npim_new_key";

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const back = new URL("/app/keys", redirectBase(request));
  const action = String(form.get("action") ?? "create");
  const jar = await cookies();

  if (action === "revoke") {
    const id = String(form.get("id") ?? "");
    const done = await revokeKey(id);
    back.searchParams.set(done ? "revoked" : "error", done ? "1" : "revoke-failed");
    return NextResponse.redirect(back, 303);
  }

  if (action === "dismiss") {
    jar.delete(NEW_KEY_COOKIE);
    return NextResponse.redirect(back, 303);
  }

  const name = String(form.get("name") ?? "").trim();
  const scopes = form.getAll("scopes").map(String).filter(Boolean);
  if (!name || scopes.length === 0) {
    back.searchParams.set("error", "needs-name-and-scope");
    return NextResponse.redirect(back, 303);
  }

  const result = await createKey(name, scopes);
  if (!result.ok) {
    back.searchParams.set("error", result.code || "failed");
    return NextResponse.redirect(back, 303);
  }

  jar.set(NEW_KEY_COOKIE, JSON.stringify({ name, secret: result.data.secret }), {
    httpOnly: true,
    sameSite: "lax",
    secure: (process.env.SITE_BASE_URL ?? "").startsWith("https://"),
    path: "/app/keys",
    // Long enough to copy it out of a page somebody is looking at, short enough that a machine
    // left unattended is not holding a working credential an hour later.
    maxAge: 600,
  });
  return NextResponse.redirect(back, 303);
}

export { NEW_KEY_COOKIE };

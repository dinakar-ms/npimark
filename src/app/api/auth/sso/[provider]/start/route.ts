import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  apiPost,
  isSsoProvider,
  SSO_ATTEMPT_COOKIE,
  SSO_ATTEMPT_PATH,
  ssoCookieOptions,
} from "@/lib/session";
import { redirectBase } from "@/lib/redirectBase";

/**
 * "Sign in with Google / Microsoft": ask the API to open an attempt, then send the browser off.
 *
 * A POST from a form on our own page, not a link, so a crawler or a link previewer cannot open
 * attempts by the thousand. The API holds the nonce and the PKCE verifier; this handler keeps only
 * the state and the binding secret, in an httpOnly cookie the callback needs to finish.
 *
 * The one redirect here that leaves the site goes to a URL the API built - and it is still checked
 * against the providers' own hosts, so a misconfigured or compromised API cannot turn this route
 * into an open redirect.
 */

export const dynamic = "force-dynamic";

const PROVIDER_HOSTS = new Set(["accounts.google.com", "login.microsoftonline.com"]);

type Started = { authorization_url: string; state: string; binding: string };

function back(request: Request, error: string) {
  const url = new URL("/sign-in", redirectBase(request));
  url.searchParams.set("error", error);
  return NextResponse.redirect(url, 303);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
): Promise<Response> {
  const { provider } = await params;
  if (!isSsoProvider(provider)) return new NextResponse("Not found", { status: 404 });

  const result = await apiPost<Started>(`/api/auth/sso/${provider}/start`, {});
  if (!result.ok) return back(request, result.status === 404 ? "sso-unavailable" : "unavailable");

  let target: URL;
  try {
    target = new URL(result.data.authorization_url);
  } catch {
    return back(request, "sso-failed");
  }
  if (target.protocol !== "https:" || !PROVIDER_HOSTS.has(target.hostname)) {
    return back(request, "sso-failed");
  }

  const jar = await cookies();
  jar.set(
    SSO_ATTEMPT_COOKIE,
    JSON.stringify({ provider, state: result.data.state, binding: result.data.binding }),
    ssoCookieOptions(SSO_ATTEMPT_PATH),
  );
  return NextResponse.redirect(target, 303);
}

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  apiPost,
  isSsoProvider,
  SESSION_COOKIE,
  sessionCookieOptions,
  SSO_ATTEMPT_COOKIE,
  SSO_ATTEMPT_PATH,
  SSO_EMAIL_COOKIE,
  ssoCookieOptions,
  type Me,
} from "@/lib/session";
import { redirectBase } from "@/lib/redirectBase";

/**
 * Where Google and Microsoft send the browser back. The redirect URI registered with each provider
 * is this route, exactly: `${SITE_BASE_URL}/api/auth/sso/{provider}/callback`.
 *
 * Nothing is decided here. The code, the state and the binding secret from our cookie go to the
 * API, which burns the attempt, exchanges the code and verifies the token; this handler only turns
 * the answer into a cookie and a redirect. Every redirect is to a fixed page of this site - there
 * is no "return to" parameter to abuse.
 *
 * The attempt cookie is dropped on every path through, so a callback can be tried once per start.
 */

export const dynamic = "force-dynamic";

type Outcome = { status: "ok" | "no_account"; user?: Me; email?: string };
type Attempt = { provider?: string; state?: string; binding?: string };

function to(request: Request, page: string, params: Record<string, string> = {}) {
  const url = new URL(page, redirectBase(request));
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return NextResponse.redirect(url, 303);
}

/** The API's refusal as a code the sign-in page has a sentence for. */
function reason(code: string, status: number): string {
  if (code === "sso_state_invalid") return "sso-expired";
  if (code === "sso_email_unverified") return "sso-unverified";
  if (code === "sso_internal_account") return "sso-internal";
  if (code === "sso_mfa_required") return "sso-mfa";
  if (code === "sso_exchange_failed" || code === "sso_provider_unavailable") return "sso-provider";
  if (code === "account_disabled") return "disabled";
  if (code === "rate_limited") return "too-many";
  if (status === 404) return "sso-unavailable";
  if (status >= 500) return "unavailable";
  return "sso-failed";
}

function readAttempt(raw: string | undefined): Attempt | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Attempt;
  } catch {
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
): Promise<Response> {
  const { provider } = await params;
  if (!isSsoProvider(provider)) return new NextResponse("Not found", { status: 404 });

  const jar = await cookies();
  const attempt = readAttempt(jar.get(SSO_ATTEMPT_COOKIE)?.value);
  jar.set(SSO_ATTEMPT_COOKIE, "", { ...ssoCookieOptions(SSO_ATTEMPT_PATH), maxAge: 0 });

  const query = new URL(request.url).searchParams;
  const providerError = query.get("error");
  if (providerError) {
    // The visitor pressed Cancel at the provider, or the provider refused before asking them.
    return to(request, "/sign-in", {
      error: providerError === "access_denied" ? "sso-cancelled" : "sso-failed",
    });
  }

  const code = query.get("code") ?? "";
  const state = query.get("state") ?? "";
  // Checked here to fail fast with a clear notice; the API checks the binding regardless.
  if (
    !code ||
    !attempt?.binding ||
    attempt.provider !== provider ||
    !state ||
    attempt.state !== state
  ) {
    return to(request, "/sign-in", { error: "sso-expired" });
  }

  const result = await apiPost<Outcome>(`/api/auth/sso/${provider}/callback`, {
    code,
    state,
    binding: attempt.binding,
  });
  if (!result.ok) return to(request, "/sign-in", { error: reason(result.code, result.status) });

  if (result.data.status === "no_account" && result.data.email) {
    jar.set(SSO_EMAIL_COOKIE, result.data.email, ssoCookieOptions("/sign-up"));
    return to(request, "/sign-up", { notice: "sso-no-account" });
  }
  if (result.data.status === "ok" && result.sessionToken) {
    jar.set(SESSION_COOKIE, result.sessionToken, sessionCookieOptions());
    return to(request, "/app");
  }
  return to(request, "/sign-in", { error: "sso-failed" });
}

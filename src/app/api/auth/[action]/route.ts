import { selectedPlan } from "@/lib/selectedPlan";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  apiPost,
  MFA_PENDING_COOKIE,
  MFA_PENDING_PATH,
  mfaPendingCookieOptions,
  SESSION_COOKIE,
  sessionCookieOptions,
  sessionToken,
  type Me,
} from "@/lib/session";
import { redirectBase } from "@/lib/redirectBase";

/**
 * Sign in, sign up and sign out, done on the server.
 *
 * The forms post here rather than at the API for one reason: the browser must never hold a
 * credential or a cross-origin cookie. This handler signs in on the visitor's behalf, keeps the
 * API's session token in an httpOnly cookie of our own origin, and answers with a redirect. The
 * password exists in one process for one request and is written nowhere.
 *
 * Failures come back as a redirect carrying a code rather than a rendered error, so a refresh
 * cannot repost the password and the URL never carries what was typed.
 *
 * Two-step sign-in is two posts. A correct password on an account with an authenticator earns an
 * opaque token from the API rather than a session; it waits in a narrow httpOnly cookie (see
 * `MFA_PENDING_COOKIE`) while the visitor fetches their phone, and the code screen posts the code
 * to `mfa`, which trades token and code for the session. The password is never kept for that.
 */

export const dynamic = "force-dynamic";

type SignUpBody = { user: Me; verify_token: string | null };

const PAGES: Record<string, string> = {
  "sign-in": "/sign-in",
  "sign-up": "/sign-up",
  "sign-out": "/",
  forgot: "/forgot",
  "reset-password": "/reset-password",
  mfa: "/sign-in/code",
};

function back(request: Request, page: string, params: Record<string, string> = {}) {
  const url = new URL(page, redirectBase(request));
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return NextResponse.redirect(url, 303);
}

/** Map the API's refusal onto something the form can say without repeating it back. */
function reason(code: string, status: number): string {
  if (code === "invalid_credentials") return "bad-credentials";
  if (code === "email_taken") return "email-taken";
  if (code === "validation_error") return "password-weak";
  if (code === "rate_limited") return "too-many";
  if (code === "account_disabled") return "disabled";
  if (code === "invalid_totp") return "bad-code";
  if (code === "mfa_challenge_invalid") return "mfa-expired";
  if (code === "signup_unavailable") return "unavailable";
  if (code === "work_email_required") return "work-email";
  if (code === "disposable_email") return "temp-email";
  if (code === "terms_not_accepted") return "terms";
  if (code === "challenge_required" || code === "challenge_failed") return "challenge";
  if (code === "challenge_unavailable") return "challenge-down";
  if (status >= 500) return "unavailable";
  return "failed";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> },
): Promise<Response> {
  const { action } = await params;
  const page = PAGES[action];
  if (!page) return new NextResponse("Not found", { status: 404 });

  const form = await request.formData();
  const field = (name: string) => String(form.get(name) ?? "").trim();
  const jar = await cookies();

  if (action === "sign-out") {
    const token = await sessionToken();
    // Ask the API to revoke it, then drop ours either way: a session we cannot reach must not
    // survive in the browser just because the API was briefly unavailable.
    if (token) {
      await apiPost("/api/auth/logout", {}, { sessionToken: token }).catch(() => null);
    }
    jar.delete(SESSION_COOKIE);
    return back(request, "/", { notice: "signed-out" });
  }

  if (action === "forgot") {
    // The API answers 204 whether or not the address has an account, and so does this page: the
    // notice is the same for everybody. Only the per-connection limit is told apart, because it
    // is about the connection, not about who has an account.
    const result = await apiPost<void>("/api/auth/forgot-password", {
      email: field("email"),
      // Cloudflare's widget puts its answer here; absent (and ignored) until Turnstile is on.
      turnstile_token: field("cf-turnstile-response") || null,
    });
    if (!result.ok && result.code === "rate_limited") return back(request, "/forgot", { notice: "too-many" });
    // A refused challenge is about this request, not about which addresses have accounts.
    if (!result.ok && result.code.startsWith("challenge_")) return back(request, "/forgot", { notice: "challenge" });
    return back(request, "/forgot", { notice: "sent" });
  }

  if (action === "reset-password") {
    const token = field("token");
    const password = String(form.get("password") ?? "");
    // Checked here as well as by the API only because the API never sees the second box.
    if (password !== String(form.get("confirm") ?? "")) {
      return back(request, "/reset-password", { token, error: "mismatch" });
    }
    const result = await apiPost<void>("/api/auth/reset-password", { token, password });
    if (result.ok) return back(request, "/sign-in", { notice: "password-reset" });
    if (result.code === "reset_invalid") return back(request, "/forgot", { notice: "expired" });
    return back(request, "/reset-password", { token, error: reason(result.code, result.status) });
  }

  if (action === "sign-in") {
    const result = await apiPost<{ status: string; user?: Me; mfa_token?: string }>("/api/auth/login", {
      email: field("email"),
      password: form.get("password") ?? "",
    });
    if (!result.ok) return back(request, "/sign-in", { error: reason(result.code, result.status) });
    if (result.data.status === "mfa_required") {
      if (!result.data.mfa_token) return back(request, "/sign-in", { error: "failed" });
      jar.set(MFA_PENDING_COOKIE, result.data.mfa_token, mfaPendingCookieOptions());
      return back(request, "/sign-in/code");
    }
    if (result.sessionToken) jar.set(SESSION_COOKIE, result.sessionToken, sessionCookieOptions());
    return back(request, "/app");
  }

  if (action === "mfa") {
    const pending = jar.get(MFA_PENDING_COOKIE)?.value;
    // The cookie has had its five minutes, or this browser never typed a password.
    if (!pending) return back(request, "/sign-in", { error: "mfa-expired" });
    const code = field("code");
    if (!code) return back(request, "/sign-in/code", { error: "code-missing" });

    const result = await apiPost<{ status: string; user?: Me }>("/api/auth/login/mfa", {
      mfa_token: pending,
      code,
    });
    const forget = () => jar.delete({ name: MFA_PENDING_COOKIE, path: MFA_PENDING_PATH });
    if (result.ok) {
      forget();
      if (result.sessionToken) jar.set(SESSION_COOKIE, result.sessionToken, sessionCookieOptions());
      return back(request, "/app");
    }
    if (result.code === "invalid_totp") return back(request, "/sign-in/code", { error: "bad-code" });
    // Expired, spent on wrong codes, or paused for the account: whatever the case, this attempt is
    // over, and the way forward is the password again.
    forget();
    if (result.code === "rate_limited") return back(request, "/sign-in", { error: "code-too-many" });
    if (result.code === "mfa_challenge_invalid") return back(request, "/sign-in", { error: "mfa-expired" });
    return back(request, "/sign-in", { error: reason(result.code, result.status) });
  }

  if (action === "sign-up") {
    const plan = selectedPlan(field("plan"));
    const result = await apiPost<SignUpBody>("/api/auth/sign-up", {
      email: field("email"),
      name: field("name"),
      organization: field("org"),
      password: form.get("password") ?? "",
      turnstile_token: field("cf-turnstile-response") || null,
      // The required "I agree to the Terms of Service and Privacy Policy" box. An unticked box is
      // absent from the post; the API refuses the sign-up without it.
      accept_terms: field("accept_terms") === "yes",
    });
    if (!result.ok) return back(request, "/sign-up", { error: reason(result.code, result.status), ...(plan ? {plan} : {}) });
    if (result.sessionToken) jar.set(SESSION_COOKIE, result.sessionToken, sessionCookieOptions());
    return back(request, (plan || process.env.NPI_CARD_TRIAL_ENABLED === "true") ? "/app/billing" : "/app", { welcome: "1", ...(plan ? {plan} : {}) });
  }

  return new NextResponse("Not found", { status: 404 });
}

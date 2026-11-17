import type { Metadata } from "next";
import Link from "next/link";
import SsoButtons from "@/components/SsoButtons";
import { getSsoProviders } from "@/lib/session";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};


const ERRORS: Record<string, string> = {
  "bad-credentials": "That email and password don't match an account. Check them and try again.",
  "mfa-expired":
    "That sign-in expired or had too many wrong codes. Sign in again with your email and password, then enter a fresh code.",
  "code-too-many":
    "Too many wrong sign-in codes for this account, so the code step is paused for about 15 minutes. If that wasn't you, somebody else knows your password: change it as soon as you're in.",
  disabled: "That account has been disabled. Ask an admin on your team to re-enable it.",
  "too-many": "Too many attempts from this connection. Wait a few minutes and try again.",
  "email-taken":
    "There is already an account for that email. Sign in instead, or reset the password if you have forgotten it.",
  "password-weak": "Use a longer password — at least 12 characters.",
  unavailable: "Sign-up is temporarily unavailable. Nothing was created; please try again shortly.",
  "signed-out": "You have been signed out. Sign in to continue.",
  failed: "That didn't work. Check what you entered and try again.",
  // Single sign-on. The API's own sentences, shortened; none of them repeats an address back.
  "sso-cancelled": "Sign-in with Google or Microsoft was canceled. Nothing was changed.",
  "sso-expired":
    "That sign-in attempt expired or was already used. Press the button again to start over.",
  "sso-unverified":
    "Your provider didn't confirm that email address belongs to your account, so we can't use it to sign you in. Sign in with your email and password instead.",
  "sso-internal":
    "That address belongs to an internal team account, which signs in on the admin application rather than here.",
  "sso-mfa":
    "This account uses two-step sign-in, and Google or Microsoft sign-in would skip the code. Sign in with your email and password instead.",
  "sso-provider":
    "Google or Microsoft didn't complete the sign-in. Try again in a minute, or sign in with your email and password.",
  "sso-unavailable": "That sign-in option isn't available. Sign in with your email and password.",
  "sso-failed":
    "We couldn't confirm that sign-in, so nothing was signed in. Try again, or sign in with your email and password.",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * The sign-in form. It posts to our own handler, never to the API, so the browser holds no
 * credential and no cross-origin cookie.
 */
export default async function SignInPage({ searchParams }: Props) {
  const params = await searchParams;
  const notice = typeof params.notice === "string" ? params.notice : null;
  const error = typeof params.error === "string" ? ERRORS[params.error] ?? ERRORS.failed : null;
  const providers = await getSsoProviders();

  return (
    <main>
      <section className="wrap auth">
        <div className="panel">
          <div className="eyebrow rule">Sign in</div>
          <h1>Welcome back.</h1>
          <p className="fine" style={{ marginTop: 8, marginBottom: 20 }}>
            Full search results, reveals, exports and your API keys.
          </p>

          {error && (
            <div className="notice stop" style={{ marginBottom: 16 }} role="alert">
              {error}
            </div>
          )}
          {notice === "password-reset" && (
            <div className="notice ok" style={{ marginBottom: 16 }} role="status">
              Password changed, and every device that was signed in has been signed out. Sign in
              with the new one.
            </div>
          )}
          {notice === "signed-out-everywhere" && (
            <div className="notice ok" style={{ marginBottom: 16 }} role="status">
              Every device signed in to your account has been signed out, this one included. Your
              password has not changed, so sign in with the one you already have.
            </div>
          )}

          <SsoButtons providers={providers} />

          <form className="form" method="post" action="/api/auth/sign-in">
            <div className="field">
              <label htmlFor="email">Work email</label>
              <input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                minLength={12}
              />
            </div>
            <button type="submit" className="btn primary block lg">
              Sign in
            </button>
          </form>

          <p className="fine" style={{ marginTop: 18 }}>
            <Link href="/forgot">Forgot your password?</Link> · New here?{" "}
            <Link href="/sign-up">Create an account</Link>
          </p>
        </div>
        <p className="fine" style={{ marginTop: 16, textAlign: "center" }}>
          Sessions are tied to this device. You can sign out everywhere from settings.
        </p>
      </section>
    </main>
  );
}

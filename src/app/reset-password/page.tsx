import type { Metadata } from "next";
import Link from "next/link";

/**
 * Where the reset email lands: choose a new password.
 *
 * The token rides in a hidden field and is spent only when the form is posted, never by opening
 * the page - mail scanners fetch links, and a GET that used the token up would leave the
 * customer with a dead link. Choosing the password here does not sign anybody in; they prove it
 * once on the sign-in page, which is also where a second factor would be asked for.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ token?: string; error?: string }> };

const ERRORS: Record<string, string> = {
  mismatch: "The two passwords don't match. Type the same one in both boxes.",
  "password-weak": "Use a longer password — at least 12 characters.",
  "too-many": "Too many attempts from this connection. Wait a few minutes and try again.",
  failed: "That didn't work. Try again, or ask for a new link.",
  unavailable: "Something went wrong on our side. Your password has not changed; try again shortly.",
};

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token, error } = await searchParams;
  const message = error ? (ERRORS[error] ?? ERRORS.failed) : null;

  return (
    <main>
      <section className="wrap auth">
        <div className="panel">
          <div className="eyebrow rule">Reset password</div>
          <h1>Choose a new password.</h1>
          <p className="fine" style={{ marginTop: 8, marginBottom: 20 }}>
            At least 12 characters. Saving it signs out every device that is signed in to this
            account.
          </p>

          {message && (
            <div className="notice stop" style={{ marginBottom: 16 }} role="alert">
              {message}
            </div>
          )}

          {token ? (
            <form className="form" method="post" action="/api/auth/reset-password">
              <input type="hidden" name="token" value={token} />
              <div className="field">
                <label htmlFor="password">New password</label>
                <input id="password" name="password" type="password" autoComplete="new-password" minLength={12} required />
              </div>
              <div className="field">
                <label htmlFor="confirm">Same again</label>
                <input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={12} required />
              </div>
              <button type="submit" className="btn primary block lg">
                Save new password
              </button>
            </form>
          ) : (
            <p className="fine">
              This page needs the link from the reset email. <Link href="/forgot">Ask for one</Link>.
            </p>
          )}

          <p className="fine" style={{ marginTop: 18 }}>
            <Link href="/sign-in">Back to sign in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

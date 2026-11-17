import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Enter your sign-in code",
  robots: { index: false, follow: false },
};

const ERRORS: Record<string, string> = {
  "bad-code":
    "That code isn't right. Enter the current 6-digit code from your authenticator app, or one of your recovery codes. A few more wrong codes and you'll need to sign in again.",
  "code-missing": "Enter the 6-digit code from your authenticator app, or a recovery code.",
  failed: "That didn't work. Try the code again, or sign in again.",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * The second step of signing in to an account with two-step sign-in.
 *
 * Nothing here knows who is signing in: the password step left an opaque token in a cookie only
 * the finishing handler receives, so this page cannot leak an address or a half-signed-in state
 * even to somebody who opens it directly. Posting without that cookie simply sends them back to
 * the password.
 *
 * One box takes either kind of code. Six digits is the authenticator; anything longer is tried as
 * a recovery code - which is what someone who has lost their phone has, and the reason recovery
 * codes exist at all.
 */
export default async function SignInCodePage({ searchParams }: Props) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? ERRORS[params.error] ?? ERRORS.failed : null;

  return (
    <main>
      <section className="wrap auth">
        <div className="panel">
          <div className="eyebrow rule">Two-step sign-in</div>
          <h1>Enter your code.</h1>
          <p className="fine" style={{ marginTop: 8, marginBottom: 20 }}>
            Open your authenticator app and enter the 6-digit code it shows for NPI Mark. You have
            five minutes.
          </p>

          {error && (
            <div className="notice stop" style={{ marginBottom: 16 }} role="alert">
              {error}
            </div>
          )}

          <form className="form" method="post" action="/api/auth/mfa">
            <div className="field">
              <label htmlFor="code">Sign-in code</label>
              <input
                id="code"
                name="code"
                type="text"
                autoComplete="one-time-code"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
                maxLength={64}
                autoFocus
              />
            </div>
            <button type="submit" className="btn primary block lg">
              Continue
            </button>
          </form>

          <details style={{ marginTop: 18 }}>
            <summary className="fine">Lost your phone?</summary>
            <p className="fine" style={{ marginTop: 8 }}>
              Enter one of the recovery codes you saved when you turned two-step sign-in on, in the
              same box. Each works once. If you have none left, ask an admin on your team to reset
              two-step sign-in for you from the Team page, or write to us from the address on the
              account - we will confirm it is you before switching it off.
            </p>
          </details>

          <p className="fine" style={{ marginTop: 18 }}>
            <Link href="/sign-in">Start again</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

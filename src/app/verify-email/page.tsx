import type { Metadata } from "next";
import Link from "next/link";

/**
 * Where the link in the verification email lands.
 *
 * It does not verify anything by itself. The token arrives in the query string and sits in a
 * hidden field until somebody presses the button, because opening a link must not have a side
 * effect: mail scanners, link previewers and corporate proxies all fetch URLs they are sent, and
 * a GET that spends the token would be used up before the customer ever saw the page.
 *
 * Signed out is the normal case here - people open mail on a phone and sign up on a laptop - so
 * this page is outside /app and asks for no session.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Confirm your email",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ token?: string; state?: string }> };

const REASONS: Record<string, string> = {
  invalid: "That link has already been used, or it was replaced by a newer one.",
  missing: "That link has no token in it. Copy it from the email again, whole.",
  failed: "Something went wrong confirming the address. Try the link again.",
};

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token, state } = await searchParams;

  if (state === "ok") {
    return (
      <main className="wrap app-main">
        <div className="eyebrow rule">Address confirmed</div>
        <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}>That&rsquo;s your address proved.</h1>
        <p className="lede">
          Reveals and exports are open. Nothing else about the account changed, and the link is now
          spent.
        </p>
        <div className="actions" style={{ marginTop: 18 }}>
          <Link className="btn primary" href="/app">
            Go to your account
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="wrap app-main">
      <div className="eyebrow rule">Confirm your email</div>
      <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}>One press and you&rsquo;re done.</h1>
      <p className="lede">
        We ask for this once. Searching works either way; opening contact details and exporting
        rows wait until we know the address is yours.
      </p>

      {state && REASONS[state] && (
        <div className="notice stop" style={{ marginTop: 18 }} role="alert">
          {REASONS[state]}{" "}
          <Link href="/app">Sign in</Link> and use the banner to send a fresh one.
        </div>
      )}

      {token ? (
        <form method="post" action="/api/app/verify" style={{ marginTop: 22 }}>
          <input type="hidden" name="token" value={token} />
          <button type="submit" className="btn primary lg">
            Confirm this address
          </button>
        </form>
      ) : (
        <p className="fine" style={{ marginTop: 22 }}>
          This page needs the link from the email. If you have lost it, sign in and ask for
          another from the banner at the top of any page.
        </p>
      )}
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import Turnstile from "@/components/Turnstile";

export const metadata: Metadata = {
  title: "Reset your password",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ForgotPage({ searchParams }: Props) {
  const params = await searchParams;
  const notice = typeof params.notice === "string" ? params.notice : null;

  return (
    <main>
      <section className="wrap auth">
        <div className="panel">
          <div className="eyebrow rule">Reset password</div>
          <h1>We will email you a one-time link.</h1>
          <p className="fine" style={{ marginTop: 8, marginBottom: 20 }}>
            The link works once and expires in an hour. The reply is the same whether or not
            the address has an account.
          </p>
          {notice === "sent" && (
            <div className="notice ok" style={{ marginBottom: 16 }} role="status">
              If that address has an account, a link is on its way. It can take a minute - check
              the spam folder before asking again, because a new link replaces the old one.
            </div>
          )}
          {notice === "expired" && (
            <div className="notice stop" style={{ marginBottom: 16 }} role="alert">
              That link has expired, been used, or been replaced by a newer one. Ask for another
              below.
            </div>
          )}
          {notice === "challenge" && (
            <div className="notice stop" style={{ marginBottom: 16 }} role="alert">
              We couldn&apos;t confirm you&apos;re a person, so nothing was sent. Complete the check
              above the button and try again.
            </div>
          )}
          {notice === "too-many" && (
            <div className="notice stop" style={{ marginBottom: 16 }} role="alert">
              Too many requests from this connection. Wait an hour and try again.
            </div>
          )}
          <form className="form" method="post" action="/api/auth/forgot">
            <div className="field">
              <label htmlFor="email">Work email</label>
              <input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <Turnstile action="forgot" />
            <button type="submit" className="btn primary block lg">
              Send reset link
            </button>
          </form>
          <p className="fine" style={{ marginTop: 18 }}>
            <Link href="/sign-in">Back to sign in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

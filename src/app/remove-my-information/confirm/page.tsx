import type { Metadata } from "next";
import Link from "next/link";
import { TARGET_DAYS } from "@/content/legal/removal";

/**
 * Where the link in the removal confirmation email lands. Like /verify-email it confirms nothing
 * by itself: the token waits in a hidden field until the person presses the button, because
 * opening a link must not have a side effect. Never indexed.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Confirm your removal request",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ token?: string; state?: string; ref?: string }> };

const REASONS: Record<string, string> = {
  invalid:
    "That link has expired or has already been used. If you still want your information removed, send the request again.",
  missing: "That link has no token in it. Copy it from the email again, whole.",
  failed: "Something went wrong confirming the request. Try the link again in a minute.",
};

export default async function ConfirmRemovalPage({ searchParams }: Props) {
  const { token, state, ref } = await searchParams;
  const reference = ref && /^RR-\d{4}-[0-9A-F]{6,24}$/.test(ref) ? ref : null;

  if (state === "ok") {
    return (
      <main className="wrap app-main">
        <div className="eyebrow rule">Request confirmed</div>
        <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}>Thank you - your request is with our team.</h1>
        <p className="lede">
          {reference ? `Reference ${reference}. ` : ""}A member of our team will review it. Our target
          is to complete it within {TARGET_DAYS} days, and we will email you the outcome.
        </p>
      </main>
    );
  }

  return (
    <main className="wrap app-main">
      <div className="eyebrow rule">Confirm your removal request</div>
      <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}>One press to confirm it was you.</h1>
      <p className="lede">
        Confirming tells us the request came from the owner of this email address. Nothing is
        reviewed until you do.
      </p>

      {state && REASONS[state] && (
        <div className="notice stop" style={{ marginTop: 18 }} role="alert">
          {REASONS[state]} <Link href="/remove-my-information">Back to the removal form</Link>.
        </div>
      )}

      {token ? (
        <form method="post" action="/api/privacy/confirm" style={{ marginTop: 22 }}>
          <input type="hidden" name="token" value={token.slice(0, 200)} />
          <button type="submit" className="btn primary lg">
            Confirm my request
          </button>
        </form>
      ) : (
        !state && (
          <p className="fine" style={{ marginTop: 22 }}>
            This page needs the link from the email we sent. If you have lost it, send the request
            again from the <Link href="/remove-my-information">removal form</Link>.
          </p>
        )
      )}
    </main>
  );
}

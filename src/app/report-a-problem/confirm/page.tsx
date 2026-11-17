import type { Metadata } from "next";
import Link from "next/link";
import { REFERENCE_PATTERN } from "@/lib/corrections";

/**
 * Where the link in a correction report's confirmation email lands. Like the removal confirm page
 * it confirms nothing by itself: the token waits in a hidden field until the person presses the
 * button, because mail scanners and link previewers fetch every URL they are sent. Never indexed.
 *
 * Unlike a removal request, the report was already in the queue before this page was opened -
 * nothing a correction can do depends on the address. What pressing the button buys is being told
 * what we decided, which is the only thing we will ever send to it.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Confirm your email address",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ token?: string; state?: string; ref?: string }> };

const REASONS: Record<string, string> = {
  invalid:
    "That link has expired or has already been used. Your report is still with our team - this only affected whether we can write back to you.",
  missing: "That link has no token in it. Copy it from the email again, whole.",
  failed: "Something went wrong confirming the address. Try the link again in a minute.",
};

export default async function ConfirmReportPage({ searchParams }: Props) {
  const { token, state, ref } = await searchParams;
  const reference = ref && REFERENCE_PATTERN.test(ref) ? ref : null;

  if (state === "ok") {
    return (
      <main className="wrap app-main">
        <div className="eyebrow rule">Email confirmed</div>
        <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}>
          Thank you - we will tell you what we decide.
        </h1>
        <p className="lede">
          {reference ? `Reference ${reference}. ` : ""}Your report is with our team. We will email
          this address once somebody has read it, and we will not write to you about anything else.
        </p>
      </main>
    );
  }

  return (
    <main className="wrap app-main">
      <div className="eyebrow rule">Confirm your email address</div>
      <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}>One press to confirm it was you.</h1>
      <p className="lede">
        Confirming tells us this address is yours, so we can write back with what we decide. Your
        report is already with our team either way.
      </p>

      {state && REASONS[state] && (
        <div className="notice stop" style={{ marginTop: 18 }} role="alert">
          {REASONS[state]} <Link href="/report-a-problem">Back to the report form</Link>.
        </div>
      )}

      {token ? (
        <form method="post" action="/api/privacy/report-confirm" style={{ marginTop: 22 }}>
          <input type="hidden" name="token" value={token.slice(0, 200)} />
          <button type="submit" className="btn primary lg">
            Confirm my email address
          </button>
        </form>
      ) : (
        !state && (
          <p className="fine" style={{ marginTop: 22 }}>
            This page needs the link from the email we sent. If you have lost it, the report is still
            with our team - we just will not be able to write back.
          </p>
        )
      )}
    </main>
  );
}

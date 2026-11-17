import type { Metadata } from "next";
import Link from "next/link";

/**
 * Where the "stop these emails" link in an allowance warning or a saved-search digest lands.
 *
 * It stops nothing by itself. The token arrives in the query string and sits in a hidden field
 * until somebody presses the button, because opening a link must not have a side effect: mail
 * scanners, link previewers and corporate proxies fetch every URL they are sent, and a GET that
 * unsubscribed would take people off mail they never asked to stop. A mail client's own one-click
 * button posts straight to /api/email-preferences/unsubscribe instead, which is what the
 * List-Unsubscribe header points at.
 *
 * Signed out is the normal case - people read mail on a phone - so this page asks for no session.
 * The token is the whole credential and is worth nothing else: it names one person and one kind of
 * mail, and it cannot sign in, read the account or change an address.
 *
 * Only the mail nobody asked for can be switched off here. A verification link, a password reset,
 * an invite, a plan change and the outcome of a privacy request have no off switch, because an
 * account that can silence them cannot be recovered or explained.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Email preferences",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ token?: string; state?: string }> };

/** What each switchable kind is called in a sentence. Keys match the API's own names. */
const KINDS: Record<string, string> = {
  allowance_warnings: "the emails about your monthly allowance",
  alert_digests: "the emails about your saved searches",
};

const REASONS: Record<string, string> = {
  missing: "That link has no token in it. Copy it from the email again, whole.",
  invalid: "That link is not one of ours, or it has been replaced by a newer one.",
  failed: "Something went wrong. Nothing has changed; try the link again in a minute.",
};

/**
 * Which kind of mail the link came from, read out of the token for the wording only.
 *
 * The token's middle part names the kind, and it is checked against the list above before it is
 * shown - a value from a URL is never printed as it arrives. What the token is actually allowed to
 * change is decided by the API, which verifies the signature; this is only how the page knows what
 * to call it.
 */
function kindOf(token: string | undefined): string | null {
  const middle = (token ?? "").split(".")[1];
  return middle && middle in KINDS ? middle : null;
}

export default async function EmailPreferencesPage({ searchParams }: Props) {
  const { token, state } = await searchParams;
  const kind = kindOf(token);
  const what = kind ? KINDS[kind] : "these emails";

  if (state === "off" || state === "on") {
    const off = state === "off";
    return (
      <main className="wrap app-main">
        <div className="eyebrow rule">Email preferences</div>
        <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}>
          {off ? "That is switched off." : "That is switched back on."}
        </h1>
        <p className="lede">
          {off
            ? `We will not send you ${what} again. Everything you would need to recover the account - a verification link, a password reset - still arrives, and nothing else about the account has changed.`
            : `You will get ${what} again from now on.`}
        </p>
        {token && (
          <form method="post" action="/api/email-preferences/unsubscribe" style={{ marginTop: 22 }}>
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="redirect" value="1" />
            <input type="hidden" name="want" value={off ? "on" : "off"} />
            <button type="submit" className="btn">
              {off ? "Actually, send them after all" : "Stop them again"}
            </button>
          </form>
        )}
        <p className="fine" style={{ marginTop: 18 }}>
          <Link href="/app">Go to your account</Link>
        </p>
      </main>
    );
  }

  return (
    <main className="wrap app-main">
      <div className="eyebrow rule">Email preferences</div>
      <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}>Stop {what}?</h1>
      <p className="lede">
        One press and we stop. Your saved searches and your allowance carry on exactly as they are -
        this only stops us writing to you about them, and everything is still in the app.
      </p>

      {state && REASONS[state] && (
        <div className="notice stop" style={{ marginTop: 18 }} role="alert">
          {REASONS[state]}
        </div>
      )}

      {token ? (
        <form method="post" action="/api/email-preferences/unsubscribe" style={{ marginTop: 22 }}>
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="redirect" value="1" />
          <input type="hidden" name="want" value="off" />
          <button type="submit" className="btn primary lg">
            Stop sending these
          </button>
        </form>
      ) : (
        <p className="fine" style={{ marginTop: 22 }}>
          This page needs the link from the email. Open it again from the bottom of any of them.
        </p>
      )}
    </main>
  );
}

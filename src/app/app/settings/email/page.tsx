import type { Metadata } from "next";
import Link from "next/link";
import { getEmailPreferences, getMe } from "@/lib/session";

/**
 * Which optional mail this person gets.
 *
 * Two switches, and only two, because only two kinds of mail are optional. A verification link, a
 * password reset, an invitation, a plan change and the outcome of a removal request are answers to
 * something somebody did, and an account that can silence them is an account that cannot be
 * recovered or explained. The page says that rather than leaving somebody hunting for a switch
 * that is deliberately absent.
 *
 * This is the signed-in version of the same two rows the unsubscribe link in a message writes
 * (`/email-preferences`, which takes a token instead, for somebody reading their mail who is not
 * signed in). Both write through the same code on the API, so the page and the link cannot
 * disagree.
 *
 * The form posts both switches every time. An unchecked checkbox is simply absent from a form
 * submission, so sending only what is on would make "switch this off" indistinguishable from
 * "leave this alone".
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Email we send you",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function one(params: Record<string, string | string[] | undefined>, key: string): string {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function EmailPreferencesPage({ searchParams }: Props) {
  const params = await searchParams;
  const saved = one(params, "notice") === "saved";
  const failed = Boolean(one(params, "error"));

  const [me, mail] = await Promise.all([getMe(), getEmailPreferences()]);

  return (
    <main className="wrap app-main">
      <div className="eyebrow rule">
        <Link href="/app/settings">Settings</Link>
      </div>
      <h1>Email we send you.</h1>
      <p className="lede">
        These settings are yours alone{me ? <> ({me.email})</> : null}. A colleague&rsquo;s choices
        are their own, and turning something off here does not turn it off for them.
      </p>

      {failed && (
        <div className="notice stop" style={{ marginTop: 16 }} role="alert">
          That didn&rsquo;t save, and nothing was changed. Try again in a moment.
        </div>
      )}
      {saved && !failed && (
        <div className="notice ok" style={{ marginTop: 16 }} role="status">
          Saved. It applies from the next message we would have sent.
        </div>
      )}

      <div className="panel" style={{ marginTop: 22 }}>
        <h2>What you can switch off</h2>
        {mail ? (
          <form method="post" action="/api/app/settings">
            <input type="hidden" name="action" value="email-preferences" />
            <label className="check" style={{ marginTop: 6 }}>
              <input type="checkbox" name="alert_digests" defaultChecked={mail.alert_digests} />
              <span>
                <b>Alert digests.</b> What your standing alerts found, on the schedule each alert
                is set to. Everything an alert finds is on{" "}
                <Link href="/app/alerts">the alerts page</Link> whether or not this is on, so
                switching it off loses the message and not the work.
              </span>
            </label>
            <label className="check" style={{ marginTop: 16 }}>
              <input
                type="checkbox"
                name="allowance_warnings"
                defaultChecked={mail.allowance_warnings}
              />
              <span>
                <b>Allowance warnings.</b> One message when your organization has used most of a
                monthly allowance, and one when it is gone. Sent to the admins on the account.
                Without them, the first you hear of a limit is a refusal.
              </span>
            </label>
            <button type="submit" className="btn primary" style={{ marginTop: 18 }}>
              Save
            </button>
          </form>
        ) : (
          <p className="fine">
            We could not read your settings just now, so there is nothing to change rather than a
            form that might save the wrong answer. Refresh the page to try again.
          </p>
        )}
      </div>

      <div className="panel" style={{ marginTop: 22 }}>
        <h2>What has no switch</h2>
        <p className="fine">
          Everything else we send is an answer to something somebody did, and there is no way to
          turn it off: confirming your address, resetting a password, an invitation, a change of
          plan, and the outcome of a request to remove somebody&rsquo;s information. An account that
          could silence those is an account nobody can recover or explain afterwards.
        </p>
        <p className="fine">
          Every one of the optional messages also carries its own unsubscribe link, so the same two
          switches can be reached from a message without signing in.
        </p>
      </div>
    </main>
  );
}

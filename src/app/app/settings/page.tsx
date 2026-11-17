import type { Metadata } from "next";
import Link from "next/link";
import { UsagePanel } from "@/components/UsagePanel";
import {
  getAlerts,
  getBilling,
  getEmailPreferences,
  getMe,
  getPeople,
} from "@/lib/session";
import { salesHref } from "@/lib/site";

/**
 * One page for the settings that were reachable only by knowing the URL, or not at all.
 *
 * Nothing here is new behaviour. The password and two-step sign-in live where they always did, on
 * the Security page, and this page links to them rather than growing a second copy of forms that
 * hand over recovery codes. What it adds is the things that existed only as endpoints - the mail
 * switches and ending every session - and one honest statement of what this person can and cannot
 * change about their own account.
 *
 * Two of those statements are about permissions rather than about features, and both are said out
 * loud instead of being expressed as a missing button:
 *
 * * A display name is changed through the API's user endpoint, which asks for `users.manage`. So
 *   somebody who cannot manage people cannot rename themselves, and is told who can.
 * * Signing out everywhere is the same endpoint an admin points at a colleague who has lost a
 *   laptop. It also needs `users.manage`. For everybody else, changing the password does it - that
 *   is not a workaround, it is what the API does on a password change, and the help page has said
 *   so all along.
 *
 * The sign-in address has no endpoint at all. The page says so rather than offering a field that
 * would have nowhere to post to.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Account settings",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const ERRORS: Record<string, string> = {
  "name-missing": "Give a name to be shown, or leave it as it was. Nothing was changed.",
  "name-invalid": "That name could not be used, so nothing was changed.",
  forbidden:
    "Your role cannot do that. An owner or admin on your team can, and nothing was changed.",
  failed: "That didn't work, and nothing was changed. Try again in a moment.",
};

const NOTICES: Record<string, string> = {
  "name-changed": "Name changed. It is what your colleagues see beside your reveals and exports.",
};

function one(params: Record<string, string | string[] | undefined>, key: string): string {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function SettingsPage({ searchParams }: Props) {
  const params = await searchParams;
  const error = ERRORS[one(params, "error")] ?? (one(params, "error") ? ERRORS.failed : null);
  const notice = NOTICES[one(params, "notice")] ?? null;

  const [me, billing, people, alerts, mail] = await Promise.all([
    getMe(),
    getBilling(),
    getPeople(),
    getAlerts(),
    getEmailPreferences(),
  ]);
  if (!me) return null; // the layout has already redirected

  const canManagePeople = me.permissions.includes("users.manage");

  return (
    <main className="wrap app-main">
      <div className="eyebrow rule">Settings</div>
      <h1>Your account.</h1>
      <p className="lede">
        Your own sign-in and the mail you get, and what {me.org.name} has left to spend this month.
      </p>

      {error && (
        <div className="notice stop" style={{ marginTop: 16 }} role="alert">
          {error}
        </div>
      )}
      {notice && !error && (
        <div className="notice ok" style={{ marginTop: 16 }} role="status">
          {notice}
        </div>
      )}

      <div className="panel" style={{ marginTop: 22 }}>
        <h2>Your details</h2>
        {canManagePeople ? (
          <form className="form" method="post" action="/api/app/settings" style={{ maxWidth: 420 }}>
            <input type="hidden" name="action" value="name" />
            <div className="field">
              <label htmlFor="name">Name shown to your team</label>
              <input id="name" name="name" defaultValue={me.name} required maxLength={200} />
            </div>
            <button type="submit" className="btn">
              Save name
            </button>
          </form>
        ) : (
          <p>
            <b>{me.name}</b>
            <span className="fine" style={{ display: "block" }}>
              An owner or admin on your team can change the name shown beside your work.
            </span>
          </p>
        )}
        <ul className="ticks" style={{ marginTop: 18 }}>
          <li>
            <span>
              <b>Sign-in address.</b> {me.email}
              {me.email_verified_at ? ", confirmed" : ", not confirmed yet"}. It cannot be changed
              from the app, because every reveal and export on the record is filed against it.{" "}
              <a href={salesHref("Changing the address on an account")}>Talk to us</a> if it has to
              move.
            </span>
          </li>
          <li>
            <span>
              <b>What you may do.</b> {me.role} in {me.org.name}.{" "}
              <Link href="/app/team">The team page</Link> lists everybody and what each role can do.
            </span>
          </li>
        </ul>
      </div>

      <div className="panel" style={{ marginTop: 22 }}>
        <h2>Password and two-step sign-in</h2>
        <p className="fine">
          Two-step sign-in is <b>{me.mfa_enabled ? "on" : "off"}</b> for this account.
          {me.mfa_enabled
            ? " Signing in asks for a code from your authenticator app as well as your password."
            : " Anyone who learns your password can sign in as you."}
        </p>
        <div className="actions" style={{ marginTop: 14 }}>
          <Link className="btn" href="/app/security#password">
            Change password
          </Link>{" "}
          <Link className="btn" href="/app/security#two-step">
            {me.mfa_enabled ? "Recovery codes and turning it off" : "Set up two-step sign-in"}
          </Link>
        </div>
      </div>

      {/* One control, on Security, rather than a second one here. Two buttons a click apart,
          called "Sign out everywhere" and "Sign out everywhere else", doing different things -
          one keeping this browser signed in and one not - is a support call waiting to happen,
          and the one that needed `users.manage` was the wrong shape anyway: acting on your own
          sessions should never need a permission for managing other people. */}
      <div className="panel" style={{ marginTop: 22 }}>
        <h2>Signed in somewhere you should not be</h2>
        <p className="fine">
          Signing out everywhere else ends every other browser and device signed in as you - a
          machine at a client site, a phone you no longer have - and keeps the one you are using.
          Your password does not change and your data is untouched.
        </p>
        <div className="actions" style={{ marginTop: 12 }}>
          <Link className="btn" href="/app/security#sessions">
            Sign out everywhere else
          </Link>
        </div>
        <p className="fine" style={{ marginTop: 12 }}>
          To sign a colleague out instead, an admin does it from{" "}
          <Link href="/app/team">the team page</Link>.
        </p>
      </div>

      <div className="panel" style={{ marginTop: 22 }}>
        <h2>Email we send you</h2>
        {mail ? (
          <p className="fine">
            Alert digests are <b>{mail.alert_digests ? "on" : "off"}</b> and allowance warnings are{" "}
            <b>{mail.allowance_warnings ? "on" : "off"}</b>. Those are the only two you can switch
            off.
          </p>
        ) : (
          <p className="fine">
            We could not read your mail settings just now. Open the page below to try again.
          </p>
        )}
        <div className="actions" style={{ marginTop: 14 }}>
          <Link className="btn" href="/app/settings/email">
            Change what we send
          </Link>
        </div>
      </div>

      <div style={{ marginTop: 22 }}>
        <UsagePanel
          billing={billing}
          seatsUsed={people && people.length > 0 ? people.length : null}
          // UsagePanel documents alertsUsed as "null when they could not be read"; until these
          // reads could fail visibly, that case was unreachable. Now it carries the truth.
          alertsUsed={alerts === null ? null : alerts.length}
        />
      </div>

      <p className="fine" style={{ marginTop: 18 }}>
        The plan itself, what it costs and the payment details are on{" "}
        <Link href="/app/billing">Plan and usage</Link>.
      </p>
    </main>
  );
}

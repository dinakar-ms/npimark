import type { Metadata } from "next";
import TotpQr from "@/components/TotpQr";
import { getMe, getMfaStatus } from "@/lib/session";

/**
 * The signed-in person's own security: their password and their two-step sign-in.
 *
 * Per person, not per organisation, so everybody on a team sees this page whatever their role;
 * the API endpoints behind it act only on the caller's own account.
 *
 * Turning two-step sign-in on is two steps on purpose. The first creates a secret and shows it
 * (as a QR code drawn on our server, and as text for manual entry); nothing changes about signing
 * in until a code from the app proves it holds that secret. The secret is shown only while it is
 * unconfirmed - once two-step sign-in is on, the API will not return it again.
 *
 * Turning it off, and replacing recovery codes, both ask for the password: a session left open on
 * a shared machine must not be enough to remove the second factor or mint a way round it.
 *
 * "Sign out everywhere else" does not ask for the password, because it only ever removes access.
 * Asking for one would put friction in front of the safe thing at the exact moment somebody has
 * realised they left a session open somewhere.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Security",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const ERRORS: Record<string, string> = {
  "password-mismatch": "The two new passwords didn't match. Nothing was changed; type them again.",
  "wrong-password": "That isn't your current password. Nothing was changed.",
  "password-weak": "Choose a longer password - at least 12 characters. Nothing was changed.",
  "password-same": "Choose a new password that is different from the current one.",
  "bad-code":
    "That code isn't right. Enter the 6-digit code your app shows now - codes change every 30 seconds. Two-step sign-in is still off.",
  "setup-missing": "Start setup first, then enter the code from your app.",
  "wrong-password-mfa": "That isn't your current password, so two-step sign-in is still on.",
  "wrong-password-codes": "That isn't your current password, so your recovery codes were not replaced.",
  "mfa-off": "Two-step sign-in is off, so there are no recovery codes to replace.",
  // Not a failure: the signed-in layout sent them here because their team now requires this and
  // they have not set it up. Said as the reason they are looking at this page rather than as an
  // error, because nothing they did went wrong and the way out is on the screen.
  "two-step-required":
    "Your team requires two-step sign-in. Set it up below to carry on - it takes about a minute, and you keep using the same password. Until then this is the only page that will work.",
  failed: "That didn't work, and nothing was changed. Try again in a moment.",
};

const NOTICES: Record<string, string> = {
  "others-signed-out":
    "Signed out everywhere else. Any other browser or device that was signed in to your account needs your email and password again. This one stays signed in.",
  "only-this-browser":
    "This was the only browser signed in to your account, so there was nothing else to sign out.",
  "password-changed":
    "Password changed. Every other device that was signed in to your account has been signed out; this one stays signed in.",
  "mfa-off":
    "Two-step sign-in is off, and your recovery codes no longer work. Signing in now needs only your password.",
  "mfa-already-on": "Two-step sign-in is already on. Nothing was changed.",
  "codes-saved": "Keep your recovery codes somewhere safe and apart from your phone.",
};

function one(params: Record<string, string | string[] | undefined>, key: string): string {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/** The base32 secret in groups of four, which is how people copy it by hand without losing their place. */
function grouped(secret: string): string {
  return secret.replace(/(.{4})/g, "$1 ").trim();
}

export default async function SecurityPage({ searchParams }: Props) {
  const params = await searchParams;
  const error = ERRORS[one(params, "error")] ?? (one(params, "error") ? ERRORS.failed : null);
  const notice = NOTICES[one(params, "notice")] ?? null;

  const [me, mfa] = await Promise.all([getMe(), getMfaStatus()]);

  return (
    <main className="wrap app-main">
      <div className="eyebrow rule">Security</div>
      <h1>Your password and sign-in.</h1>
      <p className="lede">
        These settings are yours alone{me ? <> ({me.email})</> : null}: nobody else on your team can
        see or change them.
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

      <div className="panel" style={{ marginTop: 22 }} id="password">
        <h2>Change password</h2>
        <p className="fine">
          Changing it signs out every other device where you are signed in. This one stays signed
          in.
        </p>
        <form className="form" method="post" action="/api/app/security" style={{ maxWidth: 420 }}>
          <input type="hidden" name="action" value="password" />
          {/* A hidden username lets password managers file the new password against the right account. */}
          <input
            type="email"
            name="username"
            autoComplete="username"
            defaultValue={me?.email ?? ""}
            hidden
            readOnly
          />
          <div className="field">
            <label htmlFor="current_password">Current password</label>
            <input
              id="current_password"
              name="current_password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="new_password">New password</label>
            <input
              id="new_password"
              name="new_password"
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
            />
          </div>
          <div className="field">
            <label htmlFor="confirm_password">New password again</label>
            <input
              id="confirm_password"
              name="confirm_password"
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
            />
          </div>
          <button type="submit" className="btn primary">
            Change password
          </button>
        </form>
      </div>

      <div className="panel" style={{ marginTop: 22 }} id="sessions">
        <h2>Sign out everywhere else</h2>
        <p className="fine">
          Signs out every other browser and device where your account is signed in - a machine at a
          client site, a phone you no longer have, a session you are not sure you closed. They will
          need your email and password again. This browser stays signed in, so you can carry on.
        </p>
        <form method="post" action="/api/app/security">
          <input type="hidden" name="action" value="sign-out-others" />
          <button type="submit" className="btn">
            Sign out everywhere else
          </button>
        </form>
      </div>

      <div className="panel" style={{ marginTop: 22 }} id="two-step">
        <h2>Two-step sign-in</h2>
        {!mfa ? (
          <p className="fine">
            We couldn&apos;t load your two-step sign-in settings just now. Refresh the page to try
            again.
          </p>
        ) : mfa.enabled ? (
          <>
            <p>
              <b>On.</b> Signing in asks for the code from your authenticator app as well as your
              password.
            </p>
            <p className={mfa.recovery_codes_left <= 3 ? "notice stop" : "fine"}>
              {mfa.recovery_codes_left === 0
                ? "You have no recovery codes left. Make a new set now, or losing your phone will lock you out."
                : `${mfa.recovery_codes_left} of 10 recovery codes left.`}
              {mfa.recovery_codes_left > 0 && mfa.recovery_codes_left <= 3
                ? " Make a new set soon."
                : ""}
            </p>

            <h3 style={{ marginTop: 20 }}>New recovery codes</h3>
            <p className="fine">
              Replaces the whole set: the codes you have now stop working. Use this if you have used
              most of them, or think somebody else may have seen them.
            </p>
            <form method="post" action="/api/app/security" style={{ maxWidth: 420 }}>
              <input type="hidden" name="action" value="recovery-codes" />
              <div className="field">
                <label htmlFor="codes_password">Your password</label>
                <input
                  id="codes_password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </div>
              <button type="submit" className="btn">
                Make new recovery codes
              </button>
            </form>

            <h3 style={{ marginTop: 24 }}>Turn off two-step sign-in</h3>
            <p className="fine">
              Your account will then be protected by your password alone, and your recovery codes
              will stop working. To move to a new phone, turn it off here and set it up again.
            </p>
            <form method="post" action="/api/app/security" style={{ maxWidth: 420 }}>
              <input type="hidden" name="action" value="mfa-disable" />
              <div className="field">
                <label htmlFor="disable_password">Your password</label>
                <input
                  id="disable_password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </div>
              <button type="submit" className="btn">
                Turn off two-step sign-in
              </button>
            </form>
          </>
        ) : mfa.pending ? (
          <>
            <p>
              <b>Almost there.</b> Two-step sign-in is still off until you enter a code below.
            </p>
            <ol className="fine" style={{ paddingLeft: 20 }}>
              <li>
                Open an authenticator app on your phone - Google Authenticator, Microsoft
                Authenticator, 1Password or any other that supports time-based codes.
              </li>
              <li>Add an account and scan this code, or type the key below by hand.</li>
              <li>Enter the 6-digit code the app shows for NPI Mark.</li>
            </ol>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start", margin: "16px 0" }}>
              <TotpQr uri={mfa.pending.otpauth_url} label="QR code to add this account to an authenticator app" />
              <div style={{ minWidth: 0, flex: "1 1 240px" }}>
                <div className="fine">Key, for typing in by hand</div>
                <pre className="secret">{grouped(mfa.pending.secret)}</pre>
                <p className="fine">
                  Time-based, 6 digits, every 30 seconds. Keep this key to yourself: anyone who has
                  it can produce your codes.
                </p>
              </div>
            </div>
            <form className="form" method="post" action="/api/app/security" style={{ maxWidth: 420 }}>
              <input type="hidden" name="action" value="mfa-enable" />
              <div className="field">
                <label htmlFor="code">Code from your app</label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9 ]{6,7}"
                  autoComplete="one-time-code"
                  required
                  maxLength={7}
                />
              </div>
              <button type="submit" className="btn primary">
                Turn on two-step sign-in
              </button>
            </form>
            <form method="post" action="/api/app/security" style={{ marginTop: 12 }}>
              <input type="hidden" name="action" value="mfa-setup" />
              <button type="submit" className="btn sm">
                Start again with a new key
              </button>
            </form>
          </>
        ) : (
          <>
            <p>
              <b>Off.</b> Anyone who learns your password can sign in as you.
            </p>
            <p className="fine">
              With two-step sign-in, signing in also needs a 6-digit code from an app on your phone,
              so a stolen password is not enough on its own. You will get ten one-time recovery codes
              for the day you lose your phone. Other devices are signed out when you turn it on.
            </p>
            <form method="post" action="/api/app/security">
              <input type="hidden" name="action" value="mfa-setup" />
              <button type="submit" className="btn primary">
                Set up two-step sign-in
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}

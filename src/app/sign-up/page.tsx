import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import styles from "./plans.module.css";
import Turnstile from "@/components/Turnstile";
import { PLANS, count, dollars } from "@/lib/plans";
import { selectedPlan } from "@/lib/selectedPlan";
import { SSO_EMAIL_COOKIE } from "@/lib/session";

export const metadata: Metadata = {
  title: "Create your account",
  robots: { index: false, follow: false },
};


const ERRORS: Record<string, string> = {
  "bad-credentials": "That email and password don't match an account. Check them and try again.",
  "mfa-not-supported":
    "That account uses an authenticator app. Sign in from the main application until the code screen lands here.",
  disabled: "That account has been disabled. Ask an admin on your team to re-enable it.",
  "too-many": "Too many attempts from this connection. Wait a few minutes and try again.",
  "email-taken":
    "There is already an account for that email. Sign in instead, or reset the password if you have forgotten it.",
  "password-weak": "Use a longer password — at least 12 characters.",
  "work-email":
    "Use your work email address. Personal and temporary mailboxes such as Gmail, Yahoo, Outlook or Mailinator can't open an account.",
  // The API's `disposable_email` refusal, word for word (app/abuse/email_domains.py).
  "temp-email":
    "Please sign up with your work email address. Temporary inbox addresses can't be used.",
  challenge: "We couldn't confirm you're a person. Complete the check above the button and try again.",
  "challenge-down":
    "The check that keeps automated sign-ups out isn't answering right now. Nothing was created; try again in a minute.",
  unavailable: "Sign-up is temporarily unavailable. Nothing was created; please try again shortly.",
  "signed-out": "You have been signed out. Sign in to continue.",
  terms: "Tick the box to agree to the Terms of Service and Privacy Policy, then create the account.",
  failed: "That didn't work. Check what you entered and try again.",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * Sign-up. Work email only: free and disposable mailbox domains are refused by the API
 * (app/abuse/email_domains.py), because a trial multiplied across throwaway addresses is the
 * cheapest way to copy a database. The Turnstile check appears only once it is configured.
 */
export default async function SignUpPage({ searchParams }: Props) {
  const trial = process.env.NPI_CARD_TRIAL_ENABLED === "true";
  const params = await searchParams;
  const chosenPlan = selectedPlan(params.plan);
  const notice = typeof params.notice === "string" ? params.notice : null;
  const error = typeof params.error === "string" ? ERRORS[params.error] ?? ERRORS.failed : null;
  // Set by the SSO callback when Google or Microsoft confirmed an address that has no account.
  // Only read, and only when that notice is showing: an old cookie must not fill in a stranger's
  // form days later (it expires after ten minutes anyway).
  const ssoEmail =
    notice === "sso-no-account" ? (await cookies()).get(SSO_EMAIL_COOKIE)?.value ?? null : null;

  return (
    <main className={styles.page}>
      <header className={styles.intro}>
        <div className="eyebrow rule">Your next healthcare connection starts here</div>
        <h1>Choose your plan. Find your people.</h1>
        <p>Compare three ways to search healthcare professionals and access work contact details.
          Select a package, then create your account.</p>
        <p className={styles.note}>{trial
          ? "Eligible organizations can start a seven-day trial after secure card setup. Review renewal and cancellation terms before confirming in checkout."
          : "Creating an account is free. Your package choice carries forward for review; selecting a plan here does not charge your card or start a subscription."}</p>
      </header>
          {error && (
            <div className="notice stop" style={{ marginBottom: 16 }} role="alert">
              {error}
            </div>
          )}
          {notice === "no-email-yet" && (
            <div className="notice warn" style={{ marginBottom: 16 }}>
              Password reset needs email, which is not switched on yet. Ask us and we will reset
              it by hand.
            </div>
          )}

          {notice === "sso-no-account" && (
            <div className="notice warn" style={{ marginBottom: 16 }} role="status">
              {ssoEmail ? (
                <>
                  There is no account for <strong>{ssoEmail}</strong> yet.
                </>
              ) : (
                <>There is no account for that address yet.</>
              )}{" "}
              Create one here with your organization&apos;s name and a password; after that you can
              sign in with Google or Microsoft as well.
            </div>
          )}

          <form className={styles.layout} method="post" action="/api/auth/sign-up">
            <fieldset className={styles.plans}>
              <legend>1. Choose your package</legend>
              <div className={styles.grid}>
                {PLANS.filter(plan => ["starter", "professional", "scale"].includes(plan.code)).map(plan => (
                  <label key={plan.code} className={styles.card}>
                    <input type="radio" name="plan" value={plan.code}
                      defaultChecked={chosenPlan === plan.code} required />
                    <span className={styles.name}>{plan.name}</span>
                    <span className={styles.price}>{dollars(plan.priceCents ?? 0)}</span>
                    <span className={styles.caption}>USD / month{trial ? " after the trial" : " on a paid subscription"}</span>
                    <ul className={styles.features}>
                      <li><strong>{count(plan.reveals)}</strong> work email reveals</li>
                      <li><strong>{count(plan.rows)}</strong> records across exports, API and append</li>
                      <li><strong>{count(plan.apiCalls)}</strong> API calls</li>
                      <li><strong>{plan.seats}</strong> separate user accounts included</li>
                      <li>{plan.append ? "Upload your own list for append" : "Search and build lists"}</li>
                    </ul>
                    <span className={styles.select}>Select {plan.name}</span>
                  </label>
                ))}
              </div>
              <p className={styles.note}>Allowances shown are for a paid month. Trial allowances, eligibility and the exact end date
                are confirmed in billing. Included users have separate logins; the price is for the package.</p>
              <p className={styles.note}>Need bulk data or a custom agreement? <Link href="/bulk-data">Talk to sales</Link>.
                See <Link href="/pricing">full plan details</Link>.</p>
            </fieldset>
            <section className={styles.account} aria-labelledby="account-details">
              <h2 id="account-details">2. Create your account</h2>
              <p className={styles.note}>Card details, when required, are entered securely in Stripe after account creation.</p>
              <div className="form">
            <div className="field">
              <label htmlFor="name">Your name</label>
              <input id="name" name="name" autoComplete="name" required maxLength={120} />
            </div>
            <div className="field">
              <label htmlFor="org">Organization</label>
              <input id="org" name="org" autoComplete="organization" required maxLength={120} />
            </div>
            <div className="field">
              <label htmlFor="email">Work email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@yourcompany.com"
                defaultValue={ssoEmail ?? undefined}
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password, 12 characters or more</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
              />
            </div>
            {/* Required here and refused by the API without it (terms_not_accepted); the account
                records the version agreed to (src/content/legal/version.ts). */}
            <label className="check">
              <input type="checkbox" name="accept_terms" value="yes" required />
              <span>
                I agree to the <Link href="/terms">Terms of Service</Link> and{" "}
                <Link href="/privacy">Privacy Policy</Link>
              </span>
            </label>
            <Turnstile action="sign-up" />
            <button type="submit" className="btn primary block lg">
              Create account and review plan
            </button>
              </div>
            </section>
          </form>

          <p className="fine" style={{ marginTop: 18 }}>
            Contact details are available only
            for the purposes your plan permits - the <Link href="/terms">Terms</Link> say it in
            full. Already have an account? <Link href="/sign-in">Sign in</Link>.
          </p>
    </main>
  );
}

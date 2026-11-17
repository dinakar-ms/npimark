import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { postGpcOptOut } from "@/lib/api";
import { gpcSignal, recordGpcOptOutForSignedInVisitor } from "@/lib/gpc";
import { PATH_HEADER } from "@/proxy";
import { getMe, getBilling } from "@/lib/session";
import { upgradeNotice } from "@/lib/upgradeNotice";

/**
 * Everything under /app requires a session, checked here rather than on each page.
 *
 * A layout is the right place for it: a page added tomorrow inherits the guard instead of relying
 * on somebody remembering to add it. The check is a real call to the API, so a session revoked
 * from another device stops working on the next request rather than at the next sign-in.
 *
 * It is also the one place a signed-in visitor's Global Privacy Control signal is acted on. There
 * is an identified person behind every request here, so the opt-out has to reach the platform's
 * own privacy state rather than just a line of text; and this layout already reads the session, so
 * reading the header costs nothing that was not already per-request. The public pages must stay
 * prerendered, which is why the footer's note is a client component instead.
 *
 * The signal is posted once a session rather than once a page - `lib/gpc.ts` keeps that bookkeeping
 * - and an anonymous visitor never reaches this code at all, because there is no /app without a
 * session.
 */

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await getMe();
  if (!me) redirect("/sign-in?error=signed-out");

  // The team requires a second factor and this person has not set one up. Every page behind here
  // would answer 403 (`mfa_setup_required`), so they are sent to the one page that can clear it
  // rather than shown a wall of refusals and left to work out which of them to act on.
  //
  // The security page itself is excluded, or this would be a redirect loop. It is checked by prefix
  // rather than by exact match because the page carries a fragment and may grow sub-paths, and the
  // platform is the thing actually enforcing the rule - this redirect is only where somebody lands.
  const path = (await headers()).get(PATH_HEADER) ?? "";
  // A billing outage must not turn into a plan restriction or a sign-in redirect.
  const billing = await getBilling().catch(() => null);
  const upgrade = upgradeNotice(path, billing);
  if (me.org.mfa_required && !me.mfa_enabled && !path.startsWith("/app/security")) {
    redirect("/app/security?error=two-step-required#two-step");
  }

  if (gpcSignal(await headers())) {
    // Once a session, not once a page: the hook remembers what it has posted, and the endpoint is
    // idempotent on the account id besides. It never throws, so nothing here is guarded - a
    // platform that cannot be reached must not cost somebody their account page.
    await recordGpcOptOutForSignedInVisitor(
      { accountId: me.id, email: me.email },
      postGpcOptOut,
    );
  }

  return (
    <div className="app-shell np-live-shell">
      <header className="app-bar">
        <div className="wrap app-bar-inner">
          <Link href="/app" className="brand">
            <svg viewBox="0 0 100 100" aria-hidden="true"><rect x="12" y="23" width="18" height="65" rx="9" fill="#4563ef" /><rect x="64" y="23" width="18" height="65" rx="9" fill="#4563ef" /><path d="M21 32 73 79" fill="none" stroke="#23c8df" strokeWidth="18" strokeLinecap="round" /><circle cx="73" cy="12" r="5.562" fill="#ff8058" /></svg>NPImark
          </Link>
          <nav className="app-nav" aria-label="Your account">
            {/* The business dashboard comes first for an internal account, because for the person
                who owns the business it *is* the first page - how many customers there are, how
                many seats are held against how many are allowed, what is being consumed. It spent
                its first weeks as the sixth item inside the Account dropdown, between Security and
                Settings, where the owner reasonably reported that the product had no admin view at
                all. A dashboard nobody can find is a dashboard nobody has.

                `settings.manage` is outside `CUSTOMER_CEILING`, so no customer can hold it however
                their own role is named. The page checks it again and answers 404 to anybody else,
                so this link is a convenience and not the guard. */}
            {me.permissions.includes("settings.manage") && <Link href="/app/owner" aria-current={path === "/app/owner" || path.startsWith("/app/owner/") ? "page" : undefined}>Business</Link>}
            <span className="np-nav-label">Intelligence workspace</span>
            <Link href="/app" aria-current={path === "/app" ? "page" : undefined}>Overview</Link>
            <Link href="/app/find" aria-current={path === "/app/find" || path.startsWith("/app/find/") ? "page" : undefined}>Search</Link>
            <Link href="/app/search" aria-current={path.startsWith("/app/search") || path.startsWith("/app/provider/") ? "page" : undefined}>Physicians & organizations</Link>
            <Link href="/app/lists" aria-current={path === "/app/lists" || path.startsWith("/app/lists/") ? "page" : undefined}>Lists</Link>
            <Link href="/app/campaigns" aria-current={path === "/app/campaigns" || path.startsWith("/app/campaigns/") ? "page" : undefined}>Campaigns</Link>
            <Link href="/app/alerts" aria-current={path === "/app/alerts" || path.startsWith("/app/alerts/") ? "page" : undefined}>Alerts</Link>
            <Link href="/app/exports" aria-current={path === "/app/exports" || path.startsWith("/app/exports/") ? "page" : undefined}>Exports</Link>
            <Link href="/app/assistant" aria-current={path.startsWith("/app/assistant") ? "page" : undefined}>AI assistant</Link>
            <Link href="/app/integrations" aria-current={path.startsWith("/app/integrations") ? "page" : undefined}>Deliver to tools</Link>
            <Link href="/app/append" aria-current={path === "/app/append" || path.startsWith("/app/append/") ? "page" : undefined}>Append</Link>
            {/* The account half, behind one heading rather than beside the work.
                `.app-nav` wraps, so thirteen links never ran off the screen - they ran onto a
                second row, which on a 1280px laptop pushed the bar into the page. Two of the
                thirteen were added on 2026-10-03 (Lists, Campaigns) and tipped it over.

                The split is by how often somebody needs the link, not by what it does: the eight
                above are the work, and these are the five you visit when something needs setting
                up or paying for. A `<details>` because this screen runs no client JavaScript; it
                closes by clicking the heading again, exactly as the public site's menu does. */}
            <details className="app-acct" open>
              <summary>Account</summary>
              <div className="app-acct-panel">
                <Link href="/app/keys" aria-current={path === "/app/keys" || path.startsWith("/app/keys/") ? "page" : undefined}>API keys</Link>
                <Link href="/app/team" aria-current={path === "/app/team" || path.startsWith("/app/team/") ? "page" : undefined}>Team</Link>
                {/* Named for what is on it. The allowances live here, and a limit nobody can find
                    is a limit that arrives as a surprise. */}
                <Link href="/app/billing" aria-current={path === "/app/billing" || path.startsWith("/app/billing/") ? "page" : undefined}>Plan and usage</Link>
                <Link href="/app/security" aria-current={path === "/app/security" || path.startsWith("/app/security/") ? "page" : undefined}>Security</Link>
                <Link href="/app/settings" aria-current={path === "/app/settings" || path.startsWith("/app/settings/") ? "page" : undefined}>Settings</Link>
              </div>
            </details>
          </nav>
          <span className="app-who">
            <span className="np-nav-label">Your organization</span>
            <span className="fine">{me.org.name}</span>
            <form method="post" action="/api/auth/sign-out">
              <button type="submit" className="btn sm">
                Sign out
              </button>
            </form>
          </span>
        </div>
      </header>
      {!me.email_verified_at && (
        <div className="wrap" style={{ paddingTop: 16 }}>
          <div className="notice stop" role="status">
            <b>Confirm your email address.</b> Searching works now; opening contact details and
            exporting rows wait until we know the address is yours. The link is in the message we
            sent to {me.email}.
            <form method="post" action="/api/app/resend-verification" style={{ marginTop: 10 }}>
              <button type="submit" className="btn sm">
                Send it again
              </button>
            </form>
          </div>
        </div>
      )}
      {upgrade && <div className="wrap" style={{ paddingTop: 16 }}>
        <div className="notice" role="status">
          <p>{upgrade}</p>
          <Link className="btn primary" href="/app/billing#upgrade">{billing?.active ? "Review upgrade options" : "Review billing"}</Link>
          {billing?.can_manage_billing === false && <p className="fine">Your organization’s owner or billing admin must approve plan changes.</p>}
        </div>
      </div>}
      {children}
    </div>
  );
}


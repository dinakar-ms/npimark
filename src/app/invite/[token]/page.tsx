import type { Metadata } from "next";
import Link from "next/link";
import { apiGetWithToken } from "@/lib/session";

/**
 * Where the link in an invitation lands: who asked, which organisation, as what, and a button.
 *
 * Reading the invitation is a GET that spends nothing (`/api/auth/invites/{token}` describes it),
 * and accepting is a POST from a button - the same rule as /verify-email, /reset-password and the
 * removal confirmation, and for the same reason: mail scanners, link previewers and corporate
 * proxies fetch every URL they are sent, and a GET that accepted the invitation would burn it
 * before the person ever saw this page. Worse here than elsewhere, because an invitation can only
 * be used once and a burnt one leaves somebody locked out of an organisation that has paid for
 * their seat.
 *
 * Signed out is the only case: they have no account yet. The API's accept endpoint takes a name
 * and a password and signs them in, so this page asks for both and the route handler keeps the
 * session - the browser never holds a credential or a cross-origin cookie.
 *
 * Never cached and never indexed: every render is about one token.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Accept your invitation",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
};

type InvitePublic = {
  email: string;
  org_name: string;
  role: string;
  expires_at: string;
  invited_by: string | null;
};

/**
 * What each role can do, in the same voice the team page uses to offer them - "analyst" means
 * nothing to somebody deciding whether to accept.
 */
const ROLES: Record<string, string> = {
  admin: "an admin — everything, including issuing keys and inviting people",
  analyst: "an analyst — search, reveal, export and keep lists",
  consumer_operator: "an operator — the work that runs against licensed files",
  viewer: "a viewer — search and read, without revealing or exporting",
};

/** Why the invitation cannot be read. Each one has a different thing to do next. */
const UNREADABLE: Record<string, { title: string; body: string }> = {
  invite_used: {
    title: "That invitation has already been used.",
    body: "The account exists, so signing in is the way in. If it was not you who used it, tell whoever invited you.",
  },
  invite_revoked: {
    title: "That invitation was withdrawn.",
    body: "An admin canceled it. Ask them to send a new one if you should still have a seat.",
  },
  invite_expired: {
    title: "That invitation has expired.",
    body: "Invitations last seven days. Ask whoever invited you for a fresh link - it takes them a moment.",
  },
  invite_not_found: {
    title: "We cannot find that invitation.",
    body: "Check that the whole link was copied, including everything after the last slash. If it still does not work, ask for a new one.",
  },
};

/** Why accepting failed, having read the invitation fine a moment earlier. */
const REFUSED: Record<string, string> = {
  "password-weak": "Use a longer password — at least 12 characters.",
  mismatch: "The two passwords don't match. Type the same one in both boxes.",
  "name-missing": "We need a name to put on the account.",
  user_exists:
    "An account with this address already exists. Sign in instead, or ask an admin for help.",
  seat_limit:
    "This organization is at its seat limit, so there is no seat for this invitation right now. Your invitation is still good: ask whoever invited you to free a seat or move to a larger plan, then use this link again. Or reply to the invitation email and we will sort it out.",
  expired:
    "That invitation ran out while this page was open. Ask whoever invited you for a fresh link.",
  "too-many": "Too many attempts from this connection. Wait a few minutes and try again.",
  failed: "That didn't work, and no account was created. Try again in a minute.",
};

function Stop({ title, body }: { title: string; body: string }) {
  return (
    <main className="wrap app-main">
      <div className="eyebrow rule">Invitation</div>
      <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}>{title}</h1>
      <p className="lede">{body}</p>
      <p className="fine" style={{ marginTop: 18 }}>
        <Link href="/sign-in">Go to sign in</Link>
      </p>
    </main>
  );
}

export default async function AcceptInvitePage({ params, searchParams }: Props) {
  const { token } = await params;
  const { error } = await searchParams;

  const found = await apiGetWithToken<InvitePublic>(
    `/api/auth/invites/${encodeURIComponent(token)}`,
  );
  if (!found.ok) {
    const reason = UNREADABLE[found.code];
    return reason ? (
      <Stop {...reason} />
    ) : (
      <Stop
        title="We cannot read that invitation just now."
        body="Nothing is wrong with your link as far as we can tell. Try it again in a minute."
      />
    );
  }

  const invite = found.data;
  const role = ROLES[invite.role] ?? `a ${invite.role}`;
  const asked = invite.invited_by
    ? `${invite.invited_by} invited you to join ${invite.org_name}`
    : `You have been invited to join ${invite.org_name}`;
  const message = error ? (REFUSED[error] ?? REFUSED.failed) : null;

  return (
    <main className="wrap app-main">
      <div className="eyebrow rule">Invitation</div>
      <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}>{asked}.</h1>
      <p className="lede">
        You will join as {role}. The account is for {invite.email}, and choosing a password below
        creates it and signs you in.
      </p>

      {message && (
        <div className="notice stop" style={{ marginTop: 18 }} role="alert">
          {message}
        </div>
      )}

      <form className="form" method="post" action="/api/invite/accept" style={{ marginTop: 22, maxWidth: 420 }}>
        <input type="hidden" name="token" value={token} />
        <div className="field">
          <label htmlFor="name">Your name</label>
          <input id="name" name="name" type="text" autoComplete="name" maxLength={200} required />
        </div>
        <div className="field">
          <label htmlFor="password">Choose a password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="confirm">Same again</label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
          />
        </div>
        <button type="submit" className="btn primary block lg">
          Accept and create my account
        </button>
      </form>

      <p className="fine" style={{ marginTop: 18 }}>
        Not expecting this? Close the page - nothing is created until you press the button, and the
        invitation expires on its own. Our{" "}
        <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link> apply to
        the account.
      </p>
    </main>
  );
}

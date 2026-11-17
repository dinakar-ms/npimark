import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import {
  getBilling,
  getInvites,
  getMe,
  getPeople,
  getTwoStepPolicy,
} from "@/lib/session";

/**
 * The people in this organisation, and the invitations waiting to be accepted.
 *
 * Roles are described by what they can do rather than by their name, because "analyst" means
 * nothing to somebody deciding who to invite. The one that matters is the difference between a
 * seat that can spend the plan's allowance and one that cannot.
 *
 * The invitation is emailed, and the link also comes back once and is shown here - so an admin can
 * pass it on themselves when mail is not configured on this install, or simply has not arrived.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your team",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const INVITE_COOKIE = "npim_new_invite";

const ROLES = [
  {
    value: "admin",
    label: "Admin — everything, including issuing keys and inviting people",
  },
  {
    value: "analyst",
    label: "Analyst — search, reveal, export and keep lists (spends the allowance)",
  },
  {
    value: "viewer",
    label: "Viewer — search and read only, cannot reveal or export",
  },
] as const;

const ERRORS: Record<string, string> = {
  "needs-email-and-role": "An email address and a role, please.",
  user_exists: "Somebody with that email already has an account, so they do not need an invite.",
  forbidden: "Only an owner or admin can invite people.",
  "revoke-failed": "That invitation could not be withdrawn. Refresh and try again.",
  max_users:
    "Your plan's seats are all taken, so nobody was invited. Plan and usage says how many it includes and how to get more.",
  "mfa-reset-failed":
    "Two-step sign-in could not be reset for that person. Refresh the page - it may already be off.",
  "two-step-yourself-first":
    "Set up two-step sign-in for your own account first. You are about to require it of everybody, and you would be the first person it stopped.",
  "two-step-failed": "That setting could not be changed, so nothing was changed. Try again.",
  failed: "That didn't work, and nobody was invited.",
};

function one(params: Record<string, string | string[] | undefined>, key: string): string {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function TeamPage({ searchParams }: Props) {
  const params = await searchParams;
  const error = one(params, "error");
  const revoked = one(params, "revoked");
  const mfaReset = one(params, "mfa_reset");
  const twoStep = one(params, "two_step");

  const [me, peopleOrNull, invitesOrNull, billing, twoStepPolicy, jar] = await Promise.all([
    getMe(),
    getPeople(),
    getInvites(),
    getBilling(),
    // Null for anybody whose role cannot set it - `apiGet` turns the 403 into null - so the panel
    // below simply does not render rather than showing a control that would be refused.
    getTwoStepPolicy(),
    cookies(),
  ]);

  let fresh: { email: string; url: string } | null = null;
  const raw = jar.get(INVITE_COOKIE)?.value;
  if (raw) {
    try {
      fresh = JSON.parse(raw) as { email: string; url: string };
    } catch {
      fresh = null;
    }
  }

  // The raw answers say whether the colleagues could be read at all; the rest of the page counts
  // and lists, so it works off real arrays. A failed read must not render as "it is just you".
  const people = peopleOrNull ?? [];
  const invites = invitesOrNull ?? [];
  const pending = invites.filter((invite) => !invite.accepted_at);
  const canManage = me?.permissions.includes("users.manage") ?? false;
  const seats = billing?.max_users ?? null;

  return (
    <main className="wrap app-main">
      <div className="eyebrow rule">Team</div>
      <h1>Who is in {me?.org.name}.</h1>
      <p className="lede">
        Your plan&rsquo;s allowance is counted for the organization, not per person — so one
        colleague&rsquo;s export is visible to everybody who can see this page.
      </p>
      {seats !== null && peopleOrNull !== null && (
        <p className="fine" style={{ marginTop: 10 }}>
          <b>
            {people.length} of {seats} seats
          </b>{" "}
          used{invitesOrNull === null ? ", invitation count unavailable" : pending.length > 0 ? `, ${pending.length} invitation${pending.length === 1 ? "" : "s"} pending` : ""}.
        </p>
      )}

      {/* An empty table and a table nobody could read look identical. Said once, at the top. */}
      {(peopleOrNull === null || invitesOrNull === null) && (
        <div className="notice warn" style={{ marginTop: 16 }} role="alert">
          Your colleagues could not be read just now, so this list may be incomplete. That is not
          the same as nobody else being here &mdash; try again before inviting anyone.
        </div>
      )}

      {error && (
        <div className="notice stop" style={{ marginTop: 16 }} role="alert">
          {ERRORS[error] ?? ERRORS.failed}
        </div>
      )}
      {mfaReset && !error && (
        <div className="notice ok" style={{ marginTop: 16 }} role="status">
          Two-step sign-in is off for that person. They can sign in with their password, and
          should set it up again straight away from their Security page.
        </div>
      )}
      {twoStep && !error && (
        <div className="notice ok" style={{ marginTop: 16 }} role="status">
          {twoStep === "on"
            ? "Two-step sign-in is now required. Anybody who has not set it up will be asked to before they can carry on - they can still sign in and do it themselves."
            : "Two-step sign-in is no longer required. Anybody who has set it up keeps it."}
        </div>
      )}
      {revoked && !error && (
        <div className="notice ok" style={{ marginTop: 16 }}>
          Invitation withdrawn. That link no longer works.
        </div>
      )}

      {fresh && (
        <div className="panel" style={{ marginTop: 20, borderColor: "var(--accent)" }}>
          <h2>Invitation for {fresh.email}</h2>
          <p className="fine">
            We email them this link as well. If it does not arrive, this is the one to pass on
            yourself &mdash; it expires in seven days and can only be used once.
          </p>
          <pre className="secret">{fresh.url}</pre>
          <form method="post" action="/api/app/invite">
            <input type="hidden" name="action" value="dismiss" />
            <button type="submit" className="btn">
              Done
            </button>
          </form>
        </div>
      )}

      {twoStepPolicy && (
        <div className="panel" style={{ marginTop: 22 }}>
          <h2>Two-step sign-in for the team</h2>
          <p className="fine">
            {twoStepPolicy.required
              ? "Everybody here signs in with a code from their authenticator app as well as their password. Nobody can switch it off for their own account while this is on."
              : "Each person chooses for themselves today. Requiring it means one reused password cannot open everything your team has paid for."}
          </p>
          {/* The number, before the decision rather than in the support queue after it. */}
          <p className="fine" style={{ marginTop: 10 }}>
            <b>
              {twoStepPolicy.members_without} of {twoStepPolicy.members_total}
            </b>{" "}
            {twoStepPolicy.members_without === 1 ? "person has" : "people have"} not set it up yet.
            {twoStepPolicy.members_without > 0 &&
              (twoStepPolicy.required
                ? " They can sign in and set it up, and nothing else, until they do."
                : " Turning this on will ask them to before they can carry on.")}
          </p>
          <form method="post" action="/api/app/team" style={{ marginTop: 14 }}>
            <input type="hidden" name="action" value="two-step" />
            {/* An unchecked checkbox sends nothing, which is exactly how "off" is expressed. */}
            {twoStepPolicy.required ? null : <input type="hidden" name="required" value="on" />}
            <button type="submit" className="btn">
              {twoStepPolicy.required ? "Stop requiring it" : "Require two-step sign-in"}
            </button>
          </form>
          {!twoStepPolicy.required && me?.mfa_enabled === false && (
            <p className="fine" style={{ marginTop: 12 }}>
              You have not set it up yourself yet, and you would be the first person it stopped.{" "}
              <Link href="/app/security#two-step">Set it up first</Link>.
            </p>
          )}
        </div>
      )}

      {canManage && <div className="panel" style={{ marginTop: 22 }}>
        <h2>Invite a colleague</h2>
        <form className="filters" method="post" action="/api/app/invite">
          <div className="field">
            <label htmlFor="email">Their work email</label>
            <input id="email" name="email" type="email" required maxLength={320} />
          </div>
          <div className="field">
            <label htmlFor="name">Their name (optional)</label>
            <input id="name" name="name" maxLength={200} />
          </div>
          {/* The role labels are sentences, so this field asks for a track of its own - but a
              floor of a flat 320px is 40px wider than a 320px phone's column, and produced the
              page's only horizontal scrollbar. It yields below its own width instead. */}
          <div className="field" style={{ minWidth: "min(320px, 100%)" }}>
            <label htmlFor="role">What they may do</label>
            <select id="role" name="role" defaultValue="analyst">
              {ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn primary">
            Create invitation
          </button>
        </form>
      </div>}

      <div className="results-head" style={{ marginTop: 28 }}>
        <b>People</b>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Person</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last signed in</th>
              <th>Two-step</th>
            </tr>
          </thead>
          <tbody>
            {people.map((person) => (
              <tr key={person.id}>
                <td>
                  <b>{person.name}</b>
                  <span className="fine" style={{ display: "block" }}>
                    {person.email}
                    {person.id === me?.id ? " · you" : ""}
                  </span>
                </td>
                <td className="fine">{person.role}</td>
                <td>
                  <span className={`tag ${person.status === "active" ? "ok" : "warn"}`}>
                    {person.status}
                  </span>
                </td>
                <td className="fine num nowrap-cell">
                  {person.last_login_at ? person.last_login_at.slice(0, 10) : "never"}
                </td>
                <td className="fine">
                  {person.mfa_enabled ? "on" : "off"}
                  {person.mfa_enabled && canManage && person.id !== me?.id && (
                    <form method="post" action="/api/app/team" style={{ marginTop: 6 }}>
                      <input type="hidden" name="action" value="reset-mfa" />
                      <input type="hidden" name="id" value={person.id} />
                      <button
                        type="submit"
                        className="btn sm"
                        title="For someone who has lost their phone and their recovery codes"
                      >
                        Reset two-step
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canManage && peopleOrNull !== null && invitesOrNull !== null && people.length === 1 && pending.length === 0 && (
        <p className="fine" style={{ marginTop: 14 }}>
          You are the only person on this account. Somebody you invite works from the same
          allowance, the same saved searches and the same alerts, so a list never has to be passed
          around as a file &mdash; and every reveal and export stays attributable to whoever made
          it. Invite them above.
        </p>
      )}

      {canManage && pending.length > 0 && (
        <>
          <div className="results-head" style={{ marginTop: 28 }}>
            <b>Pending invitations</b>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Expires</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {pending.map((invite) => (
                  <tr key={invite.id}>
                    <td>{invite.email}</td>
                    <td className="fine">{invite.role}</td>
                    <td className="fine num nowrap-cell">{invite.expires_at.slice(0, 10)}</td>
                    <td>
                      <form method="post" action="/api/app/invite">
                        <input type="hidden" name="action" value="revoke" />
                        <input type="hidden" name="id" value={invite.id} />
                        <button type="submit" className="btn sm">
                          Withdraw
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}

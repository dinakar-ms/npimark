import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { getKeys, getScopes } from "@/lib/session";

/**
 * API keys a customer issues for themselves.
 *
 * The secret appears exactly once, in a panel they have to dismiss. It arrives in a short-lived
 * httpOnly cookie set by the create handler rather than in the URL, because a URL survives in
 * history, screenshots and proxy logs, and a key that outlives the moment it was issued is a key
 * somebody else can find.
 *
 * A scope the person could not grant is shown disabled rather than hidden, with the reason. A
 * key can never hold more than its creator, and an option that silently vanishes teaches nobody
 * why.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "API keys",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const NEW_KEY_COOKIE = "npim_new_key";

const ERRORS: Record<string, string> = {
  "needs-name-and-scope": "Give the key a name and at least one scope.",
  forbidden: "Only an owner or admin on your team can issue keys.",
  "revoke-failed": "That key could not be revoked. Refresh and try again.",
  failed: "That didn't work. Nothing was issued.",
};

function one(params: Record<string, string | string[] | undefined>, key: string): string {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function KeysPage({ searchParams }: Props) {
  const params = await searchParams;
  const error = one(params, "error");
  const revoked = one(params, "revoked");

  const [keys, scopes, jar] = await Promise.all([getKeys(), getScopes(), cookies()]);

  let issued: { name: string; secret: string } | null = null;
  const raw = jar.get(NEW_KEY_COOKIE)?.value;
  if (raw) {
    try {
      issued = JSON.parse(raw) as { name: string; secret: string };
    } catch {
      issued = null;
    }
  }

  return (
    <main className="wrap app-main">
      <div className="eyebrow rule">API keys</div>
      <p><Link href="/app/ai">Manage AI connections</Link></p>
      <h1>Keys your own systems call with.</h1>
      <p className="lede">
        A key belongs to this organization, carries the scopes you choose, and can never hold
        more than the person who created it. See <Link href="/docs/api">the API reference</Link>{" "}
        for what it can do.
      </p>

      {error && (
        <div className="notice stop" style={{ marginTop: 16 }} role="alert">
          {ERRORS[error] ?? ERRORS.failed}
        </div>
      )}
      {revoked && !error && (
        <div className="notice ok" style={{ marginTop: 16 }}>
          Key revoked. It stops working immediately, and stays listed as revoked because what it
          did last month is still a fact.
        </div>
      )}

      {issued && (
        <div className="panel" style={{ marginTop: 20, borderColor: "var(--accent)" }}>
          <h2>Copy this now â€” it is shown once</h2>
          <p className="fine">
            <b>{issued.name}</b>. We keep a hash of it, not the key, so this is the only time it
            can be displayed. If it is lost, revoke it and issue another.
          </p>
          <pre className="secret">{issued.secret}</pre>
          <form method="post" action="/api/app/keys">
            <input type="hidden" name="action" value="dismiss" />
            <button type="submit" className="btn">
              I have saved it
            </button>
          </form>
        </div>
      )}

      <div className="panel" style={{ marginTop: 22 }}>
        <h2>New key</h2>
        <form method="post" action="/api/app/keys">
          <div className="field" style={{ maxWidth: 420 }}>
            <label htmlFor="name">What is it for?</label>
            <input
              id="name"
              name="name"
              required
              maxLength={120}
              placeholder="e.g. production sync"
            />
          </div>
          <fieldset className="scopes">
            <legend className="fine">Scopes</legend>
            {scopes.map((scope) => (
              <label key={scope.scope} className={scope.available ? "" : "unavailable"}>
                <input
                  type="checkbox"
                  name="scopes"
                  value={scope.scope}
                  disabled={!scope.available}
                />
                <span>
                  <span className="mono">{scope.scope}</span>
                  <span className="fine" style={{ display: "block" }}>
                    {scope.description}
                    {!scope.available && " â€” you do not hold the permission this needs"}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
          <button type="submit" className="btn primary" style={{ marginTop: 14 }}>
            Issue key
          </button>
        </form>
      </div>

      {/* "We could not read them" and "you have none" are different sentences, and on this page
          the difference costs something: somebody told they have no key makes a replacement, and
          now there are two. */}
      {keys === null ? (
        <div className="panel" style={{ marginTop: 28 }}>
          <div className="notice warn" role="alert">
            Your API keys could not be read just now, so they are not listed. That is not the same
            as having none &mdash; try again before creating one, or you may end up with two.
          </div>
        </div>
      ) : keys.length === 0 ? (
        <div className="panel" style={{ marginTop: 28 }}>
          <h2>You have no keys yet</h2>
          <p className="fine">
            A key lets your own systems ask the API the questions you would otherwise ask on these
            pages: search providers, read a record, start an export, read what your organization has
            spent. Calls made with a key count against the same monthly allowances as the app.
          </p>
          <p className="fine">
            Issue the first one from the form above. The secret is shown once, on that one screen â€”
            we keep a hash of it and cannot show it again â€” so have somewhere to paste it before you
            press the button. <Link href="/docs/api">The API reference</Link> has the endpoints and
            an example call.
          </p>
        </div>
      ) : (
        <>
          <div className="results-head" style={{ marginTop: 28 }}>
            <b>Your keys</b>
          </div>
          <div className="table-wrap" tabIndex={0} role="region" aria-label="Your API keys">
            <table>
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Scopes</th>
                  <th>Last used</th>
                  <th>Status</th>
                  <th><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {keys.map((key) => (
                  <tr key={key.id}>
                    <td>
                      <b>{key.name}</b>
                      <span className="fine mono" style={{ display: "block" }}>
                        {key.prefix}â€¦
                      </span>
                    </td>
                    <td className="fine">
                      {key.scopes.map((scope) => (
                        <span key={scope} className="tag" style={{ marginRight: 4 }}>
                          {scope}
                        </span>
                      ))}
                    </td>
                    <td className="fine num nowrap-cell">
                      {key.last_used_at ? key.last_used_at.slice(0, 10) : "never"}
                    </td>
                    <td>
                      <span className={`tag ${key.status === "active" ? "ok" : "warn"}`}>
                        {key.status}
                      </span>
                    </td>
                    <td>
                      {key.status === "active" && (
                        <form method="post" action="/api/app/keys">
                          <input type="hidden" name="action" value="revoke" />
                          <input type="hidden" name="id" value={key.id} />
                          <button type="submit" className="btn sm">
                            Revoke
                          </button>
                        </form>
                      )}
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

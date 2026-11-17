import type { Metadata } from "next";
import Link from "next/link";
import { apiPost, sessionToken } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "AI connections", robots: { index: false, follow: false } };
type Connection = { id: string; name: string; scopes: string[]; status: string;
  created_at: string; expires_at: string | null; last_used_at: string | null };

export default async function AIConnections() {
  const result = await apiPost<Connection[]>("/api/mcp/connections", {}, {
    sessionToken: await sessionToken(),
  }).catch(() => null);
  return <main className="wrap app-main">
    <div className="eyebrow">Connected tools</div><h1>Your AI connections</h1>
    <p>Claude, ChatGPT and compatible MCP clients use your organization&apos;s existing permissions and API allowances.</p>
    <p>This pilot is read-only. No contact reveals, exports or external sends. Access expires after one hour; reconnect from the assistant when needed.</p>
    <p><Link href="/app/billing">Review Plan and usage</Link> · <Link href="/docs/mcp">Connection setup</Link></p>
    {!result?.ok ? <div role="alert">Connections could not be loaded. Refresh to retry; your session has not been cleared.</div>
      : result.data.length === 0 ? <p>No AI connections yet.</p>
      : <ul style={{ padding: 0, listStyle: "none" }}>{result.data.map(c => <li key={c.id} style={{ padding: "1rem 0", borderBottom: "1px solid #ddd", overflowWrap: "anywhere" }}>
        <h2>{c.name}</h2><p>{c.status} · {c.scopes.join(", ")}</p>
        <p>Expires: {c.expires_at ?? "Not activated"}. Last used: {c.last_used_at ?? "Never"}.</p>
        {c.status !== "revoked" && <form method="post" action="/api/app/ai">
          <input type="hidden" name="id" value={c.id} /><button className="btn" name="action" value="revoke">Disconnect</button>
        </form>}
      </li>)}</ul>}
  </main>;
}

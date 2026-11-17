import type { Metadata } from "next";
import Link from "next/link";
import { apiPost, getMe, sessionToken } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Connect an AI assistant", robots: { index: false, follow: false }, referrer: "no-referrer",
};

export default async function ConnectAI({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const parameters: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value !== "string" || value.length > 2048) {
      return <main className="wrap"><h1>Invalid connection request</h1><p>Start again from your AI assistant.</p></main>;
    }
    parameters[key] = value;
  }
  const me = await getMe();
  if (!me) return <main className="wrap">
    <h1>Sign in to connect NPIMARK</h1>
    <p>Sign in in a separate tab, then return here and refresh this page to review access.</p>
    <Link className="btn primary" href="/sign-in" target="_blank" rel="noopener noreferrer">Sign in</Link>
    <p>No access is granted until you review and approve the connection.</p>
  </main>;
  const result = await apiPost<{ client_name: string; scopes: string[]; expires_in: number }>(
    "/api/mcp/consent-preview", { parameters, approve: false }, { sessionToken: await sessionToken() },
  ).catch(() => null);
  if (!result?.ok) return <main className="wrap"><h1>Connection unavailable</h1>
    <p>{result && !result.ok ? result.detail : "Please try again when NPIMARK is available."}</p>
    <Link href="/app/ai">Your AI connections</Link></main>;
  return <main className="wrap app-main">
    <div className="eyebrow">AI connections</div>
    <h1>Connect {result.data.client_name}</h1>
    <p>Account: {me.name}. Organization: {me.org.name}.</p>
    <p>This assistant can search provider and organization NPI records{result.data.scopes.includes("usage.read") ? " and read your plan usage" : ""}.</p>
    <p>Searches use your existing API allowances. This pilot does not reveal contact details, create exports or send data to a CRM.</p>
    <p>Access lasts one hour. You can disconnect at any time in AI connections. Your current role and subscription still apply.</p>
    <form method="post" action="/api/app/ai">
      <input type="hidden" name="parameters" value={JSON.stringify(parameters)} />
      <button className="btn primary" name="action" value="approve">Allow read-only access</button>{" "}
      <button className="btn" name="action" value="deny">Cancel</button>
    </form>
  </main>;
}

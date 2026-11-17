import "server-only";

/** Fixed endpoints only. No browser cookies or user-selected target URL are forwarded. */
export async function mcpOAuthProxy(kind: "metadata" | "token", body?: string): Promise<Response> {
  const base = process.env.NPI_ACCOUNT_API_BASE_URL;
  if (!base) return Response.json({ error: "temporarily_unavailable" }, { status: 503 });
  try {
    const response = await fetch(`${base.replace(/\/$/, "")}/api/mcp/oauth/${kind}`, {
      method: kind === "token" ? "POST" : "GET", body,
      headers: kind === "token" ? { "Content-Type": "application/x-www-form-urlencoded" } : {},
      cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(15000),
    });
    if (!response.headers.get("content-type")?.includes("application/json")) {
      return Response.json({ error: "temporarily_unavailable" }, { status: 503 });
    }
    return new Response(await response.text(), { status: response.status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "Pragma": "no-cache" } });
  } catch { return Response.json({ error: "temporarily_unavailable" }, { status: 503 }); }
}

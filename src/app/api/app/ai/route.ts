import { NextResponse } from "next/server";
import { apiPost, sessionToken } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const site = process.env.SITE_BASE_URL;
  if (!site || request.headers.get("origin") !== new URL(site).origin) {
    return new Response("Invalid origin", { status: 403 });
  }
  if (Number(request.headers.get("content-length") ?? 0) > 16384) {
    return new Response("Request too large", { status: 413 });
  }
  const text = await request.text();
  if (text.length > 16384) return new Response("Request too large", { status: 413 });
  const form = new URLSearchParams(text);
  const token = await sessionToken();
  if (!token) return new Response("Sign in and retry this connection request.", { status: 401 });
  const action = form.get("action");
  if (action === "revoke") {
    const id = form.get("id") ?? "";
    if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Invalid connection", { status: 400 });
    const result = await apiPost(`/api/mcp/connections/${id}/revoke`, {}, { sessionToken: token }).catch(() => null);
    if (!result?.ok) return new Response("Could not disconnect. Return to AI connections and retry.", { status: 503 });
    return NextResponse.redirect(new URL("/app/ai", site), 303);
  }
  if (action !== "approve" && action !== "deny") return new Response("Invalid action", { status: 400 });
  let parameters: unknown;
  try { parameters = JSON.parse(form.get("parameters") ?? ""); }
  catch { return new Response("Invalid request", { status: 400 }); }
  const result = await apiPost<{ redirect: string }>("/api/mcp/authorize", {
    parameters, approve: action === "approve",
  }, { sessionToken: token }).catch(() => null);
  if (!result?.ok) return new Response("Could not authorize. Return to the connection page and retry.", { status: 400 });
  // Only the backend's exact registered callback is used; never a client-supplied redirect.
  const response = NextResponse.redirect(result.data.redirect, 303);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

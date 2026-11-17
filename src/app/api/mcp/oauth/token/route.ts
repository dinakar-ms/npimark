import { mcpOAuthProxy } from "@/lib/mcpOAuthProxy";
export const dynamic = "force-dynamic";
export async function POST(request: Request): Promise<Response> {
  if (!request.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded")) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }
  const body = await request.text();
  if (body.length > 8192) return Response.json({ error: "invalid_request" }, { status: 400 });
  return mcpOAuthProxy("token", body);
}

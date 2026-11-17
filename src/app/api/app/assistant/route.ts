import { getMe } from "@/lib/session";
import { preparePlan } from "@/lib/assistantPlan";
import { reserveAssistantCall } from "@/lib/assistantBudget";
import { redirectBase } from "@/lib/redirectBase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const reply = (body: unknown, status = 200) => Response.json(body, {status, headers: {"Cache-Control": "private, no-store"}});
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(redirectBase(request)).origin || request.headers.get("sec-fetch-site") === "cross-site") return reply({error: "Please open the assistant on NPImark."}, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return reply({error: "Invalid request."}, 415);
  const me = await getMe();
  if (!me) return reply({error: "Please sign in again."}, 401);
  if (me.org.mfa_required && !me.mfa_enabled) return reply({error: "Set up two-step verification first."}, 403);
  const key = process.env.OPENAI_API_KEY;
  const model = process.env.NPI_AI_MODEL;
  const stateDir = process.env.NPI_AI_STATE_DIR;
  if (process.env.NPI_AI_ENABLED !== "true" || !key || !model || !stateDir) return reply({error: "The AI assistant is awaiting setup. You can use the search filters now."}, 503);
  const reader = request.body?.getReader();
  if (!reader) return reply({error: "Enter a search request."}, 400);
  let raw = ""; let bytes = 0; const decoder = new TextDecoder();
  try {
    while (true) {
      const {value, done} = await reader.read(); if (done) break;
      bytes += value.byteLength;
      if (bytes > 8000) {await reader.cancel(); return reply({error: "Keep the request under 1,500 characters."}, 413);}
      raw += decoder.decode(value, {stream: true});
    }
    raw += decoder.decode();
    const body = JSON.parse(raw);
    if (typeof body.prompt !== "string" || !body.prompt.trim() || body.prompt.length > 1500) return reply({error: "Enter a request of 1–1,500 characters."}, 400);
    if (!await reserveAssistantCall(stateDir, me.org.id)) return reply({error: "Your organization has used today's 20 AI requests. Search filters remain available."}, 429);
    return reply({plan: await preparePlan(body.prompt, {key, model})});
  } catch {
    return reply({error: "We could not prepare a reliable search. Try again or use the search filters."}, 502);
  }
}

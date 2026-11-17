import { getMe } from "@/lib/session";
import { answerHelp } from "@/lib/helpAssistant";
import { reserveAssistantCall } from "@/lib/assistantBudget";
import { redirectBase } from "@/lib/redirectBase";
import { readHelpPrompt, HelpRequestError } from "@/lib/boundedHelpRequest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const reply = (body: unknown, status = 200) => Response.json(body, {status, headers: {"Cache-Control": "private, no-store", "X-Robots-Tag": "noindex"}});
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(redirectBase(request)).origin || request.headers.get("sec-fetch-site") === "cross-site") return reply({error: "Open help from NPIMARK."}, 403);
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") return reply({error: "Send a JSON request."}, 415);
  try {
    const me = await getMe();
    if (!me) return reply({error: "Please sign in again."}, 401);
    if (me.org.mfa_required && !me.mfa_enabled) return reply({error: "Set up two-step verification first."}, 403);
    if (!me.email_verified_at) return reply({error: "Verify your email before using AI help. The Help Center is available without verification."}, 403);
    const key = process.env.OPENAI_API_KEY, model = process.env.NPI_AI_MODEL, dir = process.env.NPI_AI_STATE_DIR;
    if (process.env.NPI_HELP_AI_ENABLED !== "true" || !key || !model || !dir) return reply({error: "AI help is awaiting setup. Search the Help Center instead."}, 503);
    const prompt = await readHelpPrompt(request);
    // Shared with the search assistant: a second endpoint must not double the organization's budget.
    if (!await reserveAssistantCall(dir, me.org.id)) return reply({error: "Your organization has used today's AI allowance. Help Center search remains available."}, 429);
    return reply({answers: await answerHelp(prompt, {key, model})});
  } catch (error) {
    if (error instanceof HelpRequestError) return reply({error: error.message}, error.status);
    return reply({error: "Help is temporarily unavailable. Search the Help Center or contact support."}, 503);
  }
}

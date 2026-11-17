import { NextResponse } from "next/server";
import { resendVerification } from "@/lib/session";
import { redirectBase } from "@/lib/redirectBase";

/**
 * "Send it again", from the banner. Redirects back to wherever the banner was.
 *
 * The API throttles this to one link every five minutes and answers 429 after that, which is
 * reported rather than hidden: a silent success that sent nothing is how people end up waiting
 * for a second mail that was never going to arrive.
 */

export const dynamic = "force-dynamic";

function safeReturn(raw: string | null, base: string): URL {
  const fallback = new URL("/app", base);
  if (!raw) return fallback;
  try {
    const candidate = new URL(raw, base);
    if (!candidate.pathname.startsWith("/app")) return fallback;
    return new URL(candidate.pathname + candidate.search, base);
  } catch {
    return fallback;
  }
}

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const target = safeReturn(String(form.get("return_to") ?? ""), redirectBase(request));

  const outcome = await resendVerification();
  target.searchParams.set("verify", outcome.ok ? "sent" : (outcome.code ?? "failed"));
  return NextResponse.redirect(target, 303);
}

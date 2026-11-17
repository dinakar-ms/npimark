import { NextResponse } from "next/server";
import { revealContact } from "@/lib/session";
import { redirectBase } from "@/lib/redirectBase";

/**
 * The Reveal button beside a person with no NPI - on a facility page or the person's own page.
 *
 * The same shape as the provider reveal handler: a form post, so it works with no JavaScript; the
 * API spends the allowance, applies the pace rules and the lock, and writes the audit row; the
 * browser is sent back where it came from. Nothing is carried in the URL but the outcome - the
 * page reads the number back from the API, which hands it over only because this organisation has
 * now opened that person this month. A refresh therefore cannot charge twice, and another tenant
 * following the same link sees no number at all.
 *
 * `return_to` is rebuilt rather than trusted, as in the provider handler: a redirect that echoes
 * whatever it is handed is an open redirect.
 */

export const dynamic = "force-dynamic";

function safeReturn(raw: string | null, base: string): URL {
  const fallback = new URL("/app/find", base);
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
  const id = String(form.get("contact_id") ?? "").trim();
  const target = safeReturn(String(form.get("return_to") ?? ""), redirectBase(request));
  for (const key of ["reveal_error", "opened", "free", "empty"]) target.searchParams.delete(key);

  if (!/^\d{1,18}$/.test(id)) {
    target.searchParams.set("reveal_error", "bad-contact");
    return NextResponse.redirect(target, 303);
  }

  const outcome = await revealContact(id);
  if (!outcome.ok) {
    target.searchParams.set("reveal_error", outcome.code ?? "failed");
  } else if (outcome.empty) {
    target.searchParams.set("empty", id);
  } else {
    target.searchParams.set(outcome.charged === false ? "free" : "opened", id);
  }
  return NextResponse.redirect(target, 303);
}

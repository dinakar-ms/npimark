import { NextResponse } from "next/server";
import { revealProvider } from "@/lib/session";
import { redirectBase } from "@/lib/redirectBase";

/**
 * The reveal button's handler.
 *
 * A form post rather than a fetch, so the whole flow works with no JavaScript: the button posts,
 * the API is called on the server, and the browser is redirected back to the search it came from
 * with the provider added to `revealed`. The search page then reads those contact points back -
 * free, because the charge happened here.
 *
 * `return_to` is taken apart and rebuilt rather than trusted. It arrives from our own form, but
 * a redirect that echoes whatever it is handed is an open redirect, and the fix costs two lines.
 */

export const dynamic = "force-dynamic";

/** Keep only the path and query of a caller-supplied return path, never its origin. */
function safeReturn(raw: string | null, base: string): URL {
  const fallback = new URL("/app/search", base);
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
  const npi = String(form.get("npi") ?? "").trim();
  const target = safeReturn(String(form.get("return_to") ?? ""), redirectBase(request));

  if (!/^\d{10}$/.test(npi)) {
    target.searchParams.set("reveal_error", "bad-npi");
    return NextResponse.redirect(target, 303);
  }

  const outcome = await revealProvider(npi);

  if (!outcome.ok) {
    // The API's own code, so the page can say "your reveals are spent" rather than "failed".
    target.searchParams.set("reveal_error", outcome.code ?? "failed");
    return NextResponse.redirect(target, 303);
  }

  const already = (target.searchParams.get("revealed") ?? "")
    .split(",")
    .filter((value) => /^\d{10}$/.test(value));
  target.searchParams.set("revealed", [...new Set([...already, npi])].join(","));
  target.searchParams.delete("reveal_error");
  if (outcome.charged === false) target.searchParams.set("free", npi);
  return NextResponse.redirect(target, 303);
}

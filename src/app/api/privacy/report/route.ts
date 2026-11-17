import { NextResponse } from "next/server";
import {
  isCorrectionField,
  isCorrectionReason,
  isSubjectKind,
  subjectIdLooksRight,
  FIELDS_FOR,
} from "@/lib/corrections";
import { apiPost } from "@/lib/session";
import { redirectBase } from "@/lib/redirectBase";

/**
 * The public "this is wrong" form posts here; this forwards it to the API as the visitor (CSRF, and
 * their real address for the per-connection limit - see `apiPost`) and redirects back with a
 * notice.
 *
 * Nothing typed goes into the redirect, and nothing about the listing comes back through it. A
 * refusal names the fields to fix from the API's field list, filtered to the names the page knows,
 * and the page words the help itself. The listing id is carried back so the form can be tried
 * again, and it is re-checked on the way out rather than echoed: a value we would not accept is a
 * value we do not put in a URL either.
 */

export const dynamic = "force-dynamic";

type Accepted = { status: "confirmation_sent" | "received"; reference: string | null };

const KNOWN_FIELDS = new Set(["subject_id", "field", "reason", "contact_email", "note"]);

function back(request: Request, params: Record<string, string>) {
  const url = new URL("/report-a-problem", redirectBase(request));
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const text = (name: string, max: number) => {
    const value = String(form.get(name) ?? "")
      .trim()
      .slice(0, max);
    return value || null;
  };

  const kind = text("kind", 20) ?? "";
  const id = text("id", 20) ?? "";
  if (!isSubjectKind(kind) || !subjectIdLooksRight(kind, id)) {
    return back(request, { error: "no-record" });
  }
  // The listing travels on every answer from here on, so the form comes back pointing at the same
  // record rather than at nothing.
  const carry = { kind, id };

  const field = text("field", 40) ?? "";
  const reason = text("reason", 40) ?? "";
  if (!isCorrectionField(field) || !FIELDS_FOR[kind].includes(field)) {
    return back(request, { ...carry, error: "failed", fields: "field" });
  }
  if (!isCorrectionReason(reason)) {
    return back(request, { ...carry, error: "failed", fields: "reason" });
  }

  const result = await apiPost<Accepted>("/api/field-corrections", {
    subject_kind: kind,
    subject_id: id,
    field,
    reason,
    note: text("note", 2000),
    contact_email: text("contact_email", 320),
    // Cloudflare's widget puts its answer here; absent (and ignored) until Turnstile is on.
    turnstile_token: text("cf-turnstile-response", 4096),
  }).catch(() => null);

  if (result === null) return back(request, { ...carry, error: "unavailable" });
  if (result.ok) {
    if (result.data.status === "received" && result.data.reference) {
      return back(request, { ...carry, notice: "received", ref: result.data.reference });
    }
    return back(request, { ...carry, notice: "sent" });
  }
  if (result.code === "rate_limited") return back(request, { ...carry, error: "too-many" });
  if (result.code === "challenge_unavailable") {
    return back(request, { ...carry, error: "challenge-down" });
  }
  if (result.code.startsWith("challenge_")) return back(request, { ...carry, error: "challenge" });
  if (result.status >= 500) return back(request, { ...carry, error: "unavailable" });
  // FastAPI's own 422s carry no `fields`; ours do. Either way only known names travel.
  const fields = Object.keys(result.fields ?? {}).filter((f) => KNOWN_FIELDS.has(f));
  return back(
    request,
    fields.length
      ? { ...carry, error: "failed", fields: fields.join(",") }
      : { ...carry, error: "failed" },
  );
}

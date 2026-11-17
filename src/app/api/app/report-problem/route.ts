import { NextResponse } from "next/server";
import {
  FIELDS_FOR,
  isCorrectionField,
  isCorrectionReason,
  isSubjectKind,
  subjectIdLooksRight,
} from "@/lib/corrections";
import { reportCorrection } from "@/lib/session";
import { redirectBase } from "@/lib/redirectBase";

/**
 * The "Report a problem" control on a signed-in record page posts here.
 *
 * The same shape as the reveal handlers: a form post, so it works with no JavaScript; the API
 * records which organisation and which person said it and puts the report in the queue; the browser
 * is sent back where it came from with nothing in the URL but the outcome. The page then re-reads
 * what this organisation has reported, so the field comes back marked "reported, under review"
 * without anything being carried in the query string.
 *
 * `return_to` is rebuilt rather than trusted, as in the reveal handlers: a redirect that echoes
 * whatever it is handed is an open redirect.
 */

export const dynamic = "force-dynamic";

const OUTCOME_KEYS = ["reported", "report_error", "report_again"];

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
  const target = safeReturn(String(form.get("return_to") ?? ""), redirectBase(request));
  for (const key of OUTCOME_KEYS) target.searchParams.delete(key);

  const kind = String(form.get("kind") ?? "").trim();
  const id = String(form.get("id") ?? "").trim();
  const field = String(form.get("field") ?? "").trim();
  const reason = String(form.get("reason") ?? "").trim();
  const note = String(form.get("note") ?? "")
    .trim()
    .slice(0, 2000);

  if (!isSubjectKind(kind) || !subjectIdLooksRight(kind, id)) {
    target.searchParams.set("report_error", "bad-record");
    return NextResponse.redirect(target, 303);
  }
  if (!isCorrectionField(field) || !FIELDS_FOR[kind].includes(field)) {
    target.searchParams.set("report_error", "bad-field");
    return NextResponse.redirect(target, 303);
  }
  if (!isCorrectionReason(reason)) {
    target.searchParams.set("report_error", "bad-reason");
    return NextResponse.redirect(target, 303);
  }

  const result = await reportCorrection({
    subject_kind: kind,
    subject_id: id,
    field,
    reason,
    note: note || null,
  }).catch(() => null);

  if (result === null || !result.ok) {
    const code = result === null ? "failed" : (result.code || "failed");
    target.searchParams.set("report_error", code === "rate_limited" ? "too-many" : "failed");
    return NextResponse.redirect(target, 303);
  }
  target.searchParams.set(result.data.already_reported ? "report_again" : "reported", field);
  return NextResponse.redirect(target, 303);
}

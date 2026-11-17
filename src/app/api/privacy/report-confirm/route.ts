import { NextResponse } from "next/server";
import { apiPost } from "@/lib/session";
import { redirectBase } from "@/lib/redirectBase";

/**
 * Spends a correction report's confirmation token, then shows the confirm page with the outcome.
 *
 * A POST, and only a POST, for the same reason as the removal confirmation: mail scanners and link
 * previewers fetch every URL they are sent, so the link in the email opens a page with a button
 * rather than confirming by itself.
 */

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const token = String(form.get("token") ?? "")
    .trim()
    .slice(0, 200);
  const back = new URL("/report-a-problem/confirm", redirectBase(request));

  if (!token) {
    back.searchParams.set("state", "missing");
    return NextResponse.redirect(back, 303);
  }
  const result = await apiPost<{ reference: string; verification: string }>(
    "/api/field-corrections/confirm",
    { token },
  ).catch(() => null);
  if (result?.ok) {
    back.searchParams.set("state", "ok");
    back.searchParams.set("ref", result.data.reference);
  } else {
    back.searchParams.set("state", result && result.status === 410 ? "invalid" : "failed");
  }
  return NextResponse.redirect(back, 303);
}

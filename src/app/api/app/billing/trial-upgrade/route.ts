import { NextResponse } from "next/server";
import { upgradeTrial } from "@/lib/session";
import { redirectBase } from "@/lib/redirectBase";
export const dynamic = "force-dynamic";
export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const back = new URL("/app/billing", redirectBase(request));
  const result = await upgradeTrial(String(form.get("consent") ?? ""));
  if (!result.ok) back.searchParams.set("billing_error", result.code || "failed");
  // Pending invoice is presented as a reviewed link on Billing, not an unvalidated redirect.
  return NextResponse.redirect(back, 303);
}

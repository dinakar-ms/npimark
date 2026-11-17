import { NextResponse } from "next/server";
import { openBillingPortal, stripeHostedUrl } from "@/lib/session";
import { redirectBase } from "@/lib/redirectBase";

/**
 * "Manage billing": send an admin to Stripe's own page for their card, invoices, plan and
 * cancellation. Whatever they change there reaches the API as a signed webhook, the same way a
 * checkout does, so this handler never needs to know what they did.
 */

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const back = new URL("/app/billing", redirectBase(request));
  const result = await openBillingPortal();
  if (!result.ok) {
    back.searchParams.set("billing_error", result.code || "failed");
    return NextResponse.redirect(back, 303);
  }
  const target = stripeHostedUrl(result.data.url);
  if (!target) {
    back.searchParams.set("billing_error", "payments_unavailable");
    return NextResponse.redirect(back, 303);
  }
  return NextResponse.redirect(target, 303);
}

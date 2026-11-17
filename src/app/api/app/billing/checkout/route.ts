import { NextResponse } from "next/server";
import { startCheckout, stripeHostedUrl } from "@/lib/session";
import { redirectBase } from "@/lib/redirectBase";

/**
 * The Upgrade button's handler: ask the API for a Stripe Checkout page and send the browser there.
 *
 * A plain form post, like every other action on the site, so it works with no JavaScript. The
 * plan code is checked for shape here and for everything else by the API - whether it has a
 * price, whether this person is an admin, whether the organisation already pays.
 *
 * Nothing about the plan changes here or on the way back. Stripe returns the customer to
 * /app/billing?checkout=success, and that page only *says* the plan is on its way; the change
 * itself arrives as Stripe's signed webhook to the API.
 */

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const plan = String(form.get("plan") ?? "").trim();
  const back = new URL("/app/billing", redirectBase(request));

  if (!/^[a-z0-9_-]{1,32}$/i.test(plan)) {
    back.searchParams.set("billing_error", "plan_not_purchasable");
    return NextResponse.redirect(back, 303);
  }

  const trial = form.get("trial") === "true";
  const consent = String(form.get("consent_version") ?? "");
  const quoted = Number(form.get("quoted_cents"));
  if (trial && (!consent || !Number.isSafeInteger(quoted) || quoted < 1)) {
    back.searchParams.set("billing_error", "trial_consent_required");
    return NextResponse.redirect(back, 303);
  }
  const result = await startCheckout(plan, trial ? {consent_version: consent, quoted_cents: quoted} : undefined);
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

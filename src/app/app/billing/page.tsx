import type { Metadata } from "next";
import Link from "next/link";
import { UsagePanel } from "@/components/UsagePanel";
import { getAlerts, getBilling, getMe, getPeople, type Billing } from "@/lib/session";
import { salesHref } from "@/lib/site";

/**
 * What this organisation is on, what it has spent, and - where it can - how to pay for more.
 *
 * Upgrade buttons appear only when the API says payments are switched on, the person is an admin
 * of a customer organisation, and a plan has a Stripe price. Otherwise the page says who to ask,
 * exactly as it did before payments existed: a Pay button that cannot take money is worse than
 * one sentence about who to talk to.
 *
 * Coming back from Stripe is display only. `?checkout=success` is a query string anybody can
 * type, so it never changes anything; it only chooses which sentence to show. The plan itself
 * changes when Stripe's signed webhook reaches the API - usually within seconds, which is why the
 * page says "in a moment" until the numbers below have caught up.
 *
 * The allowance numbers come from the same records the API meters against, so what this page
 * says and what a refusal says cannot disagree. They are rendered by the shared `UsagePanel`
 * rather than by a table of this page's own, so the figures here, on the overview and in Settings
 * are one piece of arithmetic instead of three.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Plan and usage",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const BILLING_ERRORS: Record<string, string> = {
  trial_consent_required: "Review and accept the trial or early-payment terms before continuing.",
  trial_price_changed: "The billing price changed. Refresh and review the terms again.",
  trial_email_verification_required: "Verify your work email before starting a trial.",
  trial_identity_used: "A trial has already been used with this billing identity. Choose paid access or contact support for review.",
  trial_identity_review: "We need to review trial eligibility. Contact support or choose paid access. No new trial was started.",
  trial_already_claimed: "This organization already has a trial. Resume the selected plan or use Manage billing.",
  trial_checkout_review: "Your checkout needs support review before another attempt. This prevents duplicate subscriptions.",
  trial_ineligible: "No eligible trial is available. Review your current plan and billing account.",
  trial_expired: "Your trial has ended. Review your current invoice in Manage billing.",
  trial_disabled: "The trial offer is not enabled here yet.",
  payments_not_configured:
    "Online payment is not switched on yet. Tell us which plan you want and we will move you onto it.",
  billing_admin_only: "Only an admin of your organization can change its plan or billing details.",
  billing_not_self_serve:
    "This organization's plan is managed by the platform team, not bought online.",
  plan_not_purchasable: "That plan cannot be bought online. Choose another, or contact us about it.",
  contract_required:
    "That plan includes home address and cell phone, which we provide only under a signed contract. It cannot be bought online — talk to us and we will set it up. Nothing was charged.",
  use_billing_portal:
    "Your organization already pays for a plan. Use Manage billing to change it, so you are not charged twice.",
  no_billing_account:
    "There is no billing account yet - it is created with your first payment. Choose a plan first.",
  payments_unavailable:
    "We could not confirm the payment provider response. Check your billing history before trying again.",
  failed: "We could not complete this request. Check your billing history before trying again.",
};

function one(params: Record<string, string | string[] | undefined>, key: string): string {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function price(cents: number | null): string {
  if (cents === null) return "";
  const dollars = cents / 100;
  return dollars.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: Number.isInteger(dollars) ? 0 : 2,
  });
}

function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { dateStyle: "long", timeZone: "UTC" });
}

function CheckoutNotice({ outcome, billing }: { outcome: string; billing: Billing | null }) {
  if (outcome !== "success" && outcome !== "cancelled") return null;
  return (
    <div className="notice" style={{ marginTop: 18 }} role="status">
      {outcome === "cancelled"
        ? "You returned from checkout. Check your current plan and billing history before trying again."
        : "You returned from checkout. This return link does not confirm a payment. Check your billing history for confirmation."}
      {billing ? <> Current plan: <b>{billing.plan_name}</b>.</> : " Your current plan could not be loaded."}
    </div>
  );
}

export default async function BillingPage({ searchParams }: Props) {
  const params = await searchParams;
  const checkout = one(params, "checkout");
  const billingError = one(params, "billing_error");
  const requestedPlan = one(params, "plan");
  const [me, billing, people, alerts] = await Promise.all([
    getMe(),
    getBilling(),
    getPeople(),
    getAlerts(),
  ]);
  if (!billing) {
    return (
      <main className="wrap app-main">
        <h1>Plan and usage</h1>
        <div className="notice warn" role="status" style={{ marginTop: 18 }}>
          Your plan and billing details could not be loaded. We cannot confirm your current
          allowance or payment status. Refresh before making another billing change.
        </div>
        <div className="actions" style={{ marginTop: 18 }}>
          <Link className="btn primary" href="/app/billing">Try again</Link>
          <Link className="btn" href="/contact">Contact support</Link>
        </div>
      </main>
    );
  }
  const canBuy = Boolean(billing?.payments_enabled && billing?.can_manage_billing);
  const plans = canBuy ? (billing?.purchasable_plans ?? []) : [];
  const canManage = canBuy && Boolean(billing?.has_billing_account);

  return (
    <main className="wrap app-main">
      <div className="eyebrow rule">Plan and usage</div>
      <h1>
        {me?.org.name} is on {billing?.plan_name ?? "an unmanaged plan"}.
      </h1>
      <p className="lede">
        Every allowance here belongs to the organization rather than to a person, so a
        colleague&rsquo;s export shows up on this page too. Null means unlimited; zero means
        nothing, and they are different answers.
      </p>

      <CheckoutNotice outcome={checkout} billing={billing} />
      {billing.trial_identity_rejected && (
        <div className="notice warn" role="status">
          This trial was canceled because its billing identity was already used for a trial.
          It will not renew. You can choose paid access below or <Link href="/contact">contact support</Link> for review.
        </div>
      )}
      {billing.status === "trialing" && (
        <div className="notice" role="status" style={{ marginTop: 18 }}>
          {billing.trial_ends_at
            ? <>Your trial ends {new Date(billing.trial_ends_at).toLocaleString("en-US", {
                dateStyle: "long", timeStyle: "short", timeZone: "UTC",
              })} UTC. Review your renewal terms and cancellation options before then.</>
            : <>Your trial end time could not be confirmed. Contact support before using more data.</>}
          {!billing.active && <> Trial access is currently closed.</>}
        </div>
      )}

      {billingError && (
        <div className="notice stop" style={{ marginTop: 18 }} role="alert">
          {BILLING_ERRORS[billingError] ?? BILLING_ERRORS.failed}
        </div>
      )}

      {billing?.status === "past_due" && (
        <div className="notice warn" style={{ marginTop: 18 }} role="alert">
          Your subscription has a past-due payment. Check your billing details and current access
          status below{canManage ? " — update it under Manage billing so nothing is interrupted" : ""}.
        </div>
      )}

      {billing && !billing.active && (
        <div className="notice stop" style={{ marginTop: 18 }} role="alert">
          This subscription is <b>{billing.status}</b>. Your data is untouched and still here —
          but reveals, exports and API calls are refused until it is active again.
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <UsagePanel
          billing={billing}
          seatsUsed={people === null ? null : people.length}
          // UsagePanel documents alertsUsed as "null when they could not be read"; until these
          // reads could fail visibly, that case was unreachable. Now it carries the truth.
          alertsUsed={alerts === null ? null : alerts.length}
        />
      </div>

      <div className="grid two" style={{ marginTop: 30, alignItems: "start" }}>
        <div className="panel">
          <h2>What this plan includes</h2>
          <ul className="ticks">
            <li>
              API access: <b>{billing?.api_access ? "yes" : "no"}</b>
            </li>
            <li>
              Home address and cell phone:{" "}
              <b>
                {billing?.premium_contacts
                  ? "yes, one provider at a time"
                  : billing?.consumer_access
                    ? "in your contract, not switched on yet"
                    : "on the Contact plan, under contract"}
              </b>
            </li>
          </ul>
          {billing?.premium_contacts ? (
            <p className="fine" style={{ marginTop: 10 }}>
              A reveal that hands over a home address or cell phone counts as{" "}
              {billing.premium_reveal_units ?? 2} reveals; nothing extra when none is on file. They
              are matched to the provider, not guaranteed, and are never in exports, appends or
              lists. Phone type, do-not-call and TCPA compliance are your obligation under the
              contract — check before you call or text.
            </p>
          ) : (
            <p className="fine" style={{ marginTop: 10 }}>
              Home address and cell phone are provided only under a signed contract that states
              your permissible use, and cannot be bought online.{" "}
              <a href={salesHref("Contact plan")}>Talk to us</a>.
            </p>
          )}
        </div>

        <div className="panel">
          <h2 id="upgrade">Choose or upgrade your plan</h2>
          <p className="fine">The plan price includes its user seats. Each seat has a separate login; adding users within the allowance does not create another subscription.</p>
          {plans.length > 0 ? (
            <>
              <p className="fine">
                Complete your card details securely in Stripe. Access opens after confirmation,
                and your usage history stays with your organization.
              </p>
              {plans.map((plan) => (
                <form
                  key={plan.code}
                  aria-label={`${plan.name} plan`}
                  method="post"
                  action="/api/app/billing/checkout"
                  style={{ marginTop: 14 }}
                >
                  <input type="hidden" name="plan" value={plan.code} />
                  {requestedPlan === plan.code && <p role="status"><b>Your selected plan</b> — review its price and terms below.</p>}
                  {billing.trial_eligible && <>
                    <input type="hidden" name="trial" value="true" />
                    <input type="hidden" name="quoted_cents" value={plan.price_cents ?? ""} />
                    <label style={{ display: "block", marginTop: 12 }}>
                      <input type="checkbox" name="consent_version" value={billing.trial_consent_version ?? ""} required />{" "}
                      I agree to a seven-day trial with a card required. Unless I cancel before the
                      trial ends, {price(plan.price_cents ?? 0)} per month will be charged for {plan.name}.
                      The trial includes this plan&rsquo;s allowances once for the seven-day period;
                      daily limits still apply. Using them up does not start a charge.
                    </label>
                    <p className="fine">Cancel in Manage billing before the displayed end time. You can choose to pay earlier.
                      Premium cell-phone and home-address access remains contract-only.</p>
                  </>}
                  <div>
                    <b>{plan.name}</b>
                    {plan.price_cents !== null && <> &mdash; {price(plan.price_cents)} per month</>}
                  </div>
                  {plan.max_users !== undefined && <p className="fine">{plan.max_users === null ? "Unlimited" : plan.max_users} separate user accounts included in this plan price.</p>}
                  {plan.description && <div className="fine">{plan.description}</div>}
                  <button className="btn primary" type="submit" style={{ marginTop: 8 }}>
                    {billing.trial_eligible
                      ? "Start seven-day trial of"
                      : billing.current_price_cents != null &&
                          plan.price_cents != null &&
                          plan.price_cents < billing.current_price_cents
                        ? "Switch to"
                        : "Upgrade to"}{" "}
                    {plan.name}
                  </button>
                </form>
              ))}
            </>
          ) : billing?.payments_enabled && !billing.can_manage_billing ? (
            <p className="fine">
              Only an admin of your organization can change its plan. Ask one of them &mdash; your
              usage history comes with you.
            </p>
          ) : canManage ? (
            <p className="fine">
              Your plan, card and invoices are managed through Stripe. Change or cancel any time
              under Manage billing.
            </p>
          ) : (
            <p className="fine">
              Upgrades are handled by a person for now — tell us the allowance you need and we will
              move you onto it. Nothing about your account changes until you say so, and your usage
              history comes with you.
            </p>
          )}
          {billing.status === "trialing" && billing.active && canManage && billing.trial_price_cents != null && (
            <form method="post" action="/api/app/billing/trial-upgrade" style={{ marginTop: 16 }}>
              <label><input type="checkbox" name="consent" value="charge-selected-plan-now" required />{" "}
                I agree to end my trial now and pay {price(billing.trial_price_cents)} per month for {billing.plan_name}.
              </label>
              <p className="fine">Paid access requires payment confirmation. Daily limits still apply.</p>
              <button className="btn primary" type="submit">End trial and pay now</button>
            </form>
          )}
          {canManage && billing.trial_invoice_url?.startsWith("https://invoice.stripe.com/") && (
            <p><a className="btn" href={billing.trial_invoice_url}>Review or complete payment in Stripe</a></p>
          )}
          <div className="actions" style={{ marginTop: 14 }}>
            {canManage && (
              <form method="post" action="/api/app/billing/portal">
                <button className="btn" type="submit">
                  Manage billing
                </button>
              </form>
            )}
            <Link className="btn primary" href="/pricing">
              See the plans
            </Link>
          </div>
          {canManage && billing?.current_period_end && (
            <p className="fine" style={{ marginTop: 10 }}>
              The current billing period ends {longDate(billing.current_period_end)}. Your
              allowances reset on the 1st of every month (UTC), separately from that date.
            </p>
          )}
        </div>
      </div>

      <p className="fine" style={{ marginTop: 26 }}>
        A refusal will always name both numbers — what you asked for and what is left — so you
        never have to come here to work out why something stopped.{" "}
        <Link href="/app/settings">Your own account settings</Link> are a separate page.
      </p>
    </main>
  );
}

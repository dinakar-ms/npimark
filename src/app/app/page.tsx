import { cookies } from "next/headers";
import Link from "next/link";
import { FirstRun } from "@/components/FirstRun";
import { Meter } from "@/components/UsagePanel";
import { FIRST_RUN_DISMISSED, getBilling, getFirstRun, getMe } from "@/lib/session";
import { salesHref } from "@/lib/site";

/**
 * The first thing a customer sees after signing up.
 *
 * It opens on the six things worth doing in the first two minutes, then on what they have left to
 * spend. The checklist is not a tour: every line is ticked off by the work itself
 * (`/api/account/first-run`), so it cannot congratulate an empty account, and it goes for good
 * once the six things are done or somebody hides it.
 *
 * The quota comes from the same records the API meters against, so the number here and the number
 * in a refusal are the same number - two sources for one figure is how a support conversation
 * starts. A figure the API did not answer with is left out rather than shown as a zero.
 */

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * One counter as a tile. The bar itself is the application's shared `Meter`, which is the point:
 * this page used to draw its own, with no warning and no stop state, so an account past its
 * allowance read as full and healthy here and as amber on Plan and usage.
 */
function Counter({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  return (
    <div className="stat">
      <span className="label">{label}</span>
      <span className="value num">
        {used.toLocaleString("en-US")}
        {limit === null ? "" : ` / ${limit.toLocaleString("en-US")}`}
      </span>
      <Meter used={used} limit={limit} />
    </div>
  );
}

export default async function AppHome({ searchParams }: Props) {
  const params = await searchParams;
  const welcome = params.welcome === "1";
  const verify = typeof params.verify === "string" ? params.verify : null;
  const [me, billing, firstRun, jar] = await Promise.all([
    getMe(),
    getBilling(),
    getFirstRun(),
    cookies(),
  ]);
  if (!me) return null; // the layout has already redirected

  const limits = billing?.limits ?? {};
  const reveals = limits.reveals;
  const calls = limits.api_calls;
  const exports = limits.export_rows;
  const canBuy = Boolean(billing?.payments_enabled && billing?.can_manage_billing);

  // Gone once the work is done, or once somebody said they had read it. A checklist that will not
  // go away is furniture.
  const checklist =
    firstRun && !firstRun.complete && !jar.get(FIRST_RUN_DISMISSED) ? firstRun : null;

  return (
    <main className="wrap app-main np-customer-home">
      {welcome && (
        <div className="notice ok" style={{ marginBottom: 20 }}>
          <b>{me.org.name} is set up.</b> {billing?.plan_name ? `You are on the ${billing.plan_name} plan.` : "Plan details are currently unavailable."}
          Check your email to confirm your address — some features ask for it later.
        </div>
      )}

      {verify === "sent" && (
        <div className="notice ok" style={{ marginBottom: 20 }} role="status">
          <b>Link sent.</b> It can take a minute. If it does not arrive, check the spam folder
          before asking for another - a second link replaces the first.
        </div>
      )}
      {verify === "resend_too_soon" && (
        <div className="notice stop" style={{ marginBottom: 20 }} role="alert">
          <b>A link went out less than five minutes ago.</b> Give it a moment rather than asking
          again - the newest link is the only one that works.
        </div>
      )}
      {verify && verify !== "sent" && verify !== "resend_too_soon" && (
        <div className="notice stop" style={{ marginBottom: 20 }} role="alert">
          <b>That did not send.</b> Nothing about your account changed. Try again shortly.
        </div>
      )}

      <header className="np-workspace-heading"><div><div className="eyebrow rule">Your NPImark workspace</div>
        <h1>Welcome, {me.name.split(" ")[0]}.</h1>
        <p className="lede">Your research, organized. Pick up where you left off.</p></div>
        <Link href="/app/search" className="btn primary">Find physicians ↗</Link>
      </header>
      <section className="np-welcome-panel" aria-labelledby="workspace-welcome">
        <div><span className="eyebrow">A little context. A better connection.</span><h2 id="workspace-welcome">Good research starts<br />with the right people.</h2>
          <p>Explore a specialty, follow an organization, or return to the people you have saved.</p>
          <div className="actions"><Link href="/app/lists" className="btn">Open your lists</Link><Link href="/directory" className="np-text-link">Explore the directory ↗</Link></div>
        </div>
        <div className="np-welcome-orbit" aria-hidden="true"><span>People</span><span>Places</span><span>Possibilities</span></div>
      </section>

      {/* The fork, before anything teaches anybody anything.

          This page used to open on a six-line checklist, which answers "what do I do now" by
          assuming the person wants to be shown. Plenty do not - they bought provider data and
          want the search box - and their only exit was "Hide this", which is a rejection rather
          than a choice and left them on the overview regardless.

          Two doors, server-rendered, no client JavaScript: the guide is an anchor to the panel
          below, and skipping posts the dismissal and lands them on the search. Shown only while
          the checklist would be - once the six things are done, neither appears again. */}
      {checklist && (
        <section className="panel" style={{ marginTop: 26 }} aria-labelledby="start-here">
          <h2 id="start-here">Where would you like to start?</h2>
          <p className="fine">
            Nothing here is required. The checklist below ticks itself off as the work happens,
            whoever on your team does it.
          </p>
          <div className="actions" style={{ marginTop: 14 }}>
            <form method="post" action="/api/app/first-run">
              <input type="hidden" name="action" value="dismiss" />
              <input type="hidden" name="then" value="search" />
              <button type="submit" className="btn primary">
                Take me straight to the search
              </button>
            </form>
            <a className="btn" href="#getting-started">
              Show me how it works
            </a>
          </div>
        </section>
      )}

      {checklist && (
        <div style={{ marginTop: 26 }}>
          <FirstRun state={checklist} reveals={reveals} />
        </div>
      )}

      <div className="stats" style={{ marginTop: 26 }}>
        <div className="stat">
          <span className="label">Plan</span>
          <span className="value">{billing?.plan_name ?? "Unavailable"}</span>
        </div>
        {reveals && (
          <Counter label={billing?.status === "trialing" ? "Contact reveals during trial" : "Contact reveals this month"} used={reveals.used} limit={reveals.limit} />
        )}
        {exports && (
          <Counter label={billing?.status === "trialing" ? "Export rows during trial" : "Export rows this month"} used={exports.used} limit={exports.limit} />
        )}
        {calls && <Counter label={billing?.status === "trialing" ? "API calls during trial" : "API calls this month"} used={calls.used} limit={calls.limit} />}
      </div>

      <div className="grid two" style={{ marginTop: 30, alignItems: "start" }}>
        <div className="panel">
          <h2>Where everything is</h2>
          <ul className="ticks">
            <li>
              <span>
                <Link href="/app/search">Providers</Link> — search by name, NPI, state or specialty,
                open a record, and save the search as an alert
              </span>
            </li>
            <li>
              <span>
                <Link href="/app/exports">Exports</Link> — take a search away as a file, or{" "}
                <Link href="/app/append">append</Link> our columns to a list of your own
              </span>
            </li>
            <li>
              <span>
                <Link href="/app/alerts">Alerts</Link> — what changed inside a saved search: who is
                new, who moved, who stopped
              </span>
            </li>
            <li>
              <span>
                <Link href="/app/keys">API keys</Link> — the same data over REST, with{" "}
                <Link href="/docs/api">the reference</Link> beside it
              </span>
            </li>
            <li>
              <span>
                <Link href="/app/team">Team</Link> and <Link href="/app/settings">Settings</Link> —
                colleagues, your own sign-in, and the mail we send you
              </span>
            </li>
          </ul>
        </div>

        <div className="panel">
          <h2>What happens at a limit</h2>
          <p className="fine">
            Each allowance belongs to {me.org.name} rather than to you, and is counted{" "}
            {billing?.status === "trialing" ? "once across your whole trial" : "for the calendar month"}. When one runs out, the next reveal, export or API call is refused, and
            the refusal says which allowance it was and what is left of it. Nothing is charged, and
            nothing you have already done is taken away.
          </p>
          <p className="fine">
            <Link href="/app/billing">Plan and usage</Link> has every figure, the seats in use, and{" "}
            {billing?.status === "trialing" ? "when your trial ends" : "the date the counters go back up"}.{" "}
            {canBuy ? (
              <>
                Changing plan is on the same page, and <Link href="/pricing">pricing</Link> lists
                what each one includes.
              </>
            ) : (
              <>
                To have more before then, the plan has to change:{" "}
                <Link href="/pricing">pricing</Link> lists what each plan includes, and{" "}
                <Link href="/app/billing#upgrade">review upgrade options</Link> in Billing.
                If online checkout is unavailable, <a href={salesHref("Changing our plan")}>contact sales</a>.
              </>
            )}
          </p>
        </div>
      </div>
    </main>
  );
}

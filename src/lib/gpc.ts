/**
 * Global Privacy Control - a browser saying, on every request, "do not sell or share my personal
 * information".
 *
 * The browser (or an extension) sends `Sec-GPC: 1`. California's CCPA regulations, and the
 * equivalent rules in the other states we are registered in, treat that as a valid opt-out of the
 * sale and sharing of personal information, so it has to be honoured without anybody filling in a
 * form. We are a registered data broker, so this is not optional.
 *
 * How the signal travels, and why it is read twice
 * ------------------------------------------------
 * `src/proxy.ts` reads `Sec-GPC` on the way in and restates it as {@link GPC_HEADER} on the
 * request, which a server component can read with `headers()`. The proxy sets that header itself
 * and strips any copy the visitor sent, so nothing downstream can be fooled by a forged one.
 *
 * That server-side read is used only where the request is per-request anyway: the signed-in area
 * (`app/app/layout.tsx`), where there is a named person whose opt-out has to be acted on. Public
 * pages are prerendered and cached deliberately - they are the site's SEO surface - so nothing
 * reachable from the shared footer may read the request. The footer's note therefore comes from a
 * client component (`components/GpcNotice.tsx`) reading `navigator.globalPrivacyControl`, which a
 * browser sets alongside the header.
 *
 * Nothing here writes a cookie: the signal is per-request and per-browser, and an anonymous
 * visitor is not sold or shared in the first place (our public pages carry only public-record
 * fields). A signed-in visitor is a named person, and their signal is posted to the platform once
 * a session - see {@link recordGpcOptOutForSignedInVisitor}.
 *
 * This module deliberately imports nothing: it is read by `src/proxy.ts`, which runs before the
 * request reaches the app and may not touch `next/headers`, by server components, and by one
 * client component - so it has to be safe in all three.
 */

/** What the proxy restates the signal as, for server components. Ours, never the visitor's. */
export const GPC_HEADER = "x-npim-gpc";

/** The header a browser sends. `1` is the only value that means anything. */
export const GPC_BROWSER_HEADER = "Sec-GPC";

type HeaderBag = { get(name: string): string | null };

/** Whether the browser sent the signal. Read by the proxy, from the real request. */
export function gpcSentByBrowser(headers: HeaderBag): boolean {
  return headers.get("sec-gpc") === "1";
}

/** Whether this request carries the signal, as the proxy restated it. Read by server components. */
export function gpcSignal(headers: HeaderBag): boolean {
  return headers.get(GPC_HEADER) === "1";
}

/** What the footer says when the signal is there, and what it always says about cookies. */
export const GPC_HONOURED_NOTE =
  "Global Privacy Control signal detected and honored - we treat it as an opt-out of sale and " +
  "sharing for this browser.";

export const NO_TRACKING_NOTE =
  "We use only essential cookies and no advertising or tracking. Page-view analytics runs only " +
  "if you allow it, and you can switch it off at any time.";

export type GpcHookResult = {
  /** Whether the opt-out reached the platform on this call. */
  recorded: boolean;
  /** Why it did or did not, in words for a log line. Never shown to a visitor. */
  reason: string;
};

/** Who the request belongs to, when the site can name them. `null` for an anonymous visitor. */
export type GpcVisitor = { accountId: string; email: string } | null;

/**
 * What actually posts the signal. Injected rather than imported because this module imports
 * nothing (see the note at the top): the proxy loads it, and the proxy must not pull in
 * `lib/api.ts` and its `server-only` marker. `lib/api.ts` supplies `postGpcOptOut`; a test
 * supplies a counter.
 *
 * Resolves true when the platform has the opt-out, false when it refused or could not be reached.
 * It must not throw - but this module does not trust that.
 */
export type GpcSender = (visitor: { accountId: string; email: string }) => Promise<boolean>;

/**
 * Accounts whose opt-out has already been posted, and when.
 *
 * Once a session, not once a page view. A signed-in visitor with GPC on hits this on every
 * request they make under /app, and the platform is the record - repeating the post would turn one
 * standing signal into a stream of them. There is no cookie because a layout cannot set one
 * during render, and there is nothing to keep beyond this process: the platform holds the record,
 * and the worst a restart costs is one more post.
 *
 * `TTL_MS` is a day, so a long-lived container re-asserts a signal it may have posted before an
 * opt-out was processed and closed. The cap bounds the map on a busy host; the oldest entries go
 * first, and the only cost of dropping one is a repeat post, which the endpoint answers with the
 * request it already has.
 */
const posted = new Map<string, number>();
const TTL_MS = 24 * 60 * 60 * 1000;
const MAX_REMEMBERED = 5_000;

function alreadyPosted(accountId: string, now: number): boolean {
  const at = posted.get(accountId);
  if (at === undefined) return false;
  if (now - at < TTL_MS) return true;
  posted.delete(accountId);
  return false;
}

function remember(accountId: string, now: number): void {
  if (posted.size >= MAX_REMEMBERED) {
    // Insertion-ordered, so the first key is the oldest.
    const oldest = posted.keys().next();
    if (!oldest.done) posted.delete(oldest.value);
  }
  posted.set(accountId, now);
}

/** Only for tests: forget what this process has posted. */
export function forgetGpcPosts(): void {
  posted.clear();
}

/**
 * Record a signed-in visitor's GPC signal against their account, at most once a session.
 *
 * For an **anonymous** browser nothing is sent and nothing is kept. We sell and share nothing
 * about a visitor we cannot name - the public pages carry public-record fields and no advertising
 * or tracking cookie - so the footer's note is the whole of our answer, and posting an opt-out
 * with no person attached to it would be inventing a record rather than honouring a signal.
 *
 * For a **signed-in** visitor there is an identified person behind the request, so the opt-out has
 * to reach the platform's own privacy state: one standing opt-out per person, on the `gpc` channel
 * and already verified, because a legally recognised signal that we asked somebody to prove would
 * not be honoured at all. `POST /v1/privacy/gpc` is that record
 * (`docs/privacy-requests.md`, `app/api/public_privacy.py`), and it is idempotent on the account
 * id we send, so a repeat after a restart returns the first request rather than making a second.
 *
 * Never throws and never rejects. It is called from the /app layout, which every signed-in page
 * renders through: a refusal, a timeout or a missing key has to cost a log line and nothing else,
 * because the alternative is a visitor whose browser asked us for something and got an error page.
 * A failure is deliberately *not* remembered, so the next page they open tries again.
 */
export async function recordGpcOptOutForSignedInVisitor(
  visitor: GpcVisitor,
  send: GpcSender,
  now: number = Date.now(),
): Promise<GpcHookResult> {
  if (!visitor) {
    return { recorded: false, reason: "anonymous visitor: nothing about them is sold or shared" };
  }
  if (alreadyPosted(visitor.accountId, now)) {
    return { recorded: false, reason: "already recorded for this account in this process" };
  }
  let sent = false;
  try {
    sent = await send({ accountId: visitor.accountId, email: visitor.email });
  } catch {
    // `send` promises not to throw; if it breaks that promise the page still renders.
    return { recorded: false, reason: "the platform could not be reached; will try again" };
  }
  if (!sent) {
    return { recorded: false, reason: "the platform refused the signal; will try again" };
  }
  remember(visitor.accountId, now);
  return { recorded: true, reason: "recorded against the account" };
}

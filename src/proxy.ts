/**
 * Read the browser's Global Privacy Control signal on the way in, and restate it for the app.
 *
 * `Sec-GPC: 1` is a legally recognised opt-out of the sale and sharing of personal information,
 * and we are a registered data broker, so it is honoured whether or not anybody fills in a form.
 * This restates the signal as `x-npim-gpc` on the request (see `lib/gpc.ts`) and *deletes* any
 * copy the visitor sent, so the only way that header appears downstream is if the browser really
 * sent `Sec-GPC`.
 *
 * Who reads it: the signed-in area (`app/app/layout.tsx`), where there is a named person whose
 * opt-out has to be acted on, and any route handler that comes to need it. A public page must not
 * - they are prerendered and cached deliberately - so the note in the footer is read from the
 * browser instead (`components/GpcNotice.tsx`). Stripping a forged header and telling caches
 * about the real one belong here either way.
 *
 * `Vary: Sec-GPC` goes on the response because a response may legitimately differ with the
 * signal: no cache in front of us may hand one visitor's response to the other.
 *
 * It also serves two files, for the one reason the app router cannot: both are proofs of ownership
 * whose content - and in one case whose path - is a run-time setting. The IndexNow key file is
 * named after the key, so its path is not known when the app is compiled. Bing's verification file
 * has a fixed path but must be right the moment the container restarts, and a prerendered page's
 * metadata cannot be. Next 16 always runs the proxy on Node.js, which is what makes reading the
 * environment here a real read of the container rather than a value frozen at build time.
 *
 * The temporary launch gate is also enforced here, before cached routes render.
 * Operator sessions are checked by the launch page and its server action, never here.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { launchEnabled, launchExempt, launchHoldingHtml, readLaunch } from "@/lib/launchGate";
import { GPC_HEADER, gpcSentByBrowser } from "@/lib/gpc";
import { indexNowKey, indexNowKeyPath } from "@/lib/indexnow";
import {
  BING_VERIFICATION_PATH,
  bingVerification,
  bingVerificationFile,
} from "@/lib/verification";

/** A day. Both files are re-read on every check, and neither changes without a restart. */
const PROOF_CACHE = "public, max-age=86400";

/** The request path, restated for server components. See where it is set below. */
export const PATH_HEADER = "x-npim-path";

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const path = request.nextUrl.pathname;
  if (launchEnabled() && !launchExempt(path) && !(await readLaunch())) {
    return new NextResponse(path.startsWith("/api/") ? '{"error":"launch_pending"}' : launchHoldingHtml, {
      status: 503,
      headers: {
        "content-type": path.startsWith("/api/") ? "application/json" : "text/html; charset=utf-8",
        "cache-control": "private, no-store, max-age=0",
        "retry-after": "60",
        "x-robots-tag": "noindex, nofollow",
      },
    });
  }

  // IndexNow asks for a text file at the site root whose name is the key and whose body is the
  // key. Without a key configured there is no such path, and every `.txt` falls through as
  // before - which is how the feature is off by default rather than half on.
  const key = indexNowKey();
  if (key && path === indexNowKeyPath(key)) {
    return new NextResponse(`${key}\n`, {
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": PROOF_CACHE },
    });
  }

  // Bing's verification file. Unset, the path 404s as it did before, which is what an unverified
  // site should say.
  const bing = bingVerification();
  if (bing && path === BING_VERIFICATION_PATH) {
    return new NextResponse(bingVerificationFile(bing), {
      headers: { "content-type": "application/xml; charset=utf-8", "cache-control": PROOF_CACHE },
    });
  }

  const headers = new Headers(request.headers);
  // Never trust a copy that arrived with the request: we set it, or nobody does.
  headers.delete(GPC_HEADER);
  if (gpcSentByBrowser(request.headers)) headers.set(GPC_HEADER, "1");

  // The path, restated for the signed-in layout. A layout is not given its own pathname in the App
  // Router, and the one thing the layout needs it for is to not redirect the page it redirects
  // *to* - a check that silently reads empty would be a redirect loop on the security page rather
  // than a missing feature, so it is set here, where `nextUrl.pathname` is real, and deleted first
  // for the same reason the GPC header is.
  headers.delete(PATH_HEADER);
  headers.set(PATH_HEADER, path);

  const response = NextResponse.next({ request: { headers } });
  response.headers.append("Vary", "Sec-GPC");
  return response;
}

export const config = {
  /**
   * Every page, and nothing that is not one.
   *
   * `_next/` is excluded whole rather than two paths at a time. The matcher named `_next/static`
   * and `_next/image` and so left the rest of the namespace running through here - including
   * `_next/hmr`, the dev server's hot-reload channel, which is a websocket upgrade and has no
   * business being handed a `Vary` header or a rewritten request. Nothing under `_next/` is ever a
   * page: the segment is reserved by the framework, and a client-side navigation in the app router
   * fetches the page's own URL with an `RSC` header rather than anything under `_next/`. So the
   * whole namespace is the honest boundary, and it stays right when the framework adds to it -
   * which is how this broke in the first place.
   *
   * What that now covers, and why each is safe to exclude:
   *
   *   _next/static   build output: chunks, CSS, the fonts the layout loads. Fingerprinted and
   *                  immutable, no personal data, nothing that varies with a visitor.
   *   _next/image    the image optimiser. Its response varies with its own query, never with a
   *                  privacy signal.
   *   _next/hmr      Turbopack's hot-reload websocket (`_next/webpack-hmr` under webpack).
   *                  Development only, and an upgrade rather than a response.
   *   _next/postponed, _next/data, and whatever is added next
   *                  framework transport, not pages.
   *
   * `__nextjs_` catches the dev overlay's own endpoints - the source-map, stack-frame and
   * launch-editor calls behind the error dialog. Development only, and reserved: no route in
   * `app/` begins with an underscore.
   *
   * Robots and sitemaps pass through the launch gate too. Only the favicon remains excluded.
   */
  matcher: ["/((?!_next/|__nextjs_|favicon.ico).*)"],
};

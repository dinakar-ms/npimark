import { completeSocialMetadata } from "@/lib/socialMetadata";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import Link from "next/link";
import { unstable_rethrow } from "next/navigation";

/**
 * The marker monitoring reads to tell this page apart from a working one.
 *
 * It exists because HTTP 200 stopped meaning "this worked" the moment these pages began answering
 * a refused read with a recovery state instead of a 500. On 19 October 2026 the public-site check
 * was green for five hours while 98 of 257 URLs were erroring - it reads `robots.txt`, which is a
 * static file - and the thing that replaced those errors is a 200 as well. So a check that watches
 * only the status code is now blind by construction.
 *
 * A meta tag rather than matching the heading: the prose above is copy and copy gets rewritten, and
 * a monitoring check that silently stops matching is worse than no check. This name is a contract
 * between this component and `app/monitoring/checks.py`, and `directoryFallback.test.mjs` is what
 * stops it being deleted by someone who cannot see the other end of it.
 */
export const UNAVAILABLE_MARKER = "npim-directory";

function DirectoryUnavailable() {
  return <main><meta name="robots" content="noindex" /><meta name={UNAVAILABLE_MARKER} content="unavailable" /><section className="section"><div className="wrap">
    <span className="eyebrow rule">Directory</span>
    <h1>Directory data is temporarily unavailable.</h1>
    <p className="lede">We couldn’t load this directory. This does not mean there are no matching records. Please try again shortly or explore another part of the site.</p>
    <div className="actions"><Link className="btn primary" href="/directory">Back to the directory</Link><Link className="btn" href="/status">Check platform status</Link><Link className="btn" href="/contact">Contact support</Link></div>
  </div></section></main>;
}

/** Preserve Next redirects/404s; handle failed directory reads without inventing empty data. */
export function withDirectoryFallback<Args extends unknown[]>(read: (...args: Args) => Promise<ReactElement>) {
  return async (...args: Args) => {
    try { return await read(...args); }
    catch (error) {
      unstable_rethrow(error);
      console.error("Public directory render failed; showing unavailable state.");
      return <DirectoryUnavailable />;
    }
  };
}

export function withDirectoryMetadata<Args extends unknown[]>(read: (...args: Args) => Promise<Metadata>) {
  return async (...args: Args): Promise<Metadata> => {
    try { return completeSocialMetadata(await read(...args)); }
    catch (error) {
      unstable_rethrow(error);
      return { title: "Directory temporarily unavailable", robots: { index: false, follow: true } };
    }
  };
}

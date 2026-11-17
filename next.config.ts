import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Dockerfile ships .next/standalone: a server plus only the files it imports.
  // Linux deployment keeps its standalone artifact. Windows previews use next start,
  // avoiding deep standalone-copy paths that exceed local filesystem limits.
  output: process.platform === "win32" ? undefined : "standalone",
  outputFileTracingRoot: process.cwd(),
  turbopack: { root: process.cwd() },
  poweredByHeader: false,
  // Windows preview environments may disallow child-process workers. Keep type
  // checking enabled using TypeScript's compiler API and Node worker threads.
  ...(process.platform === "win32" ? {
    experimental: { workerThreads: true, useTypeScriptCli: false, cpus: 2 },
  } : {}),
  // Fail the build on a type error rather than shipping one. This is already the default; it
  // is written down because turning it off is the tempting fix at exactly the wrong moment.
  typescript: { ignoreBuildErrors: false },
  async redirects() {
    return [
      { source: "/docs", destination: "/docs/api", permanent: true },
      { source: "/npi", destination: "/search", permanent: true },
    ];
  },
  async headers() {
    // An hour at the edge, nothing in the browser. `max-age=0` keeps a person's own browser
    // asking - so a correction is one reload away - while `s-maxage` lets the CDN answer for
    // everybody else. `stale-while-revalidate` means the first visitor after the hour is up gets
    // the old copy immediately rather than waiting for a fresh render.
    //
    // Cloudflare rewrites the `max-age=0` to `max-age=14400` on the way out, because the zone's
    // Browser Cache TTL is set to 4 hours rather than "Respect Existing Headers". Measured
    // 2026-10-06: the origin sends `max-age=0`, the edge serves `max-age=14400`. Harmless for
    // marketing pages and not what this line says, so it is a setting to change in Cloudflare,
    // not here.
    const PUBLIC_CACHE =
      "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400";

    // Pages that are one segment and have nothing under them. Each is public marketing or
    // reference: the same bytes for every visitor, no form, nothing per-request.
    const LEAF_PAGES = [
      "idn-data",
      "pbm-data",
      "mcp",
      "mobile-app",
      "tour",
      // The profession landings and the audience pages they share a component with.
      "physicians",
      "nurses",
      "dentists",
      "chiropractors",
      "pharmacists",
      "podiatrists",
      "mental-health-providers",
      "optometrists-ophthalmologists",
      "physical-occupational-therapists",
      "advanced-practice-providers",
      "healthcare-professionals",
      // Reference and company pages.
      "ehr-data",
      "fields",
      "why-npi-mark",
      "about",
      "pricing",
      "intent-data",
      "security",
      "privacy",
      "privacy-choices",
      "terms",
    ];

    // Only reference trees remain cacheable. Live facility, system and leadership trees
    // can render noindex recovery states and therefore use the no-store rule below.
    const TREES = [
      // Reference trees.
      "lists",
      "glossary",
      "help",
      "docs",
      "data",
    ];

    // Deliberately NOT cached, and each for its own reason:
    //
    // * `/app/*`      - the signed-in product. The origin already says `private, no-store`; this
    //                   file never contradicts it, and never lists it.
    // * `/sign-in`, `/sign-in/code`, `/sign-up`, `/forgot`, `/reset-password`, `/verify-email`,
    //   `/invite/*` - sign-in state and bot checks.
    // * `/email-preferences`, `/test-your-list/*` - addressed to one recipient by token. A shared
    //   cache here would hand one person's page to the next.
    // * `/search`     - answers a query string, and a crawler can mint unlimited variants of it.
    // * `/contact`, `/remove-my-information`, `/report-a-problem` and their `/confirm` pages -
    //   public forms. They carry no server-rendered token today, so caching them would not break
    //   them *today*; they are left out because the day somebody adds one, nobody will remember
    //   this file.
    // * `/status`     - says whether the platform is up. A cached status page is a lie.

    return [
      // Live-data families that can render a recovery state when a read is refused.
      // None of them may be stored by a shared cache, and the reason is not the 500 - it is the
      // recovery page, which carries `noindex`. Cached with `s-maxage=3600` it would tell every
      // crawler for an hour that a page it has indexed should be dropped, and that is worse than
      // the error it replaced. Each of these also sets `revalidate = 0`, which is the same decision
      // taken against Next's own route cache; the two belong together and changing one alone
      // reintroduces the fault through the other.
      //
      // Measured 19 Oct 2026, after the row allowance ran out: `/npi/<id>` 15,020 and
      // `/facility/<slug>` 1,236 HTTP 500s in ten minutes, plus both `/directory` A-Z pages.
      ...["specialty", "npi", "facility", "directory", "hospitals", "nursing-homes", "hospices", "home-health-agencies", "dialysis-centers", "systems", "leadership"].map((tree) => ({
        source: `/${tree}/:path*`,
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      })),
      {
        source: "/:path(" + LEAF_PAGES.join("|") + ")",
        headers: [{ key: "Cache-Control", value: PUBLIC_CACHE }],
      },
      ...TREES.map((tree) => ({
        source: `/${tree}/:path*`,
        headers: [{ key: "Cache-Control", value: PUBLIC_CACHE }],
      })),
    ];
  },
};

export default nextConfig;

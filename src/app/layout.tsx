import type { Metadata, Viewport } from "next";
import { AnalyticsConsent } from "@/components/AnalyticsConsent";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { ga4MeasurementId } from "@/lib/analytics";
import { PRODUCT, SITE_NAME, TAGLINE, siteUrl } from "@/lib/site";
import { bingVerification, googleVerification } from "@/lib/verification";
import "./globals.css";
import "./npimark-bright.css";
import "./npimark-production.css";
import "./npimark-wide.css";
import "./decision-network.css";
import "./new-design.css";

// System font stacks in npimark-bright.css keep production builds independent of font CDNs.

const GOOGLE_TOKEN = googleVerification();
// Google Analytics 4, consent-gated and production-only (src/lib/analytics.ts). Read at module
// load like the verification tokens, with the same timing: a page prerendered when the image was
// built carries the value of that build until it revalidates.
const GA4_ID = ga4MeasurementId();
const BING_TOKEN = bingVerification();

export const viewport: Viewport = { themeColor: "#4563ef" };

export const metadata: Metadata = {
  title: { default: `${SITE_NAME} ${PRODUCT}`, template: `%s · ${SITE_NAME}` },
  // The default for every page on the site, so it cannot read a live count - which is why it is
  // written to need no number at all. A typed-in one is stale the week after it is typed, and
  // where the records come from is neither a customer's question nor a competitor's business.
  description:
    "Find US healthcare providers by NPI, specialty and location. Explore practice connections and contact information available with your plan.",
  // With SITE_BASE_URL set, canonical and preview URLs resolve absolutely - which is what a
  // crawler and a link unfurl both need. Until the domain is decided, it is the preview host.
  metadataBase: new URL(siteUrl("/")),
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} ${PRODUCT}`,
    description: TAGLINE,
    // Absolute, through `metadataBase`. It read `/` on every page until 2026-10-05, and a
    // relative `og:url` is not a URL to the crawler reading the card.
    url: "/",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  // `summary_large_image` promises an image. It promised one for weeks without serving one, which
  // unfurls as a blank rectangle - so the image is named here rather than left to be inherited.
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} ${PRODUCT}`,
    description: TAGLINE,
    images: ["/opengraph-image"],
  },
  formatDetection: { telephone: false },
  // Search Console and Bing Webmaster Tools, when the owner has pasted the tokens in. Both render
  // one meta tag on every page; unset, neither renders anything. A page that was prerendered when
  // the image was built carries the tokens of that build, so a freshly set token reaches the home
  // page when it next revalidates - `/BingSiteAuth.xml` (src/proxy.ts) and Google's Cloudflare DNS
  // record are both correct immediately instead. docs/deployment.md "Getting found".
  verification: {
    ...(GOOGLE_TOKEN ? { google: GOOGLE_TOKEN } : {}),
    ...(BING_TOKEN ? { other: { "msvalidate.01": BING_TOKEN } } : {}),
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-US">
      <body>
        {/* First in the tab order, so the seven links in the header can be stepped over rather
            than through on every page. */}
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {/* The site's own `WebSite` and `Organization` are declared once, on the home page
            (`app/page.tsx`, `siteGraph` in `lib/schema.ts`), not here on every page. The sitelinks
            search box is only read from the home page, and repeating the publisher on nine million
            provider pages says nothing that the home page has not already said. Pages that need to
            name the site or its publisher reference those two nodes by `@id` and carry enough of
            them to stand alone. */}
        <SiteNav />
        {/* Where "skip to content" lands. It is here rather than on each page's <main> because
            every page owns its own, and a target that only some pages carried would be a link
            that sometimes did nothing. Zero-height, so it changes no layout. */}
        <div id="main" tabIndex={-1} />
        {children}
        <SiteFooter />
        {/* Nothing is loaded, set or sent until the visitor allows it; see the component. */}
        <AnalyticsConsent measurementId={GA4_ID} />
      </body>
    </html>
  );
}

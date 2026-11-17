/**
 * Google Analytics 4, behind consent, on the public marketing pages only.
 *
 * What this is and is not
 * -----------------------
 * The site has promised, in the footer and the Privacy Policy, that it loads no tracking script
 * and sets no analytics cookie. That promise is kept by `scripts/no-trackers.mjs`, which fails
 * the build when a tracker's name appears under src/. Analytics is the one deliberate exception,
 * and it is allowed on three conditions that this module encodes:
 *
 * 1. **Nothing before consent.** No script, no cookie, no request leaves the browser until the
 *    visitor has pressed "Allow analytics" (`AnalyticsConsent`). A browser sending Global Privacy
 *    Control is treated as having said no, and is not asked. Saying no later stops future events
 *    and removes the analytics cookies this site set.
 * 2. **Public marketing pages only.** Only the routes in {@link ANALYTICS_ROUTES} report a page
 *    view, with a fixed title and a location stripped to origin + path. Provider pages, the
 *    directory, search, the signed-in app, sign-in, reset, invitation, removal and privacy forms
 *    report nothing, so no name, search term, token or account identity can reach Google.
 * 3. **Production only.** The measurement id comes from `GA4_MEASUREMENT_ID` in the site's
 *    environment, which staging, previews and local builds do not set, and the loader also refuses
 *    any hostname that is not the production one.
 *
 * This module imports nothing, so the client component, the server layout and the tests can all
 * read it.
 */

/** GA4 measurement ids look like `G-` followed by 6-12 upper-case letters and digits. */
const MEASUREMENT_ID_SHAPE = /^G-[A-Z0-9]{6,12}$/;

/** The id from the environment, or null when unset or malformed (then nothing loads). */
export function ga4MeasurementId(value: string | undefined = process.env.GA4_MEASUREMENT_ID): string | null {
  const trimmed = (value ?? "").trim();
  return MEASUREMENT_ID_SHAPE.test(trimmed) ? trimmed : null;
}

/** Where the production property may be fed from. Any other hostname loads nothing. */
export const PRODUCTION_HOSTS: readonly string[] = ["npimark.com", "www.npimark.com"];

export function productionHost(hostname: string): boolean {
  return PRODUCTION_HOSTS.includes(hostname.toLowerCase());
}

/**
 * The pages that may report a view, each with the fixed title Google is told. Exact paths, not
 * prefixes: `/pricing` reports and `/pricing/anything` does not, which is how a route added later
 * stays silent until somebody adds it here on purpose.
 */
export const ANALYTICS_ROUTES: Readonly<Record<string, string>> = {
  "/": "Home",
  "/about": "About",
  "/advanced-practice-providers": "Advanced practice providers",
  "/bulk-data": "Bulk data",
  "/chiropractors": "Chiropractors",
  "/contact": "Contact",
  "/data": "What is in the data",
  "/data/deliverability": "Measured deliverability",
  "/dentists": "Dentists",
  "/dialysis-centers": "Dialysis centers",
  "/docs": "Documentation",
  "/docs/api": "API reference",
  "/ehr-data": "EHR data",
  "/fields": "Field reference",
  "/healthcare-professionals": "Healthcare professionals",
  "/home-health-agencies": "Home health agencies",
  "/hospices": "Hospices",
  "/hospitals": "Hospitals",
  "/idn-data": "IDN intelligence",
  "/intent-data": "Intent data",
  "/leadership": "Leadership",
  "/mcp": "MCP for AI assistants",
  "/mental-health-providers": "Mental health providers",
  "/mobile-app": "Mobile app",
  "/nurses": "Nurses",
  "/nursing-homes": "Nursing homes",
  "/optometrists-ophthalmologists": "Optometrists and ophthalmologists",
  "/pbm-data": "PBMs and payer relationships",
  "/pharmacists": "Pharmacists",
  "/physical-occupational-therapists": "Physical and occupational therapists",
  "/physicians": "Physicians",
  "/podiatrists": "Podiatrists",
  "/pricing": "Pricing",
  "/tour": "Tour",
  "/why-npi-mark": "Why NPI Mark",
};

/** Trailing slashes are the same page. Anything else is returned as it came. */
export function normalisePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname || "/";
}

/** The fixed title for a reportable page, or null for every page that must stay silent. */
export function reportableTitle(pathname: string): string | null {
  return ANALYTICS_ROUTES[normalisePath(pathname)] ?? null;
}

/** What Google is told the page is: origin and path, never a query string or a fragment. */
export function sanitisedLocation(origin: string, pathname: string): string {
  return `${origin}${normalisePath(pathname)}`;
}

/**
 * The only events the site sends, with fixed names and fixed labels. A click is a click: none of
 * these claims a sign-up, a purchase or a subscription, which need a server-confirmed record.
 */
export const CTA_EVENTS = {
  pricing_cta_click: "pricing_cta_click",
  bulk_data_cta_click: "bulk_data_cta_click",
} as const;

export type CtaEvent = keyof typeof CTA_EVENTS;

/**
 * How a button reports a click without knowing whether analytics is on. A call site dispatches
 * this window event with the CTA's name; `AnalyticsConsent` listens, and forwards it to the tag
 * only while consent is granted and the tag is loaded. With consent denied or never given the
 * event is dispatched into silence, which is the point: the button never has to ask.
 */
export const CTA_EVENT_NAME = "npimark:cta";

export function isCtaEvent(value: unknown): value is CtaEvent {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(CTA_EVENTS, value);
}

export function reportCta(event: CtaEvent): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<CtaEvent>(CTA_EVENT_NAME, { detail: event }));
}

/** Where the visitor's choice is kept, in their own browser and nowhere else. */
export const CONSENT_STORAGE_KEY = "npimark.analytics";

export type AnalyticsConsent = "granted" | "denied";

/** A stored value that is not one of the two words is treated as no choice. */
export function parseConsent(value: string | null | undefined): AnalyticsConsent | null {
  return value === "granted" || value === "denied" ? value : null;
}

/**
 * The cookies GA4 sets for a property, by name: `_ga` and `_ga_<id without the G- prefix>`.
 * Both are removed when consent is withdrawn, for the host and for the parent domain Google may
 * have written them on.
 */
export function analyticsCookieNames(measurementId: string): string[] {
  return ["_ga", `_ga_${measurementId.replace(/^G-/, "")}`];
}

/** The script Google documents for gtag.js. The id is checked by shape before it is used. */
export function tagScriptUrl(measurementId: string): string {
  return `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
}

"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  analyticsCookieNames,
  CONSENT_STORAGE_KEY,
  parseConsent,
  productionHost,
  reportableTitle,
  sanitisedLocation,
  tagScriptUrl,
  CTA_EVENTS,
  CTA_EVENT_NAME,
  isCtaEvent,
  type AnalyticsConsent as Consent,
} from "@/lib/analytics";

/**
 * The analytics consent control and, once consent is given, the only loader of Google's tag.
 *
 * Rendered in the root layout with the measurement id the server read from the environment.
 * With no id it renders nothing and loads nothing, which is every environment but production.
 *
 * Order of events, which is the whole point:
 *
 * 1. Prerendered HTML carries nothing: the choice lives in the visitor's browser, so the first
 *    render on the server and the first render in the browser both show nothing. The bar appears
 *    after hydration, only for a browser that has not chosen and is not signalling Global Privacy
 *    Control.
 * 2. A browser sending Global Privacy Control has already answered. It is recorded as "denied"
 *    and never asked.
 * 3. "Allow analytics" is the first moment any script, cookie or request involving Google exists.
 *    Consent Mode defaults are set to denied for everything before the configuration call, then
 *    analytics storage alone is granted; advertising storage, ad user data and ad personalisation
 *    stay denied. Automatic page views are off, and the one view this component sends names a
 *    fixed title and a location with no query string.
 * 4. "No thanks", or withdrawing later on /privacy-choices, sets Google's own disable flag for the
 *    property, removes the `_ga` cookies this site set, and stops every later event.
 *
 * `window.dataLayer` and the `gtag` function are exactly what Google documents; they are created
 * here rather than by an inline snippet so that the site's Content-Security-Policy needs no new
 * inline allowance and the lint in scripts/no-trackers.mjs can name this file as the one place.
 */

/** Fired on `window` when the choice changes, so the control on /privacy-choices and this bar agree. */
export const CONSENT_EVENT = "npimark:analytics-consent";

type GtagWindow = {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  [disable: `ga-disable-${string}`]: boolean | undefined;
};

/** The same `window`, seen with the two names Google's tag adds to it. */
const win = (): GtagWindow => window as unknown as GtagWindow;

export function readStoredConsent(): Consent | null {
  try {
    return parseConsent(window.localStorage.getItem(CONSENT_STORAGE_KEY));
  } catch {
    return null;
  }
}

/** "granted" | "denied" | "none" in the browser; "unknown" in prerendered HTML, so nothing shows. */
export type ConsentState = Consent | "none" | "unknown";

function subscribeToConsent(onChange: () => void): () => void {
  window.addEventListener(CONSENT_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CONSENT_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function consentSnapshot(): ConsentState {
  if (gpcSignalled()) return "denied";
  return readStoredConsent() ?? "none";
}

const consentOnServer = (): ConsentState => "unknown";

/**
 * The visitor's current choice, read the way React reads anything outside itself: from the
 * browser's storage, re-read when this tab or another changes it. The server snapshot is
 * "unknown" for everybody, so the prerendered HTML is identical for every visitor.
 */
export function useAnalyticsConsent(): ConsentState {
  return useSyncExternalStore(subscribeToConsent, consentSnapshot, consentOnServer);
}

export function storeConsent(choice: Consent): void {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch {
    // Storage may be blocked; the choice then lasts for the page, which is still an honest answer.
  }
  window.dispatchEvent(new CustomEvent<Consent>(CONSENT_EVENT, { detail: choice }));
}

function gpcSignalled(): boolean {
  return (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
}

function clearAnalyticsCookies(measurementId: string): void {
  const expired = "expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  const host = window.location.hostname;
  const parent = host.split(".").slice(-2).join(".");
  for (const name of analyticsCookieNames(measurementId)) {
    document.cookie = `${name}=; ${expired}`;
    document.cookie = `${name}=; ${expired}; domain=${host}`;
    document.cookie = `${name}=; ${expired}; domain=.${parent}`;
  }
}

function tag(this: void): void {
  const w = win();
  w.dataLayer = w.dataLayer ?? [];
  // Google's tag reads the `arguments` object itself and ignores a plain array, which is why its
  // documented snippet is `function gtag(){dataLayer.push(arguments);}` - kept verbatim here.
  // eslint-disable-next-line prefer-rest-params
  w.dataLayer.push(arguments);
}

/** Load Google's tag once, with consent defaults set before the configuration call. */
function activate(measurementId: string): void {
  const w = win();
  if (w.gtag) {
    w[`ga-disable-${measurementId}`] = false;
    return;
  }
  w.dataLayer = w.dataLayer ?? [];
  w.gtag = tag;
  w.gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    wait_for_update: 500,
  });
  w.gtag("consent", "update", { analytics_storage: "granted" });
  w.gtag("js", new Date());
  w.gtag("config", measurementId, { send_page_view: false, anonymize_ip: true });
  const script = document.createElement("script");
  script.async = true;
  script.src = tagScriptUrl(measurementId);
  document.head.appendChild(script);
}

function deactivate(measurementId: string): void {
  const w = win();
  w[`ga-disable-${measurementId}`] = true;
  if (w.gtag) w.gtag("consent", "update", { analytics_storage: "denied" });
  clearAnalyticsCookies(measurementId);
}

function sendPageView(pathname: string): void {
  const title = reportableTitle(pathname);
  if (!title) return;
  win().gtag?.("event", "page_view", {
    page_title: title,
    page_location: sanitisedLocation(window.location.origin, pathname),
  });
}

export function AnalyticsConsent({ measurementId }: { measurementId: string | null }) {
  const choice = useAnalyticsConsent();
  const pathname = usePathname();

  useEffect(() => {
    if (!measurementId || choice === "unknown" || choice === "none") return;
    if (!productionHost(window.location.hostname)) return;
    if (choice === "granted") {
      activate(measurementId);
      sendPageView(pathname);
      // Buttons report clicks as a window event (`reportCta`) and never touch the tag; while
      // consent stands, each becomes one named event with the same sanitised location a page
      // view carries. Removed with consent, so a withdrawn visitor's clicks go nowhere.
      const onCta = (e: Event) => {
        const name = (e as CustomEvent<unknown>).detail;
        if (!isCtaEvent(name)) return;
        win().gtag?.("event", CTA_EVENTS[name], {
          page_location: sanitisedLocation(window.location.origin, pathname),
        });
      };
      window.addEventListener(CTA_EVENT_NAME, onCta);
      return () => window.removeEventListener(CTA_EVENT_NAME, onCta);
    }
    deactivate(measurementId);
    return undefined;
  }, [choice, measurementId, pathname]);

  if (!measurementId || choice !== "none") return null;

  return (
    <div className="consent-bar" role="region" aria-label="Analytics consent">
      <p>
        We would like to measure which of our public pages are read, using Google Analytics. Nothing
        is sent unless you allow it, and you can change your mind on{" "}
        <Link href="/privacy-choices#analytics">Your Privacy Choices</Link>.
      </p>
      <div className="consent-bar-actions">
        <button type="button" className="btn sm" onClick={() => storeConsent("denied")}>
          No thanks
        </button>
        <button type="button" className="btn primary sm" onClick={() => storeConsent("granted")}>
          Allow analytics
        </button>
      </div>
    </div>
  );
}

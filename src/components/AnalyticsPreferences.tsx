"use client";

import { storeConsent, useAnalyticsConsent } from "@/components/AnalyticsConsent";

/**
 * The switch on /privacy-choices: what the visitor chose, and a button to change it.
 *
 * It only records the choice; `AnalyticsConsent` in the root layout listens for the change and
 * loads or disables the tag. With analytics not configured for this deployment the control says
 * so and offers nothing to press, so staging and previews cannot make a promise production keeps.
 */
export function AnalyticsPreferences({ configured }: { configured: boolean }) {
  const choice = useAnalyticsConsent();

  if (!configured) {
    return <p className="fine">Analytics is not switched on for this deployment, so there is nothing to choose.</p>;
  }
  if (choice === "unknown") return null;

  const granted = choice === "granted";
  return (
    <div className="consent-pref" data-analytics-consent={choice}>
      <p>
        {granted
          ? "Analytics is on for this browser: page views of our public pages are sent to Google Analytics."
          : choice === "denied"
            ? "Analytics is off for this browser. Nothing is sent to Google Analytics."
            : "You have not chosen yet. Until you allow it, nothing is sent to Google Analytics."}
      </p>
      <button
        type="button"
        className={granted ? "btn sm" : "btn primary sm"}
        onClick={() => storeConsent(granted ? "denied" : "granted")}
      >
        {granted ? "Turn analytics off" : "Allow analytics"}
      </button>
    </div>
  );
}

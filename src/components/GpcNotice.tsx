"use client";

import { useSyncExternalStore } from "react";
import { GPC_HONOURED_NOTE } from "@/lib/gpc";

/** The browser's own flag, read the way React reads anything outside itself. */
const subscribe = () => () => {};
const inBrowser = () =>
  (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
/** What the prerendered HTML says: nothing, for everybody. */
const onServer = () => false;

/**
 * The line that tells a visitor we saw their Global Privacy Control signal - read in the browser,
 * on purpose.
 *
 * The signal arrives two ways, and they travel together: the `Sec-GPC` request header, and
 * `navigator.globalPrivacyControl` in the page. Reading the header on the server would mean a
 * request-time read inside the shared footer, which would turn every public page dynamic - and
 * those pages are the site's SEO surface, prerendered and cached deliberately. So the footer stays
 * static and this one component asks the browser instead. `src/proxy.ts` still handles the header
 * for the signed-in area and the API-facing routes, where the answer has to be acted on rather
 * than displayed.
 *
 * The flag cannot change while a page is open, so the subscription is a no-op and the server
 * snapshot is always false: the prerendered HTML is identical for every visitor, the cache stays
 * honest, and the note appears on hydration for the browser that is signalling. A browser with
 * scripting off sends the header and sees no note; the promise is still kept - the opt-out is
 * honoured either way, and /privacy-choices states that in prerendered text.
 */
export function GpcNotice() {
  const signalled = useSyncExternalStore(subscribe, inBrowser, onServer);

  if (!signalled) return null;
  return (
    <p className="footer-gpc" role="status" data-gpc="1">
      {GPC_HONOURED_NOTE}
    </p>
  );
}

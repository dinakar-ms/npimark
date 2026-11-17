"use client";

import { useEffect, useRef } from "react";

/**
 * Entrance-on-scroll for the sections below the fold. The hero does not use it - its entrance is a
 * CSS animation that starts on paint, because a hero that waits for an observer is a hero that is
 * sometimes blank. The header's scrolled state is not here either: that belongs to the header, and
 * lives in `NavLinks`.
 *
 * Four rules it is built around, and the fourth was learned the hard way.
 *
 * 1. Nothing may depend on it. The page renders complete and visible from the server; this
 *    component only *adds* `data-anim="on"` to its own wrapper after it has mounted, and the
 *    stylesheet hides nothing unless that attribute is present. A browser with JavaScript off,
 *    or a hydration that never happens, shows the finished page rather than a blank one.
 *
 * 2. `prefers-reduced-motion` is honoured before anything is observed. If the visitor has asked
 *    for less movement the attribute is never set, no observer is created, and every element
 *    stays exactly where the server put it. The stylesheet repeats the guard, so neither layer
 *    alone can leak motion.
 *
 * 3. Nothing it animates changes layout. `opacity` and `transform` only; the coverage bars grow
 *    from a `scaleX` inside a track that is already its final size. No reflow, and no link that
 *    moves out from under a cursor mid-click.
 *
 * 4. It always finishes. Two belts besides the braces: anything already inside the viewport when
 *    this mounts is marked shown in the same frame rather than waiting to be told, and a timer
 *    marks everything still hidden after `FAILSAFE_MS` whatever the observer did or did not do.
 *    That is not paranoia - the first build of this page screenshotted as an empty gradient in a
 *    headless browser, because observer callbacks were starved and forty elements sat at
 *    `opacity: 0` forever. Anything that can leave content invisible will eventually do it to a
 *    crawler, a printer, or a customer on a bad connection.
 */

/** How long the observer gets before every remaining element is shown anyway. */
const FAILSAFE_MS = 1400;

export function Reveal({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    node.setAttribute("data-anim", "on");

    const targets = [...node.querySelectorAll<HTMLElement>("[data-reveal]")];
    const show = (element: Element) => element.setAttribute("data-shown", "true");

    // Whatever is on screen already gets no entrance: it was painted, and fading in something
    // the visitor is looking at is the tell of a page that animates because it can.
    const fold = window.innerHeight;
    const waiting = targets.filter((target) => {
      if (target.getBoundingClientRect().top < fold * 0.92) {
        show(target);
        return false;
      }
      return true;
    });

    let observer: IntersectionObserver | null = null;
    if (waiting.length > 0 && typeof IntersectionObserver === "function") {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            show(entry.target);
            observer?.unobserve(entry.target);
          }
        },
        { rootMargin: "0px 0px -10% 0px", threshold: 0.06 },
      );
      for (const target of waiting) observer.observe(target);
    }

    // Belt: if the observer never reports - starved, unsupported, a viewport that never
    // intersects - show everything anyway. Late motion is a blemish; hidden text is a bug.
    const failsafe = window.setTimeout(() => {
      for (const target of waiting) show(target);
      observer?.disconnect();
    }, FAILSAFE_MS);

    return () => {
      window.clearTimeout(failsafe);
      observer?.disconnect();
    };
  }, []);

  return (
    <div ref={root} className="anim">
      {children}
    </div>
  );
}

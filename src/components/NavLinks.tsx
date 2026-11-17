"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { AccountActions } from "@/components/AccountActions";
import { NAV } from "@/lib/site";

/**
 * "Has this component been hydrated yet", asked the way React wants it asked: a store with one
 * answer on the server and a different one in the browser, rather than an effect that sets state
 * and renders the component a second time for it.
 */
const NEVER_CHANGES = () => () => {};
const ON_THE_CLIENT = () => true;
const ON_THE_SERVER = () => false;

/**
 * The only client component on a public page. It does three things, all of which need the browser:
 * it marks the current section in the nav, it tells the header whether it may float, and below
 * 760px - where there is no room for four links in the bar - it is the menu.
 *
 * The first two ship no state; they are attributes. The third is a disclosure.
 */
export function NavLinks() {
  const pathname = usePathname();

  /**
   * Whether the header may float, and whether it is floating right now.
   *
   * The header is dark in both colour schemes, so floating it over a light reading surface would be
   * unreadable - it may only float over a hero, which is dark in both schemes too. Rather than have
   * every page declare that, this looks: if the document opens on a `.hero` sitting at the very
   * top, the page is floatable.
   *
   * Solid is the default, and `data-nav` is only ever *set* to "float" - never relied on to be
   * removed. A page whose JavaScript never runs (a crawler, a broken bundle, a customer on a bad
   * connection) gets the solid bar rather than a transparent one over white text. That is the right
   * way round: a bar that is solid where it could have floated is a missed flourish; a bar that
   * floats where it should not is unreadable.
   *
   * The listener is passive and sets one attribute, so it cannot block a frame, and the attribute
   * changes colour only - nothing moves and nothing reflows.
   */
  useEffect(() => {
    const root = document.documentElement;
    const hero = document.querySelector("main > .hero");
    // A hero that is not at the top of the document is not something the header can float on.
    const floatable = !!hero && hero.getBoundingClientRect().top <= 8;
    if (!floatable) {
      root.removeAttribute("data-nav");
      return;
    }
    const sync = () => {
      if (window.scrollY > 24) root.removeAttribute("data-nav");
      else root.setAttribute("data-nav", "float");
    };
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => {
      window.removeEventListener("scroll", sync);
      root.removeAttribute("data-nav");
    };
  }, [pathname]);

  /**
   * The menu.
   *
   * Below 760px the four primary links are not in the bar - there is no room for them beside a
   * wordmark and two actions - and until now they were nowhere else either: `display: none`, and a
   * copy of them in the footer. This is the disclosure that gives them back, and it carries the two
   * header actions as well, so everything the header offers is in one place once it is open.
   *
   * `mounted` is why the button is not in the server-rendered HTML. A client component is rendered
   * on the server too, so a button written plainly here would exist for a visitor whose JavaScript
   * never ran: a control that looks like the way to the rest of the site and does nothing when it
   * is pressed. Of the two honest options this takes the second - the button is not rendered at
   * all. Before hydration a native details menu below provides the same navigation without JS.
   */
  const mounted = useSyncExternalStore(NEVER_CHANGES, ON_THE_CLIENT, ON_THE_SERVER);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Open is not a boolean, it is a page: the path the menu was opened on.
   *
   * Arriving somewhere is the end of a menu, and every link in it navigates. Storing where it was
   * opened rather than that it is open makes closing-on-arrival a thing the render works out -
   * `pathname` changes, the two stop matching, the panel is shut - instead of a second render
   * chasing the first one through an effect.
   */
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn !== null && openedOn === pathname;
  const setOpen = useCallback(
    (next: boolean) => setOpenedOn(next ? pathname : null),
    [pathname],
  );

  /** Close, and hand focus back to the control that opened it. */
  const closeAndReturn = useCallback(() => {
    setOpenedOn(null);
    buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    // The bar may not be translucent while an opaque panel is hanging off the bottom of it.
    root.setAttribute("data-menu", "open");

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAndReturn();
    };
    // Pressing anywhere else is a way of saying no. `pointerdown` rather than `click`, and in the
    // capture phase, so the panel is gone before whatever is behind it acts on the press.
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    // Tabbing out of it is the same statement made with the keyboard. Focus has already gone where
    // it was going, so this closes without taking it back.
    const onFocusIn = (event: FocusEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    // A window wide enough for the bar to carry the links itself has no use for the panel, and
    // leaving it open would leave focus inside something the stylesheet has stopped drawing.
    const wide = window.matchMedia("(min-width: 761px)");
    const onWide = () => {
      if (wide.matches) setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("focusin", onFocusIn);
    wide.addEventListener("change", onWide);
    return () => {
      root.removeAttribute("data-menu");
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("focusin", onFocusIn);
      wide.removeEventListener("change", onWide);
    };
  }, [open, setOpen, closeAndReturn]);

  const isCurrent = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="nav-nav" ref={containerRef}>
      <nav className="nav-links" aria-label="Primary">
        {NAV.map(({ href, label }) => (
          <Link key={href} href={href} aria-current={isCurrent(href) ? "page" : undefined}>
            {label}
          </Link>
        ))}
      </nav>

      {!mounted && (
        <details className="nav-fallback">
          <summary>Menu</summary>
          <nav aria-label="Mobile navigation">
            {NAV.map(({ href, label }) => <Link key={href} href={href}>{label}</Link>)}
          </nav>
        </details>
      )}
      {mounted && (
        <>
          <button
            type="button"
            className="nav-toggle"
            ref={buttonRef}
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => (open ? closeAndReturn() : setOpen(true))}
          >
            {/* Three rules, or a cross. Decoration either way: the button says what it is in the
                word beside it, and what it is doing is on `aria-expanded`. */}
            <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
              {open ? (
                <path
                  d="M5 5 15 15M15 5 5 15"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M3 6h14M3 10h14M3 14h9"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              )}
            </svg>
            Menu
          </button>

          {/* Hidden rather than unmounted, so the panel the button names in `aria-controls` is
              something that exists whether or not it is showing. */}
          <div className="nav-panel" id={panelId} hidden={!open}>
            <nav className="nav-panel-links" aria-label="Menu">
              {NAV.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  aria-current={isCurrent(href) ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </nav>
            {/* The two header actions again. They stay in the bar at every width - that is the
                point of the bar - but somebody who has opened the menu is looking at the menu, and
                a menu that omits the two things the header is for is a menu with a hole in it. */}
            <AccountActions className="nav-panel-actions" onNavigate={() => setOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
}

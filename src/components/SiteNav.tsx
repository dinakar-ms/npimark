import Link from "next/link";
import { AccountActions } from "@/components/AccountActions";
import { NavLinks } from "@/components/NavLinks";
import { PRODUCT, SITE_NAME } from "@/lib/site";

/**
 * The header.
 *
 * It belongs to the design system rather than sitting above it, which is the bug this fixes: both
 * candidate home pages had to hide the shared chrome, because a light bar with a blue accent fought
 * whatever the hero was doing underneath it. So the bar now stands on the ink ground in both colour
 * schemes, like the heroes and the footer, and it floats on a dark hero rather than drawing a line
 * across it.
 *
 * Two states, and solid is the default:
 *
 *   - solid: an ink bar with a hairline under it. Every page that does not open on a hero, and
 *     every page at all before its JavaScript has run, gets this. It is always readable.
 *   - floating: only a scrim, so the hero's colour field runs unbroken behind the bar. Added by
 *     `NavLinks` once it has established that this page opens on a hero and the page is still at
 *     the top of the scroll; see the comment there.
 *
 * Nothing here reads the request, so the header costs no page its prerender.
 */

export function Wordmark() {
  return (
    <Link href="/" className="brand" aria-label={`${SITE_NAME} ${PRODUCT} home`}>
      <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <rect x="12" y="23" width="18" height="65" rx="9" fill="#4563ef" />
        <rect x="64" y="23" width="18" height="65" rx="9" fill="#4563ef" />
        <path d="M21 32 73 79" fill="none" stroke="#23c8df" strokeWidth="18" strokeLinecap="round" />
        <circle cx="73" cy="12" r="5.562" fill="#ff8058" />
      </svg>
      <span>
        {SITE_NAME}
        <small>{PRODUCT}</small>
      </span>
    </Link>
  );
}

export function SiteNav() {
  return (
    <header className="nav">
      <div className="wrap">
        <Wordmark />
        <NavLinks />
        {/* The one citron thing in the bar, on every page. Citron means press this, and in the
            header the thing to press is an account: sign up for a stranger, the account itself for
            a customer who is signed in. The component asks the browser which, after the page has
            loaded, so this header still costs no page its prerender. */}
        <AccountActions className="nav-actions" />
      </div>
    </header>
  );
}

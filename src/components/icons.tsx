/**
 * The site's icon set: eleven marks, drawn here, in one weight.
 *
 * All of them are 24x24, `fill="none"`, `stroke="currentColor"` at 1.7 with round caps and joins,
 * so they sit at the same optical weight next to body text and inherit whatever colour the card
 * gives them. A second colour in each is `--icon-2`, the palette's magenta, which is what stops
 * eleven line drawings from reading as a dead grey row. Nothing is loaded from anywhere: no icon
 * font, no sprite sheet, no request.
 *
 * Every one is decorative. Each card and each row already says in words what its icon means, so
 * all of them carry `aria-hidden` and `focusable="false"` - an icon announced twice is worse than
 * an icon not announced at all.
 *
 * Drawn for the product-led candidate home page, and lifted out of it when the owner chose that
 * direction, so that every page can use them rather than one preview route.
 */

type IconProps = { className?: string };

function Frame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg
      className={className ? `icon-glyph ${className}` : "icon-glyph"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/** Search: a lens over a list. */
export function IconSearch({ className }: IconProps) {
  return (
    <Frame className={className}>
      <circle cx="10.5" cy="10.5" r="6.2" />
      <path d="M15.2 15.2 20 20" />
      <path d="M8 9.4h5M8 12h3.4" stroke="var(--icon-2)" />
    </Frame>
  );
}

/** Reveal: a record opening. */
export function IconReveal({ className }: IconProps) {
  return (
    <Frame className={className}>
      <rect x="3.2" y="10.2" width="13.6" height="10.6" rx="2.4" />
      <path d="M10 15v1.8" stroke="var(--icon-2)" />
      <path d="M7 10.2V7.4A4.6 4.6 0 0 1 16 6.2" />
    </Frame>
  );
}

/** Export: rows leaving as a file. */
export function IconExport({ className }: IconProps) {
  return (
    <Frame className={className}>
      <path d="M13.6 3.4H6.2A2 2 0 0 0 4.2 5.4v13.2a2 2 0 0 0 2 2h11.6a2 2 0 0 0 2-2V9.4z" />
      <path d="M13.6 3.4V9.4h6.2" stroke="var(--icon-2)" />
      <path d="M12 12v5.2m0 0-2-2m2 2 2-2" stroke="var(--icon-2)" />
    </Frame>
  );
}

/** Coverage: the country as a grid of counted cells. */
export function IconCoverage({ className }: IconProps) {
  return (
    <Frame className={className}>
      <rect x="3.4" y="3.4" width="17.2" height="17.2" rx="2.6" />
      <path d="M3.4 9.2h17.2M3.4 14.8h17.2M9.2 3.4v17.2M14.8 3.4v17.2" strokeWidth="1.2" />
      <rect x="9.2" y="9.2" width="5.6" height="5.6" fill="var(--icon-2)" stroke="none" />
    </Frame>
  );
}

/** Standing: a shield with a check. */
export function IconStanding({ className }: IconProps) {
  return (
    <Frame className={className}>
      <path d="M12 3.2 4.6 6v6.2c0 4.3 3 7.4 7.4 8.6 4.4-1.2 7.4-4.3 7.4-8.6V6z" />
      <path d="M8.8 12.2l2.4 2.4 4-4.6" stroke="var(--icon-2)" />
    </Frame>
  );
}

/** API: a plug into a socket. */
export function IconApi({ className }: IconProps) {
  return (
    <Frame className={className}>
      <path d="M7.4 3.6v4.2M12.6 3.6v4.2" stroke="var(--icon-2)" />
      <rect x="4.4" y="7.8" width="11.2" height="6.4" rx="2.2" />
      <path d="M10 14.2v2.6a3.4 3.4 0 0 0 3.4 3.4h1.2" />
      <circle cx="18" cy="20.2" r="1.8" fill="var(--icon-2)" stroke="none" />
    </Frame>
  );
}

/** Cadence: a clock turning back on itself. */
export function IconCadence({ className }: IconProps) {
  return (
    <Frame className={className}>
      <path d="M20.2 12a8.2 8.2 0 1 1-2.6-6" />
      <path d="M20.4 3.6v4.6h-4.6" stroke="var(--icon-2)" />
      <path d="M12 8.4V12l2.6 1.6" stroke="var(--icon-2)" />
    </Frame>
  );
}

/** Identity: a badge with a person on it. */
export function IconIdentity({ className }: IconProps) {
  return (
    <Frame className={className}>
      <rect x="3.4" y="4.6" width="17.2" height="14.8" rx="2.6" />
      <circle cx="9.4" cy="10.6" r="2.3" stroke="var(--icon-2)" />
      <path d="M5.8 16.4a3.9 3.9 0 0 1 7.2 0" stroke="var(--icon-2)" />
      <path d="M15.6 9.6h2.8M15.6 12.8h2.8" />
    </Frame>
  );
}

/** Location: a pin over its own radius. */
export function IconPin({ className }: IconProps) {
  return (
    <Frame className={className}>
      <path d="M12 21c4.2-4.6 6.3-7.9 6.3-10.6A6.3 6.3 0 0 0 5.7 10.4C5.7 13.1 7.8 16.4 12 21z" />
      <circle cx="12" cy="10.2" r="2.3" stroke="var(--icon-2)" />
    </Frame>
  );
}

/** Affiliation: one organisation, three people reassigned to it. */
export function IconOrg({ className }: IconProps) {
  return (
    <Frame className={className}>
      <rect x="9" y="3.2" width="6" height="4.4" rx="1.4" />
      <path d="M12 7.6v3.6M5.6 15.2v-1.6a2.4 2.4 0 0 1 2.4-2.4h8a2.4 2.4 0 0 1 2.4 2.4v1.6" />
      <circle cx="5.6" cy="18.2" r="2.4" stroke="var(--icon-2)" />
      <circle cx="12" cy="18.2" r="2.4" stroke="var(--icon-2)" />
      <circle cx="18.4" cy="18.2" r="2.4" stroke="var(--icon-2)" />
    </Frame>
  );
}

/** Facilities: the buildings behind the people. */
export function IconFacility({ className }: IconProps) {
  return (
    <Frame className={className}>
      <path d="M4 20.6V8.2l6-3.4v15.8" />
      <path d="M10 10.4h7.4a2 2 0 0 1 2 2v8.2H10" />
      <path d="M13.4 14h3M13.4 17.2h3" stroke="var(--icon-2)" />
      <path d="M2.6 20.6h18.8" />
    </Frame>
  );
}

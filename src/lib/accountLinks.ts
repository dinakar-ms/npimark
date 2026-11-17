/**
 * The two account links every public page carries, chosen by whether the visitor is signed in.
 *
 * The header, its phone menu and the footer's Account column all offered "Sign in" and "Get
 * started" to a customer who had just signed in and followed a footer link out of the
 * application (reported by Caryn Trazi, 29 Oct 2026). The public pages are prerendered and read
 * no request, so they cannot know; the browser can, after the page has loaded, by asking
 * `/api/auth/state`. This is the one place the two states are spelled out.
 */
export type AccountLink = { href: string; label: string; primary: boolean };

export function accountLinks(signedIn: boolean): AccountLink[] {
  if (signedIn) {
    return [
      { href: "/app", label: "Open app", primary: false },
      { href: "/app/settings", label: "Account", primary: true },
    ];
  }
  return [
    { href: "/sign-in", label: "Sign in", primary: false },
    { href: "/sign-up", label: "Get started", primary: true },
  ];
}

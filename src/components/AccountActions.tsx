"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { accountLinks } from "@/lib/accountLinks";

/**
 * "Is this browser signed in", asked once per page after it has loaded. The server-rendered
 * answer is always "no", so a prerendered page stays prerendered and a signed-out visitor sees
 * no flicker; a signed-in customer sees the links change a moment after the page appears.
 */
function useSignedIn(): boolean {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    let live = true;
    fetch("/api/auth/state", { cache: "no-store", credentials: "same-origin" })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { signed_in?: boolean } | null) => {
        if (live && body?.signed_in) setSignedIn(true);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);
  return signedIn;
}

/** The two account buttons of the header and its phone menu. */
export function AccountActions({ className, onNavigate }: { className: string; onNavigate?: () => void }) {
  const signedIn = useSignedIn();
  return (
    <div className={className}>
      {accountLinks(signedIn).map((link) => (
        <Link key={link.href} href={link.href} className={link.primary ? "btn primary" : "btn ghost"} onClick={onNavigate}>
          {link.label}
        </Link>
      ))}
    </div>
  );
}

/** The same two links as a footer list. */
export function AccountFooterLinks() {
  const signedIn = useSignedIn();
  return (
    <ul>
      {accountLinks(signedIn).map((link) => (
        <li key={link.href}>
          <Link href={link.href}>{link.label}</Link>
        </li>
      ))}
    </ul>
  );
}

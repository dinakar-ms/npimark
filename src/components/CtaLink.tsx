"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { type CtaEvent, reportCta } from "@/lib/analytics";

/**
 * A link that reports its click as one of the named CTA events, through the consent bridge in
 * `@/lib/analytics`. It renders exactly like `next/link`; the report is a window event, so this
 * component knows nothing about whether analytics is loaded, and nothing is sent unless the
 * visitor allowed it.
 */
export function CtaLink({ event, onClick, ...rest }: ComponentProps<typeof Link> & { event: CtaEvent }) {
  return (
    <Link
      {...rest}
      onClick={(e) => {
        reportCta(event);
        onClick?.(e);
      }}
    />
  );
}

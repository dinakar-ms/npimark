/**
 * What the live lookup passes around.
 *
 * It lives in a module of its own because the action beside it carries `"use server"`, and such a
 * module may export nothing but async functions - a type or a constant in there is a build error.
 * Everything here is erased at compile time, so importing it costs the browser nothing.
 */

import type { PublicProvider } from "@/lib/api";

export type Probe =
  | { ok: true; query: string; total: number; items: PublicProvider[] }
  /** The API could not be read. The caller says so; it never fills the gap with an invention. */
  | { ok: false; query: string };

/** How many rows the panel shows at once. Small on purpose: this is a lookup, not a results table. */
export const PROBE_ROWS = 6;

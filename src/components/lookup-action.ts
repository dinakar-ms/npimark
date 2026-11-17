"use server";

/**
 * The one server action the live lookup needs.
 *
 * `lib/api.ts` is `server-only` and holds the API key, so a lookup that answers as somebody types
 * cannot run in the browser. This is the whole bridge: a string in, the public record
 * out, one export and nothing else, and neither the key nor the base URL crossing the wire.
 *
 * What comes back has been through `toPublic`, the same reduction every public page on this site
 * goes through: the federal public record, and two booleans about what a signed-in customer would
 * additionally find. No email address, no home contact, nothing derived.
 *
 * A `"use server"` module may export only async functions, which is why the type and the row limit
 * live next door in `lookup-shape.ts`.
 */

import { searchProviders, toPublic } from "@/lib/api";
import { PROBE_ROWS, type Probe } from "./lookup-shape";

/**
 * Providers whose name matches `query`, at most `PROBE_ROWS` of them.
 *
 * The query is trimmed and capped before it leaves here - the API would refuse a pathological one
 * anyway, and a 422 rendered as "nothing matched" is a lie about the data. `searchProviders` caches
 * for a day inside `call()`, so somebody holding a key down types into the cache.
 */
export async function probeProviders(query: string): Promise<Probe> {
  const q = query.trim().slice(0, 60);
  if (q.length < 2) return { ok: true, query: q, total: 0, items: [] };
  try {
    const page = await searchProviders({ q, page_size: PROBE_ROWS });
    return { ok: true, query: q, total: page.total, items: page.items.map(toPublic) };
  } catch {
    return { ok: false, query: q };
  }
}

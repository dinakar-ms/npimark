import { searchProviders, toPublic } from "@/lib/api";
import { PROBE_ROWS, type Probe } from "./lookup-shape";

/**
 * What the live lookup starts on.
 *
 * The panel has to show a real record before anybody has typed anything, and it must not show one
 * this dataset does not hold. So the first page of the index is read, four surnames are taken out of
 * what came back, and the first of them is looked up - which means the record on screen at first
 * paint and every chip beside the field are names that are genuinely in there. If the index cannot
 * be read, all of it comes back empty and the panel says so rather than inventing a name.
 *
 * Written for the vivid candidate home page, and lifted out of it when the owner chose that
 * direction's colour, so that any page can put the lookup on itself.
 */
export async function seedLookup(): Promise<{
  seed: Probe;
  seedQuery: string;
  chips: string[];
}> {
  const nothing = {
    seed: { ok: false as const, query: "" },
    seedQuery: "",
    chips: [],
  };
  try {
    const page = await searchProviders({ page_size: 24 });
    const surnames: string[] = [];
    for (const row of page.items.map(toPublic)) {
      const surname = row.name.split(",")[0]?.trim();
      if (!surname || surname.length < 3) continue;
      const pretty = surname.charAt(0) + surname.slice(1).toLowerCase();
      if (!surnames.includes(pretty)) surnames.push(pretty);
      if (surnames.length >= 4) break;
    }
    if (surnames.length === 0) return nothing;
    const [first, ...rest] = surnames;
    const hits = await searchProviders({ q: first, page_size: PROBE_ROWS });
    return {
      seed: { ok: true, query: first, total: hits.total, items: hits.items.map(toPublic) },
      seedQuery: first,
      chips: rest,
    };
  } catch {
    return nothing;
  }
}

import { MAX_NPIS } from "./whoFilters.ts";

type Params = Record<string, string | string[] | undefined>;
type Selection = { ok: true; params: Params } | { ok: false };

/** Old mobile/MCP links used `npis`. Never let a broken selection become a broad search. */
export function selectionQuery(input: Params): Selection {
  const params = { ...input };
  if (params.npi === undefined && params.npis === undefined) return { ok: true, params };
  const values = [params.npi, params.npis].flatMap(value =>
    value === undefined ? [] : Array.isArray(value) ? value : [value],
  ).flatMap(value => value.split(",").map(part => part.trim()));
  if (!values.length || values.some(value => !/^[0-9]{10}$/.test(value))) return { ok: false };
  const selected = [...new Set(values)];
  if (selected.length > MAX_NPIS) return { ok: false };
  params.npi = selected;
  delete params.npis;
  return { ok: true, params };
}

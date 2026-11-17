/**
 * Which columns the signed-in search may be ordered by, and how an order is read off the URL.
 *
 * An allow-list rather than passing the parameter through: `sort` reaches the platform as a field
 * name, and a name it does not know is a 422 - which arrives on the page as an empty result
 * reading "nothing matched". So a hand-edited URL falls back to the default order rather than to
 * a page that looks like an answer. These five are what `sort_columns` in `provider_rows.py`
 * declares; adding a sixth here without adding it there is the one way to reintroduce the 422.
 *
 * Lives in `lib` rather than in the page so it can be tested. The page renders it; this decides
 * it.
 */

/** The orderable fields, each with the column header it belongs to. */
export const SORTS: Record<string, string> = {
  name: "Provider",
  city: "Where",
  state: "Where",
  npi: "NPI",
  updated_at: "Updated",
};

export type Sort = { field: string; descending: boolean };

/** What the screen sorts by when the URL says nothing, or says something it should not. */
export const DEFAULT_SORT: Sort = { field: "name", descending: false };

/** `-name` -> descending by name, and anything unknown -> the default. */
export function readSort(raw: string | undefined): Sort {
  const value = raw ?? "";
  const descending = value.startsWith("-");
  const field = descending ? value.slice(1) : value;
  return field in SORTS ? { field, descending } : DEFAULT_SORT;
}

/**
 * What clicking a column's header should sort by next: the column you are already on reverses,
 * any other column starts ascending.
 *
 * Returned as the parameter value rather than a `Sort`, because that is what the link carries.
 */
export function nextSort(current: Sort, field: string): string {
  return current.field === field && !current.descending ? `-${field}` : field;
}

/**
 * The URL a column header links to: everything the page is already showing, with the order
 * replaced.
 *
 * `set`, not an appended `&sort=`, because `here` already carries the current ordering so that
 * paging and a reveal's return address keep it - and a second `sort` in the query string would be
 * read as the first one, so every header would look clickable and change nothing.
 */
export function sortHref(here: string, current: Sort, field: string): string {
  const url = new URLSearchParams(here);
  url.set("sort", nextSort(current, field));
  return `/app/search?${url}`;
}

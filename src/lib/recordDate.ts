/** Public record dates must render identically on the server and in every browser. */
export function recordDate(iso: string | null): string | null {
  if (!iso) return null;
  // Preserve a calendar date even when a source sent a timezone-less timestamp.
  // Do not let the visitor's timezone decide how that ambiguous value is parsed.
  const value = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(iso)
    ? `${iso}Z`
    : iso;
  const at = new Date(value);
  if (Number.isNaN(at.getTime())) return null;
  return at.toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric", timeZone: "UTC",
  });
}

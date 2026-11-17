export type BulkQuote = {name: string; email: string; organization: string; audience: string; geography: string; volume: string; use: string};
export function bulkQuoteMailto(value: BulkQuote): string {
  const clean = (text: string, max: number) => text.replace(/[\x00-\x1f\x7f]/g, " ").trim().slice(0, max);
  const body = ["Hello NPIMARK,", "", "I would like a quote for bulk data.",
    `Name: ${clean(value.name, 120)}`, `Work email: ${clean(value.email, 254)}`,
    `Organization: ${clean(value.organization, 160)}`, `Audience/list: ${clean(value.audience, 200)}`,
    `Geography: ${clean(value.geography, 200)}`, `Estimated volume: ${clean(value.volume, 80)}`,
    `Intended use and required fields: ${clean(value.use, 800)}`, "",
    "Please confirm coverage, available fields, licensing, delivery options, and pricing."].join("\n");
  return `mailto:sales@npimark.com?subject=${encodeURIComponent("NPIMARK bulk data quote")}&body=${encodeURIComponent(body)}`;
}

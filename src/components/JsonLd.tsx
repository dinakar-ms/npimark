/**
 * Structured data, inline. The object is serialised once on the server; `<` is escaped so a
 * value taken from a record can never close the script tag early.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

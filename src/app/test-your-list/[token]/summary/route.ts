import { readListTest } from "@/lib/listTest";

/**
 * The same report as a file, for the buyer who has to put it in front of somebody.
 *
 * A link is the better artefact - it is live, it is readable on a phone, and it needs no
 * spreadsheet - but a procurement reviewer wants a file attached to an email, and a CSV of counts
 * is what goes into their own comparison sheet beside whatever the incumbent sent. So the page has
 * both, and this is the same numbers off the same saved row rather than a second measurement.
 *
 * It carries exactly what the page carries: a field name, a count and the denominator, four
 * columns, no identifier and no contact value. Nothing is computed here - the shares are not even
 * written, because a share in a spreadsheet cell outlives the denominator it was a share of.
 *
 * The route is `/summary` rather than `/summary.csv`, which would have read better in the address
 * bar: this repository ignores `*.csv` so that nobody commits a data file by accident, and a route
 * directory named `summary.csv` is caught by that rule and silently never committed. The file the
 * visitor saves is named by `Content-Disposition`, so the download is a `.csv` either way.
 */

export const dynamic = "force-dynamic";

/** RFC 4180: quote everything, double any quote inside. Labels are ours, but a file is a file. */
function cell(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
): Promise<Response> {
  const { token } = await params;
  const result = await readListTest(token);
  if (!result.ok) {
    return new Response("That report has expired or never existed.\n", {
      status: result.status === 404 ? 404 : 502,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  const report = result.data;
  const rows: (string | number)[][] = [
    ["Section", "What was counted", "Count", "Out of"],
    ["Your list", "Ten-digit numbers you sent", report.submitted, report.submitted],
    ["Your list", "Repeats dropped", report.duplicates, report.submitted],
    ["Your list", "Not valid NPIs", report.rejected, report.submitted],
    ["Your list", "Distinct identifiers measured", report.listed, report.listed],
    ["Coverage", "Records we hold", report.held, report.listed],
    ["Coverage", "Of those, inactive identifiers", report.held_inactive, report.held],
    ["Coverage", "Not in our data (never held, or suppressed)", report.not_held, report.listed],
    ["Coverage", "People", report.individuals, report.held],
    ["Coverage", "Organizations", report.organizations, report.held],
    ["Work email", "At least one address on file", report.email.any, report.listed],
    ...report.email.tiers.map((tier) => [
      "Work email",
      `Best tier held: ${tier.label}`,
      tier.count,
      report.listed,
    ]),
    ...report.asked.map((row) => ["Fields you asked about", row.label, row.count, report.listed]),
    ...report.extra.map((row) => ["Also on the record", row.label, row.count, report.listed]),
    ...report.flags.map((row) => ["Flags", row.label, row.count, report.listed]),
    ...report.confirmed.map((row) => ["Last confirmed", row.label, row.count, report.held]),
    ...report.gaps.map((gap) => ["Not held for this list", gap.label, 0, report.listed]),
    ["Report", "Measured on", report.created_at, ""],
    ["Report", "Link stops answering", report.expires_at, ""],
    [
      "Report",
      "What this report does not contain: any email address, phone number, name or record row, "
        + "and nothing licensed under contract",
      "",
      "",
    ],
  ];
  // A BOM, because the one thing this file will certainly be opened in is Excel.
  const body = "﻿" + rows.map((row) => row.map(cell).join(",")).join("\r\n") + "\r\n";
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="npi-mark-coverage-on-your-list.csv"',
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

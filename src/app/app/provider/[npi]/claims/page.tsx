import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  boundary,
  NOT_HELD,
  NO_VOLUME,
  utilisation,
  WHY_EMPTY,
  YEAR,
  count as claimsCount,
} from "@/lib/claims";
import {
  getProviderClaims,
  type PrescriptionLine,
  type ProcedureLine,
  type ProviderClaims,
} from "@/lib/session";

/**
 * What one provider actually did: the procedures they billed and the drugs they prescribed.
 *
 * Why this is a page of its own rather than a panel on the record
 * --------------------------------------------------------------
 * A busy surgeon has dozens of procedure lines and a large group has hundreds, so this is a screen
 * rather than a card, and it is asked for deliberately rather than loaded beside everything else.
 * That reasoning is why it kept a screen of its own when the signed-in record page was built at
 * `/app/provider/[npi]`: the record links here, and the lines load when somebody asks for them.
 * The public record page at `/npi/[npi]` names the capability too. Reading it is included with an
 * account exactly as search is. What is metered is the API twin of it -
 * `/v1/providers/{npi}/procedures` charges a row per published line - and that difference is
 * stated on /pricing rather than left to be discovered.
 *
 * The three states, which the markup keeps apart
 * ----------------------------------------------
 * 1. **Not held.** We hold none of that dataset. A statement about us, and it must never render as
 *    a statement about the provider.
 * 2. **No published volume.** We hold it, and nothing was published for this provider. That covers
 *    no Medicare volume, volume below the publication threshold and not billing Medicare at all,
 *    and the published data does not separate them - so there is one phrase and `WHY_EMPTY` on the
 *    page beside it, never a badge implying we know which.
 * 3. **Withheld.** The provider asked to be left out, and the platform withholds the whole record
 *    rather than listing part of it. That *is* distinguishable and is said in its own words.
 *
 * A fourth thing that is not a state: a null figure inside a line. The published file leaves cells
 * blank and a blank is not a zero, so `figure` prints "not published" rather than 0.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "What they bill and prescribe",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ npi: string }> };

const PLACES: Record<string, string> = { F: "Facility", O: "Office" };

/** A published number, or the words for a cell the file left blank. Never a zero standing in. */
function figure(value: number | null): string {
  return value === null ? "Not published" : value.toLocaleString("en-US");
}

function money(value: number | null): string {
  return value === null
    ? "Not published"
    : value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

/** "25 of 212", or just the number when that is all of them. */
function shown(items: number, total: number): string {
  return items < total
    ? `${claimsCount(items)} of ${claimsCount(total)}`
    : claimsCount(total);
}

function Procedures({ data }: { data: ProviderClaims["procedures"] }) {
  if (data === null) {
    return (
      <p className="fine">
        <b>{NOT_HELD}.</b> We hold no procedure data at all, which is a fact about us rather than
        about this provider. It says nothing about what they bill.
      </p>
    );
  }
  if (data.items.length === 0) {
    return (
      <p className="fine">
        <b>{NO_VOLUME}</b> for {data.year}. {WHY_EMPTY}
      </p>
    );
  }
  return (
    <>
      <p className="fine">
        {shown(data.items.length, data.total_rows)} published lines for {data.year}, most services
        first.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Procedure</th>
              <th>Where</th>
              <th>Services</th>
              <th>Patients</th>
              <th>Average allowed</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((row: ProcedureLine) => (
              <tr key={`${row.code}-${row.place_of_service}`}>
                <td>
                  <span className="mono">{row.code}</span>
                  <span className="fine" style={{ display: "block" }}>
                    {row.description ?? "No description published"}
                    {row.drug && " · drug billed under Part B, so services count units"}
                  </span>
                </td>
                <td className="fine">{PLACES[row.place_of_service] ?? row.place_of_service}</td>
                <td className="fine num">{figure(row.services)}</td>
                <td className="fine num">{figure(row.beneficiaries)}</td>
                <td className="fine num">{money(row.avg_allowed_amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Prescribing({ data }: { data: ProviderClaims["prescribing"] }) {
  if (data === null) {
    return (
      <p className="fine">
        <b>{NOT_HELD}.</b> We hold no prescribing data at all &mdash; again a fact about us, not
        about this provider.
      </p>
    );
  }
  if (data.withheld) {
    return (
      <p className="fine">
        <b>Withheld.</b> This provider is on our suppression list, so we do not list what they
        prescribe. That is a decision they asked for and it holds for every customer, through every
        refresh. It is not a statement that nothing was published.
      </p>
    );
  }
  if (data.items.length === 0) {
    return (
      <p className="fine">
        <b>{NO_VOLUME}</b> under Part D for {data.year}. {WHY_EMPTY}
      </p>
    );
  }
  return (
    <>
      <p className="fine">
        {shown(data.items.length, data.total_rows)} published drugs for {data.year}, most claims
        first.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Drug</th>
              <th>Claims</th>
              <th>Patients</th>
              <th>Drug cost</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((row: PrescriptionLine) => (
              <tr key={`${row.brand_name}-${row.generic_name}`}>
                <td>
                  <b>{row.brand_name ?? row.generic_name ?? "Not named"}</b>
                  {row.generic_name !== null && row.generic_name !== row.brand_name && (
                    <span className="fine" style={{ display: "block" }}>
                      {row.generic_name}
                    </span>
                  )}
                </td>
                <td className="fine num">{figure(row.claims)}</td>
                <td className="fine num">{figure(row.beneficiaries)}</td>
                <td className="fine num">{money(row.drug_cost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default async function ProviderClaimsPage({ params }: Props) {
  const { npi } = await params;
  if (!/^\d{10}$/.test(npi)) notFound();
  const claims = await getProviderClaims(npi);
  // Measured, not typed - the same read every public page that names the coverage makes.
  const measured = await utilisation();

  return (
    <main className="wrap app-main">
      <div className="eyebrow rule">What they do</div>
      <h1>
        What NPI <span className="mono">{npi}</span> billed and prescribed.
      </h1>
      <p className="lede">
        Published Medicare data for {YEAR}. Reading it here is included with your account, like
        search &mdash; through the API the same lines are metered, one row each.{" "}
        <Link href={`/npi/${npi}`}>The rest of the record</Link> is on the provider page.
      </p>

      {claims === null ? (
        <div className="notice warn" style={{ marginTop: 20 }} role="alert">
          The platform did not answer, so nothing is shown. Nothing was counted &mdash; try again in
          a moment. If this provider is not in the register, the provider page will say so.
        </div>
      ) : (
        <>
          <div className="panel" style={{ marginTop: 22 }}>
            <h2>Procedures billed</h2>
            <Procedures data={claims.procedures} />
          </div>

          <div className="panel" style={{ marginTop: 18 }}>
            <h2>Drugs prescribed under Part D</h2>
            <Prescribing data={claims.prescribing} />
          </div>
        </>
      )}

      <div className="panel" style={{ marginTop: 18 }}>
        <h2>What this data is, and what it is not</h2>
        <ul className="fine">
          {boundary(measured).map((line) => (
            <li key={line.slice(0, 32)} style={{ marginTop: 8 }}>
              {line}
            </li>
          ))}
        </ul>
        <p className="fine" style={{ marginTop: 12 }}>
          A blank cell inside a line is a cell the published file left blank, and it is never shown
          as a zero. <Link href="/fields#utilisation">The field reference</Link> gives every field,
          and <Link href="/data">the data page</Link> gives the coverage.
        </p>
      </div>

      <p className="fine" style={{ marginTop: 18 }}>
        <Link href={`/app/provider/${npi}`}>Back to the record</Link> &mdash; or{" "}
        <Link href="/app/search">to search</Link>, where a search can be filtered on a procedure or
        a drug by name without needing a code.
      </p>
    </main>
  );
}

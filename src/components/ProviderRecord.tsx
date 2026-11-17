/**
 * One provider record, shown as the ladder of reach it actually is.
 *
 * This is the site's one primitive. A search result, a plan card, a hero, a long-tail city page
 * and an API example are all this component with a different band open, because that is what the
 * product is: the record is the same for everybody, and what you pay for is how far down it you
 * may read. Building the pages out of it means the pricing is explained by the layout rather than
 * by a paragraph under the layout.
 *
 * The rule that makes it honest, and the reason the props are shaped like this
 * ---------------------------------------------------------------------------
 * **A held field is absent from the response, never rendered and hidden.** A blurred email in the
 * markup is a free email: view-source, or one `fetch`, and the meter is gone. So the component is
 * given values only for the bands it is allowed to show, and it renders the *field names* of every
 * band below that with nothing behind them.
 *
 * `personal` is not a prop at all. Home address and cell phone are contract-only and this is the
 * public marketing site, so there is no shape of this component that can print them - the band
 * always renders held. That is a product rule enforced by a type rather than by remembering.
 */

import { BANDS, type BandKey } from "@/lib/reach";

/** What the federal registry already publishes. Free to show to anybody. */
export type PublicRecord = {
  npi: string;
  name: string;
  credentials?: string | null;
  specialty?: string | null;
  city?: string | null;
  state?: string | null;
  practiceAddress?: string | null;
  practicePhone?: string | null;
};

/** The part we do the work on. Only ever passed where the viewer has been metered for it. */
export type VerifiedRecord = {
  email: string;
  grade?: string | null;
  checkedAt?: string | null;
};

type Props = {
  record: PublicRecord;
  /** Omit to render band 2 held. Passing it is what says "this viewer has paid for this one". */
  verified?: VerifiedRecord;
  /** The deepest band this context opens, for the rule that marks where reach stops. */
  reach?: BandKey;
  /** Small caption under the record - what this instance is demonstrating. */
  caption?: string;
  /** `demo` drops the live-data framing for a worked example on a marketing page. */
  variant?: "live" | "demo";
};

const ORDER: readonly BandKey[] = ["public", "verified", "personal"];

function isOpen(band: BandKey, reach: BandKey): boolean {
  return ORDER.indexOf(band) <= ORDER.indexOf(reach);
}

/** A field with nothing behind it. Named, so the reader knows what they are not being shown. */
function Held({ label }: { label: string }) {
  return (
    <div className="prec-field is-held">
      <dt>{label}</dt>
      <dd>
        <span className="prec-bar" aria-hidden="true" />
        <span className="sr-only">Held</span>
      </dd>
    </div>
  );
}

function Shown({ label, value }: { label: string; value: string }) {
  return (
    <div className="prec-field">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function ProviderRecord({
  record,
  verified,
  reach = "public",
  caption,
  variant = "live",
}: Props) {
  const place = [record.city, record.state].filter(Boolean).join(", ");
  const sub = [record.specialty ?? "Specialty not filed", place].filter(Boolean).join(" · ");

  return (
    <article className="prec" data-reach={reach} data-variant={variant}>
      <header className="prec-head">
        <div>
          <h3 className="prec-name">
            {record.name}
            {record.credentials ? <span className="cell-cred">{record.credentials}</span> : null}
          </h3>
          <p className="prec-sub">{sub}</p>
        </div>
        <code className="prec-npi">NPI {record.npi}</code>
      </header>

      <ol className="prec-bands">
        {BANDS.map((band, index) => {
          // `personal` can never be open here: see the header. The others follow `reach`.
          const open = band.key !== "personal" && isOpen(band.key, reach);
          return (
            <li
              key={band.key}
              className={`prec-band${open ? " is-open" : ""}`}
              data-band={band.key}
            >
              <div className="prec-band-head">
                <span className="prec-band-n" aria-hidden="true">
                  {index + 1}
                </span>
                <span className="prec-band-name">{band.name}</span>
                <span className="prec-gate">{band.tag}</span>
              </div>
              <dl className="prec-fields">
                {band.key === "public" ? (
                  <>
                    <Shown label="Name and credential" value={record.name} />
                    {record.specialty ? (
                      <Shown label="Specialty" value={record.specialty} />
                    ) : null}
                    {record.practiceAddress ? (
                      <Shown label="Practice address" value={record.practiceAddress} />
                    ) : null}
                    {record.practicePhone ? (
                      <Shown label="Practice phone" value={record.practicePhone} />
                    ) : null}
                  </>
                ) : band.key === "verified" ? (
                  verified ? (
                    <>
                      <Shown label="Work email" value={verified.email} />
                      {verified.grade ? (
                        <Shown label="Deliverability" value={verified.grade} />
                      ) : null}
                      {verified.checkedAt ? (
                        <Shown label="Last checked" value={verified.checkedAt} />
                      ) : null}
                    </>
                  ) : (
                    band.fields.map((field) => <Held key={field} label={field} />)
                  )
                ) : (
                  band.fields.map((field) => <Held key={field} label={field} />)
                )}
              </dl>
            </li>
          );
        })}
      </ol>

      {caption ? <p className="prec-caption">{caption}</p> : null}
    </article>
  );
}

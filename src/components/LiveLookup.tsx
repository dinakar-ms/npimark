"use client";

/**
 * The live lookup: a field that searches as you type, and a record that opens beside it.
 *
 * It exists to answer the only question a buyer of a provider file actually has - "is the record
 * any good?" - by opening a real one in front of them. You type part of a name, the index answers,
 * and the row you land on unfolds into every field the public record carries, with the date it was
 * last checked. Nothing on it is illustrative: every value is the one the API returned for that
 * NPI a moment ago, and the two fields we sell are shown as what they are - present or absent, and
 * in the case of home contact, not for sale without a contract.
 *
 * It degrades honestly, in three steps:
 *
 *   - No JavaScript: the field is a real `name="q"` input in a form that GETs `/search`. Typing and
 *     pressing Enter does the useful thing. The panel still shows the record the server rendered.
 *   - JavaScript, no API: the action returns `{ok: false}`, the panel keeps the last real record it
 *     had and says the index did not answer. If there was never a record to keep, the panel lists
 *     the field names and says where the values come from. It never prints a placeholder value.
 *   - Reduced motion: every transition in the stylesheet is behind
 *     `prefers-reduced-motion: no-preference`, so this becomes an instant swap.
 *
 * Keyboard: the input is a combobox over a listbox. Up and Down move the active option, Enter opens
 * it, Escape drops back to the field. Enter with nothing active submits the form - so the key that
 * means "go" always goes somewhere.
 */

import { useEffect, useId, useRef, useState, useTransition } from "react";
import type { PublicProvider } from "@/lib/api";
import { recordDate as day } from "@/lib/recordDate";
import { probeProviders } from "./lookup-action";
import type { Probe } from "./lookup-shape";

/** How long after the last keystroke the index is asked. Long enough to skip a word being typed. */
const SETTLE_MS = 220;

type Props = {
  /** What the server read at render: the rows behind `seedQuery`, or the failure to read them. */
  seed: Probe;
  /** The query the seed answers, shown in the field so the panel and the field never disagree. */
  seedQuery: string;
  /**
   * Real queries from the index, offered as one-click starts. Generated on the server from rows the
   * index actually returned, so a chip can never be a name that is not in there.
   */
  chips: string[];
};

const FIELDS = [
  "NPI",
  "Record type",
  "Status",
  "Name",
  "Primary specialty",
  "Practice location",
  "Practice phone",
  "Affiliation",
  "Last checked",
] as const;

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(
      /(^|[\s,'\-/(])([a-z])/g,
      (_, lead: string, letter: string) => lead + letter.toUpperCase(),
    );
}

/** One row of the opened record. `value` of null renders as an absence, not as a blank. */
function Row({ label, value, mono }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <div className="field-row">
      <dt>{label}</dt>
      <dd className={mono ? "mono" : undefined}>
        {value ?? <span className="probe-absent">not on the public record</span>}
      </dd>
    </div>
  );
}

function OpenedRecord({ provider }: { provider: PublicProvider }) {
  const place = [titleCase(provider.city ?? ""), provider.state].filter(Boolean).join(", ");
  const taxonomy = provider.primary_taxonomy;
  return (
    <dl className="probe-record">
      <Row label="NPI" value={provider.npi} mono />
      <Row
        label="Record type"
        value={provider.type === "individual" ? "Individual" : "Organization"}
      />
      <Row label="Status" value={provider.status === "active" ? "Active" : "Inactive"} />
      <Row
        label="Name"
        value={titleCase(provider.name) + (provider.credentials ? `, ${provider.credentials}` : "")}
      />
      <Row
        label="Primary specialty"
        value={taxonomy ? `${taxonomy.display} · ${taxonomy.code}` : null}
      />
      <Row
        label="Practice location"
        value={place ? `${place}${provider.postal_code ? ` ${provider.postal_code}` : ""}` : null}
      />
      <Row label="Practice phone" value={provider.phone} mono />
      <Row
        label="Affiliation"
        value={provider.employer_name ? titleCase(provider.employer_name) : null}
      />
      <Row label="Last checked" value={day(provider.updated_at)} />

      {/* The two fields the product is actually sold on. Both are stated as facts about this row:
          whether there is a work email, and that home contact is contracted and never self-serve.
          Neither value is shown here, and nothing here may read as though it could be. */}
      <div className="field-row field-sold">
        <dt>Work email</dt>
        <dd>
          {provider.has_email ? (
            <>
              <span className="probe-pip yes" aria-hidden="true" />
              On file for this NPI, with its trust tier — visible once you are signed in
            </>
          ) : (
            <>
              <span className="probe-pip" aria-hidden="true" />
              None on file for this NPI
            </>
          )}
        </dd>
      </div>
      <div className="field-row field-sold">
        <dt>Home address &amp; cell</dt>
        <dd>
          <span className="probe-pip locked" aria-hidden="true" />
          Matched, contracted, never sold self-serve. A released cell number carries the
          file&rsquo;s Do&nbsp;Not&nbsp;Call state with it — and that state reads <em>
            unknown
          </em>{" "}
          whenever the file holds no flag for the number, which is not the same as safe to call.
        </dd>
      </div>
    </dl>
  );
}

/** What the panel shows when there has never been a record to show: the shape, and where it comes from. */
function NoRecord() {
  return (
    <dl className="probe-record">
      {FIELDS.map((field) => (
        <div className="field-row" key={field}>
          <dt>{field}</dt>
          <dd>
            <span className="probe-absent">read from the index</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function LiveLookup({ seed, seedQuery, chips }: Props) {
  const seedItems = seed.ok ? seed.items : [];
  const [query, setQuery] = useState(seedQuery);
  const [result, setResult] = useState<Probe>(seed);
  /** The last rows that were really returned, kept so a failed lookup has something true to show. */
  const [rows, setRows] = useState<PublicProvider[]>(seedItems);
  /** Which query the rows on screen answer. Not always the query in the field - see `stale`. */
  const [rowsQuery, setRowsQuery] = useState(seedQuery);
  const [openNpi, setOpenNpi] = useState<string | null>(seedItems[0]?.npi ?? null);
  const [active, setActive] = useState(-1);
  const [pending, startTransition] = useTransition();
  const listId = useId();
  const optionId = (index: number) => `${listId}-option-${index}`;
  /** Set when the field has been typed in, so the first paint is never the "searching" state. */
  const typed = useRef(false);

  useEffect(() => {
    if (!typed.current) return;
    const value = query;
    const timer = setTimeout(() => {
      startTransition(async () => {
        const next = await probeProviders(value);
        setResult(next);
        if (next.ok && next.items.length > 0) {
          setRows(next.items);
          setRowsQuery(next.query);
          setOpenNpi(next.items[0].npi);
          setActive(-1);
        }
      });
    }, SETTLE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const open = rows.find((row) => row.npi === openNpi) ?? rows[0] ?? null;
  const tooShort = query.trim().length > 0 && query.trim().length < 2;
  const noMatch = result.ok && result.query.length >= 2 && result.items.length === 0;
  /* When the newest query matched nothing, or could not be asked, the rows on screen are the last
     ones that really came back - which is the honest thing to keep, but only if the panel says so.
     Otherwise four rows for a query that matched none of them looks like four matches. */
  const stale = rows.length > 0 && rowsQuery !== query.trim();

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (rows.length === 0) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      const next = (active + step + rows.length + 1) % (rows.length + 1);
      const index = next === rows.length ? 0 : next;
      setActive(index);
      setOpenNpi(rows[index].npi);
      return;
    }
    if (event.key === "Enter" && active >= 0) {
      // A highlighted row means "open this one", not "leave the page".
      event.preventDefault();
      setOpenNpi(rows[active].npi);
      return;
    }
    if (event.key === "Escape") {
      setActive(-1);
    }
  }

  return (
    <div className="probe">
      <form className="probe-form" action="/search" method="get" role="search">
        <label className="probe-label" htmlFor={`${listId}-input`}>
          Look up a provider by name
        </label>
        <div className="probe-field">
          <svg className="probe-glyph" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
            <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path
              d="M12.8 12.8 17 17"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          <input
            id={`${listId}-input`}
            name="q"
            type="search"
            className="probe-input"
            value={query}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            placeholder="Start typing a surname"
            role="combobox"
            aria-expanded={rows.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? optionId(active) : undefined}
            aria-describedby={`${listId}-hint`}
            onChange={(event) => {
              typed.current = true;
              setQuery(event.target.value);
            }}
            onKeyDown={onKeyDown}
          />
          <button type="submit" className="btn">
            Full search
          </button>
        </div>
        <p className="probe-hint" id={`${listId}-hint`}>
          {result.ok === false ? (
            <>The index did not answer just now. Everything below is the last record it returned.</>
          ) : tooShort ? (
            <>Two letters or more.</>
          ) : noMatch ? (
            <>
              No provider in the index matches <strong>{result.query}</strong>.
            </>
          ) : result.ok && result.total > 0 ? (
            <>
              <strong>{result.total.toLocaleString("en-US")}</strong>{" "}
              {result.total === 1 ? "record matches" : "records match"} — pressing Enter takes all
              of them to the full search.
            </>
          ) : (
            <>Up and down arrows move through the matches. Enter opens the highlighted one.</>
          )}
        </p>
        {chips.length > 0 && (
          <div className="probe-chips">
            <span className="probe-chips-label">Names that are really in there:</span>
            {chips.map((chip) => (
              <button
                key={chip}
                type="button"
                className="probe-chip"
                onClick={() => {
                  typed.current = true;
                  setQuery(chip);
                }}
              >
                {chip}
              </button>
            ))}
          </div>
        )}
      </form>

      <div className={`probe-body${pending ? " is-waiting" : ""}`}>
        <ul
          className="probe-hits"
          id={listId}
          role="listbox"
          aria-label={stale ? `Providers matching ${rowsQuery}` : "Matching providers"}
        >
          {stale && (
            <li className="probe-hits-note" role="none">
              Still showing the rows for <strong>{rowsQuery}</strong>.
            </li>
          )}
          {rows.map((row, index) => (
            <li key={row.npi} role="none">
              <button
                type="button"
                id={optionId(index)}
                role="option"
                aria-selected={row.npi === open?.npi}
                className={`probe-hit${row.npi === open?.npi ? " is-open" : ""}${active === index ? " is-active" : ""}`}
                onClick={() => {
                  setOpenNpi(row.npi);
                  setActive(index);
                }}
              >
                <span className="probe-hit-name">{titleCase(row.name)}</span>
                <span className="probe-hit-meta">
                  {row.primary_taxonomy?.display ?? "specialty not stated"}
                  {row.state ? ` · ${row.state}` : ""}
                </span>
                <span className="probe-hit-npi mono">{row.npi}</span>
              </button>
            </li>
          ))}
          {rows.length === 0 && (
            <li className="probe-hits-none" role="none">
              Nothing to open yet.
            </li>
          )}
        </ul>

        <div className="probe-sheet" aria-live="polite">
          <p className="probe-sheet-head">
            {open ? (
              <>
                The public record for <span className="mono">{open.npi}</span>
              </>
            ) : (
              <>What a record carries</>
            )}
          </p>
          {open ? <OpenedRecord provider={open} /> : <NoRecord />}
        </div>
      </div>
    </div>
  );
}

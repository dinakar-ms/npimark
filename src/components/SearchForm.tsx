import { CLASSIFICATIONS, US_STATES } from "@/lib/site";

export type SearchValues = {
  q?: string;
  state?: string;
  classification?: string;
  city?: string;
  postal_code?: string;
  type?: string;
  has_email?: string;
  /** A health system slug, carried through rather than offered: it comes from a system's page. */
  system?: string;
};

/**
 * A plain GET form. No JavaScript: the URL is the state, the back button works, and a
 * search is a link somebody can send. The filters are the ones the team uses most.
 */
export function SearchForm({ values }: { values: SearchValues }) {
  return (
    <form method="get" action="/search" className="panel np-search-form" role="search">
      <div className="np-search-heading"><div><span className="eyebrow">Build your search</span><h2>Who are you looking for?</h2></div><a href="/search" className="np-reset">Clear filters</a></div>
      {/* Not a field anybody types: a re-search from a system's page has to stay on it. */}
      {values.system && <input type="hidden" name="system" value={values.system} />}
      <div className="filters">
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label htmlFor="q">Name, organization or NPI</label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={values.q ?? ""}
            placeholder="e.g. Mayo Clinic, Patel, 1234567893"
            maxLength={200}
            autoComplete="off"
          />
        </div>
        <div className="field">
          <label htmlFor="state">State</label>
          <select id="state" name="state" defaultValue={values.state ?? ""}>
            <option value="">Any state</option>
            {US_STATES.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="classification">Specialty</label>
          <select
            id="classification"
            name="classification"
            defaultValue={values.classification ?? ""}
          >
            <option value="">Any specialty</option>
            {CLASSIFICATIONS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="city">City</label>
          <input id="city" name="city" defaultValue={values.city ?? ""} maxLength={120} />
        </div>
        <div className="field">
          <label htmlFor="postal_code">ZIP</label>
          <input
            id="postal_code"
            name="postal_code"
            defaultValue={values.postal_code ?? ""}
            inputMode="numeric"
            pattern="[0-9]{3,5}"
            maxLength={5}
            placeholder="5 digits, or first 3"
          />
        </div>
        <div className="field">
          <label htmlFor="type">Type</label>
          <select id="type" name="type" defaultValue={values.type ?? ""}>
            <option value="">Individuals and organizations</option>
            <option value="individual">Individuals</option>
            <option value="organization">Organizations</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="has_email">Contact</label>
          <select id="has_email" name="has_email" defaultValue={values.has_email ?? ""}>
            <option value="">Any</option>
            <option value="true">Has email on file</option>
          </select>
        </div>
        <div className="field">
          <button type="submit" className="btn primary">
            Search providers
          </button>
        </div>
      </div>
      <p className="fine np-search-note">Start broad, then narrow by location or specialty. Contact availability does not guarantee access; plan and permission rules apply.</p>
    </form>
  );
}

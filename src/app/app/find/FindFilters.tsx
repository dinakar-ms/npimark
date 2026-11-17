import Link from "next/link";
import { CLASSIFICATIONS, US_STATES } from "@/lib/site";
import styles from "./FindFilters.module.css";

export default function FindFilters({ q }: { q: string }) {
  return (
    <section className={styles.panel} aria-labelledby="provider-filters-title">
      <div className={styles.heading}>
        <div>
          <h2 id="provider-filters-title">Build a provider search</h2>
          <p>No name needed. Choose who you need and where they practice.</p>
        </div>
        <Link href={`/app/search?${new URLSearchParams({ q })}`}>All provider filters →</Link>
      </div>
      <form method="get" action="/app/search">
        <div className={styles.grid}>
          <label>Name or NPI (optional)<input name="q" type="search" defaultValue={q} maxLength={200} placeholder="Name, organization, or NPI" /></label>
          <label>Record type<select name="type" defaultValue=""><option value="">Providers and organizations</option><option value="individual">Individual providers</option><option value="organization">Organizations with an NPI</option></select></label>
          <label>Specialty<select name="classification" defaultValue=""><option value="">Any specialty</option>{CLASSIFICATIONS.map(name => <option key={name} value={name}>{name}</option>)}</select></label>
          <label>State<select name="state" defaultValue=""><option value="">Any state</option>{US_STATES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label>
          <label>City<input name="city" maxLength={120} placeholder="e.g. Miami" /></label>
          <label>ZIP code<input name="postal_code" inputMode="numeric" pattern="[0-9]{5}" maxLength={5} placeholder="e.g. 33179" /></label>
          <label>Work email<select name="has_email" defaultValue=""><option value="">Any availability</option><option value="true">Email available</option><option value="false">No email available</option></select></label>
          <label>Practice phone<select name="has_phone" defaultValue=""><option value="">Any availability</option><option value="true">Phone available</option><option value="false">No phone available</option></select></label>
        </div>
        <input type="hidden" name="status" value="active" />
        <div className={styles.actions}><button type="submit" className="btn primary">Find matching providers</button><button type="reset" className="btn">Reset filters</button><span>Active NPI records. Results open in Physicians &amp; organizations.</span></div>
      </form>
      <p className={styles.note}>Need EHR/EMR, health-system affiliations, radius, or procedure filters? Open all provider filters. These filters apply to NPI records; use the name search above for facilities and nonclinical contacts.</p>
    </section>
  );
}

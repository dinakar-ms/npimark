import Link from "next/link";

type Profile = { npi: string; name: string; city: string | null; state: string | null; employer_name?: string | null; primary_taxonomy?: { display: string } | null };

/** A public registry summary only. Never pass contact fields into the illustration. */
export function ConnectedProfile({ profile }: { profile: Profile | null }) {
  return <aside className="np-connected" aria-label="Provider and organization context">
    <div className="np-orbit" aria-hidden="true" />
    <div className="np-connected-card">
      <span className="eyebrow">The connected profile</span>
      {profile ? <>
        <h2><Link href={`/npi/${profile.npi}`}>{profile.name}</Link></h2>
        <p className="fine">NPI <span className="mono">{profile.npi}</span></p>
        <p>{profile.primary_taxonomy?.display ?? "Specialty not filed"}</p>
        <p className="fine">{[profile.city, profile.state].filter(Boolean).join(", ") || "Practice location not filed"}</p>
        <div className="np-connection-line" aria-hidden="true" />
        <span className="eyebrow">Organization relationship</span>
        <h3>{profile.employer_name ?? "No affiliation on file"}</h3>
        <p className="fine">Practice location and affiliation are separate facts.</p>
        <Link href={`/npi/${profile.npi}`} className="np-text-link">Explore the professional picture ↗</Link>
      </> : <>
        <h2>People.<br />Places.<br /><em>Possibilities.</em></h2>
        <p>Explore a specialty, a practice location, and the organizations around a provider.</p>
        <Link href="/directory" className="np-text-link">Find your starting point ↗</Link>
        <p className="fine">Live profile preview is currently unavailable.</p>
      </>}
    </div>
  </aside>;
}

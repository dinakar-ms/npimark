import Link from "next/link";
import type { ReactNode } from "react";
import type { LeadershipCounts } from "@/lib/api";
import { ROLE_LABELS, titleCase } from "@/lib/facilities";
import type { PublicDecisionNetworkData, WorkspaceDecisionNetworkData } from "@/lib/decisionNetwork";
import { systemPath } from "@/lib/lists";

type Context = {
  name: string;
  network: PublicDecisionNetworkData | WorkspaceDecisionNetworkData | null | undefined;
  organizationName?: string | null;
  ownershipType?: string | null;
  chain?: string | null;
};

export type DecisionPerson = {
  id: number;
  name: string;
  title: string | null;
  role: string | null;
};
export type DecisionOwner = {
  owner_name: string | null;
  role: string;
  private_equity: boolean;
  reit: boolean;
};

function Frame({ context: c, ownership, leadership }: {
  context: Context; ownership: ReactNode; leadership: ReactNode;
}) {
  if (!c.network?.links.length) return null;
  return (
    <section className="np-decision-network" id="decision-network" aria-labelledby="decision-network-heading">
      <header className="np-decision-heading">
        <div><div className="eyebrow">Account research</div><h2 id="decision-network-heading">Decision network</h2></div>
        <p>Understand the organizations and roles connected to {c.name}. These records support research; they do not identify an approved purchase or confirm who controls a budget.</p>
      </header>
      <div className="np-decision-grid">
        <div className="np-decision-card">
          <span className="eyebrow">Organization</span><h3>The wider account</h3>
          <p>{c.organizationName || c.name}</p>
          {c.network.links.map((link, index) => <div key={`${link.system.slug}-${index}`} className="np-decision-system">
            {"suggestion" in link && link.suggestion === true && <span className="tag warn">Suggested relationship — needs review</span>}
            <h4><Link href={systemPath(link.system.slug)}>{link.system.name}</Link></h4>
            <p className="fine">{link.system.counts.facilities.toLocaleString("en-US")} facilities · {link.system.counts.hospitals.toLocaleString("en-US")} hospitals · {link.system.counts.providers.toLocaleString("en-US")} linked providers</p>
            {link.member?.corp_parent_name && <p><b>Recorded corporate parent:</b> {link.member.corp_parent_name}{link.member.corp_parent_type && <span className="fine np-decision-note">{link.member.corp_parent_type}</span>}</p>}
            {link.system.ownership && <p className="fine"><b>System ownership:</b> {link.system.ownership}. {c.network?.ownership_note}</p>}
            {"link_method" in link && <p className="fine">Internal match method: {link.link_method}. Match confidence: {link.confidence}. This is relationship matching, not purchase propensity.</p>}
          </div>)}
          {c.network.truncated && <p className="fine">The network response is capped; additional links may exist.</p>}
          <p className="fine">System membership does not establish employment, ownership of every facility, or centralized purchasing.</p>
        </div>
        <div className="np-decision-card"><span className="eyebrow">Ownership</span><h3>Recorded interests</h3>
          {c.ownershipType && <p><b>Ownership type:</b> {c.ownershipType}</p>}{ownership}
        </div>
        <div className="np-decision-card np-decision-people"><span className="eyebrow">People</span><h3>Leadership by role</h3>{leadership}</div>
      </div>
      <p className="fine np-decision-footnote">Roles and relationships are starting points for research, not proof of employment, purchasing authority, or buying intent. Group-purchasing membership is not available in this view.</p>
    </section>
  );
}

/** Public entry point deliberately accepts counts, never named leadership or owner rows. */
export function PublicDecisionNetwork({ leadership, workspaceHref, ...context }: Context & {
  leadership: LeadershipCounts | null; workspaceHref: string;
}) {
  return <Frame context={{ ...context, network: context.network ? { ...context.network, links: context.network.links.filter(link => !("suggestion" in link) || link.suggestion !== true).map(link => ({ system: link.system, member: link.member })) } : null }}
    ownership={<><p className="fine">Detailed ownership interests are available in the signed-in facility record where filed. A chain label alone is not a verified parent-company hierarchy.</p><Link href={workspaceHref}>Review account details</Link></>}
    leadership={<>{leadership ? leadership.total > 0 ? <>
      <p>{leadership.total.toLocaleString("en-US")} named contacts on file. Names and titles are available in the workspace.</p>
      <dl className="rows">{leadership.by_role.map(r=><div key={r.role}><dt>{ROLE_LABELS[r.role] ?? titleCase(r.role)}</dt><dd>{r.count.toLocaleString("en-US")}</dd></div>)}</dl>
      <Link className="btn primary" href={workspaceHref}>Explore leadership</Link>
    </> : <p>No named leadership contacts are recorded here.</p> : <p>Leadership information could not be loaded. This is not a zero count.</p>}</>}
  />;
}

/** Called only by authenticated routes. Contact values and source labels are never rendered. */
export function WorkspaceDecisionNetwork({ owners, people, peopleTotal, peoplePage = 1, peoplePageSize = 25, pageHref, ...context }: Context & {
  owners: readonly DecisionOwner[] | null;
  people: readonly DecisionPerson[] | null;
  peopleTotal?: number | null;
  peoplePage?: number;
  peoplePageSize?: number;
  pageHref?: (page: number) => string;
}) {
  const groups = new Map<string, DecisionPerson[]>();
  for (const person of people ?? []) {
    const role = person.role?.trim() || "Role not filed";
    groups.set(role, [...(groups.get(role) ?? []), person]);
  }
  return <Frame context={context}
    ownership={owners === null ? <p className="fine">Ownership interests are not supplied for this organization. Review its linked facility records; do not assume that their owners own the entire organization.</p>
      : owners.length === 0 ? <p className="fine">No ownership interests are supplied in this record. This does not establish that it has no owners.</p>
      : <><ul className="np-decision-owners">{owners.map((owner,i)=><li key={`${owner.owner_name}-${owner.role}-${i}`}>
        <b>{owner.owner_name || "Owner name not filed"}</b><span>{owner.role || "Relationship not filed"}</span>
        {owner.private_equity === true && <span className="tag">Reported private equity</span>}
        {owner.reit === true && <span className="tag">Reported REIT</span>}
      </li>)}</ul><p className="fine">Reported interests, not an ordered ownership chain. Flags reflect the underlying filing, not a propensity model. An absent flag is not evidence that an owner is neither private equity nor a REIT.</p></>}
    leadership={people === null ? <p>Leadership could not be loaded. Try this record again; this is not a zero count.</p>
      : <>{people.length === 0 ? <p>No leadership rows were returned for this page.</p> : <>
        <p className="fine">{people.length} contacts shown{peopleTotal != null ? ` of ${peopleTotal.toLocaleString("en-US")}` : " in this response; the response may be capped"}. Grouped by recorded role, not ranked as decision-makers.</p>
        <div className="np-decision-role-grid">{[...groups].map(([role,rows])=><div key={role}><h4>{ROLE_LABELS[role] ?? titleCase(role)}</h4><ul>{rows.map(person=><li key={person.id}><Link href={`/app/contact/${person.id}`}>{person.name}</Link><span>{person.title || "Title not filed"}</span></li>)}</ul></div>)}</div>
      </>}
      {pageHref && <nav className="actions" aria-label="Leadership pages">{peoplePage > 1 && <Link className="btn" href={pageHref(peoplePage-1)}>Previous contacts</Link>}{peopleTotal != null && peoplePage * peoplePageSize < peopleTotal && <Link className="btn" href={pageHref(peoplePage+1)}>Next contacts</Link>}</nav>}
      <p className="fine">Open a person&apos;s record to review contact availability. Viewing this network does not reveal a phone number.</p>
    </>}
  />;
}

import type { HealthSystem, HealthSystemMember } from "./api";

export type PublicNetworkLink = { system: HealthSystem; member: HealthSystemMember | null };
export type PublicDecisionNetworkData = { links: PublicNetworkLink[]; ownership_note: string; truncated: boolean };
export type WorkspaceDecisionNetworkData = Omit<PublicDecisionNetworkData, "links"> & {
  links: (PublicNetworkLink & { link_method?: string; confidence?: number; suggestion?: boolean })[];
};

/** Defense in depth: public page props never retain internal matching fields or person rows. */
export function publicDecisionNetwork(network: PublicDecisionNetworkData | null | undefined): PublicDecisionNetworkData | null {
  if (!network?.links?.length) return null;
  const links = network.links.filter(link => !("suggestion" in link) || link.suggestion !== true).map(({ system: s, member: m }) => ({
    system: { slug:s.slug, name:s.name, kind:s.kind, hq_city:s.hq_city, hq_state:s.hq_state,
      beds:s.beds, states:s.states, organization_npis:s.organization_npis, ownership:s.ownership,
      multistate:s.multistate, counts:{ hospitals:s.counts.hospitals, nursing_homes:s.counts.nursing_homes,
        home_health:s.counts.home_health, facilities:s.counts.facilities, groups:s.counts.groups,
        organizations:s.counts.organizations, providers:s.counts.providers,
        outpatient_centers:s.counts.outpatient_centers } },
    member: m ? { name:m.name, ccn:m.ccn, city:m.city, state:m.state, member_kind:m.member_kind,
      member_type:m.member_type, facility_type:m.facility_type, beds:m.beds,
      corp_parent_name:m.corp_parent_name, corp_parent_type:m.corp_parent_type } : null,
  }));
  return links.length ? { links, ownership_note:network.ownership_note, truncated:network.truncated } : null;
}

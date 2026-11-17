import Link from "next/link";
import type { FacilityKind } from "@/lib/facilities";
import { ROLE_PAGES, roleHeading, rolePath, type RoleIndex } from "@/lib/roles";
import { stateName } from "@/lib/site";

function count(n: number): string {
  return n.toLocaleString("en-US");
}

function region(state: string): string {
  return stateName(state) ?? state;
}

function lower(kind: FacilityKind): string {
  return kind.plural.toLowerCase();
}

/**
 * The role pages for one family (and state), for the facility directory to link to. Renders
 * nothing when there are none - or when the API cannot answer, since the facility page's own
 * content does not depend on it.
 */
export function RoleLinks({ index, kind, state }: { index: RoleIndex; kind: FacilityKind; state?: string }) {
  const links = ROLE_PAGES.flatMap((role) => {
    const cell = index.get(role.key, kind.type, state ?? null);
    return cell ? [{ role, cell }] : [];
  });
  if (links.length === 0) return null;
  const where = state ? ` in ${region(state)}` : "";
  return (
    <div className="panel" style={{ marginTop: 24 }}>
      {/* h2, not h3: on a facility index this panel is the first heading under the page's h1,
          and h1 straight to h3 is a level a screen reader reports as skipped. `.panel h2` is
          sized for a panel, so it reads at the size it always did. */}
      <h2>
        Who runs {lower(kind)}
        {where}
      </h2>
      <p className="fine">Named leadership contacts, counted by role. Names are for signed-in customers.</p>
      <ul className="ticks" style={{ marginTop: 10 }}>
        {links.map(({ role, cell }) => (
          <li key={role.key}>
            <Link href={rolePath(role, kind, state)}>
              {roleHeading(role, kind)}
              {where}
            </Link>{" "}
            <span className="fine num">({count(cell.people)})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}


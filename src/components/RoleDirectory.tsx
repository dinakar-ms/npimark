import { withDirectoryFallback, withDirectoryMetadata } from "@/components/DirectoryFallback";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Crumbs } from "@/components/FacilityDirectory";
import { JsonLd } from "@/components/JsonLd";
import type { RoleCell } from "@/lib/api";
import { FACILITY_KINDS, kindPath, type FacilityKind } from "@/lib/facilities";
import { breadcrumb } from "@/lib/schema";
import {
  ROLE_PAGES,
  resolveSegments,
  roleHeading,
  roleIndex,
  rolePath,
  type RoleIndex,
  type RolePage,
} from "@/lib/roles";
import { siteUrl, stateName } from "@/lib/site";

/**
 * The leadership role pages, one template for every level: the hub, a role, a role at one
 * family of facility, and a role at one family in one state. See `lib/roles.ts` for the layout.
 *
 * Counts, never people. Nothing on these pages - copy, structured data, links - names anybody,
 * and the structured data is a `CollectionPage` about an `Occupation`, never a `Person`. Each
 * page publishes only what the API returns above its floor; anything else is a 404. Cached for a
 * day, like every public page.
 */

function count(n: number): string {
  return n.toLocaleString("en-US");
}

function region(state: string): string {
  return stateName(state) ?? state;
}

function lower(kind: FacilityKind): string {
  return kind.plural.toLowerCase();
}

/** What a signed-in customer gets, said once, the same everywhere. */
function WhatYouGet({ what }: { what: string }) {
  return (
    <div className="panel" style={{ marginTop: 24 }}>
      <h2>What you get when you sign in</h2>
      <ul className="ticks" style={{ marginTop: 10 }}>
        <li>
          The name of every one of these {what}, with their title exactly as their organization
          files it.
        </li>
        <li>
          The facility and organization each one leads, with its size, ownership and ratings.
        </li>
        <li>
          A direct phone number where one is on file, revealed one person at a time from your
          plan&apos;s monthly allowance - you only use a reveal on the people you want.
        </li>
        <li>Filters by state, facility type and role, and the same data over the API.</li>
      </ul>
    </div>
  );
}

function Cta({ what }: { what: string }) {
  return (
    <div className="cta" style={{ marginTop: 32 }}>
      <h2>See who they are</h2>
      <p className="lede">
        Public pages count {what}; they never name them. Create an account to see names,
        titles and the facilities they lead, and reveal contact details when you need them.
      </p>
      <div className="actions" style={{ marginTop: 16 }}>
        <Link className="btn primary lg" href="/sign-up">
          Sign up free
        </Link>
        <Link className="btn lg" href="/pricing">
          See plans
        </Link>
      </div>
    </div>
  );
}

function Stats({ cell, unit }: { cell: RoleCell; unit: string }) {
  return (
    <div className="stats" style={{ marginTop: 26 }}>
      <div className="stat">
        <span className="value num">{count(cell.people)}</span>
        <span className="label">{unit} on file</span>
      </div>
      <div className="stat">
        <span className="value num">{count(cell.facilities)}</span>
        <span className="label">facilities with at least one</span>
      </div>
    </div>
  );
}

/** The page as a collection about an occupation - the role, never a person holding it. */
function occupationPage(role: RolePage, name: string, path: string, description: string) {
  return {
    "@type": "CollectionPage",
    name,
    url: siteUrl(path),
    description,
    about: { "@type": "Occupation", name: capital(role.long) },
  };
}

function capital(value: string): string {
  return value.replace(/^./, (c) => c.toUpperCase());
}

/* ---------------------------------------------------------------------------------------- */
/* the hub: /leadership                                                                      */
/* ---------------------------------------------------------------------------------------- */

export const HUB_TITLE = "Healthcare leadership contacts by role";

async function loadhubMetadata(): Promise<Metadata> {
  const index = await roleIndex();
  const total = FACILITY_KINDS.reduce(
    (sum, kind) => sum + (index.get("all", kind.type)?.people ?? 0),
    0,
  );
  if (total === 0) return { title: "Not found", robots: { index: false } };
  return {
    title: HUB_TITLE,
    description: `${count(total)} named executives, directors of nursing, administrators, board members and owners at US hospitals, nursing homes and hospices, by role and state.`,
    alternates: { canonical: "/leadership" },
  };
}

async function loadHub() {
  const index = await roleIndex();
  const kinds = FACILITY_KINDS.filter((kind) => index.get("all", kind.type));
  if (kinds.length === 0) notFound();
  const roles = ROLE_PAGES.filter((role) => kinds.some((k) => index.get(role.key, k.type)));
  const description =
    "Leadership contacts at certified US facilities, counted by role, facility type and state.";
  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            { "@type": "CollectionPage", name: HUB_TITLE, url: siteUrl("/leadership"), description },
            breadcrumb([
              { name: "Directory", href: "/directory" },
              { name: "Leadership", href: "/leadership" },
            ]),
          ],
        }}
      />
      <section className="section" style={{ paddingTop: 36 }}>
        <div className="wrap">
          <Crumbs items={[{ name: "Directory", href: "/directory" }, { name: "Leadership" }]} />
          <div className="eyebrow rule">Counted by role · refreshed daily</div>
          <h1 style={{ fontSize: "clamp(1.7rem, 3.6vw, 2.5rem)" }}>{HUB_TITLE}</h1>
          <p className="lede">
            The people who run certified US facilities - executives, finance and clinical
            leaders, administrators, board members and owners - counted by role, facility type
            and state. The counts are public; names, titles and contact details are for
            signed-in customers.
          </p>
          <div className="stats" style={{ marginTop: 26 }}>
            {kinds.map((kind) => (
              <div className="stat" key={kind.type}>
                <span className="value num">{count(index.get("all", kind.type)?.people ?? 0)}</span>
                <span className="label">leadership contacts at {lower(kind)}</span>
              </div>
            ))}
          </div>
          <div className="table-wrap" style={{ marginTop: 26 }}>
            <table>
              <thead>
                <tr>
                  <th>Role</th>
                  {kinds.map((kind) => (
                    <th key={kind.type}>{kind.plural}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.key}>
                    <td>
                      <Link href={rolePath(role)}>
                        {role.long.replace(/^./, (c) => c.toUpperCase())}
                      </Link>
                    </td>
                    {kinds.map((kind) => {
                      const cell = index.get(role.key, kind.type);
                      return (
                        <td key={kind.type} className="num">
                          {cell ? (
                            <Link href={rolePath(role, kind)}>{count(cell.people)}</Link>
                          ) : (
                            "—"
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="fine" style={{ marginTop: 10 }}>
            A person is counted once in a place however many filings or facilities name them. A
            dash is a combination with fewer than {index.floor} people, which gets no page of its
            own.
          </p>
          <WhatYouGet what="leaders" />
          <Cta what="these leaders" />
        </div>
      </section>
    </main>
  );
}

/* ---------------------------------------------------------------------------------------- */
/* a role: /leadership/cfos                                                                  */
/* ---------------------------------------------------------------------------------------- */

function roleKinds(index: RoleIndex, role: RolePage) {
  return FACILITY_KINDS.flatMap((kind) => {
    const cell = index.get(role.key, kind.type);
    return cell ? [{ kind, cell }] : [];
  });
}

async function loadroleMetadata(roleSlug: string): Promise<Metadata> {
  const resolved = resolveSegments(roleSlug);
  if (!resolved) return { title: "Not found", robots: { index: false } };
  const kinds = roleKinds(await roleIndex(), resolved.role);
  if (kinds.length === 0) return { title: "Not found", robots: { index: false } };
  const total = kinds.reduce((sum, k) => sum + k.cell.people, 0);
  return {
    title: `Healthcare ${resolved.role.short} - ${count(total)} on file`,
    description: `${count(total)} ${resolved.role.long} at US ${kinds
      .map((k) => lower(k.kind))
      .join(", ")}, counted by facility type and state. Sign up to see names, titles and contact details.`,
    alternates: { canonical: rolePath(resolved.role) },
  };
}

async function loadRoleOverview({ roleSlug }: { roleSlug: string }) {
  const resolved = resolveSegments(roleSlug);
  if (!resolved) notFound();
  const { role } = resolved;
  const index = await roleIndex();
  const kinds = roleKinds(index, role);
  if (kinds.length === 0) notFound();
  const path = rolePath(role);
  const heading = `Healthcare ${role.short}`;
  const others = ROLE_PAGES.filter((r) => r.key !== role.key && roleKinds(index, r).length > 0);
  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            occupationPage(role, heading, path, role.why),
            breadcrumb([
              { name: "Leadership", href: "/leadership" },
              { name: capital(role.short), href: path },
            ]),
          ],
        }}
      />
      <section className="section" style={{ paddingTop: 36 }}>
        <div className="wrap">
          <Crumbs items={[{ name: "Leadership", href: "/leadership" }, { name: capital(role.short) }]} />
          <div className="eyebrow rule">Counted by facility type · refreshed daily</div>
          <h1 style={{ fontSize: "clamp(1.7rem, 3.6vw, 2.5rem)" }}>{heading}</h1>
          <p className="lede">
            {capital(role.long)} at certified US facilities. {role.why}
          </p>
          <div className="table-wrap" style={{ marginTop: 26 }}>
            <table>
              <thead>
                <tr>
                  <th>Facility type</th>
                  <th>{capital(role.short)}</th>
                  <th>Facilities</th>
                </tr>
              </thead>
              <tbody>
                {kinds.map(({ kind, cell }) => (
                  <tr key={kind.type}>
                    <td>
                      <Link href={rolePath(role, kind)}>{roleHeading(role, kind)}</Link>
                    </td>
                    <td className="num">{count(cell.people)}</td>
                    <td className="num">{count(cell.facilities)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <WhatYouGet what={role.short} />
          <OtherRoles roles={others} />
          <Cta what={role.long} />
        </div>
      </section>
    </main>
  );
}

function OtherRoles({ roles, kind, state }: { roles: RolePage[]; kind?: FacilityKind; state?: string }) {
  if (roles.length === 0) return null;
  return (
    <div className="hints" style={{ justifyContent: "flex-start", marginTop: 24 }}>
      <span>Other roles:</span>
      {roles.map((r) => (
        <Link key={r.key} href={rolePath(r, kind, state)}>
          {kind ? roleHeading(r, kind) : capital(r.short)}
          {state ? ` in ${region(state)}` : ""}
        </Link>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------------------------- */
/* a role at a family: /leadership/cfos/hospitals                                            */
/* ---------------------------------------------------------------------------------------- */

async function resolveKindPage(roleSlug: string, kindSlug: string) {
  const resolved = resolveSegments(roleSlug, kindSlug);
  if (!resolved?.kind) return null;
  const { role, kind } = resolved;
  const index = await roleIndex();
  const national = index.get(role.key, kind.type);
  if (!national) return null;
  const states = index.cells
    .filter((c) => c.role === role.key && c.facility_type === kind.type && c.state && stateName(c.state))
    .sort((a, b) => b.people - a.people);
  return { role, kind, index, national, states };
}

async function loadroleKindMetadata(roleSlug: string, kindSlug: string): Promise<Metadata> {
  const r = await resolveKindPage(roleSlug, kindSlug);
  if (!r) return { title: "Not found", robots: { index: false } };
  const heading = roleHeading(r.role, r.kind);
  return {
    // The count belongs in the description; in the title it pushed the longest family and
    // role combinations past what a result ever shows.
    title: heading,
    description: `${count(r.national.people)} ${r.role.long} at ${count(r.national.facilities)} US ${lower(
      r.kind,
    )}, counted by state. Sign up free to see names, titles and contact details.`,
    alternates: { canonical: rolePath(r.role, r.kind) },
  };
}

async function loadRoleKindPage({ roleSlug, kindSlug }: { roleSlug: string; kindSlug: string }) {
  const r = await resolveKindPage(roleSlug, kindSlug);
  if (!r) notFound();
  const { role, kind, index, national, states } = r;
  const heading = `${roleHeading(role, kind)} in the United States`;
  const path = rolePath(role, kind);
  const description = `${count(national.people)} ${role.long} at ${count(national.facilities)} certified ${lower(kind)}.`;
  const otherRoles = ROLE_PAGES.filter((x) => x.key !== role.key && index.get(x.key, kind.type));
  const otherKinds = FACILITY_KINDS.filter((k) => k.type !== kind.type && index.get(role.key, k.type));
  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            occupationPage(role, heading, path, description),
            breadcrumb([
              { name: "Leadership", href: "/leadership" },
              { name: capital(role.short), href: rolePath(role) },
              { name: kind.plural, href: path },
            ]),
          ],
        }}
      />
      <section className="section" style={{ paddingTop: 36 }}>
        <div className="wrap">
          <Crumbs
            items={[
              { name: "Leadership", href: "/leadership" },
              { name: capital(role.short), href: rolePath(role) },
              { name: kind.plural },
            ]}
          />
          <div className="eyebrow rule">United States · refreshed daily</div>
          <h1 style={{ fontSize: "clamp(1.7rem, 3.6vw, 2.5rem)" }}>{heading}</h1>
          <p className="lede">
            {count(national.people)} {role.long} at {count(national.facilities)} certified{" "}
            {lower(kind)} ({kind.blurb}). {role.why}
          </p>
          <Stats cell={national} unit={role.short} />
          {states.length > 0 && (
            <div className="table-wrap" style={{ marginTop: 26 }}>
              <table>
                <thead>
                  <tr>
                    <th>State</th>
                    <th>{capital(role.short)}</th>
                    <th>{kind.plural}</th>
                  </tr>
                </thead>
                <tbody>
                  {states.map((c) => (
                    <tr key={c.state}>
                      <td>
                        <Link href={rolePath(role, kind, c.state ?? "")}>{region(c.state ?? "")}</Link>
                      </td>
                      <td className="num">{count(c.people)}</td>
                      <td className="num">{count(c.facilities)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="fine" style={{ marginTop: 10 }}>
            States with fewer than {index.floor} {role.short} at {lower(kind)} are counted in the
            national total and have no page of their own.
          </p>
          <WhatYouGet what={`${kind.singular.toLowerCase()} ${role.short}`} />
          <OtherRoles roles={otherRoles} kind={kind} />
          {otherKinds.length > 0 && (
            <div className="hints" style={{ justifyContent: "flex-start", marginTop: 12 }}>
              <span>At other facilities:</span>
              {otherKinds.map((k) => (
                <Link key={k.type} href={rolePath(role, k)}>
                  {roleHeading(role, k)}
                </Link>
              ))}
            </div>
          )}
          <Cta what={`${kind.singular.toLowerCase()} ${role.short}`} />
        </div>
      </section>
    </main>
  );
}

/* ---------------------------------------------------------------------------------------- */
/* a role at a family in a state: /leadership/cfos/hospitals/tx                              */
/* ---------------------------------------------------------------------------------------- */

async function resolveStatePage(roleSlug: string, kindSlug: string, stateSlug: string) {
  const resolved = resolveSegments(roleSlug, kindSlug, stateSlug);
  if (!resolved?.kind || !resolved.state || !stateName(resolved.state)) return null;
  const { role, kind, state } = resolved;
  const index = await roleIndex();
  const cell = index.get(role.key, kind.type, state);
  if (!cell) return null;
  return { role, kind, state, index, cell };
}

async function loadroleStateMetadata(
  roleSlug: string,
  kindSlug: string,
  stateSlug: string,
): Promise<Metadata> {
  const r = await resolveStatePage(roleSlug, kindSlug, stateSlug);
  if (!r) return { title: "Not found", robots: { index: false } };
  const heading = `${roleHeading(r.role, r.kind)} in ${region(r.state)}`;
  return {
    title: `${heading} - ${count(r.cell.people)} on file`,
    description: `${count(r.cell.people)} ${r.role.long} at ${count(r.cell.facilities)} ${lower(
      r.kind,
    )} in ${region(r.state)}. Sign up free to see names, titles, the facility each leads and contact details.`,
    alternates: { canonical: rolePath(r.role, r.kind, r.state) },
  };
}

async function loadRoleStatePage({
  roleSlug,
  kindSlug,
  stateSlug,
}: {
  roleSlug: string;
  kindSlug: string;
  stateSlug: string;
}) {
  const r = await resolveStatePage(roleSlug, kindSlug, stateSlug);
  if (!r) notFound();
  const { role, kind, state, index, cell } = r;
  const place = region(state);
  const heading = `${roleHeading(role, kind)} in ${place}`;
  const path = rolePath(role, kind, state);
  const description = `${count(cell.people)} ${role.long} at ${count(cell.facilities)} certified ${lower(kind)} in ${place}.`;
  const national = index.get(role.key, kind.type);
  const everyone = index.get("all", kind.type, state);
  const otherRoles = ROLE_PAGES.filter((x) => x.key !== role.key && index.get(x.key, kind.type, state));
  const otherKinds = FACILITY_KINDS.filter(
    (k) => k.type !== kind.type && index.get(role.key, k.type, state),
  );
  const otherStates = index.cells
    .filter(
      (c) =>
        c.role === role.key && c.facility_type === kind.type && c.state && c.state !== state && stateName(c.state),
    )
    .sort((a, b) => b.people - a.people)
    .slice(0, 10);
  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            occupationPage(role, heading, path, description),
            breadcrumb([
              { name: "Leadership", href: "/leadership" },
              { name: capital(role.short), href: rolePath(role) },
              { name: kind.plural, href: rolePath(role, kind) },
              { name: place, href: path },
            ]),
          ],
        }}
      />
      <section className="section" style={{ paddingTop: 36 }}>
        <div className="wrap">
          <Crumbs
            items={[
              { name: "Leadership", href: "/leadership" },
              { name: capital(role.short), href: rolePath(role) },
              { name: kind.plural, href: rolePath(role, kind) },
              { name: place },
            ]}
          />
          <div className="eyebrow rule">{place} · refreshed daily</div>
          <h1 style={{ fontSize: "clamp(1.7rem, 3.6vw, 2.5rem)" }}>{heading}</h1>
          <p className="lede">
            {count(cell.people)} {role.long} at {count(cell.facilities)} certified {lower(kind)}{" "}
            in {place}
            {national ? `, out of ${count(national.people)} nationally` : ""}. {role.why}
          </p>
          <Stats cell={cell} unit={role.short} />
          {everyone && (
            <p className="fine" style={{ marginTop: 10 }}>
              In all, {count(everyone.people)} named leadership contacts at {count(everyone.facilities)}{" "}
              {lower(kind)} in {place}.{" "}
              <Link href={kindPath(kind, state)}>
                Browse the {lower(kind)} in {place}
              </Link>
              .
            </p>
          )}
          <WhatYouGet what={`${kind.singular.toLowerCase()} ${role.short} in ${place}`} />

          {(otherRoles.length > 0 || otherStates.length > 0) && (
            <div className="grid two" style={{ alignItems: "start", marginTop: 24 }}>
              {otherRoles.length > 0 && (
                <div className="panel">
                  <h3>
                    Other leaders at {lower(kind)} in {place}
                  </h3>
                  <ul className="ticks" style={{ marginTop: 10 }}>
                    {otherRoles.map((x) => (
                      <li key={x.key}>
                        <Link href={rolePath(x, kind, state)}>{roleHeading(x, kind)}</Link>{" "}
                        <span className="fine num">({count(index.get(x.key, kind.type, state)?.people ?? 0)})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {otherStates.length > 0 && (
                <div className="panel">
                  <h3>{roleHeading(role, kind)} elsewhere</h3>
                  <ul className="ticks" style={{ marginTop: 10 }}>
                    {otherStates.map((c) => (
                      <li key={c.state}>
                        <Link href={rolePath(role, kind, c.state ?? "")}>{region(c.state ?? "")}</Link>{" "}
                        <span className="fine num">({count(c.people)})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {otherKinds.length > 0 && (
            <div className="hints" style={{ justifyContent: "flex-start", marginTop: 16 }}>
              <span>Also in {place}:</span>
              {otherKinds.map((k) => (
                <Link key={k.type} href={rolePath(role, k, state)}>
                  {roleHeading(role, k)}
                </Link>
              ))}
            </div>
          )}
          <Cta what={`${kind.singular.toLowerCase()} ${role.short} in ${place}`} />
        </div>
      </section>
    </main>
  );
}

export const Hub = withDirectoryFallback(loadHub);

export const RoleOverview = withDirectoryFallback(loadRoleOverview);

export const RoleKindPage = withDirectoryFallback(loadRoleKindPage);

export const RoleStatePage = withDirectoryFallback(loadRoleStatePage);

export const hubMetadata = withDirectoryMetadata(loadhubMetadata);

export const roleMetadata = withDirectoryMetadata(loadroleMetadata);

export const roleKindMetadata = withDirectoryMetadata(loadroleKindMetadata);

export const roleStateMetadata = withDirectoryMetadata(loadroleStateMetadata);

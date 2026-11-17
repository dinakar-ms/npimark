import type { Metadata } from "next";
import { RoleStatePage, roleStateMetadata } from "@/components/RoleDirectory";

/**
 * One role at one facility family in one state: "Hospital CFOs in Texas". A count and what a
 * signed-in customer gets - never a name. Below the floor it is a 404, not a page with a small
 * number on it. Template in `components/RoleDirectory`.
 */
export const revalidate = 0;

type Props = { params: Promise<{ role: string; kind: string; state: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { role, kind, state } = await params;
  return roleStateMetadata(role, kind, state);
}

export default async function Page({ params }: Props) {
  const { role, kind, state } = await params;
  return <RoleStatePage roleSlug={role} kindSlug={kind} stateSlug={state} />;
}

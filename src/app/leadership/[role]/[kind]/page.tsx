import type { Metadata } from "next";
import { RoleKindPage, roleKindMetadata } from "@/components/RoleDirectory";

/** One role at one facility family, by state. Template in `components/RoleDirectory`. */
export const revalidate = 0;

type Props = { params: Promise<{ role: string; kind: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { role, kind } = await params;
  return roleKindMetadata(role, kind);
}

export default async function Page({ params }: Props) {
  const { role, kind } = await params;
  return <RoleKindPage roleSlug={role} kindSlug={kind} />;
}

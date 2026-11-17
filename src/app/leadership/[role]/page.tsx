import type { Metadata } from "next";
import { RoleOverview, roleMetadata } from "@/components/RoleDirectory";

/** One leadership role across the facility families. Template in `components/RoleDirectory`. */
export const revalidate = 0;

type Props = { params: Promise<{ role: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { role } = await params;
  return roleMetadata(role);
}

export default async function Page({ params }: Props) {
  const { role } = await params;
  return <RoleOverview roleSlug={role} />;
}

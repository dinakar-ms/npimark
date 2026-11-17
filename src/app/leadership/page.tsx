import { connection } from "next/server";
import type { Metadata } from "next";
import { Hub, hubMetadata } from "@/components/RoleDirectory";

/** Leadership contacts by role and facility type. The template lives in `components/RoleDirectory`. */
// Rendered when first requested, not at build: the build has no API to call (the image is built
// where the API is not reachable), and a page baked without its data would serve that for a day.
// The API responses inside stay cached for a day by `call()` in lib/api.ts.

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  return hubMetadata();
}

export default async function Page() {
  await connection();
  return <Hub />;
}

export const revalidate = 0;

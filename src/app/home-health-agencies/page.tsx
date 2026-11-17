import { connection } from "next/server";
import type { Metadata } from "next";
import { KindIndex, kindMetadata } from "@/components/FacilityDirectory";

/** Certified home health agencies by state. The template lives in `components/FacilityDirectory`. */
// Rendered when first requested, not at build: the build has no API to call (the image is built
// where the API is not reachable), and a page baked without its data would serve that for a day.
// The API responses inside stay cached for a day by `call()` in lib/api.ts.

const KIND = "home-health-agencies";

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  return kindMetadata(KIND);
}

export default async function Page() {
  await connection();
  return <KindIndex slug={KIND} />;
}

export const revalidate = 0;

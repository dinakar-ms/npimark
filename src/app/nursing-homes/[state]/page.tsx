import type { Metadata } from "next";
import { StateIndex, stateMetadata } from "@/components/FacilityDirectory";

/** Certified nursing homes in one state. The template lives in `components/FacilityDirectory`. */
export const revalidate = 0;

const KIND = "nursing-homes";

type Props = { params: Promise<{ state: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state } = await params;
  return stateMetadata(KIND, state);
}

export default async function Page({ params }: Props) {
  const { state } = await params;
  return <StateIndex kindSlug={KIND} stateSlug={state} />;
}

import type { Metadata } from "next";
import { CityPage, cityMetadata } from "@/components/FacilityDirectory";

/** Certified nursing homes in one town. The template lives in `components/FacilityDirectory`. */
export const revalidate = 0;

const KIND = "nursing-homes";

type Props = { params: Promise<{ state: string; city: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state, city } = await params;
  return cityMetadata(KIND, state, city);
}

export default async function Page({ params }: Props) {
  const { state, city } = await params;
  return <CityPage kindSlug={KIND} stateSlug={state} citySlug={city} />;
}

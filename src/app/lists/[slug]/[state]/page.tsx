import { withSocialMetadata } from "@/lib/socialMetadata";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  FacilityListPage,
  TaxonomyListPage,
  facilityDescription,
  facilityTitle,
  taxonomyDescription,
  taxonomyTitle,
} from "@/components/ListPage";
import { facilityTypeList, taxonomyList, type FacilityListDetail, type TaxonomyListDetail } from "@/lib/api";
import { stateFromSlug } from "@/lib/facilities";
import { facilityKindForList, listPath } from "@/lib/lists";

/**
 * One list in one state: `/lists/cardiologists/tx`, `/lists/nursing-homes/oh`.
 *
 * The platform applies the floor - 50 providers for a taxonomy, 10 facilities for a facility
 * type - and answers 404 below it, as does this page; the national page's by-state table links
 * only the states that clear it. A state code must be lower case, so there is one address per
 * page. Cached for a day.
 */

export const revalidate = 86_400;

type Props = { params: Promise<{ slug: string; state: string }> };

type Resolved =
  | { kind: "taxonomy"; list: TaxonomyListDetail }
  | { kind: "facility"; list: FacilityListDetail };

async function resolve(slug: string, stateSlug: string): Promise<Resolved | null> {
  const state = stateFromSlug(stateSlug);
  if (!state || !/^[a-z0-9-]{1,160}$/.test(slug)) return null;
  if (facilityKindForList(slug)) {
    const list = await facilityTypeList(slug, state);
    return list ? { kind: "facility", list } : null;
  }
  const list = await taxonomyList(slug, state);
  return list ? { kind: "taxonomy", list } : null;
}

async function readSocialMetadata({ params }: Props): Promise<Metadata> {
  const { slug, state } = await params;
  const resolved = await resolve(slug, state);
  if (!resolved) return { title: "List not found", robots: { index: false } };
  const title = resolved.kind === "taxonomy" ? taxonomyTitle(resolved.list) : facilityTitle(resolved.list);
  const description =
    resolved.kind === "taxonomy" ? taxonomyDescription(resolved.list) : facilityDescription(resolved.list);
  return {
    title,
    description,
    alternates: { canonical: listPath(slug, state) },
    openGraph: { title, description, type: "website" },
  };
}

export default async function ListStatePage({ params }: Props) {
  const { slug, state } = await params;
  const resolved = await resolve(slug, state);
  if (!resolved) notFound();
  const path = listPath(slug, state);
  return resolved.kind === "taxonomy" ? (
    <TaxonomyListPage list={resolved.list} path={path} />
  ) : (
    <FacilityListPage list={resolved.list} path={path} />
  );
}

export const generateMetadata = withSocialMetadata(readSocialMetadata);

import { DIRECTORY_SPECIALTIES, METROS, slugify, specialtyPath } from "./geo.ts";

type PublicIdentity = {type: string; name: string; status: string; city: string | null; state: string | null; primary_taxonomy: {display: string} | null};
export function providerDiscoveryLinks(provider: PublicIdentity): {name: string; href: string}[] {
  const root = provider.type === "organization" ? "/directory/organizations" : "/directory/providers";
  const links = [{name: provider.type === "organization" ? "Organization directory" : "Provider directory", href: root}];
  // Never invent a taxonomy/location page. Only exact published classifications and metros.
  const specialty = DIRECTORY_SPECIALTIES.find(item => item.toLowerCase() === provider.primary_taxonomy?.display.toLowerCase());
  const metro = METROS.find(item => item.state === provider.state?.toUpperCase() && slugify(item.city) === slugify(provider.city ?? ""));
  if (provider.type !== "organization" && provider.status === "active" && specialty && metro) {
    links.push({name: `${specialty} in ${metro.city}, ${metro.state}`, href: specialtyPath(specialty, metro)});
  }
  return links;
}

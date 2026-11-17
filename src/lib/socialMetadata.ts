import type { Metadata } from "next";
import { SITE_NAME, siteUrl, socialCard } from "./site";

/** Complete page-specific previews from the page's own canonical, title and description. */
export function completeSocialMetadata(metadata: Metadata): Metadata {
  const canonical = metadata.alternates?.canonical;
  const path = typeof canonical === "string" ? canonical : canonical instanceof URL ? canonical.href : null;
  if (!path) return metadata; // Recovery and missing pages do not acquire invented URLs.
  const title = typeof metadata.title === "string" ? metadata.title : SITE_NAME;
  const description = metadata.description ?? "";
  const url = new URL(path, siteUrl("/")).href;
  const image = siteUrl("/opengraph-image");
  return {
    ...metadata,
    openGraph: {
      ...socialCard("/", title, description),
      ...metadata.openGraph,
      url,
      images: metadata.openGraph?.images ?? [{url: image, width:1200, height:630}],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      ...metadata.twitter,
    },
  };
}

export function withSocialMetadata<Args extends unknown[]>(read: (...args: Args) => Promise<Metadata>) {
  return async (...args: Args): Promise<Metadata> => completeSocialMetadata(await read(...args));
}

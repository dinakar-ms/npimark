import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/site";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    start_url: "/",
    display: "browser",
    background_color: "#ffffff",
    theme_color: "#4563ef",
    icons: [192, 512].map((size) => ({
      src: `/icon-${size}.png`, sizes: `${size}x${size}`, type: "image/png",
    })),
  };
}

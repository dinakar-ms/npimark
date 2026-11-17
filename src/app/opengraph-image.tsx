import { ImageResponse } from "next/og";
import { PRODUCT, SITE_NAME } from "@/lib/site";

/**
 * The card every share of this site unfurls as.
 *
 * `twitter:card` has said `summary_large_image` since the site was built and there was no image,
 * which is worse than declaring nothing: a link posted into Slack, LinkedIn or a message rendered
 * as a blank rectangle with the title under it. Checked 2026-10-05, `/opengraph-image` was a 404.
 *
 * Drawn here rather than shipped as a file so it cannot drift from the brand: the ground, the
 * citron and the mark are the same values `globals.css` and `icon.svg` use, and the name comes
 * from `content/company.ts` like every other place the product is named.
 *
 * One image for the whole site. A per-page card would be better and is a different job - it needs
 * each page to say what belongs on it, and a wrong card is worse than a general one.
 */

export const alt = `${SITE_NAME} — ${PRODUCT}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0616",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="64" height="64" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="NPImark"><rect width="100" height="100" rx="20" fill="white"/><rect x="12" y="23" width="18" height="65" rx="9" fill="#4563ef"/><rect x="64" y="23" width="18" height="65" rx="9" fill="#4563ef"/><path d="M21 32 73 79" fill="none" stroke="#23c8df" strokeWidth="18" strokeLinecap="round"/><circle cx="73" cy="12" r="5.562" fill="#ff8058"/></svg>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ color: "#f6f4fb", fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>
              {SITE_NAME}
            </span>
            <span style={{ color: "#cff25f", fontSize: 18, letterSpacing: 6, textTransform: "uppercase" }}>
              {PRODUCT}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <span style={{ color: "#f6f4fb", fontSize: 62, fontWeight: 700, lineHeight: 1.12, letterSpacing: -2 }}>
            Healthcare provider insights.
          </span>
          <span style={{ color: "#cff25f", fontSize: 62, fontWeight: 700, lineHeight: 1.12, letterSpacing: -2 }}>
            Better connections.
          </span>
        </div>

        <span style={{ color: "rgba(246,244,251,0.62)", fontSize: 24 }}>
          npimark.com
        </span>
      </div>
    ),
    size,
  );
}

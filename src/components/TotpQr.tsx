import "server-only";
import { encode } from "uqr";

/**
 * The authenticator QR code, drawn here on the server as plain SVG.
 *
 * The code carries the account's TOTP secret, so it is never sent to a QR web service or drawn
 * by a script in the browser: `uqr` (no dependencies) turns the otpauth URI into a grid of
 * modules and this component turns the grid into one SVG path. Nothing is injected as markup,
 * and it needs neither `img-src` beyond 'self' nor any script, so it sits inside the CSP.
 *
 * Dark modules on a white ground in both themes: authenticator cameras read dark-on-light, and
 * an inverted code in dark mode is a code that some phones will not scan.
 */
export default function TotpQr({ uri, label }: { uri: string; label: string }) {
  const { data, size } = encode(uri, { ecc: "M", border: 2 });
  let path = "";
  data.forEach((row, y) => {
    row.forEach((dark, x) => {
      if (dark) path += `M${x} ${y}h1v1h-1z`;
    });
  });
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={200}
      height={200}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
      style={{ display: "block", borderRadius: 8 }}
    >
      <rect width={size} height={size} fill="#ffffff" />
      <path d={path} fill="#000000" />
    </svg>
  );
}

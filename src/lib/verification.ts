/**
 * Proving to Google and Bing that we own this site.
 *
 * Both accept a token. Google's goes in a `<meta name="google-site-verification">`; Bing's goes in
 * a `<meta name="msvalidate.01">` and, for the same token, in an XML file at the site root. They
 * are settings rather than constants because they are issued per property by whoever owns the
 * Search Console and Webmaster Tools accounts, and because the preview host and production are
 * different properties.
 *
 * Unset means nothing is rendered and nothing is served - not a broken tag, not an empty one.
 *
 * Timing, which matters on launch day: the meta tags are part of the page metadata, so a page that
 * was prerendered when the image was built carries whatever the tokens were then, which is
 * nothing. Setting a token and restarting the site does not rewrite that HTML; the page picks the
 * tag up when it next revalidates (an hour for the home page). `/BingSiteAuth.xml` is served by
 * `src/proxy.ts` and is therefore correct the moment the container restarts, and Google's DNS
 * record is correct the moment Cloudflare has it. docs/deployment.md says which to use when.
 */

/** Both services issue URL-safe tokens. Checked, so a pasted quote or newline cannot be served. */
const TOKEN_SHAPE = /^[A-Za-z0-9_-]{8,128}$/;

function token(value: string | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return TOKEN_SHAPE.test(trimmed) ? trimmed : null;
}

/** The Search Console token, or null. Rendered as `google-site-verification`. */
export function googleVerification(): string | null {
  return token(process.env.GOOGLE_SITE_VERIFICATION);
}

/** The Bing Webmaster Tools token, or null. Rendered as `msvalidate.01` and in BingSiteAuth.xml. */
export function bingVerification(): string | null {
  return token(process.env.BING_SITE_VERIFICATION);
}

/** Where Bing looks for the file form of its token. Fixed by Bing, not by us. */
export const BING_VERIFICATION_PATH = "/BingSiteAuth.xml";

/** The body Bing expects at that path: the same token, in its own one-element document. */
export function bingVerificationFile(value: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<users>\n  <user>${value}</user>\n</users>\n`;
}

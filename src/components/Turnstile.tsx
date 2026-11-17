/**
 * Cloudflare Turnstile, the human check on the five forms anybody may post: sign-up,
 * forgot-password, the removal form, the "report a problem" form and "test it on your own list".
 *
 * Renders nothing unless TURNSTILE_SITE_KEY is set in the site's environment - the default - so the
 * forms are then exactly what they were before. Read on the server at request time rather than
 * baked into the build as a NEXT_PUBLIC_ variable, so switching it on is an env change and a
 * restart, not a rebuild.
 *
 * No client code of ours: Cloudflare's script finds the `cf-turnstile` element, draws the check,
 * and puts the answer in a hidden `cf-turnstile-response` input inside the form, which then posts
 * as it always has. The route handler forwards that value; the API verifies it with Cloudflare
 * (app/abuse/turnstile.py). The public CSP names challenges.cloudflare.com for exactly this script
 * and its frame (infra/Caddyfile.public).
 *
 * Set the site key together with the API's TURNSTILE_SECRET_KEY: the secret alone refuses every
 * sign-up, because no widget is producing a token.
 */
export function turnstileSiteKey(): string | null {
  const key = (process.env.TURNSTILE_SITE_KEY ?? "").trim();
  return key || null;
}

export default function Turnstile({
  action,
}: {
  action: "sign-up" | "forgot" | "remove" | "report" | "list";
}) {
  const siteKey = turnstileSiteKey();
  if (!siteKey) return null;
  return (
    <div className="field">
      <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      <div className="cf-turnstile" data-sitekey={siteKey} data-action={action} />
    </div>
  );
}

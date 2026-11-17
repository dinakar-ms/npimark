/**
 * The origin a route handler must build its redirects from.
 *
 * `new URL("/app", request.url)` looks right and is wrong in production. Inside the container Next
 * binds to 0.0.0.0:3000, so `request.url` is `http://0.0.0.0:3000/...`, and every redirect built
 * from it sends the browser to an address it refuses with ERR_ADDRESS_INVALID. Eighteen handlers
 * did this.
 *
 * It is not a cosmetic bug. `api/app/verify/route.ts` is the handler behind the link in the
 * verification email, so with mail working the link still could not verify anybody: the whole
 * onboarding path ended at an invalid address. The failure is invisible in development, where
 * `request.url` happens to be `http://localhost:3000` and therefore correct.
 *
 * `SITE_BASE_URL` is what the site is actually reachable at, and the site already reads it for
 * canonical URLs (`lib/site.ts`) and for the `secure` flag on its cookies. Falling back to
 * `request.url` keeps `next dev` working for anybody who has not set it, which is the only place
 * that fallback is right - in production it is the bug, which is why the go-live runbook has
 * `SITE_BASE_URL` as a required value in two files, not one.
 *
 * Never derived from the `Host` or `X-Forwarded-Host` header: those are the client's to write, and
 * a redirect built from one is an open redirect with extra steps.
 */
export function redirectBase(request: Request): string {
  const configured = (process.env.SITE_BASE_URL ?? "").trim().replace(/\/$/, "");
  return configured || request.url;
}

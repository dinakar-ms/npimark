# Deployment — GitHub → OVH

The images live in DigitalOcean's Container Registry; the server they run on is an OVH host.
Those are two different vendors, and the distinction matters when something breaks — a
registry fault and a host fault look nothing alike.

```
push to main ─► CI (backend + frontend tests) ─► build npi-api + npi-web + npi-site images
                                                 (tag = commit)
             ─► push to DigitalOcean Container Registry ─► SSH to the OVH host ─► deploy.sh <tag>
                                                            pull → migrate → start → /api/ready
                                                            └─ not ready in 120 s → roll back
```

## One-time setup

### 1. DigitalOcean Container Registry (in the DO control panel — you do this)
This is the image registry only. The server is OVH — see step 2.
1. **Container Registry** → Create. Pick a name (e.g. `npi-intel`). Basic plan is enough to start.
2. **API → Tokens** → Generate new token with scopes for the registry (read + write). Copy it once.

### 2. The host (SSH as root — ~5 minutes)
Production is the OVH host `40.160.130.186`, reachable as `npi-v5` if your SSH config names it.
```bash
scp infra/deploy/bootstrap-droplet.sh root@40.160.130.186:/root/
ssh root@40.160.130.186
REGISTRY=registry.digitalocean.com/npi-intel \
PUBLIC_BASE_URL=https://npimark.com \
bash /root/bootstrap-droplet.sh
```
Creates the `deploy` user, `/opt/npi-v5`, `/etc/npi-v5/app.env` with generated secrets and
`/mnt/npidata/v5/{postgres,data}`. v4 is untouched.

### 3. Deploy key
Generate a key pair used only by GitHub Actions:
```bash
ssh-keygen -t ed25519 -f npi_deploy -N "" -C "github-actions-deploy"
```
Put `npi_deploy.pub` into `/home/deploy/.ssh/authorized_keys` on the host.

### 4. GitHub (repo → Settings → Secrets and variables → Actions)
| kind | name | value |
|---|---|---|
| secret | `DIGITALOCEAN_ACCESS_TOKEN` | the DO token |
| **variable** | `DEPLOY_HOST` | `40.160.130.186` |
| secret | `DEPLOY_SSH_KEY` | contents of `npi_deploy` (private key) |
| **variable** | `DEPLOY_KNOWN_HOSTS` | output of `ssh-keyscan 40.160.130.186` |
| variable | `DOCR_REGISTRY` | `registry.digitalocean.com/npi-intel` |

**`DEPLOY_HOST` and `DEPLOY_KNOWN_HOSTS` are variables, not secrets, and getting it wrong is
quiet.** `deploy.yml` reads them as `vars.DEPLOY_HOST` / `vars.DEPLOY_KNOWN_HOSTS`. Stored as
secrets they resolve to an empty string, the SSH target becomes `deploy@`, and the release fails
looking like a key or network fault instead. This has cost three silent update failures. A
hostname is not a secret — it is in DNS — and keeping it a variable is what makes it readable
in a failed run's log, which is the point.

Until `DOCR_REGISTRY` is set, pushes to `main` run CI only and skip the deploy.

Optional: Settings → Environments → `production` → required reviewers, if you want to approve each release.

### 5. First release
Push to `main` (or Actions → Deploy → Run workflow). Then create the first admin as a one-time
invite link, so the password is set in the browser rather than typed into a server console:
```bash
cd /opt/npi-v5 && TAG=$(cat .deployed_tag) docker compose --env-file .env run --rm -T api \
  python -m app.cli invite-admin --email you@company.com --name "Your Name" --org "InfoDepots"
```
Open the printed link (valid 24 h, single use), set a password, then invite the team from **Users & roles**.

Current production addresses, all public and served by Caddy on the `edge` container:
`https://npimark.com` (customer site), `https://api.npimark.com` (public API) and
`https://app.list-smarter.com` (admin). Staging is `https://stg.list-smarter.com`.

Tailscale is still installed on the host and still works (`npi-v5-us`, `100.111.79.54`), but it
is no longer how production is reached and is not required to release. v4 was retired on
2026-09-11, its data kept in `/mnt/npidata`.

### 6. Going public (the customer site)
**This is already done** — npimark.com, api.npimark.com and app.list-smarter.com are live on the
public edge. The steps below are kept as the record of what was set up and what to repeat on a
rebuild; the release path is identical whether or not the public profile is on.

1. Point `A`/`AAAA` records for the site and the API hostname at the host.
2. On the host, set `SITE_DOMAIN`, `API_DOMAIN`, `ACME_EMAIL`, `SITE_BASE_URL` and
   `SITE_INDEXABLE=true` in `/opt/npi-v5/.env`.
3. Set `SITE_BASE_URL` and the `SMTP_*` keys in `/etc/npi-v5/app.env` (see
   `infra/app.env.example`). Any SMTP provider will do. **Until SMTP is configured a customer can
   never confirm their address**, and the platform therefore does not ask them to: sign-up works,
   but the rule that gates reveals and exports on a proved address stays off. Setting SMTP turns
   it on by itself, so configure it before the first real customer, not after.
4. Open 80 and 443 in the firewall, then deploy (or `Actions → Deploy → Run workflow`).
5. Put Cloudflare in front of it, from [`cloudflare.md`](cloudflare.md) — the rate-limiting rules,
   the bot settings, the cache rules and the two locks that stop the origin answering anybody who
   did not come through Cloudflare. That file is written to be pasted in, rule by rule, with the
   command that proves each one. **Read its §7 before closing the firewall to Cloudflare's ranges:
   Caddy's Let's Encrypt renewal stops working the moment you do, and the fix is a Cloudflare Origin
   CA certificate rather than a surprise sixty days later.** We have no page-level rate limiting of
   our own; this is it.

`SITE_DOMAIN` is the switch: with it set, `deploy.sh` and `rollback.sh` add `--profile public`,
so `edge` is started and refreshed with every release instead of being left to whoever started
it by hand. Caddy requests its own certificates on the first request, so the DNS records must
resolve **before** the deploy.

Check it from off the tailnet: `curl -sI https://<SITE_DOMAIN>` and
`curl -s https://<API_DOMAIN>/v1/health`. Any other path on the API hostname must answer 404 —
that is the point of the separate config, so confirm one (`/api/imports`, say) really does.

**The site's own API key.** The public pages (search, directory, facility and provider pages)
read the platform through one key of the site's own. Mint it on the host for an internal
admin - never a customer, whose plan limit would throttle every visitor at once:
```
cd /opt/npi-v5 && TAG=$(cat .deployed_tag) docker compose --env-file .env -f docker-compose.yml   run --rm -T api python -m app.cli issue-api-key --email you@infodepots.com
```
It prints the secret once. Put it in `/etc/npi-v5/site.env` as `NPI_API_KEY=...` (create the
file, `chmod 600`), then restart the site:
`cd /opt/npi-v5 && TAG=$(cat .deployed_tag) docker compose --env-file .env -f docker-compose.yml up -d site`.
Until it is set, public pages say the provider service cannot be reached.

**Put the internal organisation on the `internal` plan.** A `/v1` read now costs the rows it
returns against the plan's row allowance, not only one API call, and the site reads every public
page through the key above. An organisation with no subscription at all falls back to the settings,
where `CONSUMER_EXPORT_MONTHLY_ROW_QUOTA` is 50,000,000 - which is a ceiling on public page views
(a directory page is about a hundred rows), and reaching it would take the data pages down for
everybody at once with a `409`. The `internal` plan that migration 0014 seeds has every limit null,
which is unlimited, so one subscription settles it:

    PUT /api/plans/subscriptions/<internal org id>   {"plan_code": "internal", "status": "active"}

Check it from the app's billing screen - `plan_code` should read `internal`, not `unmanaged` - or
with `GET /v1/usage` on the site's own key, where `limits.export_rows.enforced` should be `false`.
Never mint the site's key for a customer organisation: their row allowance would be spent by
visitors rather than by them.

### 7. Taking payments (Stripe)
Off until you do this, and safe to leave off: with the Stripe keys blank the billing page shows
the "tell us what you need" text, and the checkout, portal and webhook endpoints answer 404.
Only a customer organisation's admin can buy; the internal tenant's plan is never for sale.
A plan changes **only** when Stripe's signed webhook says so - coming back to the success page
changes nothing.

1. **Products and prices** (Stripe dashboard → Product catalogue). One product per plan you sell,
   each with one **recurring monthly** price. Copy each price id (`price_...`, not `prod_...`).
   Keep `plans.price_cents` in step with it - that is what the site shows; Stripe's price is
   what is charged.
2. **Attach each price to its plan** on the host (one price, one plan; `--clear` stops selling
   it online without touching existing subscribers):
   ```
   docker compose -p npi-v5 exec api python -m app.cli set-plan-price --plan pro --price price_1Q...
   ```
   (Same effect: `PUT /api/plans/pro` with `{"stripe_price_id": "price_..."}` as an internal
   admin, or `UPDATE plans SET stripe_price_id = 'price_...' WHERE code = 'pro';`.) A plan with
   no price id never shows an Upgrade button.
3. **Customer portal** (Settings → Billing → Customer portal): turn it on, allow payment-method
   updates, invoice history and cancellation, and - if customers may switch plan themselves -
   add the same products under "Subscriptions → customers can switch plans". Every change made
   there reaches us by webhook.
4. **Webhook endpoint** (Developers → Webhooks → Add endpoint):
   - URL: `https://<API_DOMAIN>/stripe/webhook` (the public edge forwards exactly that path, POST
     only, to `/api/billing/stripe/webhook`; it needs `SITE_DOMAIN`/`API_DOMAIN` live, step 6).
   - Events: `checkout.session.completed`, `customer.subscription.created`,
     `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.
     Anything else is recorded and ignored, so extra events are harmless.
   - Any API version works; the code reads both the old and the 2025+ payload shapes.
   - Copy the signing secret (`whsec_...`).
5. In `/etc/npi-v5/app.env` set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` and (already, from
   step 6) `SITE_BASE_URL`, then redeploy. Checkout switches on only when all three are set.
6. Test it end to end in **test mode first** (`sk_test_...`, a test-mode webhook with its own
   `whsec_...`, card `4242 4242 4242 4242`): upgrade from the billing page, confirm the plan
   changes within seconds, then cancel from Manage billing and confirm reveals and exports are
   refused while the organisation's data stays. Stripe's dashboard shows each webhook delivery
   and our answer; `SELECT id, type, outcome FROM stripe_events ORDER BY received_at DESC` shows
   what we did with it (`applied`, `ignored`, `stale`, `unmatched`).

What each event does: a paid checkout moves the organisation onto the plan it bought;
`past_due` (a failed card Stripe is still retrying) keeps working and the billing page warns;
`unpaid`/`paused` suspend and `canceled` cancels - both stop reveals, exports, appends and API
calls, and nothing is deleted. Redelivered events are applied once, and an older event arriving
after a newer one changes nothing.

### 8. Single sign-on (optional)
"Sign in with Google" and "Sign in with Microsoft" on the customer site. Off until configured:
with the keys blank there are no buttons and the SSO endpoints answer 404. It needs
`SITE_BASE_URL` set (step 6), because the redirect URI is a **site** URL - the browser never talks
to the API. SSO signs in an *existing* customer account whose email the provider has verified; it
never creates an organisation, refuses internal users and accounts with two-step sign-in, and
marks the address verified. `app/sso.py` has the full policy.

The redirect URIs to register, exactly (with `SITE_BASE_URL=https://npimark.com`):

| provider | redirect URI |
|---|---|
| Google | `https://npimark.com/api/auth/sso/google/callback` |
| Microsoft | `https://npimark.com/api/auth/sso/microsoft/callback` |

**Google** (Google Cloud console, the project that owns the domain):
1. *APIs & Services → OAuth consent screen*: user type **External**, app name, support email,
   the site's domain as an authorised domain. Scopes: `openid`, `email`, `profile` only - these
   are non-sensitive, so no Google verification review is needed. Publish the app (a consent
   screen left in *Testing* only admits listed test users).
2. *APIs & Services → Credentials → Create credentials → OAuth client ID*, type **Web
   application**. Add the Google redirect URI above under *Authorised redirect URIs*. No
   JavaScript origins are needed.
3. Put the client ID and secret in `GOOGLE_OIDC_CLIENT_ID` / `GOOGLE_OIDC_CLIENT_SECRET`.

**Microsoft** (Microsoft Entra admin center, any tenant you control):
1. *Identity → Applications → App registrations → New registration*. Supported account types:
   **Accounts in any organizational directory** (matches the default
   `MICROSOFT_OIDC_TENANT=organizations`; pick "...and personal Microsoft accounts" only if you
   set `common`). Redirect URI: platform **Web**, the Microsoft URI above.
2. *Certificates & secrets → New client secret*. Note its expiry - **it stops working on that
   date** and SSO with Microsoft fails until a new one is set. Put the *Value* (not the Secret
   ID) in `MICROSOFT_OIDC_CLIENT_SECRET`, and the *Application (client) ID* from Overview in
   `MICROSOFT_OIDC_CLIENT_ID`.
3. *Token configuration → Add optional claim → ID*: add **`email`** and **`xms_edov`** (and
   `verified_primary_email` if offered). This is not optional for us: a work account's `email`
   is whatever its tenant admin typed, so it is believed only when `xms_edov` says the domain is
   verified. Without the claim every work account is refused with "your provider didn't confirm
   that email address".
4. *API permissions*: the default `User.Read` plus `openid`, `email`, `profile` (Microsoft Graph,
   delegated). No admin consent is required for these.

Then restart the API (`deploy.sh`, or recreate the `api` container) and open `/sign-in` - the
buttons appear within five minutes (the site caches the provider list briefly). Sign-ins show in
the audit log as `auth.sso_login`; refusals of a real account as `auth.sso_refused`.

### 9. Turnstile (optional, recommended once the site is public)
Cloudflare's human check on sign-up, forgot-password and the removal form. Off until configured: with both keys
blank there is no widget and the API checks nothing. `backend/app/abuse/turnstile.py` explains the
policy - notably that once configured it **fails closed**: if Cloudflare cannot be reached,
sign-up and reset requests are refused until it can.

1. Cloudflare dashboard → *Turnstile* → *Add widget*. Name it (e.g. "NPI Mark site"), add the
   site's hostname (`npimark.com`, plus the staging hostname if wanted), widget mode **Managed**,
   no pre-clearance.
2. It shows a **site key** and a **secret key**. Put the site key in the site's env
   (`/etc/npi-v5/site.env`) as `TURNSTILE_SITE_KEY`, and the secret in the API's env
   (`/etc/npi-v5/app.env`) as `TURNSTILE_SECRET_KEY`. **Set both or neither** - a secret with no
   site key refuses every sign-up, because no widget is producing a token.
3. Recreate the `site` and `api` containers. `infra/Caddyfile.public` already allows
   `https://challenges.cloudflare.com` in `script-src` and `frame-src`; the API needs outbound
   HTTPS to the same host.

### 10. Terms, Privacy and the removal page (before launch)
The site serves `/terms`, `/privacy` and `/remove-my-information`, all linked from the footer.
The Terms and Privacy text lives in `site/src/content/legal/` (`terms.ts`, `privacy.ts`; the
conventions are at the top of `types.ts`), so counsel's edits drop in without touching a page.

- **Draft until approved.** While `LEGAL_PAGES_APPROVED` in the site's env is anything but `true`
  (the default), both pages open with a "Draft - under legal review" banner and show every
  `[LAWYER: ...]` note highlighted where it sits. Once counsel has signed off, set
  `LEGAL_PAGES_APPROVED=true` in `/etc/npi-v5/site.env` and recreate the `site` container; the
  banner and any leftover notes then render as nothing. Sections counsel has already approved
  carry an "Approved wording" tag in the draft.
- **Mailboxes.** Set `PRIVACY_EMAIL` and `SUPPORT_EMAIL` in the site's env. The Privacy Policy
  tells people to write to the privacy address to have their details removed, so somebody must
  be reading it from launch day.
- **Version.** Sign-up requires ticking "I agree to the Terms of Service and Privacy Policy"; the
  API refuses sign-up without it (422 `terms_not_accepted`) and records `users.terms_version`
  and `users.terms_accepted_at`, plus the same pair in the `auth.sign_up` audit row. When the
  substance of either document changes, bump `TERMS_VERSION` in both
  `site/src/content/legal/version.ts` and `backend/app/legal.py` in the same commit (a backend
  test compares them). Accounts created by admins, by invitation or before the box existed have
  null there. Single sign-on never creates an account - a proven address with no account is sent
  to the sign-up form, box and all.
- **Removal confirmations need mail.** With `SMTP_HOST`/`SMTP_FROM` and `SITE_BASE_URL` set,
  every removal request is confirmed by a link to the requester's own address before staff see
  it. Without mail, requests arrive marked `unverified` (see "Removal requests" below).

### 11. Getting found (Search Console, Bing, IndexNow) and measured (GA4)
Four settings, all in `/etc/npi-v5/site.env`, all blank by default, all read at run time — set one
and recreate the `site` container; no rebuild, no code change:
```
GOOGLE_SITE_VERIFICATION=
BING_SITE_VERIFICATION=
INDEXNOW_KEY=
GA4_MEASUREMENT_ID=
```

**Google Analytics 4.** `GA4_MEASUREMENT_ID=G-…` on production only (never staging: the loader
also refuses any hostname but npimark.com). Nothing loads, no cookie is set and nothing is sent
until a visitor presses *Allow analytics* on the consent bar; Global Privacy Control counts as no;
the switch on /privacy-choices withdraws it. Only the public marketing routes listed in
`site/src/lib/analytics.ts` report a page view, with a fixed title and no query string. The edge
policy in `infra/Caddyfile.public` allows Google's tag and collection hosts - **a Caddyfile change
is not reloaded by the deploy; reload the edge by hand after it lands.** Acceptance: a fresh
browser makes zero requests to Google before consent, exactly one page_view after it (GA4
DebugView shows it), and none on /npi/*, /search, /app or any form.
Recreate the container with:
```
cd /opt/npi-v5 && TAG=$(cat .deployed_tag) docker compose --env-file .env -f docker-compose.yml up -d --force-recreate site
```

**Google Search Console.**
1. <https://search.google.com/search-console> → *Add property* → **URL prefix** → `https://<SITE_DOMAIN>`
   (exact scheme and host, no path, no trailing slash).
2. Open *HTML tag* and copy **only** the `content="…"` value — not the whole tag.
3. Paste it as `GOOGLE_SITE_VERIFICATION=…` in `/etc/npi-v5/site.env`, recreate the site.
4. Check it is there: `curl -s https://<SITE_DOMAIN>/ | grep google-site-verification`.
   **If nothing comes back, that is expected for up to an hour after a release**: the home page is
   still serving the HTML that was prerendered when the image was built, and the tag appears when
   the page next revalidates. Wait, or use the DNS method below, which is immediate.
5. Press *Verify*. Then *Sitemaps* → *Add a new sitemap* → `sitemap-index.xml`.

*The no-code alternative, and the better one:* in Cloudflare, add the `TXT` record Search Console
offers for a **Domain** property. It verifies the apex and every subdomain at once, it is live as
soon as DNS propagates, and nothing in this repository is involved. Use it if you would rather not
wait on a revalidation.

**Bing Webmaster Tools.**
1. <https://www.bing.com/webmasters> → *Add a site*. Importing from Search Console skips
   verification altogether and is the shortest path once step 1 above is done.
2. Otherwise copy the token from either the *XML file* or the *meta tag* option — it is the same
   token — and set `BING_SITE_VERIFICATION=…`, then recreate the site.
3. Check: `curl -s https://<SITE_DOMAIN>/BingSiteAuth.xml` prints the token inside `<user>`. That
   file is generated per request, so it is correct the moment the container is up — no waiting.
4. Verify, then submit `https://<SITE_DOMAIN>/sitemap-index.xml`.

**IndexNow** (Bing, Yandex, Seznam, Naver — one endpoint).
1. Pick a key: 8–128 characters of letters, digits and dashes. `openssl rand -hex 16` is fine, or
   let Bing Webmaster Tools → *IndexNow* generate one.
2. `INDEXNOW_KEY=…` in `/etc/npi-v5/site.env`, recreate the site.
3. Check the key file: `curl -s https://<SITE_DOMAIN>/<key>.txt` prints the key back. Without this
   file every submission is refused, so check it before the first release that will submit.
4. From then on **every release announces itself**: `deploy.sh` runs
   `node scripts/indexnow.mjs` inside the site container once the new version is serving and
   healthy. It cannot fail a release — it logs one line either way.
5. To see what would be sent, or to submit by hand:
   ```
   cd /opt/npi-v5 && TAG=$(cat .deployed_tag) docker compose --env-file .env -f docker-compose.yml exec -T site node scripts/indexnow.mjs --dry-run
   ```
   Drop `--dry-run` to submit. It submits the site's own pages — the ones whose URL is in the code
   rather than in the data, a few dozen — plus the sitemap index and every sitemap in it, which is
   how "some of the data pages changed" is said without naming millions of URLs. Nothing is ever
   submitted while `SITE_INDEXABLE` is anything but `true`.

### 11a. The MCP pilot host (staging only)

The remote MCP service (`integrations/mcp-remote`) lets ChatGPT and Claude search providers
through an OAuth consent flow on the customer site. It runs on staging only, as the `mcp`
service in `infra/docker-compose.stg.yml`, reachable from the edge as `stg-mcp:8080`, and the
backend keeps `NPI_MCP_ENABLED` unset in production. Nothing listens until the staging backend
env sets it to `true`, which happens only inside a coordinated acceptance window and is set back
afterwards.

1. **DNS**: an A record for `stg-mcp.npimark.com` to this box, DNS-only (not proxied), like the
   other staging hostnames. A browser challenge in front of `/mcp` breaks the connection.
2. **infra/.env**: `STG_SITE_DOMAIN`, `STG_MCP_DOMAIN=stg-mcp.npimark.com`,
   `STG_MCP_BACKEND_ORIGIN=https://stg.list-smarter.com`. The edge block defaults the MCP
   hostname, so an edge restarted before this step still validates.
3. **/etc/npi-v5/stg.env**: the four `NPI_MCP_*` lines from `infra/stg.env.example` - flag,
   site URL, resource URL and the client map. The client map is the whole registry: exact
   public client ids and the clients' published callbacks, `https://chatgpt.com/connector_platform_oauth_redirect`
   for ChatGPT (our metadata advertises `authorization_response_iss_parameter_supported`, which
   is what makes ChatGPT use its stable callback; if its management page shows a
   `/connector/oauth/<id>` callback instead, register that exact string) and
   `https://claude.ai/api/mcp/auth_callback` for Claude. No wildcards, no fallback key.
4. **The edge** (`infra/Caddyfile.public`, lands with the production deploy, reloaded by hand):
   the MCP host serves exactly `/mcp` and the protected-resource metadata; the staging site lets
   the authorization-server metadata (GET) and the token exchange (POST) past its password; the
   staging admin host lets `POST /api/mcp/read` past it for the service's bearer adapter. The
   consent page `/connect/ai` stays behind the staging password on purpose.
5. **The clients**: in ChatGPT, add a custom MCP server at `https://stg-mcp.npimark.com/mcp`
   with OAuth and the client id `npimark-chatgpt-pilot`; in Claude, add a custom connector at
   the same URL and enter the OAuth client id `npimark-claude-pilot` with no secret. Both are
   public clients with PKCE. Claude Code is not registered for the pilot.
6. **Acceptance** per `integrations/mcp-remote/README.md`, then `NPI_MCP_ENABLED=false` again.

### 12. Pre-launch indexing checklist
Everything that has to be true for the site to be indexed at all. Run these against the public
hostname from off the tailnet. If any check fails, the launch is invisible, not merely suboptimal.

Do this list **after** the Cloudflare rules in [`cloudflare.md`](cloudflare.md) are in place, and
check them from off the tailnet through Cloudflare rather than against the origin: two of the
settings on a new Cloudflare zone - AI crawler blocking, and a Cloudflare-managed `robots.txt` -
will fail checks 1 and 2 here while every file on the origin is perfectly correct. Its §8 has a
one-line test for whether you are looking through Cloudflare at all, which is worth running first.

| # | Must be true | How to check | If it is wrong |
|---|---|---|---|
| 1 | `SITE_INDEXABLE=true` in `/opt/npi-v5/.env` | `curl -s https://<SITE_DOMAIN>/robots.txt` shows `Allow: /` and a `Sitemap:` line | Anything else means every crawler is being told `Disallow: /`. The default is off, deliberately; this is the switch, and it is read per request, so setting it and recreating the `site` container is enough |
| 2 | `SITE_BASE_URL=https://<SITE_DOMAIN>` in `/opt/npi-v5/.env` | the same `robots.txt` has the `Sitemap:` line, and `curl -s https://<SITE_DOMAIN>/llms.txt \| head -12` shows full `https://` URLs | Unset, robots.txt has no sitemap line at all, `llms.txt` lists bare paths, and every canonical, `og:url` and JSON-LD `@id` on the site is relative. This one setting is the difference between a site with an address and a site without |
| 3 | Canonicals resolve absolutely | `curl -s https://<SITE_DOMAIN>/ \| grep -o '<link rel="canonical"[^>]*>'` gives the full URL | A relative `href="/"` for the first hour after a release is the prerendered build HTML; it becomes absolute at the first revalidation. Still relative a day later means `SITE_BASE_URL` is not reaching the container (check 2) |
| 4 | The sitemap index is served and lists real files | `curl -s https://<SITE_DOMAIN>/sitemap-index.xml` lists `/sitemap.xml` plus the facility and list sitemaps; then open one facility sitemap and count `<loc>` | An index whose facility sitemaps are empty means the site could not reach the API when it generated them — check 5, then recreate the `site` container to discard the cached empties |
| 5 | The site's own API key is set | `curl -s https://<SITE_DOMAIN>/lists \| grep -c "cannot be reached"` is `0` | Without `NPI_API_KEY` in `/etc/npi-v5/site.env` the data pages render an apology, and an apology is what gets indexed. §6 mints the key |
| 6 | No page that should be indexed carries `noindex` | `python infra/smoke_site.py --site https://<SITE_DOMAIN> --api https://<API_DOMAIN>`, then `curl -s <one page of each family> \| grep 'name="robots"'` | `noindex` is returned on purpose for a URL that resolves to nothing — an NPI that is not in the registry, a specialty-and-metro combination with no rows, a list below its floor. On a page with rows behind it, it is a bug |
| 7 | Terms and Privacy are not drafts | `curl -s https://<SITE_DOMAIN>/terms \| grep -c "under legal review"` is `0` | `LEGAL_PAGES_APPROVED=true` (§10). A crawler that first reads these pages as drafts has indexed them as drafts |
| 8 | One hostname, not two | `curl -sI https://www.<SITE_DOMAIN>` redirects to the canonical host (or does not resolve) | Two hosts serving the same pages split every signal between them. Fix it in Cloudflare with a redirect rule, not here — the site has one `SITE_BASE_URL` and canonicals will point at it whichever host answers |
| 9 | Cloudflare is not serving a stale switch | `curl -sI https://<SITE_DOMAIN>/robots.txt \| grep -i cf-cache-status` says `BYPASS`; then flip `SITE_INDEXABLE`, recreate the `site` container and re-read the file **without purging** | Origin sends these per request; a cache in front can hold the old answer for as long as its TTL. Cache rule C2 in [`cloudflare.md`](cloudflare.md) §6 is what makes this true by configuration instead of by somebody remembering to purge |
| 10 | Verification is in place | §11 checks 4 (Google) and 3 (Bing) | Without it neither console will show a single crawl error, which is the only way to find out the rest of this list was wrong |
| 11 | Verified crawlers are not being challenged | Cloudflare → Security → Events, filter `Bot: Verified bot`: every row is `Allow`/`Skip` | A `Block` or `Managed Challenge` against a verified bot is the most expensive misconfiguration on this page, and nothing on the origin will show it. [`cloudflare.md`](cloudflare.md) §8 has the three ways to prove it, including the two that need Search Console |

Two things that are deliberately true, so nobody "fixes" them:

- **`/search?…` is disallowed.** Faceted search URLs are not crawl surface; the A–Z directory
  (`/directory/providers`, `/directory/organizations`) is how every provider page is reached, and
  it needs no query string. Breadcrumbs on a provider page point at searches because that is what a
  *reader* clicking upwards wants.
- **Provider pages are not in a sitemap.** Nine million URLs is a crawl-budget decision, not an
  oversight. The A–Z reaches every one of them within a few links, and that is the path stated in
  `lib/sitemaps.ts`.

### 12a. The host itself, before launch day

Two things about the machine that are nobody's feature and will bite on the day they are
forgotten.

**A planned reboot, before 12 October and after the last release.** `/var/run/reboot-required.pkgs`
has listed `libc6`, `linux-image` and `linux-base` since 24 September 2026: a kernel and libc
security update has been installed and the running system is still on the old one. Ubuntu keeps
working, so this never announces itself.

Do it deliberately, in a quiet hour the owner picks, and **not** while another application on the
box is mid-update - that is why it was deferred on 24 September. The reason to do it *before*
launch rather than after is that a reboot is the only test of whether everything comes back on its
own, and that question is far better answered with nobody watching than with traffic arriving.

Afterwards, confirm in this order:

```
curl -s http://127.0.0.1:8080/api/ready          # database, migrations, both worker lanes, volume
systemctl list-timers --all | grep npi          # npi-backup.timer and npi-restore-test.timer
docker ps --format '{{.Names}}' | sort        # web, site, worker, worker-bulk, db
crontab -l                                      # the four self-hosted runners start @reboot
```

A container that does not come back is a missing `restart:` policy in
`infra/docker-compose.yml`; a timer that does not come back was installed by hand and is not in
the repo (see the backup section).

**Swap and memory are not a problem, whatever the login banner says.** The MOTD reported 48%
swap on 24 September while `free -g` showed 125 GB total, 14 GB used, 111 GB available and
**zero** swap in use. The banner is generated at login from a cached sample and is not evidence.
Trust `free -g` and the monitoring, not the greeting. The Postgres processes each show about
4 GB of RSS, which is the same shared buffer pool counted once per backend, not 4 GB each.

### 13. Launch smoke test
`infra/smoke_site.py` walks every public page family with a real row behind it: the fixed pages
(including `/terms`, `/privacy` and `/remove-my-information`), then one page of each dynamic kind
found by following the site's own links. It needs only Python 3 and the standard library, so run
it from any machine off the tailnet once DNS resolves, and again after every release that
touches the site or the public edge:
```
python infra/smoke_site.py --site https://<SITE_DOMAIN> --api https://<API_DOMAIN>
python infra/smoke_site.py --site https://<SITE_DOMAIN> --api https://<API_DOMAIN> --key <providers.read key>
python infra/smoke_site.py --site http://localhost:3001      # a local site, pages only
```
`--api` adds the edge checks (`/health` answers, a non-`/v1` path is a 404); `--key` also reads
a few `/v1` endpoints as the site does. It exits 0 only when every check passed. When a page is
added or retired under `site/src/app`, update the `FIXED` list at the top of the script.

### Anti-abuse controls (no setup needed)
`backend/app/abuse/` holds the rest, all on by default and none needing a third party:
- **Work email only** at sign-up and for invites into customer organisations. The lists are in
  `app/abuse/email_domains.py`, with how to extend them.
- **Reveal pace**: the `REVEAL_*` settings (defaults and meaning in `app/config.py`; override in
  `app.env`). An organisation that keeps hitting the limit, or opens 1,000 new contacts in a day,
  is locked for review. List locks with `python -m app.cli reveal-locks` (or
  `GET /api/abuse/reveal-locks`) and clear one after looking with
  `python -m app.cli clear-reveal-lock --org <id> --note "what you found"` (or
  `POST /api/abuse/reveal-locks/{org_id}/clear`). Run the CLI inside the api container:
  `docker compose -p npi-v5 exec api python -m app.cli ...`.
- **Premium residence** (`PREMIUM_RESIDENCE_ENABLED`, default `false`): customer organisations
  on a contract plan with `consumer_access` may reveal one provider's matched home address and
  cell phone at a time. **Set it to `true` only after the owner confirms the consumer file's
  licence permits resale of its values attached to an NPI.** While it is off, every customer
  sees those kinds as restricted whatever their plan says. A plan with `consumer_access` is
  switched on by an internal admin (`PUT /api/plans/subscriptions/{org_id}`) after a contract
  with a stated permissible use; it cannot be bought online (checkout answers 409
  `contract_required`, a Stripe price cannot be set on such a plan, and the Stripe webhook never
  moves an organisation onto one). A reveal that hands over either value costs
  `PREMIUM_REVEAL_UNITS` (default 2) of the monthly reveal allowance. Only confirmed links from
  the current `RESIDENCE_MODEL_VERSION` are ever revealed to a customer. The contract must carry
  the DNC/TCPA clause: phone type and do-not-call compliance are the customer's obligation.
- **Canary rows** in customer provider exports. To trace a leaked file, copy it into the api
  container (`docker compose -p npi-v5 cp leaked.csv api:/tmp/leaked.csv`) and run
  `python -m app.cli canary-trace /tmp/leaked.csv`, or upload it to
  `POST /api/abuse/canaries/trace`. Optional: set `EXPORT_CANARY_EMAIL_DOMAIN` to a domain you
  own and read mail for, so a leaked list that gets mailed announces itself in your inbox.

## Everyday operations
| task | command (on host) |
|---|---|
| status | `curl -s http://127.0.0.1:8080/api/ready` |
| logs | `cd /opt/npi-v5 && docker compose -p npi-v5 logs --tail 100 api worker worker-bulk` |
| roll back to previous release | `sudo -u deploy /opt/npi-v5/rollback.sh` |
| current version | `cat /opt/npi-v5/.deployed_tag` |

### Monitoring and alerting
Before this, nothing on this box noticed anything: if the site stopped answering, the nightly
refresh failed, a worker died, the disk filled, the backup broke or a release rolled back, the
first report came from a customer. `backend/app/monitoring/` runs nine checks on the interactive
worker's own loop (every `MONITOR_SWEEP_SECONDS`, default 60s), deliberately **not** behind
`SCHEDULER_ENABLED` — pausing the data refresh must never also pause the thing that would tell you
the refresh stopped. No cron line is needed and no job row is created (one a minute would bury the
Jobs page).

**Switching it on.** The checks run already; what needs setting is where an alert goes. Nothing is
sent until at least one of these is set, and with neither set nothing is sent, nothing fails, and
the operator view says which setting is missing. Set them in `/etc/npi-v5/app.env` and restart the
api and workers (`docker compose -p npi-v5 up -d api worker worker-bulk`):

| setting | what it does |
|---|---|
| `MONITOR_ALERT_EMAIL` | where alert mail goes. Needs `SMTP_HOST` and `SMTP_FROM` too — mail of any kind is off until those exist. |
| `MONITOR_WEBHOOK_URL` | one JSON `POST {"text": ...}` per alert. Point it at whatever reaches your phone in seconds. **The URL is the whole authentication, so treat it as a secret** — it is never logged and never returned by the API. |
| `MONITOR_HEARTBEAT_TOKEN` | optional. Makes `/api/monitor/heartbeat` demand an `X-Monitor-Token` header. Set it before routing that path publicly; leave it blank otherwise. |

**Prove it fires, before you rely on it.** An operator must not have to wait for a real outage:

```bash
docker exec -i npi-v5-api-1 python -m app.cli monitor-test-alert
```

It sends one harmless message through every configured channel, bypassing the once-per-window
claim so it can be run twice in a row, and prints what each channel did — `sent`, or exactly which
setting is blank. `POST /api/monitor/test-alert` does the same from the internal API.

**The checks, and why each one is worth waking somebody for.** Every check carries its own reason
and its own first step in code (`app/monitoring/checks.py`), and the alert repeats both, so the
message you get at 3 a.m. says what to do about it.

| check | unhealthy when | why it is worth an alert | first step |
|---|---|---|---|
| `readiness` | the database, the schema or the data volume fails, for 3 sweeps running | these are the states where the platform is *up and answering wrongly*, which is worse than being down. The deploy gate only catches them at deploy time. | `curl -s http://127.0.0.1:8080/api/ready` names which of the three |
| `worker` | a job lane has no fresh heartbeat, for 2 sweeps | that lane's jobs then queue silently — customer exports, appends, the refresh | `docker compose -p npi-v5 logs --tail 100 worker worker-bulk` |
| `schedules` | a pipeline is `MONITOR_SCHEDULE_OVERDUE_HOURS` (6h) past its slot, its last outcome was `failed`/`missed`, or a daily maintenance job has not succeeded in ~2 cadences | the only failure with *no symptom*: the platform keeps serving while the data ages, and nobody notices until a customer says the numbers are stale | Admin → Pipelines shows each schedule's last outcome and why |
| `jobs` | one kind failed `MONITOR_JOB_FAILURES` (3) times inside `MONITOR_JOB_FAILURE_WINDOW_HOURS` (6h) with no success since | one failed job is ordinary — a bad source file. The same kind three times is structural and will not fix itself | open that kind on the Jobs page; the newest failure carries the error |
| `disk` | free space under `MONITOR_DISK_FREE_GB` (25) **or** `MONITOR_DISK_FREE_PERCENT` (8%) | one filesystem carries Postgres, the uploads and the local dumps. A full disk does not stop work politely: a load dies mid-`COPY` and the nightly dump truncates | `df -h` on the data mount; the local dumps and finished exports clear first |
| `backup` | the run failed, nothing succeeded in `MONITOR_BACKUP_MAX_AGE_HOURS` (26), the off-site copy failed while the local dump worked, or the dump lost content — **object count** first (`MONITOR_BACKUP_OBJECT_DROP`, 5), size as backstop (20%), optional absolute floor | it already succeeds silently and would fail just as silently. A dump that lost a table while a load added 3 GB is *bigger* than last night's, which is why size alone is not enough | `sudo journalctl -u npi-backup.service -n 50` or `/var/log/npi-backup.log`, then `sudo /usr/local/lib/npi-backup/backup.sh` |
| `restore_test` | the last test failed, the newest passing one is older than `MONITOR_RESTORE_TEST_MAX_AGE_DAYS` (40), or a host that takes backups has never run one | a backup nobody has restored is a rumour — **this check is unhealthy on the box today**, because the timer exists and has never fired | `sudo /usr/local/lib/npi-backup/restore-test.sh`, by hand, at an hour you choose |
| `deploy` | a release was rolled back inside `MONITOR_ROLLBACK_HOURS` (24) | a rollback leaves the platform *up*, so nothing looks wrong — and the release somebody believes is live is not live | `cat /opt/npi-v5/.deployed_tag`, then the failed run's log in Actions |
| `reveal_locks` | an organisation is locked for review and not cleared | not an outage: a paying customer stopped from working until a person looks. Every hour nobody looks is an hour of them being refused | `python -m app.cli reveal-locks`, then clear it with a note |
| `public_site` | `SITE_BASE_URL/robots.txt` does not answer 200, disallows the whole site, or names a sitemap that is not on that host | the one failure every other check is blind to: on 11 Oct 2026 npimark.com was served by the **staging** container for twenty minutes, telling every crawler `Disallow: /` and publishing relative sitemap URLs, while `/api/ready` stayed green because the API was fine. Nothing alerted; it was found by accident. Skipped where `SITE_BASE_URL` is unset, which is staging and any development copy | `curl -s https://<SITE_DOMAIN>/robots.txt` against `curl -s http://127.0.0.1:8090/robots.txt`. Different answers for the same route means the edge is resolving the wrong container: `docker inspect npi-v5-stg-site-1` must show `stg-site` on `npi-shared` and never `site` |

**Deliberately not alerted on**, because an alert nobody acts on trains people to ignore alerts:

- **"the site is not answering"** — a process that cannot answer cannot report that it cannot
  answer. That belongs to the external checker below. `public_site` is not an exception to this:
  it is the worker reporting on a *different* process, through the public edge, which is exactly
  the thing the API can honestly observe. A box with no network at all still says nothing, and
  that is still the heartbeat's job.
- **a spike in refused requests** — a busy launch day, one customer's broken integration retrying,
  and a password-guessing bot all look the same, and none needs anybody woken; the refusals *are*
  the system working. The counts are on the operator view (`refusals_24h`) for whoever is already
  investigating, and the one refusal-shaped condition that does need a human is `reveal_locks`.
- **certificate expiry** — there is no certificate on this box for the app to look at. Caddy gets
  and renews them itself, and its store is a volume on a container the app cannot see. Checking
  the public hostname from inside would be inspecting Caddy's work through Caddy, over the same
  DNS. The external checker below watches it from where it actually matters — outside.

**One alert per condition per window.** The claim is a conditional `UPDATE` on
`monitor_checks.notified_at`, so Postgres decides who sends and a four-hour outage sends one
message per `MONITOR_RESEND_HOURS` (6h), not one per sweep. A check with a grace period does not
alert on its first bad run, so a successful deploy wakes nobody. When a condition clears, one
"resolved" goes out — and only to somebody who was told about the problem in the first place.

**No alert ever carries** a secret, a provider's contact details, or a person's or organisation's
name. A reveal lock is reported as a count and an organisation *id*; the name behind that id is on
the operator view, behind a permission.

#### Seeing the state, and silencing one during planned work
`GET /api/monitor/checks` — every check, its state, when it last passed, what is wrong now, when it
was last alerted on, whether it is silenced, which channels are configured (never their addresses),
and the last day's refusal counts. **Internal admins only**: it needs `settings.manage`, which is
outside `CUSTOMER_CEILING` so no customer role can hold it whatever it is called, *and* it refuses a
customer organisation outright — the same two locks as `/api/abuse`. Reading it never sends
anything. On the command line: `docker exec -i npi-v5-api-1 python -m app.cli monitor-status`.

Before planned work, quieten one check rather than the lot:

```bash
curl -X POST .../api/monitor/checks/disk/silence -d '{"minutes": 120, "note": "moving the dumps"}'
curl -X DELETE .../api/monitor/checks/disk/silence     # let it speak again
```

The check keeps running and the screen keeps telling the truth — silence decides who is woken,
never what is known. It is capped at a fortnight, because an indefinite silence is a check you do
not have. Both are in the audit log (`monitor.silenced`, `monitor.unsilenced`).

#### The external checker — and what this design cannot see
A monitor that dies is worse than none, because its silence reads as health. From inside the box,
**these failures cannot be reported at all**:

- the database being unreachable — the sweep cannot write its own state, let alone alert;
- the interactive worker being dead — nothing sweeps, so nothing complains;
- the box, the host, or its network being gone;
- the API not answering;
- a rollback that did not itself come up (the marker is written by the api container afterwards).

Every one of those makes the sweep's timestamp go stale, which is the whole point of
`GET /api/monitor/heartbeat`: **200** while a sweep has run inside `MONITOR_STALE_MINUTES` (5),
**503** when it is stale or has never run, and nothing in the body but `ok` and a timestamp. It is
deliberately *not* a health summary — if a full disk and a dead monitor both produced 503, you
would lose the one signal that cannot be faked from inside. Point something outside at it, and
treat the absence of a ping as the alarm. Two ways, neither of which publishes anything new:

1. **A cron-ping (recommended).** A free service such as a healthchecks-style cron monitor gives
   you a URL to call; if it is not called, it alerts you. Nothing new is exposed:

   ```
   */5 * * * * curl -fsS --max-time 10 http://127.0.0.1:8080/api/monitor/heartbeat >/dev/null \
     && curl -fsS --max-time 10 https://<your-ping-url> >/dev/null
   ```

   The `-f` matters: on a 503, or with the box down, the first `curl` fails, the second never runs,
   the ping is missed, and the service alerts you.

2. **An uptime checker on the tailnet**, pointed at `/api/monitor/heartbeat` — and set
   `MONITOR_HEARTBEAT_TOKEN` and have it send `X-Monitor-Token` if you ever route that path beyond
   the tailnet. Also give the same checker `https://<API_DOMAIN>/health` once the public edge is
   live: that is the reachability check the box cannot do for itself, and it is what watches the
   certificate.

### Backups, and proving they work
The nightly backup **already runs and already works**. Evidence, not assumption: the 24 Sep run
fired at 03:24:43 UTC and exited 0; there are twelve restic snapshots, one a night from 13 to 24
September inclusive, all tagged `nightly` on host `npi-v5`; the log ends `no errors were found` then
`BACKUP_OK`. What was missing was anybody being *told* when that stops being true.

`backup.sh` (on `npi-backup.timer`, 03:20 UTC + up to 10 minutes of jitter) takes a local `pg_dump`
into `/mnt/npidata/v5/backups`, proves it readable with `pg_restore --list`, then copies it
off-server with restic under `--keep-daily 7 --keep-weekly 5 --keep-monthly 6`. Credentials live in
`/etc/npi-v5/backup.env`, root-only, and appear in no script, no record and no alert.

**What a snapshot holds:** three paths — `/etc/npi-v5/app.env`, that night's dump, and
`/mnt/npidata/v5/data/uploads`. The `app.env` inclusion is what makes the `APP_SECRET_KEY` step of
the runbook below possible. One exception: the first snapshot (13 September) has **no uploads path**,
because that directory did not exist yet, so a restore from the oldest snapshot recovers the database
and the secrets file but no uploaded files.

**Local retention keeps two dumps, not one.** `find -mtime +N` compares whole 24-hour units, so a
dump 1 day 20 hours old has an age of 1 and survives `+1`. That is `find`'s arithmetic and not a bug
— it is why `KEEP_LOCAL_DAYS=3` was keeping four files (36.6 GB) — and `backup.sh` says so in a
comment so nobody "fixes" it. It is now `1`: a local dump exists to survive a bad migration or a
dropped table, both noticed within hours and covered by last night's copy, while disk loss is what
the off-site repository is for. The script also logs `du -sh` of the directory after pruning, so the
growth trend is in the log an operator reads, and refuses to dump at all below 20 GB free — filling
this volume does not merely fail the backup, it stops Postgres writing.

**Every run records what it did**, through `python -m app.cli backup-record`, so the `backup` and
`restore_test` checks can see it and `docker exec -i npi-v5-api-1 python -m app.cli backup-status`
answers "when did a backup last work, and when was one last actually restored?". Recording is
best-effort and never changes the script's exit status: a release that does not know the command
must not turn a good backup into a failed script. What is lost then is visibility, and the age check
reports it. Last-attempt and last-success are read separately, so a failed night never overwrites
the size and object count tomorrow's comparison needs.

#### How a broken dump is actually detected
Three tests, in order of how much they can tell you. The reasoning is in
`backend/app/monitoring/checks.py`; the short version is that **size alone is the weakest of them**:

1. **Object count** (`MONITOR_BACKUP_OBJECT_DROP`, default 5). `pg_restore --list` already counts
   the tables, indexes and constraints in the dump; the number is now kept. This is the only test
   growth cannot mask — if `providers` stopped being dumped while a consumer load added 3 GB, the
   dump gets *bigger* and a shrink test says nothing at all. A retired index moves this by one or
   two, which is an ordinary release; a dropped table moves it by dozens.
2. **Size**, as the blunt backstop (`MONITOR_BACKUP_SHRINK_PERCENT`, default 20%). Deliberately
   second: these dumps grew 6.9 → 8.7 → 10 → 11 GB over four nights (+26%, +15%, +10%), so a dump
   that comes back merely *equal* to yesterday's is already suspicious and this test cannot see it.
   It earns its place for the case the object count misses — every object present, each one short.
3. **An absolute floor** (`MONITOR_BACKUP_MIN_DUMP_BYTES`), shipped **off**. A fixed byte count on a
   database still growing this fast would need editing weekly, and a threshold that needs weekly
   editing is one that gets switched off. Set it once the dumps plateau, to a number no honest dump
   could be under.

#### The restore test, and the 1 October risk
`restore-test.sh` restores the newest dump into a scratch database and proves four things rather
than counting three tables: `pg_restore --exit-on-error` completed; the restored schema is at the
migration revision this release expects (`app.cli migration-head`); tables that can never honestly
be empty are not; and the counts are within 80% of live. It records the revision, the counts and
**how long it took**.

It has **never run**. `/var/log/npi-restore-test.log` does not exist, so no backup on this server
has ever been proved restorable and nobody knows what a restore costs. That is what the
`restore_test` check being unhealthy today is telling you, and it is the most useful thing the
monitoring says right now.

Before it does anything, it now **refuses unless there is room**. It restores a second full copy of
the live database onto the same volume the live one is on: the database is ~161 GB, its data
directory ~165 GB, and the volume has ~432 GB free. It fits — but a monthly unattended job that
finds out otherwise would take the platform down to prove the backups work. So it reads
`pg_database_size` from the `postgres` maintenance database (never connecting to the live one),
insists on 120% of that being free, and records a failure if it is not, so a refusal alerts rather
than sitting in a log.

Three other decisions, all for the same reason — this runs on the instance serving the site:

- **`pg_restore --jobs 3`** (override with `RESTORE_JOBS`). Single-threaded would spend hours of I/O
  alongside live traffic; more workers raise the peak but shorten the window of contention a lot,
  and a shorter window is what matters when the alternative is half a working day. Three rather
  than the core count because this box also runs CI.
- **The dump is `docker cp`'d into the container, not piped.** `pg_restore` seeks in a custom-format
  dump and a parallel restore cannot read a pipe at all — `backup.sh` learned the same thing for
  `--list`. Piping works single-threaded and then breaks the moment `--jobs` appears, which is the
  kind of trap that only fires the night it is needed.
- **The scratch database is dropped on success and on failure**, and the copied dump is removed from
  the container either way, so a failed run never leaves a second 161 GB copy behind.

It cannot touch the live database: `--scratch-db` accepts only names matching `restore_test*`, it
refuses if that name equals the live one, every write names that variable, and the live database is
read only by `SELECT count(*)`. `backend/tests/test_restore_invariants.py` asserts each of those
claims about the file and takes a real dump-and-restore, so a release that renames a table the
script counts fails here rather than reporting zero and *passing* on the server a month later.

**Run it once by hand, at an hour you choose, before the timer ever does it unattended:**

```bash
sudo /usr/local/lib/npi-backup/restore-test.sh
```

The timer is the 1st at 05:00 UTC + 30m jitter, kept as installed: after that night's backup, at
midnight–01:00 US Eastern, and 28 hours clear of the monthly government refresh. The one clash no
date avoids is `healthcare_refresh`, weekly on Tuesdays at 06:00 UTC — roughly one month in seven
the 1st is a Tuesday. That argues for measuring the duration first, not for a different date.

#### Restoring for real (the 3am runbook)
The database is gone, corrupt, or a migration has destroyed something. In this order. **Nothing here
drops the damaged database** — it is renamed and kept, because the only unrecoverable mistake
available tonight is deleting the evidence before the restore is proved.

```bash
# 0. Stop everything that writes. The db container stays up: you need it to restore into.
cd /opt/npi-v5 && docker compose -p npi-v5 stop api worker worker-bulk site

# 1. Find the backup you want. Newest local dump first - it needs no network and no password:
ls -lh /mnt/npidata/v5/backups/
#    Off-site, if the disk is the problem or you need something older:
sudo -i
set -a; source /etc/npi-v5/backup.env; set +a
restic snapshots --tag nightly --compact
restic restore <snapshot-id> --target /mnt/npidata/v5/restore --include '*.dump'
ls -lh /mnt/npidata/v5/restore/mnt/npidata/v5/backups/

# 2. Keep the damaged database. This needs no connections, which step 0 took care of.
DUMP=/mnt/npidata/v5/backups/npi-<stamp>.dump          # or the restored path from step 1
STAMP=$(date -u +%Y%m%d%H%M)
docker exec npi-v5-db-1 psql -U npi -d postgres -c \
  "ALTER DATABASE npi RENAME TO npi_broken_$STAMP"
docker exec npi-v5-db-1 psql -U npi -d postgres -c "CREATE DATABASE npi OWNER npi"

# 3. Restore. Copied into the container first because pg_restore seeks and cannot take a pipe.
docker cp "$DUMP" npi-v5-db-1:/tmp/restore.dump
docker exec npi-v5-db-1 pg_restore -U npi -d npi --no-owner --exit-on-error /tmp/restore.dump
docker exec npi-v5-db-1 rm -f /tmp/restore.dump

# 4. Bring the schema up to the running release. The dump may be a release or two behind.
#    TAG is not optional: compose interpolates every service's image before it does anything.
TAG=$(cat /opt/npi-v5/.deployed_tag)
cd /opt/npi-v5 && TAG=$TAG docker compose --env-file .env run --rm migrate

# 5. Start up and check.
TAG=$TAG docker compose --env-file .env up -d api worker worker-bulk site
curl -s http://127.0.0.1:8080/api/ready | jq

# 6. Prove it before telling anybody it is fixed. Compare against the counts the last restore test
#    saw, which are on the operator view:
#      GET /api/monitor/checks -> .checks[] | select(.key=="restore_test") | .context.counts
docker exec npi-v5-db-1 psql -U npi -d npi -c \
  "select 'users' t, count(*) from users union all select 'orgs', count(*) from orgs
   union all select 'providers', count(*) from providers
   union all select 'provider_emails', count(*) from provider_emails
   union all select 'audit_events', count(*) from audit_events"
#    Then sign in, run a search, and open one provider.

# 7. Only after a day of the restored database being fine:
docker exec npi-v5-db-1 psql -U npi -d postgres -c "DROP DATABASE npi_broken_$STAMP"
```

**If `/etc/npi-v5` itself was lost**, the app's secrets file is in the same snapshots. Restore it to
a temporary directory and copy it into place by hand — **never restore straight onto `/`**:

```bash
restic restore <snapshot-id> --target /tmp/etc-restore --include /etc/npi-v5/app.env
diff /tmp/etc-restore/etc/npi-v5/app.env /etc/npi-v5/app.env    # look before you overwrite
```

`APP_SECRET_KEY` from that file is what every session cookie, TOTP secret and removal-request hash
is keyed with: restore the **old** value rather than generating a new one, or everybody is signed
out and the two-step secrets cannot be read. (The 13 September snapshot is the one exception to
"three paths": it carries no uploads directory.)

**Restoring into production is not what the monthly test does.** `restore-test.sh` only ever
restores into a `restore_test*` database and refuses any other name. Use the runbook above for a
real restore; never point the test at the live database.

#### Putting the schedule in the repository
The `npi-backup` and `npi-restore-test` units on the server were written by hand on **13 Sep** and
nothing in git reproduced them, so rebuilding the box would have restored every line of code and
silently lost the backups. They are now in `infra/backup/systemd/`, verbatim as installed — same
times, same `After=`, same `/var/log/npi-*.log` paths, and the same deliberate absence of
`TimeoutStartSec` and `Nice` (a `oneshot` unit has no timeout by default, so adding one would
*introduce* a kill able to cut a 161 GB dump in half).

**One deliberate difference: `ExecStart`.** The installed units run `/opt/npi-v5/backup.sh`, and
`/opt/npi-v5` is the deploy checkout — writable by the `deploy` account. A root unit was executing a
script a non-root account could replace, and the deploy key is a GitHub Actions secret used on a
self-hosted runner that is this same machine, so anything holding it could have had root at 03:20.
The scripts install to `/usr/local/lib/npi-backup/`, root-owned, and the units point there.

The unit **names** are unchanged, which is what makes that safe: each file is replaced in place, so
there is exactly one `npi-backup.service` and one timer at every moment. New names would have left
the old units enabled beside the new ones, running two backups a night over one script.

```bash
sudo bash infra/backup/install-schedule.sh
```

It diffs every unit and both scripts against what is installed, shows the difference, and changes
nothing without a yes. `setup-remote.sh` calls it at the end, so a rebuilt box gets the destination
and the schedule in one pass.

Note on limits: the `deploy` account has no sudo, cannot read `/mnt/npidata/v5/backups` and cannot
read another user's journal — so every backup fact an operator can get without root comes from
`backup-status`, `GET /api/monitor/checks`, or an alert. The `sudo` commands above need root.

**A note on `docker compose` on this box:** compose interpolates every service's image before it does
anything, so any `docker compose … exec/run` from `/opt/npi-v5` fails outright without `TAG` from
`.deployed_tag`. Commands in this document that reach into the api container use plain
`docker exec -i npi-v5-api-1 …`, which needs no interpolation and cannot fail that way.

### Standing alerts
Nothing to configure and no cron line needed. The interactive `worker` queues an `alerts.digest`
job every five minutes when any alert is due (the same tick that schedules the NPPES refresh),
under the oldest internal organization, so it shows on the internal Jobs page. Hits are stored in
the app either way. A digest email goes to the alert's creator only when `SMTP_HOST` and
`SMTP_FROM` are set, and its links need `SITE_BASE_URL`; with SMTP blank nothing is sent and
nothing fails. For a host with no worker, the same run is
`docker compose -p npi-v5 exec -T api python -m app.cli alerts-digest`, safe to run beside a
worker (each alert is taken `FOR UPDATE SKIP LOCKED`) — e.g. as a cron line
`*/15 * * * * cd /opt/npi-v5 && docker compose -p npi-v5 exec -T api python -m app.cli alerts-digest`.
The alert cap is `plans.max_alerts` (null = unlimited; the free plan is seeded at 3). It is enforced
on every run as well as when an alert is created, because a plan can shrink under alerts that
already exist: the oldest alerts up to the cap run, the rest are skipped without advancing their
window, and nothing is deleted — raise the cap and they pick up where they stopped.

The digest is not transactional, so it carries an unsubscribe link and the `List-Unsubscribe`
headers, and it is not sent to anybody who has switched digests off (see **Customer email**).

### Customer email
Everything customer-facing goes through the one SMTP relay (`SMTP_*`), and with `SMTP_HOST` blank
nothing is sent, nothing is queued and nothing fails — a sign-up, a reveal or an approval never
depends on mail. Links need `SITE_BASE_URL`, which is the customer site, never `PUBLIC_BASE_URL`:
that one is the admin app on the tailnet.

Transactional, with no off switch: verification, password reset, invitation, the outcome of a
privacy request, and a subscription that activates, cancels, lapses or fails a payment. The welcome
goes once, after the address is proved.

Optional, and customers can stop it: the allowance warnings and the saved-search digest. The footer
links to `/email-preferences` on the site and the `List-Unsubscribe` header points at its one-click
POST. Both are stored in `email_preferences`, where no row means every default is on.

**Allowance warnings.** No configuration and no cron line: the interactive `worker` queues a
`mail.allowance_warnings` job at most once an hour (the same five-minute tick as the alert digest),
under the oldest internal organization, and only while `SMTP_HOST` is set — so a host that cannot
send mail shows no job for it. It warns at 80% and at 100% of each metered allowance, to the
organization's owner and admins with a proved address, once per metric per period: each warning
claims a row in `email_notices` (`(org_id, kind, scope)` unique) before it is sent, which is what
makes the job safe to re-run and safe to run twice at once. The claim is kept even when the relay
refuses, because retrying a send nobody can prove failed is how people get the same warning six
times. A metric with no limit, a metric whose limit is zero, and an organization whose subscription
has lapsed are never warned about.

`email_notices` grows by a few rows per customer per month and nothing prunes it yet; it is indexed
on `sent_at` for when that becomes worth doing.

### Two-step sign-in, and a customer who has lost their phone
Nothing to configure. Customers turn it on from **Security** on the site (`/app/security`): scan a
QR code (drawn on our server - the secret never goes to a third party), confirm with a code, and
save ten one-time recovery codes, which are shown once and stored only as hashes. Turning it on
signs out their other devices. Turning it off or making new recovery codes asks for the password.
Signing in is then two steps: the password earns a five-minute token (held by the site in an
httpOnly cookie scoped to `/api/auth/mfa`, never the password), and the code screen trades it,
with an authenticator or recovery code, for the session. Wrong codes: five per sign-in, eight per
email and connection (shared with wrong passwords), ten per account from anywhere in 15 minutes.
A TOTP code works once. Single sign-on still refuses two-step accounts, because it would skip the
code; a password reset does **not** switch two-step off, and ends any sign-in waiting on a code.

When somebody has lost their authenticator, in order:
1. **A recovery code** in the same box on the code screen. Afterwards they should turn two-step
   off and on again from Security to move it to the new phone (which also issues new codes).
2. **An admin in their own organisation** presses *Reset two-step* next to them on the site's
   **Team** page (API: `POST /api/users/{id}/mfa/reset`, needs `users.manage`, own organisation
   only, never one's own account). Internal staff are reset the same way by an internal admin
   through that endpoint (the admin application has no button for it yet). This only switches
   two-step off - they still need their password - and is audited as `user.mfa_reset`.
3. **Nobody left who can do 2** (typically a customer who is their team's only admin): an operator
   runs, after confirming who is asking through something already on file (not just an email
   that says so - that check is all that stands in for the second factor):
   `docker compose -p npi-v5 exec -T api python -m app.cli reset-mfa --email someone@example.com`
   It is audited as `user.mfa_reset` with no acting user and `detail.via = "cli"`.

The admin application (internal) still signs in with password and code in one request; it
accepts a recovery code there too, typed without dashes.

### Removal requests ("Remove my information")
Anybody may ask, from `/remove-my-information`, for their work email, phone, home address and
cell phone, or their whole record to be removed. **Nothing is suppressed until a member of staff
approves the request** - the form is anonymous, and acting on it directly would let anyone take a
competitor's listing or a colleague's number out of every customer's search.
`backend/app/removal_requests.py` explains the whole flow.

How a request arrives:
- **Mail configured** (the normal case): the requester is emailed a one-time link (valid seven
  days) at the contact address they gave - the only address this flow ever writes to. The request
  shows as `awaiting_confirmation` and **cannot be approved** until they follow it; then it is
  `pending` with verification `email_confirmed`. One address is sent at most three confirmation
  emails a day; one connection may file five requests an hour; Turnstile applies when configured.
- **No mail** (or the send failed): the request goes straight to `pending` marked `unverified`.
  Before approving, check who is asking another way - for a provider, call the practice phone on
  their public record and ask for them; for an organisation leader, the organisation's main
  number; never rely on the requester's own say-so or a number they supplied. The approval must
  say what you did (`verified_by`), and it is kept on the request and in the audit log.

Working the queue (the admin app has no screen for this yet; use the API or the CLI inside the
api container, `docker compose -p npi-v5 exec -T api python -m app.cli ...`):

| step | API (internal staff with `suppression.manage`) | CLI |
|---|---|---|
| list | `GET /api/removal-requests?status=pending` (or `awaiting_confirmation`, `approved`, `rejected`, `expired`, `all`) | `removal-requests [--status pending]` |
| read one | `GET /api/removal-requests/{id}` - includes `planned`, what approving would suppress, and `follow_ups` | (shown in the list) |
| approve | `POST /api/removal-requests/{id}/approve` `{"note", "verified_by", "npi", "email", "phone", "notify"}` | `removal-request-approve --id 42 [--verified-by "..."] [--npi ...] [--note ...] [--no-notify]` |
| reject | `POST /api/removal-requests/{id}/reject` `{"reason", "notify"}` | `removal-request-reject --id 42 --reason "..." [--no-notify]` |

What approval writes (ordinary global suppressions with `source = removal_request` and the
request's reference in the note - visible on the Suppression page, liftable like any other,
never deleted; no provider or contact row is touched):
- whole record with an NPI: one `npi` suppression with no field (gone from search, detail pages,
  reveals, exports, Append and the API);
- part of the record with an NPI: `npi` field suppressions - `email`; `phone` (practice phone);
  `home_address` **and** `cell_phone` for "home address and cell";
- any email or phone the request names: a value suppression of that address or number wherever
  it appears (this is also how an organisation leader's number is removed - leaders have no
  subject suppression of their own). "Remove my email" with the box blank means the contact
  address, which is the one the confirmation link proved;
- if the request has no NPI, find it and pass `npi` (or `--npi`); for a leader, pass the
  `email`/`phone` you found. A name or title on its own cannot be suppressed; `follow_ups` says
  when something needs doing by hand. Approving something that would suppress nothing is
  refused - reject it with a reason instead.

Rejections keep the reason (write it so it could be read to the requester). With `notify` (the
default) the requester is emailed the outcome - but only when their address was confirmed by the
link, never for an unverified request. Every step is audited: `removal_request.created`,
`.confirmed`, `.approved` (with the suppression ids), `.rejected` and `.expired`. The public page
states a target of 30 days (`TARGET_DAYS` in `site/src/content/legal/removal.ts`, subject to
counsel).

**Retention.** The worker queues `maintenance.expire_removal_requests` once a day (no setup). A
request still `awaiting_confirmation` 30 days after it was made (its link died at seven) is marked
`expired`: the NPI, full name, organisation, email and phone to remove and the note are nulled,
and the contact address is replaced by a keyed hash (`hmac-sha256:...`, keyed with
`APP_SECRET_KEY`), so repeat requests from one address still show as the same value without the
address being readable. The row, its subject type, scope, verification and dates stay, and each
expiry writes a `removal_request.expired` audit row naming the fields cleared, never their values.
An expired request cannot be approved or rejected; the requester can simply ask again. To run it
by hand: `removal-requests-expire [--dry-run]`; list them with `removal-requests --status expired`.
The mail cap looks back only 24 hours, so hashing the address loses nothing it needs.

- `[LAWYER: Unconfirmed requests are cleared 30 days after they are made (UNCONFIRMED_RETENTION
  in backend/app/removal_requests.py). Confirm the period. The Privacy Policy draft's retention
  section (site/src/content/legal/privacy.ts) gives one period for every request and does not yet
  mention this shorter one.]`
- `[LAWYER: The NPI on an unconfirmed request is cleared with the rest, because it links the
  request to a person even though the NPI itself is public. Confirm, or say it may be kept.]`
- `[LAWYER: Approved requests keep everything, with no end date: the fields are the record of
  what was suppressed, for whom and on whose word, and the suppressions themselves are never
  deleted. The Privacy Policy draft proposes keeping the request 3 years; nothing enforces that
  yet. Confirm the period, and whether after it the contact address and note are cleared so only
  the reference, scope, suppression ids and dates remain.]`
- `[LAWYER: Rejected requests (including ones rejected before being confirmed) keep everything
  with no end date, as the record of what was refused and why. Confirm the period (the draft's
  3 years applies here too) - once set, it can be added to the same daily job.]`
- `[LAWYER: Pending requests that were confirmed, or arrived unverified, are never expired
  automatically - they wait for staff. Confirm that is acceptable, or set a limit.]`
- `[LAWYER: The audit rows for every step keep the reference, subject type and scope, and the
  rejection reason, but never the contact address. Confirm the audit log's own retention covers
  them.]`

### Field corrections ("this is wrong")
One field of one record reported as wrong, by a signed-in customer from the record they are reading
or by the public from `/report-a-problem` (linked from every provider and facility profile). Both
land in the same queue, and **nothing on a record changes until a member of staff accepts a
report**: a report from the public proves at most that somebody read a web page, and a report from a
customer is a customer's word about somebody else's record.
`backend/app/field_corrections.py` explains the flow and what each acceptance does.

How a report arrives:
- **Signed in**: the organisation and the user are on the row, so there is no challenge - just a
  per-connection cap (60 an hour, on its own counter). That organisation then sees the field as
  "reported, under review" on the record, so nobody reports it twice.
- **Public**: a per-connection cap (10 an hour), Turnstile when configured, every field capped. A
  reply address is **optional**. Given one, with mail configured, a one-time link goes there and
  nowhere else and the report shows `awaiting`; following it makes it `email_confirmed`. Unlike a
  removal request the report is reviewable straight away - nothing a correction does depends on the
  address; what the link buys is being told the outcome. One address gets at most three confirmation
  emails a day, and past that the form answers identically and writes nothing.

Working the queue (the admin app has no screen for this yet; use the API or the CLI inside the api
container, `docker compose -p npi-v5 exec -T api python -m app.cli ...`):

| step | API (internal staff with `suppression.manage`) | CLI |
|---|---|---|
| list | `GET /api/field-corrections?status=new` (or `accepted`, `rejected`, `duplicate`, `all`; plus `recheck=true`, `subject_kind`, `subject_id`) | `field-corrections [--status new] [--recheck]` |
| read one | `GET /api/field-corrections/{id}` - includes `value_at_report`, `verification`, and for an open report `planned` / `would_do` / `follow_ups` | (shown in the list) |
| see what accepting would do | the `planned` and `would_do` fields above, on the list and on one report | `field-correction-accept --id 42 --dry-run` |
| accept | `POST /api/field-corrections/{id}/accept` `{"note", "notify"}` | `field-correction-accept --id 42 [--note "..."] [--no-notify]` |
| reject | `POST /api/field-corrections/{id}/reject` `{"reason", "duplicate_of", "notify"}` | `field-correction-reject --id 42 --reason "..." [--duplicate-of 41] [--no-notify]` |
| re-checked | (no screen - it is a data job) | `field-corrections-rechecked --id 42 43 [--note "..."]` |

**Nobody has to accept a report to find out what accepting does.** `app.field_corrections.plan`
works out every suppression, quarantine and derived-employer clear without writing anything; the
queue returns it on every open report (`planned`, `would_do`, `follow_ups`), the CLI prints it under
each row, and `--dry-run` prints it and stops. `accept` then executes that same plan.

**Accepting never rewrites a filed value.** NPPES publishes the practice address, phone and
taxonomy; CMS publishes the facility and the clinician's specialty. A correction is an overlay with
provenance, not an edit, so every effect is outside those columns:

| reason | what accepting does |
|---|---|
| `wrong_number` | Suppresses the value we snapshotted (`phone`, `email` or `address`) - or, where we hold no value because it was already withheld, a field suppression on the subject (`npi` + `phone`/`email`/`practice_address`). An email is also quarantined on `provider_emails`, which is what takes it out of employer derivation too. |
| `not_at_practice` | Clears the employer we *derived* on `provider_enrichment`, writing what it was to `provider_employer_history` (`reason = field_correction`), and quarantines **that one provider's own** work addresses at the domain they have left. A colleague who shares the domain is untouched: the quarantine is keyed on the reported NPI and the domain only narrows within it, because one person saying "Dr X has left" must not hide the working addresses of every clinician at the practice. Nothing filed is touched. |
| `retired_deceased` | Field suppressions on the subject's `phone` and `email`, plus a quarantine of **that subject's own** addresses. **Not** the whole record - that is a removal request, and the follow-up says so. |
| `wrong_specialty` | **Recorded only**, plus the re-check flag: the specialty on file is what the registry publishes, and we have nothing of our own to put in its place. |
| `duplicate` | **Recorded only**, plus the re-check flag. Merging two records is by hand; the follow-up says so. |
| `other` | **Recorded only**, plus the re-check flag. Read the note. |

Suppressions carry `source = field_correction` and the report's reference in the note - visible on
the Suppression page, liftable like any other, never deleted. `follow_ups` in the answer is the part
to read: a reason this queue cannot act on is accepted and recorded rather than refused, so a report
is never left open forever.

**Re-check — this list must be worked by hand.** Accepting raises `recheck_pending` on the report.
It lives on `field_corrections` rather than on the provider precisely so a refresh - which rewrites
every filed column - cannot clear it.

**Nothing clears it automatically, and no job reads it.** If nobody ever runs the commands below,
nothing breaks and nothing is lost - the suppressions an acceptance wrote stay in force - but the
flag stops meaning anything: every record anybody ever reported sits in the list for ever, none of
them is looked at again after the source is refreshed, and the part of the promise that says "we
will look at this again the next time we refresh it" is quietly not being kept. A list that only
grows, with no `field_correction.rechecked` audit rows behind it, is what that looks like.

So this belongs on somebody's calendar after each monthly NPPES refresh:

```
python -m app.cli field-corrections --recheck    # what is waiting, and what was reported about it
python -m app.cli field-corrections-rechecked --id 42 43 --note "still wrong after the refresh"
```

The same list is `GET /api/field-corrections?status=all&recheck=true`. Wiring it into the refresh is
the obvious next step and would remove the calendar entry;
`app.field_corrections.awaiting_recheck` and `mark_rechecked` are the two functions it needs.

With `notify` (the default) the reporter is emailed the outcome - **only** when we know the address
is theirs (`signed_in` or `email_confirmed`), never an address a stranger typed and never confirmed.
The message carries the decision, the field in plain words and the reviewer's note, and nothing
else: no value, no NPI, no name, no address. Every step is audited:
`field_correction.reported`, `.confirmed`, `.accepted` (with every effect), `.rejected` and
`.rechecked`.

## Giving somebody else access

**Nobody needs the server to ship code.** A deploy is `push to main` and nothing else: CI builds
the images, pushes them to the registry, and the workflow SSHes to the host with its own key.
A developer who never has an SSH key, never sees `/etc/npi-v5/*.env` and never logs in to
DigitalOcean can still release. That is the point of the pipeline and it is the answer to "what do
I give them".

### What to give

| They need to | Give them |
| --- | --- |
| Read and write code, open pull requests | A GitHub account, added under **Settings → Collaborators** on `sunilraj-pixel/npi-intelligence` |
| Run the tests | Nothing further - `npm test` and `pytest` run against throwaway databases |
| Release | Nothing further - see above |
| Change a secret, a domain or a mailbox | The owner does it on the box. These are in `/etc/npi-v5/app.env` and `/opt/npi-v5/.env`, never in the repository |
| Reach production data | A **customer** or **internal** account on the app, with the role the job needs - not a shell |

### Read this before adding the first collaborator

**On this plan, push access is production access, in two ways.**

1. **There is no branch protection.** It is a private repository on the free plan, where GitHub
   does not offer it - `GET /branches/main/protection` answers *"Upgrade to GitHub Pro or make
   this repository public"*. So anybody with push can push straight to `main`, and `main` deploys
   itself. The gate discipline in this document is a convention the people here keep, not a rule
   the server enforces.
2. **The deploy credentials are repository secrets.** `DEPLOY_SSH_KEY`, `DEPLOY_HOST`,
   `DEPLOY_KNOWN_HOSTS` and `DIGITALOCEAN_ACCESS_TOKEN` are GitHub Actions secrets, and a workflow
   file is just a file in the repository. Somebody who can push a change to `.github/workflows/`
   can write one that prints the key. **Push access is therefore equivalent to the deploy key and
   a shell on the host**, whatever anybody intends.

Three ways to give somebody code access without giving them that, in the order they cost:

* **Fork and pull request.** Give **Read**, not Write. They fork, push to their own copy, and open
  a PR. Secrets are not exposed to workflows running on a fork's PR, and nothing reaches `main`
  without the owner merging. Free, and it is what the first outside contributor should get.
* **GitHub Team** (paid, per user). Turns on branch protection and required reviews on a private
  repository, so Write access stops meaning "can deploy unreviewed". This is the right answer once
  more than one person writes code regularly.
* **A deploy environment with required reviewers.** Moves the secrets out of the repository scope
  into an environment the workflow must be approved into. Also needs a paid plan for a private
  repository.

Until one of those is in place, **Write access should go only to somebody who is already trusted
with the production box**, because in practice that is what it is.

### What is not in the repository, and so cannot be handed over by adding a collaborator

Every real credential: the database, `APP_SECRET_KEY`, the Stripe keys, the SMTP password, the
Turnstile secret, the SAM.gov key, the site's own API key. They live in `/etc/npi-v5/app.env`,
`/etc/npi-v5/site.env` and `/opt/npi-v5/.env` on the host, which is why a developer can have
the whole codebase and still not be able to read a customer's data.

### The social accounts

Twitter, LinkedIn and the rest are not in here at all - the site links to none of them today, and
nothing in the code touches an account. Handing those over is a password-manager question rather
than a repository one. If the site should carry links to them, that is a small code change and the
addresses belong in `src/content/company.ts` with the other facts only the owner can settle, so
that changing one later is an edit to one line rather than a hunt through the markup.

---
## Rules for changes
- **Migrations must be backward compatible** (add first, remove in a later release) — rollback runs the previous
  image against the migrated database.
- The deploy only succeeds when `/api/ready` reports database, migrations, worker and data volume all healthy.
- Two workers run: `worker` (interactive lane) and `worker-bulk` (long resumable loads, `app/job_lanes.py`). The
  deploy waits only for the interactive worker's running jobs; bulk jobs are handed back and resume on the new release.
  `/api/ready` fails while either lane has no live worker.
- Secrets live in `/etc/npi-v5/app.env` and GitHub secrets — never in the repo.

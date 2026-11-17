# NPI Mark website - handoff for DevOps

Source of the public site (npimark.com), exported from `main` of `npi-intelligence` (commit 11315dc0).
Committed files only: no `node_modules`, no `.env`, no secrets.

## Build and run

    cp .env.example .env.local    # fill NPI_API_KEY (providers.read scope only), set the URLs
    npm ci
    npm run typecheck && npm run lint
    npm run build && npm start    # or: docker build -t npi-mark-site .

## Environment (see .env.example and _deploy/infra/site.env.example)

- NPI_API_BASE_URL, NPI_PUBLIC_API_BASE_URL, NPI_ACCOUNT_API_BASE_URL - the platform API.
  The account origin must be a private backend origin, never npimark.com or api.npimark.com.
- NPI_API_KEY - server-side only. Never prefix it NEXT_PUBLIC_.
- SITE_BASE_URL - public origin for canonical URLs.
- SITE_INDEXABLE=true only on production.
- GOOGLE_SITE_VERIFICATION, BING_SITE_VERIFICATION, INDEXNOW_KEY - optional.

## Deployment reference (in _deploy/)

- docs/deployment.md - how production and staging are deployed today.
- infra/docker-compose.yml - the site service as it runs beside the API.
- infra/Caddyfile.public - the public reverse proxy for npimark.com.
- infra/smoke_site.py - the post-deploy smoke check.

The site reads the platform only through the API with a scoped key and shares no code with the
admin app. Keep that boundary if you rework it.

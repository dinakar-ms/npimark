# The public site

The customer-facing website. It is **not** the admin app and shares no code with it: it holds an
API key, calls `/api/v1`, and can reach exactly what that key's scopes allow. That separation is
the point — a customer can never be handed a URL that reaches Data sources, Email quality or
Users, because this application has no route to them at all.

Next.js (App Router), server-rendered. Pages are HTML before any JavaScript runs, which is what
makes them indexable by search engines and quotable by assistants.

## Running it locally

```bash
cp .env.example .env.local   # then paste a real key into NPI_API_KEY
npm install
npm run dev
```

The key needs `providers.read` and nothing else. Issue one in the admin app under API keys; the
secret is shown once.

| Script | What it does |
|---|---|
| `npm run dev` | Development server on http://localhost:3000 |
| `npm run typecheck` | `tsc --noEmit` — the same check CI runs |
| `npm run lint` | ESLint |
| `npm run build` | Production build; must pass with no API reachable |

## Environment

| Variable | Notes |
|---|---|
| `NPI_API_BASE_URL` | Where the API is. Inside the compose project this is `http://api:8000`. |
| `NPI_API_KEY` | Server-side only. Never give it a `NEXT_PUBLIC_` prefix — that compiles it into the browser bundle. |
| `SITE_BASE_URL` | Public origin, for canonical URLs and link previews. |
| `SITE_INDEXABLE` | `true` only on the host meant to be found. Anything else serves `Disallow: /`. |

## Three rules this site keeps

**The key stays on the server.** Every call to the platform happens in a server component.
The browser receives HTML, never a credential. `src/lib/api.ts` imports `server-only`, so
importing it from a client component fails the build rather than leaking at runtime.

**Public pages carry the public record only.** The API row carries more than a visitor may see
(emails, and for consumer plans home contact), so every public page reduces it through
`toPublic()` in `src/lib/api.ts`, which keeps identity, specialty, practice location and
employer and turns contact details into a yes/no lock. The site's own key never holds
`consumer.read`; that refusal is enforced by the API rather than by this code remembering to
ask. Home address and cell phone reach a customer only through their own org key, on a plan
with consumer access, behind a per-row reveal that is counted and logged (Phase 4 of the
blueprint).

**Visitors are capped.** `/search` serves 25 rows a page and 10 pages a query to anyone not
signed in, and search result URLs are `noindex`. Provider pages and search results are cached
for an hour to a day so a crawl lands on the cache, not the platform.

## Pages

| Route | What it is |
|---|---|
| `/` | Positioning, live provider count, search box, FAQ with `FAQPage` JSON-LD |
| `/search` | Public search, visitor-capped, contact columns locked |
| `/npi/[npi]` | One provider, public record, `Physician`/`MedicalOrganization` + `BreadcrumbList` JSON-LD |
| `/data` | Sources, refresh cadence, field catalogue with visibility, `Dataset` JSON-LD |
| `/pricing` | Plan structure; prices are announced at launch |
| `/docs/api` | The `/api/v1` reference |
| `/sign-in`, `/sign-up`, `/forgot` | Auth forms; the handlers arrive with the accounts release and today answer with an honest notice |
| `/llms.txt`, `/sitemap.xml`, `/robots.txt` | Machine-readable map of the site |

## Deployment

Built and pushed as `npi-site` by `.github/workflows/deploy.yml`, run as the `site` service in
`infra/docker-compose.yml` on its own port (`127.0.0.1:8090` by default) — not behind the admin
proxy, so publishing the site later never means publishing the admin app.

The key it runs with lives in `/etc/npi-v5/site.env`; see `infra/site.env.example`. That file is
optional, so a host without one still deploys the rest of the stack instead of failing the
release.

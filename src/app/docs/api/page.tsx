import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { DarkFooter } from "@/components/DarkFooter";
import { JsonLd } from "@/components/JsonLd";
import { ApiScripts } from "@/components/ApiScripts";
import { SITE_NAME, siteUrl, socialCard } from "@/lib/site";

const ENDPOINTS: readonly { method: string; path: string; scope: string; does: string }[] = [
  { method: "GET", path: "/v1/providers", scope: "providers.read", does: "Search providers and organizations, with a true total." },
  { method: "GET", path: "/v1/providers/{npi}", scope: "providers.read", does: "One provider, the same row search returns." },
  { method: "POST", path: "/v1/providers/{npi}/reveal", scope: "contacts.reveal", does: "Open one provider's contact details. Costs a call and a reveal." },
  { method: "GET", path: "/v1/providers/{npi}/leadership", scope: "providers.read", does: "An organization's leadership contacts counted by role. No names." },
  { method: "GET", path: "/v1/organizations/{npi}/profile", scope: "providers.read", does: "Linked providers by specialty, EHR, facilities, locations, system, similar organizations." },
  { method: "GET", path: "/v1/facilities", scope: "providers.read", does: "Certified facilities still in the program, by state, town, type, name or NPI." },
  { method: "GET", path: "/v1/facilities/{ccn}", scope: "providers.read", does: "One facility, with leadership counted by role." },
  { method: "GET", path: "/v1/facilities/{ccn}/profile", scope: "providers.read", does: "Providers linked to it, its EHR, sibling locations, system and closest peers by size." },
  { method: "GET", path: "/v1/facilities/places", scope: "providers.read", does: "Where facilities of one type are, with counts, by state or by town." },
  { method: "GET", path: "/v1/facilities/index", scope: "providers.read", does: "Every active facility in CCN order, a few fields each. What a sitemap is built from." },
  { method: "GET", path: "/v1/leadership/counts", scope: "providers.read", does: "Leadership contacts by role, facility family and state, above the publication floor." },
  { method: "GET", path: "/v1/systems", scope: "providers.read", does: "Health systems and chains with five or more active facilities, largest first." },
  { method: "GET", path: "/v1/systems/{slug}", scope: "providers.read", does: "One system and its member facilities." },
  { method: "GET", path: "/v1/health-systems", scope: "providers.read", does: "Health systems, biggest first, with hospitals, beds and member facilities counted." },
  { method: "GET", path: "/v1/health-systems/{slug}", scope: "providers.read", does: "One health system: where it is, how big it is, and its members grouped by kind." },
  { method: "GET", path: "/v1/health-systems/{slug}/members", scope: "providers.read", does: "One kind of a system's members, paged, for a system with hundreds of them." },
  { method: "GET", path: "/v1/lists", scope: "providers.read", does: "The published list catalog: specialties and facility types with national counts." },
  { method: "GET", path: "/v1/lists/taxonomies/{slug}", scope: "providers.read", does: "One specialty list, nationally or in one state, with counts by state." },
  { method: "GET", path: "/v1/lists/facility-types/{slug}", scope: "providers.read", does: "One facility-type list, nationally or in one state." },
  { method: "GET", path: "/v1/directory/{kind}", scope: "providers.read", does: "One node of the A-Z of active providers or organizations." },
  { method: "GET", path: "/v1/taxonomies", scope: "providers.read", does: "Every specialty in the reference list, with how many providers hold it, biggest first." },
  { method: "GET", path: "/v1/taxonomies/classes", scope: "providers.read", does: "The specialty headings with the providers under each. The short list for a dropdown." },
  { method: "POST", path: "/v1/exports", scope: "providers.export", does: "Export a provider search to CSV as a job, checked against the month's row allowance." },
  { method: "POST", path: "/v1/append", scope: "append.run", does: "Upload a file of NPIs or names and get the provider fields you asked for added." },
  { method: "GET", path: "/v1/jobs", scope: "jobs.read", does: "Every export and append this key started, newest first." },
  { method: "GET", path: "/v1/jobs/{job_id}", scope: "jobs.read", does: "Where one job got to, and the counts worth reading before sending the file anywhere." },
  { method: "GET", path: "/v1/jobs/{job_id}/download", scope: "jobs.read", does: "Stream the file the job produced. Recorded against the key that fetched it." },
  { method: "GET", path: "/v1/usage", scope: "usage.read", does: "The plan and this month's spend, read from the same numbers a refusal quotes." },
  { method: "POST", path: "/v1/privacy/requests", scope: "privacy.submit", does: "A consumer's opt-out, deletion or access request. Our own form's scope, not a key's." },
  { method: "POST", path: "/v1/privacy/gpc", scope: "privacy.submit", does: "A Global Privacy Control opt-out for a visitor the site can identify. Same scope." },
];

export const metadata: Metadata = {
  title: "API reference",
  description:
    `All ${ENDPOINTS.length} routes on /v1: bearer keys and scopes, provider, facility and ` +
    "health-system search, reveals, exports, append, jobs and usage, with the refusal each " +
    "check returns.",
  alternates: { canonical: "/docs/api" },
  openGraph: socialCard(
    "/docs/api",
    "API reference",
    `The ${ENDPOINTS.length} routes on /v1, the scope each needs, and what a refusal means.`,
  ),
};

function LogoSvg() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" style={{ width: 40, height: 40 }}>
      <rect x="12" y="23" width="18" height="65" rx="9" fill="#4563ef" />
      <rect x="64" y="23" width="18" height="65" rx="9" fill="#4563ef" />
      <path d="M21 32 73 79" fill="none" stroke="#23c8df" strokeWidth="18" strokeLinecap="round" />
      <circle cx="73" cy="12" r="5.562" fill="#ff8058" />
    </svg>
  );
}

export default function ApiDocsPage() {
  return (
    <>
      <Script src="https://unpkg.com/@phosphor-icons/web@2.1.1" strategy="beforeInteractive" />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "TechArticle",
          headline: `${SITE_NAME} public API, version 1`,
          url: siteUrl("/docs/api"),
          about: "REST API for US healthcare provider records",
        }}
      />
      <main className="nd-api nd-home">
        <div className="hero2 api-top">
          <header className="site-nav-new">
            <div className="wrap">
              <Link className="nd-brand" href="/" aria-label="NPImark Provider Data home">
                <LogoSvg /><span>NPImark<small>Provider Data</small></span>
              </Link>
              <nav className="top-menu" aria-label="Primary">
                <Link href="/search">Search</Link>
                <Link href="/directory">Directory</Link>
                <Link href="/tour">Tour</Link>
                <Link href="/pricing">Pricing</Link>
                <Link href="/docs/api" aria-current="page">API</Link>
              </nav>
              <div className="nav-actions">
                <Link className="icon-btn" href="/search" aria-label="Search"><i className="ph ph-magnifying-glass" /></Link>
                <Link className="btn-solid" href="/#cta">Get Started <i className="ph ph-arrow-right" /></Link>
              </div>
            </div>
          </header>

          <section className="api-hero">
            <div className="wrap api-hero-grid">
              <div>
                <div className="sp-kicker">API reference &middot; /v1</div>
                <h1>Small, versioned, changed only by adding.</h1>
                <p className="sp-sub">The surface a customer&apos;s own system calls. Keys belong to an organization, carry scopes, and are metered on two things at once: the calls they make and the rows those calls return. Every number the API holds you to is in the response headers.</p>
              </div>
              <div className="hero-term" aria-hidden="true">
                <div className="term-bar"><span className="win-dots"><i /><i /><i /></span><span>api.npimark.com</span></div>
                <pre><span className="t-m">GET</span> /v1/providers?state=TX&amp;page_size=50{"\n"}<span className="t-k">Authorization:</span> Bearer npi_live_<span className="t-d">&hellip;</span>{"\n\n"}<span className="t-ok">200 OK</span>{"\n"}<span className="t-k">X-RateLimit-Remaining:</span> <span className="t-v">59</span>{"\n"}<span className="t-k">X-Quota-Rows-Remaining:</span> <span className="t-v">24,950</span></pre>
              </div>
            </div>
          </section>
        </div>

        <section className="api-body">
          <div className="wrap api-layout">
            <aside className="api-toc">
              <p className="toc-h">On this page</p>
              <nav aria-label="On this page">
                <a href="#machine">The machine-readable document</a>
                <a href="#ai">From an AI assistant</a>
                <a href="#auth">Authentication</a>
                <a href="#checks">What a call is checked against, in order</a>
                <a href="#headers">Headers on every successful call</a>
                <a href="#endpoints">Endpoints</a>
                <a href="#metering">Metering</a>
                <a href="#not-yet">Not here yet</a>
              </nav>
              <div className="toc-actions">
                <Link className="btn-solid" href="/app/keys"><i className="ph ph-key" />Manage API keys</Link>
                <Link className="toc-help" href="/contact"><i className="ph ph-lifebuoy" />Get integration help</Link>
              </div>
            </aside>

            <article className="api-doc">
              {/* ── Machine-readable ── */}
              <section id="machine" className="doc-sec">
                <h2>The machine-readable document</h2>
                <p><a href="https://api.npimark.com/openapi.json">OpenAPI specification</a> at <code>https://api.npimark.com/openapi.json</code>, no key needed. It is an OpenAPI 3.1 document of exactly the routes below &mdash; the <code>/v1</code> paths and the shapes they return, and nothing else &mdash; generated from the code that answers your calls, so it cannot describe a version we are not running. Point a client generator at it.</p>
              </section>

              {/* ── AI assistant ── */}
              <section id="ai" className="doc-sec">
                <h2>From an AI assistant</h2>
                <p>There is an MCP server for this API, so an assistant can answer questions out of your account with your own key and your own allowance: thirteen read-only tools over provider search, one provider by NPI, the specialty, procedure and drug lookups, facilities, health systems, the published lists, and what your plan has left. It runs on your machine, it is configured in one block, and it is metered exactly as the routes below are &mdash; one call, and one row for every record a response names.</p>
                <p>It deliberately cannot reveal a provider&apos;s contact details, never returns a home address or a cell phone, cannot start an export or an append, and fetches one page of at most fifty records per call rather than walking pages.</p>
                <p>Configuring it is one block in your MCP client, with your key in <code>NPI_MARK_API_KEY</code> and this API&apos;s host in <code>NPI_MARK_API_BASE</code> &mdash; both are on your API keys page. The server is not published to a public package index yet, so ask us for the current release and the exact block to paste; <Link href="/mcp">the integration overview</Link> has the rest.</p>
              </section>

              {/* ── Authentication ── */}
              <section id="auth" className="doc-sec">
                <h2>Authentication</h2>
                <div className="code">
                  <div className="code-bar"><span>Header</span><button type="button" className="copy-btn"><i className="ph ph-copy" />Copy</button></div>
                  <pre><code>{"Authorization: Bearer npi_live_<prefix>_<secret>"}</code></pre>
                </div>
                <p>Keys are issued in your account settings and shown once. A key belongs to an organization, not a person, and carries scopes that can never exceed the permissions of whoever created it. Every failed authentication is the same 401 with the same message.</p>
                <p>Scopes, each granted only to a key created by somebody who already holds the matching permission:</p>
                <ul className="scopes">
                  <li><code>providers.read</code><span>for search, lookup, facilities, lists, systems and the A-Z</span></li>
                  <li><code>contacts.reveal</code><span>to open one provider&apos;s contact details</span></li>
                  <li><code>providers.export</code><span>to start an export</span></li>
                  <li><code>append.run</code><span>to submit a file to append</span></li>
                  <li><code>jobs.read</code><span>to follow a job and download what it produced</span></li>
                  <li><code>usage.read</code><span>for the plan and the month</span></li>
                </ul>
                <p className="callout"><i className="ph-fill ph-lock-key" />Home address and cell phone are not available through the API: on the Contact plan they are revealed in the app, one provider at a time, and an API reveal lists them as restricted.</p>
              </section>

              {/* ── Checks ── */}
              <section id="checks" className="doc-sec">
                <h2>What a call is checked against, in order</h2>
                <ol className="checks">
                  <li><span className="ck-n">1</span><div className="ck-a">Subscription is live</div><code className="ck-r r">402 subscription_inactive</code><div className="ck-m">Canceled or suspended. Nothing was read.</div></li>
                  <li><span className="ck-n">2</span><div className="ck-a">Pace, calls a minute per key</div><code className="ck-r w">429 rate_limited</code><div className="ck-m">Too fast. <code>Retry-After</code> says when to come back.</div></li>
                  <li><span className="ck-n">3</span><div className="ck-a">Volume, calls a month per organization</div><code className="ck-r w">409 quota_exceeded</code><div className="ck-m">Out of plan. The message carries both numbers and says which window it was: the month, or a paid plan&apos;s daily cap, which clears at midnight UTC.</div></li>
                  <li><span className="ck-n">4</span><div className="ck-a">Volume, rows a month per organization</div><code className="ck-r w">409 quota_exceeded</code><div className="ck-m">The page asked for is bigger than the rows left. Ask for a page that fits and it is served whole; a page is never shortened to make it fit.</div></li>
                  <li><span className="ck-n">5</span><div className="ck-a">Scope</div><code className="ck-r r">403 forbidden</code><div className="ck-m">The key lacks the scope. Keys cannot be widened; issue a new one.</div></li>
                  <li><span className="ck-n">6</span><div className="ck-a">Home address and cell phone</div><code className="ck-r n">restricted</code><div className="ck-m">Never returned to a key. Listed in <code>restricted</code> on a reveal, so an absence is never mistaken for nothing on file.</div></li>
                </ol>
                <p>Pace and volume are deliberately different answers. A 429 means retry in a minute; a 409 means today will not work no matter how long you wait.</p>
              </section>

              {/* ── Headers ── */}
              <section id="headers" className="doc-sec">
                <h2>Headers on every successful call</h2>
                <div className="tbl">
                  <table>
                    <thead><tr><th>Header</th><th>Meaning</th></tr></thead>
                    <tbody>
                      <tr><td><code>X-RateLimit-Limit</code>, <code>-Remaining</code>, <code>-Reset</code></td><td>Calls a minute allowed for this key, what is left, and when the minute clears</td></tr>
                      <tr><td><code>X-Quota-Limit</code>, <code>-Used</code>, <code>-Remaining</code></td><td>The month, against the plan</td></tr>
                      <tr><td><code>X-Quota-Period</code></td><td>First day of the period the quota counts</td></tr>
                      <tr><td><code>X-Quota-Rows-Limit</code>, <code>-Used</code>, <code>-Remaining</code></td><td>The month&apos;s rows, against the plan &mdash; the same allowance an export spends. As they stood when the request arrived, before this call&apos;s own rows were charged.</td></tr>
                    </tbody>
                  </table>
                </div>
                <p>A plan with no limit sends no header rather than a header you cannot trust.</p>
              </section>

              {/* ── Endpoints ── */}
              <section id="endpoints" className="doc-sec">
                <div className="ep-head">
                  <div><h2>Endpoints</h2><p>There are {ENDPOINTS.length} of them, and this is all of them. Version 1 changes only by adding.</p></div>
                  <label className="ep-filter"><i className="ph ph-magnifying-glass" /><input id="ep-q" type="search" placeholder="Filter routes or scopes" autoComplete="off" /></label>
                </div>
                <div className="tbl">
                  <table className="ep-table">
                    <thead><tr><th>Call</th><th>Scope</th><th>What it answers</th></tr></thead>
                    <tbody>
                      {ENDPOINTS.map((row) => (
                        <tr key={`${row.method} ${row.path}`} data-k={`${row.method.toLowerCase()} ${row.path} ${row.scope} ${row.does.toLowerCase()}`}>
                          <td><span className={`m ${row.method.toLowerCase()}`}>{row.method}</span><code>{row.path}</code></td>
                          <td><code className="scope">{row.scope}</code></td>
                          <td>{row.does}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Endpoint details */}
                <div className="ep-detail">
                  <h3 className="ep-h"><span className="m get">GET</span><code>/v1/providers</code></h3>
                  <p>Scope <code>providers.read</code>. Filters: <code>q</code> (NPI, person or organization name), <code>npi</code>, <code>first_name</code>, <code>last_name</code>, <code>organization_name</code>, <code>state</code> (repeatable), <code>city</code>, <code>postal_code</code> (5 digits or a 3-digit prefix), <code>taxonomy_code</code>, <code>taxonomy_classification</code>, <code>taxonomy_specialization</code>, <code>credentials</code>, <code>type</code>, <code>status</code>, <code>has_email</code>, <code>employer_domain</code>, <code>near_zip</code> with <code>radius_miles</code>, plus <code>page</code> and <code>page_size</code> up to 200. Returns a page with a true total.</p>
                  <div className="code">
                    <div className="code-bar"><span>curl</span><button type="button" className="copy-btn"><i className="ph ph-copy" />Copy</button></div>
                    <pre><code>{`curl -H "Authorization: Bearer $KEY" \\
  "https://api.npimark.com/v1/providers?state=TX&taxonomy_classification=Internal%20Medicine&page_size=50"`}</code></pre>
                  </div>
                </div>

                <div className="ep-detail">
                  <h3 className="ep-h"><span className="m get">GET</span><code>/v1/providers/{"{npi}"}</code></h3>
                  <p>Scope <code>providers.read</code>. One provider as the same row search returns. 404 when no such record exists; the message names the usual cause, a wrong check digit.</p>
                  <p>Contact fields appear only for a key that clears both halves of the gate. For every other key the row does not carry them.</p>
                  <p>What each field on the row means, what it is for, and how complete it is, is on the <Link href="/fields">field reference</Link> &mdash; one entry per field, with the export column header and the append field name beside the API name.</p>
                </div>

                <div className="ep-detail">
                  <h3 className="ep-h"><span className="m get">GET</span><code>/v1/facilities</code><span className="and">and</span><code>/v1/facilities/{"{ccn}"}</code></h3>
                  <p>Scope <code>providers.read</code>. Certified facilities still operating. Filters: <code>state</code>, <code>city</code> (exact, with a state), <code>facility_type</code> (<code>hospital</code>, <code>nursing_home</code>, <code>home_health</code>, <code>hospice</code>, <code>dialysis</code>, <code>other</code>), <code>name</code> (prefix), <code>npi</code>, plus <code>page</code> and <code>page_size</code> up to 200. Each row carries type, category, name, address, county, main phone, ownership, chain, beds, star ratings, emergency services, the organization NPI and when it was certified. One facility adds its leadership contacts counted by role &mdash; never names.</p>
                  <p><code>GET /v1/facilities/places</code> counts one type by state, by town in a state, or by every town; <code>GET /v1/providers/{"{npi}"}/leadership</code> counts an organization&apos;s leadership contacts by role.</p>
                  <p><code>GET /v1/leadership/counts</code> counts leadership contacts by role (CEO, CFO, administrator, director of nursing, board member, owner and more), facility type and state, nationally or by state. Counts only; a combination with fewer than ten people, or spread over fewer than three facilities, is left out rather than reported.</p>
                </div>

                <div className="ep-detail">
                  <h3 className="ep-h"><span className="m get">GET</span><code>/v1/directory/{"{providers|organizations}"}</code></h3>
                  <p>Scope <code>providers.read</code>. The A-Z as a tree of name prefixes: <code>prefix=SMITH J</code> returns either the names under it (up to 1,000, paged) or the longer prefixes under it with counts. Active records only.</p>
                </div>

                <div className="ep-detail">
                  <h3 className="ep-h"><span className="m get">GET</span><code>/v1/lists</code>, <code>/systems</code><span className="and">and the profiles</span></h3>
                  <p>Scope <code>providers.read</code>. <code>/v1/lists</code> is the published catalog &mdash; which specialties and facility types have enough behind them to be a list, with national counts and the states that have a page &mdash; and <code>/v1/lists/taxonomies/{"{slug}"}</code> and <code>/v1/lists/facility-types/{"{slug}"}</code> are one of them, nationally or in one state. A list below its floor is a 404 rather than a short list. <code>/v1/systems</code> and <code>/v1/systems/{"{slug}"}</code> are the health systems and chains with five or more active facilities. <code>/v1/organizations/{"{npi}"}/profile</code> and <code>/v1/facilities/{"{ccn}"}/profile</code> add what a profile page shows around a record: linked providers, the EHR, sibling locations, the system, and the closest comparable organizations.</p>
                </div>

                <div className="ep-detail">
                  <h3 className="ep-h"><span className="m get">GET</span><code>/v1/health-systems</code></h3>
                  <p>Scope <code>providers.read</code>. Health systems as their own records rather than as a field on a facility: name, headquarters, ownership word, bed total, and counts of hospitals, member facilities and providers. <code>/v1/health-systems/{"{slug}"}</code> adds the members grouped by kind &mdash; hospitals, nursing homes, home health and hospice, other certified facilities &mdash; each group capped at 100 with its real total beside it, and <code>/v1/health-systems/{"{slug}"}/members</code> pages the rest of one kind, so a system with 900 nursing homes is a sequence of requests rather than one enormous one. A member tied to a system only by a name match is not served: an inference printed as a fact is worse than a gap.</p>
                  <p>Two counts, and they are not the same number: <code>counts.hospitals</code> counts hospitals and <code>counts.facilities</code> counts every member kind. The provider count is counted as the call runs, with the suppression list applied, so it agrees with what a provider search for the same system returns.</p>
                  <p>Slugs are permanent. A system folded into another still resolves and answers a <code>308</code> with <code>merged_into</code> naming the target, following the chain to its end; the members route 404s for one, so nothing serves a merged system&apos;s content at two addresses. This is a different family from <code>/v1/systems</code>, which is the chain summary the profiles reference &mdash; both use the same slug for the same system, so neither URL changes hands.</p>
                </div>

                <div className="ep-detail">
                  <h3 className="ep-h"><span className="m post">POST</span><code>/v1/providers/{"{npi}"}/reveal</code></h3>
                  <p>Scope <code>contacts.reveal</code>. Opens one provider&apos;s contact details &mdash; the same function the app calls, so the two cannot drift apart. One provider a month per organization, and the second time in the month is free. It costs two allowances on purpose: one API call, because a request was answered, and one reveal, because contact data was handed over. Polling it for a provider you already opened spends calls and no reveals. It spends no rows: charging one disclosure twice under two names would make both numbers meaningless.</p>
                </div>

                <div className="ep-detail">
                  <h3 className="ep-h"><span className="m post">POST</span><code>/v1/exports</code>, <span className="m post">POST</span><code>/v1/append</code><span className="and">and the jobs</span></h3>
                  <p>An export takes the filters <code>GET /v1/providers</code> takes, as a JSON object, validated against the same code &mdash; a mistake is a 422 now rather than a job that fails an hour later. An append takes a CSV, TSV or XLSX, matches on NPI (and on first and last name for rows without one), and returns your file with its columns and row order intact and only the fields you asked for added. Both are checked against the month&apos;s row allowance before anything is queued, and both refuse the home-address and cell-phone fields for every key.</p>
                  <p>Which columns an export can write and which fields an append can fill &mdash; and which fields are on one surface and not the other &mdash; are on the <Link href="/fields">field reference</Link>, entry by entry, with the same list <Link href="/fields.json">machine-readable</Link>.</p>
                  <p>A file can carry the published Medicare summary as six columns: the three highest-volume procedures and the three highest-volume drugs, each with its volume, one cell each, and four sizes. Ask for them by name in <code>columns</code> (<code>top_procedures</code>, <code>procedure_services</code>, <code>procedure_codes</code>, <code>top_drugs</code>, <code>prescribing_claims</code>, <code>prescribing_drugs</code>) or as the <code>claims</code> preset, and by the same names in an append&apos;s <code>fields</code>. Values inside a cell are separated by <code>;</code> and each carries its volume in brackets; every one of those headers ends with the data year. They widen a row and never add one, so the file costs the same rows with them as without. A provider with nothing published reads <code>No published volume</code> rather than an empty cell, and about one clinician in six has anything published &mdash; the individual lines, with the published averages, stay on their own per-provider call.</p>
                  <p>Scope <code>jobs.read</code> then follows it: <code>GET /v1/jobs</code> lists the jobs this key started, <code>GET /v1/jobs/{"{job_id}"}</code> carries the counts worth reading before you send a file anywhere &mdash; rows, suppressed rows, matched and unmatched &mdash; and <code>GET /v1/jobs/{"{job_id}"}/download</code> streams the file. A job that is not this key&apos;s is a 404, an unfinished one a 409, and a file past its retention a 410 that says so rather than an empty download.</p>
                </div>

                <div className="ep-detail">
                  <h3 className="ep-h"><span className="m get">GET</span><code>/v1/taxonomies</code><span className="and">and</span><code>/v1/usage</code></h3>
                  <p>Build a specialty picker from <code>/v1/taxonomies</code> and <code>/v1/taxonomies/classes</code> rather than from a pasted list: the reference list gains codes, and the counts are the same suppression-aware counts search returns, so the number beside a specialty is the number you will get. <code>/v1/usage</code> (scope <code>usage.read</code>) reads the plan and the month&apos;s spend from the same entitlements every refusal quotes. A limit is <code>null</code> for unlimited and <code>0</code> for nothing at all &mdash; read <code>enforced</code> rather than testing for null.</p>
                </div>

                <div className="ep-detail">
                  <h3 className="ep-h"><span className="m post">POST</span><code>/v1/privacy/requests</code><span className="and">and</span><code>/v1/privacy/gpc</code></h3>
                  <p>Scope <code>privacy.submit</code>, which is not issued with a customer key: these two are what our own <Link href="/remove-my-information">removal form</Link> calls when a member of the public asks to be opted out, deleted or told what we hold, and what records a browser&apos;s &quot;do not sell&quot; signal for a visitor we can name. They are in the table above because it is the whole of version 1, and a gap in a list that promises to be complete is the one thing a reader cannot check.</p>
                  <p>They sit outside the billing gate and are metered by nothing. A person&apos;s request not to be sold, or to be deleted, does not depend on whether an invoice was paid, and a privacy request that bounced off a payment refusal is a regulator&apos;s finding rather than a billing event. Both answer <code>202</code> with a reference whatever we hold, because telling a stranger &quot;we have no record of you&quot; is itself an answer about somebody.</p>
                </div>
              </section>

              {/* ── Metering ── */}
              <section id="metering" className="doc-sec">
                <h2>Metering</h2>
                <p>A call the API answers adds one to the month&apos;s calls, and the records it returns are charged against the month&apos;s rows &mdash; the same allowance an export spends, because a row read through a key is the same row. Both are written in the same transaction as the read and before the answer leaves, so nothing is handed over unmetered and nothing is metered that was not handed over.</p>
                <p>A row, on this surface, is a record about a provider, an organization, a facility or a health system that the response names. What that works out to:</p>
                <div className="tbl">
                  <table>
                    <thead><tr><th>What you asked for</th><th>Rows</th></tr></thead>
                    <tbody>
                      <tr><td>A page of results</td><td>One per record returned. Fifty for a page of fifty, twelve for a page of twelve. <code>page_size</code> is checked against the rows you have left before anything is read, so a page bigger than the remainder is a <code>409</code> rather than a short page.</td></tr>
                      <tr><td>One record by NPI, CCN or slug</td><td>One.</td></tr>
                      <tr><td>A record with others named beside it &mdash; a profile, a system</td><td>One per record named, the subject included. The counts beside them, none.</td></tr>
                      <tr><td>A result that found nothing</td><td>None. Nothing was handed over.</td></tr>
                      <tr><td>Counts and index pages that name no record &mdash; specialties, places, leadership counts, the published lists, your own jobs</td><td>None.</td></tr>
                      <tr><td>A <code>404</code>, or a <code>308</code> from a folded system slug</td><td>None, and one call. The lookup happened, which is why the call is metered; no record was named, which is why there are no rows.</td></tr>
                      <tr><td>A refusal &mdash; 402, 403, 409, 429</td><td>None, and no call either. Being told no costs nothing.</td></tr>
                    </tbody>
                  </table>
                </div>
                <p>Nothing is charged twice. Starting an export or an append costs one call and no rows; its rows are charged when the job writes them, and downloading the file it produced &mdash; again, as often as you like &mdash; costs neither. A reveal spends a call and a reveal and no rows. The converse holds too: a work email arriving in an ordinary row is metered as a row and never touches the reveal allowance.</p>
              </section>

              {/* ── Not here yet ── */}
              <section id="not-yet" className="doc-sec">
                <h2>Not here yet</h2>
                <ul className="soon">
                  <li><i className="ph-duotone ph-upload-simple" />Suppression uploads. Send them to us and they are applied for everyone.</li>
                  <li><i className="ph-duotone ph-users-three" />Consumer audiences. Counting and exporting them is an app screen and a contract, not a key.</li>
                </ul>
                <p>Keys are issued from account settings. <Link href="/sign-up">Create an account</Link> or <Link href="/pricing">see plans</Link>.</p>
              </section>
            </article>
          </div>
        </section>
      </main>

      {/* ═══════════════════════════════ CTA ═══════════════════════════════ */}
      <section className="nd-home next-step" id="cta" aria-labelledby="next-title">
        <div className="wrap">
          <div className="cta-band">
            <div className="cta-copy">
              <span className="cta-rule" aria-hidden="true" />
              <span className="cta-eyebrow">Your next step</span>
              <h2 id="next-title">Start with the providers you need to reach.</h2>
              <p>Explore the public records, check your target segment, then choose the account or API access that fits your workflow.</p>
              <div className="cta-actions">
                <Link className="btn-solid btn-green" href="/search">Find providers <i className="ph ph-arrow-up-right" /></Link>
                <Link className="cta-outline" href="/contact">Discuss your use case</Link>
              </div>
              <Link className="cta-ghost" href="/docs/api">Building an integration? Explore the API &rarr;</Link>
            </div>
            <svg className="cta-art" viewBox="0 0 320 220" aria-hidden="true">
              <defs>
                <linearGradient id="crossG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5b8cff" stopOpacity=".55" /><stop offset="1" stopColor="#23c8df" stopOpacity=".18" /></linearGradient>
                <filter id="glow"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
              </defs>
              <path d="M120 20h80a8 8 0 0 1 8 8v52h52a8 8 0 0 1 8 8v44a8 8 0 0 1-8 8h-52v52a8 8 0 0 1-8 8h-80a8 8 0 0 1-8-8v-52H60a8 8 0 0 1-8-8V88a8 8 0 0 1 8-8h52V28a8 8 0 0 1 8-8z" fill="url(#crossG)" stroke="#8fe6f3" strokeOpacity=".5" />
              <path className="ecg" d="M10 112h110l12-26 16 58 16-90 16 74 10-16h120" fill="none" stroke="#5be08a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />
            </svg>
          </div>
        </div>
      </section>

      <DarkFooter />
      <ApiScripts />
    </>
  );
}

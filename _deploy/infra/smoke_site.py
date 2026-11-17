"""Launch smoke test for the NPI Mark public site and API.

Two minutes, no dependencies beyond the standard library, and every public page family
exercised with a real row behind it: first the pages whose content lives in this repository, then
one page of each generated kind, found by following the site's own links - a state, a town, a
facility profile, a list, a list for one state, a role page, a health system, a glossary term, an
A-Z prefix, a provider, an organisation, a specialty in one metro.

A page passes when it answers 200 and does not carry the "could not be reached" notice the site
shows when it has no API key or the API is down.

    python infra/smoke_site.py --site https://npimark.com --api https://api.npimark.com
    python infra/smoke_site.py --site http://localhost:3001            # the demo, site only
    python infra/smoke_site.py --site https://npimark.com --strict     # switch-on: nothing skipped

The pages the platform decides
------------------------------
Some families exist only while the platform publishes rows for them. A facility kind with no
certified facilities, the leadership pages below their floor, a specialty glossary term whose list
has not cleared it: each of those answers 404 by design rather than rendering an empty page. So a
404 there is reported as SKIP - that family is not in this deployment - while every other status,
and the "could not be reached" notice, is a failure. The hubs link some of these before the
platform publishes them, so a step with several candidate links tries them in order and says how
many it had to step over.

`--strict` turns every skip into a failure. That is what the run at switch-on wants: against the
live site each family should be there, and a skip is then the thing worth knowing about.

With --api it also checks the public API edge: /health answers, /openapi.json gives either the
schema or a deliberate 404, and a non-/v1 path on the API host is a 404 - the property the
separate public edge exists for. With --key it reads /v1 as the site does. Exit code 0 only when
everything passed.
"""

from __future__ import annotations

import argparse
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

UNREACHABLE = "could not be reached"

# Every public page whose content lives in this repository, so it answers 200 on any deployment.
# Kept in step with site/src/app, and with site/src/app/sitemap.ts - the site's own list of what it
# publishes, which is where a page added to the app has to be registered too.
FIXED = [
    # The front door and search.
    "/", "/search", "/search?q=smith&state=TX",
    # Every audience landing page (site/src/lib/audiences.ts).
    "/physicians", "/nurses", "/advanced-practice-providers", "/dentists",
    "/mental-health-providers", "/pharmacists", "/physical-occupational-therapists",
    "/optometrists-ophthalmologists", "/chiropractors", "/podiatrists",
    "/healthcare-professionals",
    # What is in the database, what it costs, and how to call it.
    "/data", "/intent-data", "/ehr-data", "/pricing", "/docs/api",
    # The field reference and its machine-readable twin, generated from the same constant.
    "/fields", "/fields.json",
    # The glossary hub, and the help centre: its hub and every article (site/src/lib/help.ts).
    "/glossary",
    "/help", "/help/reveals", "/help/plans-and-limits", "/help/search-and-filters",
    "/help/email-trust", "/help/suppression", "/help/api-keys", "/help/exports-and-append",
    "/help/accounts", "/help/premium-contact-data",
    # The company pages.
    "/why-npi-mark", "/about", "/security", "/contact",
    # Legal, privacy, and the two things a member of the public can ask us for.
    "/terms", "/privacy", "/privacy-choices", "/remove-my-information", "/report-a-problem",
    # Signing in. The pages reached by a one-time emailed link are deliberately not here: fetching
    # one spends somebody's token, which is also why robots.txt disallows them.
    "/sign-in", "/sign-up", "/forgot",
    # The hubs. What lies under each is followed below.
    "/directory", "/directory/providers", "/directory/organizations", "/lists", "/systems",
    # What a crawler reads.
    "/robots.txt", "/sitemap-index.xml", "/sitemap.xml", "/llms.txt",
]

# The split sitemaps: file 0 of each, the one that exists at any row count (see lib/sitemaps.ts).
# They read the platform a page at a time and run to tens of thousands of URLs, so they get longer.
SITEMAP_FILES = ["/facility/sitemap/0.xml", "/lists/sitemap/0.xml"]
SITEMAP_TIMEOUT = 120.0

# The facility kinds. Each has a hub the platform decides; the tree below every hub is the same
# shape, so one kind is walked to the bottom and the others are checked at their hub.
FACILITY_KINDS = ["/hospitals", "/nursing-homes", "/home-health-agencies", "/hospices",
                  "/dialysis-centers"]

# How many candidate links one step will try before calling the family absent.
CANDIDATES = 8


class Result:
    def __init__(self, strict: bool = False) -> None:
        self.strict = strict
        self.rows: list[tuple[str, str, str]] = []

    def _record(self, state: str, what: str, detail: str) -> None:
        self.rows.append((state, what, detail))
        print(f"  {state:4}  {what}" + (f"  - {detail}" if detail else ""))

    def add(self, ok: bool, what: str, detail: str = "") -> None:
        self._record("PASS" if ok else "FAIL", what, detail)

    def skip(self, what: str, detail: str) -> None:
        """A family the platform publishes nothing for. A failure under --strict."""
        if self.strict:
            self._record("FAIL", what, f"{detail} (--strict)")
        else:
            self._record("SKIP", what, detail)

    @property
    def failed(self) -> int:
        return sum(1 for state, _, _ in self.rows if state == "FAIL")

    @property
    def skipped(self) -> int:
        return sum(1 for state, _, _ in self.rows if state == "SKIP")


def fetch(url: str, key: str | None = None, timeout: float = 30.0) -> tuple[int, str, float]:
    request = urllib.request.Request(url, headers={"User-Agent": "npimark-smoke/1"})
    if key:
        request.add_header("Authorization", f"Bearer {key}")
    started = time.monotonic()
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = response.read().decode("utf-8", errors="replace")
            return response.status, body, time.monotonic() - started
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace") if error.fp else ""
        return error.code, body, time.monotonic() - started
    except (urllib.error.URLError, TimeoutError) as error:
        return 0, str(error), time.monotonic() - started


def check_page(
    result: Result,
    site: str,
    path: str,
    *,
    required: bool = True,
    timeout: float = 30.0,
    label: str | None = None,
) -> str:
    """Check one page. Returns its body when it passed, "" otherwise.

    `required=False` marks a page the platform decides: a 404 is then "not in this deployment"
    rather than a break. Every other status is a failure either way, and so is the "could not be
    reached" notice - a page that renders its furniture around that notice has not passed.
    """
    what = label or path
    status, body, took = fetch(site + path, timeout=timeout)
    if status == 200 and UNREACHABLE in body:
        result.add(False, what, "shows 'could not be reached' - no site key, or the API is down")
        return ""
    if status == 200:
        result.add(True, what, f"{took:.1f}s")
        return body
    if status == 404 and not required:
        result.skip(what, f"{path} is a 404 - the platform publishes nothing here")
        return ""
    result.add(False, what, f"HTTP {status} at {path}")
    return ""


def links(body: str, pattern: str) -> list[str]:
    """Every distinct href path in `body` matching `pattern`, in the order they appear."""
    found: list[str] = []
    for href in re.findall(r'href="([^"#?]+)', body):
        path = urllib.parse.urlparse(href).path
        if re.match(pattern, path) and path not in found:
            found.append(path)
    return found


def follow(
    result: Result,
    site: str,
    start: str,
    steps: list[tuple[str, str]],
    *,
    start_required: bool = True,
) -> None:
    """From `start`, follow one link matching each pattern in turn, checking the page it lands on.

    A step tries its candidates in order, because a hub may link a page the platform has not
    published: the first that answers is the one the walk continues from, a candidate that 404s is
    stepped over and counted, and a step whose every candidate 404s ends the walk as a skip.
    Anything that is neither a 200 nor a 404 fails on the spot.
    """
    if start in FIXED:
        status, body, _ = fetch(site + start)
        if status != 200:
            result.add(False, f"{start} (as a starting point)", f"HTTP {status}")
            return
    else:
        body = check_page(result, site, start, required=start_required)
        if not body:
            return
    for label, pattern in steps:
        candidates = links(body, pattern)
        if not candidates:
            result.skip(label, f"no link matching {pattern} on the previous page")
            return
        body, stepped_over = "", 0
        for path in candidates[:CANDIDATES]:
            status, candidate, took = fetch(site + path)
            if status == 404:
                stepped_over += 1
                continue
            over = f", stepped over {stepped_over} unpublished" if stepped_over else ""
            if status != 200:
                result.add(False, label, f"HTTP {status} at {path}")
            elif UNREACHABLE in candidate:
                result.add(False, label, f"{path} shows 'could not be reached'")
            else:
                result.add(True, label, f"{path}, {took:.1f}s{over}")
                body = candidate
            break
        else:
            result.skip(label, f"all {stepped_over} candidate(s) matching {pattern} are 404")
            return
        if not body:
            return


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--site", required=True, help="e.g. https://npimark.com")
    parser.add_argument("--api", help="e.g. https://api.npimark.com (checks the public edge)")
    parser.add_argument("--key", help="a providers.read key, to read /v1 as the site does")
    parser.add_argument(
        "--strict", action="store_true",
        help="fail on a family the platform publishes nothing for, instead of skipping it",
    )
    args = parser.parse_args()
    site = args.site.rstrip("/")
    result = Result(strict=args.strict)

    print(f"Pages that do not depend on a row, on {site}")
    for path in FIXED:
        check_page(result, site, path)
    for path in SITEMAP_FILES:
        check_page(result, site, path, timeout=SITEMAP_TIMEOUT)

    print("The facility directory, by kind")
    follow(result, site, FACILITY_KINDS[0], [
        ("a state of hospitals", r"^/hospitals/[a-z]{2}$"),
        ("a town of hospitals", r"^/hospitals/[a-z]{2}/[a-z0-9-]+$"),
        ("a facility profile", r"^/facility/[a-z0-9-]+$"),
    ], start_required=False)
    for kind in FACILITY_KINDS[1:]:
        check_page(result, site, kind, required=False)

    print("One page of each other generated kind, found by following the site's own links")
    follow(result, site, "/lists", [
        ("a list page", r"^/lists/[a-z0-9-]+$"),
        ("a list for one state", r"^/lists/[a-z0-9-]+/[a-z]{2}$"),
    ])
    follow(result, site, "/systems", [
        ("a health system", r"^/systems/[a-z0-9-]+$"),
        ("a facility in that system", r"^/facility/[a-z0-9-]+$"),
    ])
    follow(result, site, "/leadership", [
        ("a role", r"^/leadership/[a-z-]+$"),
        ("a role by facility type", r"^/leadership/[a-z-]+/[a-z-]+$"),
        ("a role in one state", r"^/leadership/[a-z-]+/[a-z-]+/[a-z]{2}$"),
    ], start_required=False)
    follow(result, site, "/glossary", [("a glossary term", r"^/glossary/[a-z0-9-]+$")])
    follow(result, site, "/directory/providers", [
        ("an A-Z prefix of providers", r"^/directory/providers/[a-z0-9]+$"),
        ("a provider profile", r"^/npi/\d{10}$"),
    ])
    follow(result, site, "/directory/organizations", [
        ("an A-Z prefix of organisations", r"^/directory/organizations/[a-z0-9]+$"),
        ("an organisation profile", r"^/npi/\d{10}$"),
    ])
    follow(result, site, "/directory", [
        ("a specialty in one metro", r"^/specialty/[a-z0-9-]+/[a-z]{2}/[a-z0-9-]+$"),
    ])

    if args.api:
        api = args.api.rstrip("/")
        print(f"Public API edge on {api}")
        status, _, _ = fetch(api + "/health")
        result.add(status == 200, "/health", f"HTTP {status}")
        # Not asserted as a 200. The edge has a handler for it, but `create_app()` sets
        # `openapi_url=None` when APP_ENV is production - "API docs are a map of the attack
        # surface" - so on the live host the handler proxies to a 404, and on staging it does not.
        # Either is a deliberate answer; a 5xx is not, and neither is a 200 that is not a schema.
        status, body, _ = fetch(api + "/openapi.json")
        served = status == 200 and '"openapi"' in body
        result.add(served or status == 404, "/openapi.json",
                   "served" if served else f"HTTP {status} - not published on this host")
        status, _, _ = fetch(api + "/api/imports")
        result.add(status == 404, "a non-/v1 path is a 404", f"HTTP {status}")
        if args.key:
            # One read of each family the site depends on; every one is in tests' V1_ROUTES.
            for path in ("/v1/providers?state=TX&page_size=1",
                         "/v1/facilities?state=TX&page_size=1",
                         "/v1/lists", "/v1/leadership/counts?level=national",
                         "/v1/health-systems?page_size=1", "/v1/taxonomies/classes"):
                status, body, took = fetch(api + path, key=args.key)
                result.add(status == 200 and len(body) > 20, path, f"HTTP {status}, {took:.1f}s")

    total = len(result.rows)
    passed = total - result.failed - result.skipped
    print(f"\n{passed} of {total} passed, {result.failed} failed, {result.skipped} skipped")
    if result.skipped:
        print("A skip is a family the platform publishes nothing for today. At switch-on, run with")
        print("--strict: against the live site every one of them should be a page.")
    return 1 if result.failed else 0


if __name__ == "__main__":
    sys.exit(main())

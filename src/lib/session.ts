import type { WorkspaceDecisionNetworkData } from "./decisionNetwork";
/**
 * The customer's session, held by this site rather than by the browser's relationship with the API.
 *
 * Why the site keeps the cookie
 * -----------------------------
 * The API lives on a different origin, so its own `npi_session` cookie would be a third-party
 * cookie to anybody's browser: blocked by default in Safari and Firefox, and on borrowed time in
 * Chrome. Rather than fight that, the browser only ever talks to this site. A route handler signs
 * in on the visitor's behalf, keeps the API's session token in a cookie of *our* origin, and every
 * server component that needs data sends it back to the API itself.
 *
 * The cookie is httpOnly, so no script on the page can read it - which also means an XSS bug here
 * cannot walk away with a working session token. It is SameSite=Lax, so a form on somebody else's
 * site cannot post one, and Secure everywhere except plain-HTTP local development.
 *
 * CSRF, honestly
 * --------------
 * The API enforces double-submit CSRF on every unsafe method, with no exemption. Server-to-server
 * calls are not what that protects against, but the check does not know that, so `apiPost` plays
 * along properly: fetch a token, send it as both cookie and header. Satisfying a guard rather than
 * asking for an exemption keeps one rule in the system instead of two.
 */

import "server-only";
import { cache } from "react";
import { readIdentity } from "./sessionIdentity";
import { accountApiOrigin } from "@/lib/apiOrigins";
import { isIP } from "node:net";
import { cookies, headers } from "next/headers";

const SESSION_COOKIE = "npim_session";
const API_SESSION_COOKIE = "npi_session";
const CSRF_COOKIE = "npi_csrf";

/**
 * Set when somebody hides the getting-started checklist.
 *
 * A cookie rather than a column: "I have read that panel" is a fact about one browser, and it does
 * not belong in a tenant's data. It holds nothing but the fact that a panel was dismissed, which
 * is why it is not httpOnly.
 */
export const FIRST_RUN_DISMISSED = "npim_first_run_hidden";

export type Me = {
  id: string;
  email: string;
  name: string;
  role: string;
  org: { id: string; name: string; mfa_required: boolean };
  permissions: string[];
  mfa_enabled: boolean;
  /** Null until the address is proved. Reveals and exports are refused while it is. */
  email_verified_at: string | null;
};

/**
 * One metered thing: what the plan allows, what has gone, which month that is, and the day.
 *
 * `limit` null is unlimited and 0 is nothing at all - opposite answers, and `enforced` is the
 * field to branch on rather than testing for null. `remaining` is 0 on an unenforced limit, which
 * means "not counted" and must not be shown as "none left". The period fields are optional
 * because an older API answered without them; absent, a page says nothing about the month rather
 * than guessing it from this server's clock. The daily fields are absent for the same reason:
 * treat a missing `daily_enforced` as false - no daily cap - never as "none left".
 */
export type LimitFigures = {
  limit: number | null;
  used: number;
  remaining: number;
  enforced?: boolean;
  /** First day of the month the figures cover, ISO, e.g. `2026-09-01`. */
  period_start?: string;
  /** The same month in words, e.g. `September 2026`. */
  period_label?: string;
  resets_at?: string;
  daily_limit?: number | null;
  daily_used?: number;
  daily_remaining?: number;
  daily_enforced?: boolean;
  daily_resets_at?: string | null;
};

/** The name the app pages use for the same shape. One type, two spellings of it. */
export type Limit = LimitFigures;

/** Seats: what the plan allows and what is sitting in them. A pending invite holds one. */
export type Seats = {
  limit: number | null;
  users: number;
  pending_invites: number;
  used: number;
  remaining: number;
  enforced: boolean;
};

export type Billing = {
  plan_code: string;
  plan_name: string;
  status: string;
  active: boolean;
  api_access: boolean;
  consumer_access: boolean;
  max_users: number | null;
  /** Standing alerts the plan allows, paused ones included. Null is unlimited. */
  max_alerts?: number | null;
  limits?: Record<string, LimitFigures>;
  /** Seats used and allowed. Absent on an older API. */
  seats?: Seats;
  /** Whether this install takes payment online at all. Absent on an older API: treat as false. */
  payments_enabled?: boolean;
  /** Whether this person may start a checkout or open the billing portal. */
  can_manage_billing?: boolean;
  /** Whether the organisation has a Stripe customer, so "Manage billing" has something to open. */
  has_billing_account?: boolean;
  trial_ends_at?: string | null;
  trial_available?: boolean;
  trial_eligible?: boolean;
  trial_consent_version?: string | null;
  trial_identity_rejected?: boolean;
  trial_invoice_url?: string | null;
  trial_price_cents?: number | null;
  current_price_cents?: number | null;
  current_period_end?: string | null;
  purchasable_plans?: PurchasablePlan[];
  /**
   * Whether home address and cell phone can actually be revealed today: a contract plan that
   * includes them, switched on for this install. Absent on an older API: treat as false.
   */
  premium_contacts?: boolean;
  /** Reveals a reveal counts as when it hands over a home address or cell phone. */
  premium_reveal_units?: number;
};

export type PurchasablePlan = {
  max_users?: number | null;
  code: string;
  name: string;
  description: string | null;
  price_cents: number | null;
};

function base(): string {
  return accountApiOrigin(process.env.NPI_ACCOUNT_API_BASE_URL, process.env.NPI_API_BASE_URL);
}

/** Pull one cookie's value out of a response's Set-Cookie headers. */
function readSetCookie(response: Response, name: string): string | null {
  const all = response.headers.getSetCookie?.() ?? [];
  for (const line of all) {
    const [pair] = line.split(";");
    const [key, ...rest] = pair.split("=");
    if (key.trim() === name) return rest.join("=");
  }
  return null;
}

/**
 * The visitor's address, for the API to count them by.
 *
 * Every call from here reaches the API from this container, so without it the API's per-IP
 * limits - five sign-ups an hour, ten reset requests, the failed sign-in lockout - would count
 * every visitor on earth as one, and one busy hour would close sign-up for everybody.
 *
 * Only `X-Real-IP`, which the public edge sets from its own resolution of the chain
 * (`{client_ip}` with trusted_proxies_strict in Caddyfile.public), is believed - never the
 * visitor's `X-Forwarded-For`, whose leftmost entry is theirs to write. The value must parse as an
 * address; anything else is dropped and the API falls back to the connection, which is the old
 * behaviour rather than a spoofed one. Reaching this container directly is only possible from
 * the host and the internal network.
 *
 * Not used by the public, cached calls in api.ts: reading request headers there would turn every
 * directory page from cached into rendered per request, and those calls are metered per key, not
 * per address.
 */
async function forwardedFor(): Promise<Record<string, string>> {
  const address = (await headers()).get("x-real-ip")?.trim();
  return address && isIP(address) ? { "X-Forwarded-For": address } : {};
}

/** A CSRF token and the cookie that must accompany it. */
async function csrfPair(): Promise<{ token: string; cookie: string }> {
  const response = await fetch(`${base()}/api/auth/csrf`, { cache: "no-store" });
  if (!response.ok) throw new Error(`The API would not issue a CSRF token (${response.status}).`);
  const body = (await response.json()) as { csrf_token: string };
  const cookie = readSetCookie(response, CSRF_COOKIE) ?? body.csrf_token;
  return { token: body.csrf_token, cookie };
}

export type ApiResult<T> =
  | { ok: true; data: T; sessionToken: string | null }
  | { ok: false; status: number; code: string; detail: string; fields?: Record<string, string> };

/**
 * Send a body to the API as this visitor, carrying CSRF and (optionally) their session.
 *
 * `method` exists because the API says what it means: replacing something that already exists is
 * a PUT and changing part of it is a PATCH, and tunnelling either through POST would make this
 * file disagree with the endpoint it is calling. Nothing else differs - the API enforces the CSRF
 * double-submit on every unsafe method alike.
 */
export async function apiPost<T>(
  path: string,
  body: unknown,
  { sessionToken, method = "POST" }: {
    sessionToken?: string | null;
    method?: "POST" | "PUT" | "PATCH";
  } = {},
): Promise<ApiResult<T>> {
  const { token, cookie } = await csrfPair();
  const jar = [`${CSRF_COOKIE}=${cookie}`];
  if (sessionToken) jar.push(`${API_SESSION_COOKIE}=${sessionToken}`);

  const response = await fetch(`${base()}${path}`, {
    method,
    headers: {
      ...(await forwardedFor()),
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-CSRF-Token": token,
      Cookie: jar.join("; "),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const issued = readSetCookie(response, API_SESSION_COOKIE);
  if (response.status === 204) {
    return { ok: true, data: undefined as T, sessionToken: issued };
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // A non-JSON body means something in front of the API answered.
  }

  if (!response.ok) {
    const error = (payload ?? {}) as { detail?: string; code?: string; fields?: Record<string, string> };
    return {
      ok: false,
      status: response.status,
      code: error.code ?? "error",
      detail: error.detail ?? `The API answered ${response.status}.`,
      fields: error.fields,
    };
  }
  return { ok: true, data: payload as T, sessionToken: issued };
}

/**
 * GET from the API with no session, for a page whose credential is the token in its own URL.
 *
 * The invite page is the one of these: somebody reading their mail is not signed in - that is the
 * whole point of an invitation - and the token in the link is what the API believes. The refusal
 * is returned rather than flattened to null, because "expired", "already used" and "withdrawn" are
 * three different things to tell somebody.
 *
 * Never cached: the answer is about one token and changes the moment the invite is accepted.
 */
export async function apiGetWithToken<T>(path: string): Promise<ApiResult<T>> {
  const response = await fetch(`${base()}${path}`, {
    headers: { ...(await forwardedFor()), Accept: "application/json" },
    cache: "no-store",
  });
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // A non-JSON body means something in front of the API answered.
  }
  if (!response.ok) {
    const error = (payload ?? {}) as { detail?: string; code?: string };
    return {
      ok: false,
      status: response.status,
      code: error.code ?? "error",
      detail: error.detail ?? `The API answered ${response.status}.`,
    };
  }
  return { ok: true, data: payload as T, sessionToken: null };
}

/** GET from the API as the signed-in visitor. Null when they are not signed in. */
async function apiGet<T>(path: string): Promise<T | null> {
  const token = await sessionToken();
  if (!token) return null;
  const response = await fetch(`${base()}${path}`, {
    headers: {
      ...(await forwardedFor()),
      Accept: "application/json",
      Cookie: `${API_SESSION_COOKIE}=${token}`,
    },
    cache: "no-store",
  });
  if (!response.ok) return null;
  return (await response.json()) as T;
}

export async function sessionToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value ?? null;
}

/** Who is signed in, or null. Costs one call to the API and is never cached. */
export const getMe = cache(async (): Promise<Me | null> => {
  const token = await sessionToken();
  return readIdentity<Me>(token, async () => fetch(`${base()}/api/auth/me`, {
    headers: { ...(await forwardedFor()), Accept: "application/json", Cookie: `${API_SESSION_COOKIE}=${token}` },
    cache: "no-store",
  }));
});

/** What this organisation is on and what it has spent. */
export async function getBilling(): Promise<Billing | null> {
  return apiGet<Billing>("/api/billing");
}

export type SearchRow = {
  npi: string;
  type: "individual" | "organization";
  status: string;
  name: string;
  credentials: string | null;
  primary_taxonomy: { code: string; display: string } | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  phone: string | null;
  employer_name: string | null;
  /** How many addresses this search is allowed to see and show. Suppression-aware: the platform
   *  counts and displays an address under exactly the same conditions, so a row can never say it
   *  holds three and then hand over one the filter excluded. */
  email_count?: number;
  updated_at: string | null;
};

export type SearchPage = {
  items: SearchRow[];
  total: number;
  page: number;
  page_size: number;
  hint?: string | null;
};

/**
 * Search as the signed-in customer rather than as this site.
 *
 * The public pages use the site's own key, which is capped at the public record. Here the
 * request carries the customer's session, so what comes back is what *their* plan allows - and
 * a row they may not see is a row the API does not return, rather than one this code has to
 * remember to hide.
 */
/** One EHR product we have actually identified, and how many providers run it. */
export type CredentialOption = { code: string; label: string; provider_count: number };

/**
 * The credentials worth filtering on, with how many providers filed each.
 *
 * A list rather than a text box for the same reason as the EHR systems below: the filter matches
 * curated codes, so a typed "M.D." finds nothing and an empty result reads as "no such providers".
 *
 * The count is of providers who *filed* that credential. NPPES does not require one, so a large
 * part of the registry has none at all and is excluded by any credential filter - physicians
 * included. The screen says so beside the control, because a filter that silently drops most of
 * the file is one somebody will otherwise trust.
 */
export async function getCredentials(): Promise<CredentialOption[]> {
  return (await apiGet<CredentialOption[]>("/api/reference/credentials")) ?? [];
}

export type EhrOption = { ehr_system: string; provider_count: number };

/**
 * The EHR products that can be filtered on, biggest first.
 *
 * The platform counts these from the data rather than listing a vendor table, precisely so the
 * filter is a list and not a text box: `ehr_system` is an **exact** match, so a typed name that is
 * almost right returns nothing, and an empty result reads as "no such providers" rather than "no
 * such spelling".
 */
export async function getEhrSystems(): Promise<EhrOption[]> {
  return (await apiGet<EhrOption[]>("/api/reference/ehr-systems")) ?? [];
}


/**
 * The Open Payments program years the platform holds, newest first.
 *
 * Asked rather than worked out. The platform refuses a program year nothing loaded into - the
 * amount filter and its "paid under" twin disagree about an empty year in opposite directions -
 * and a screen cannot know which years those are, because CMS publishes a program year in the
 * middle of the following one. An empty array means Open Payments has not been loaded, in which
 * case the year field has nothing to offer and is not shown.
 */
export async function getPaymentYears(): Promise<number[]> {
  return (await apiGet<number[]>("/api/reference/open-payments/years")) ?? [];
}

/** One health system a search can be narrowed to, named the way a customer may name it. */
export type HealthSystemOption = {
  slug: string;
  name: string;
  hq_state: string | null;
  hospitals: number;
};

/**
 * Health systems matching what somebody typed, for the picker on the search screen.
 *
 * Picked and not typed, for the reason the EHR filter is a list: the platform matches a system
 * exactly, so a name that is almost right returns nothing and reads as "nobody works there". What
 * comes back carries the permanent **slug**, which is what the filter takes and what may appear in
 * a URL - `idn_systems.id` is an internal field and this surface does not serve it.
 *
 * Null when the platform did not answer, which the screen says out loud rather than showing an
 * empty list; an empty array means it answered and nothing matched.
 */
export async function findHealthSystems(q: string): Promise<HealthSystemOption[] | null> {
  return apiGet<HealthSystemOption[]>(
    `/api/reference/health-systems?q=${encodeURIComponent(q)}`,
  );
}

export async function searchAsUser(
  filters: Record<string, string | number | string[] | undefined>,
): Promise<SearchPage | null> {
  const search = new URLSearchParams();
  for (const [name, value] of Object.entries(filters)) {
    // An array is a repeatable filter - `hcpcs_code`, `drug` - and every value is appended under
    // the same name, which is what the platform's list filters expect. `set` would keep only the
    // last one and silently narrow a search the customer thought they had widened.
    if (Array.isArray(value)) {
      for (const one of value) if (one !== "") search.append(name, one);
    } else if (value !== undefined && value !== "") {
      search.set(name, String(value));
    }
  }
  return apiGet<SearchPage>(`/api/providers?${search}`);
}

/**
 * The procedure and drug pickers, and what a provider actually billed and prescribed.
 *
 * All three read the platform's own screens rather than `/api/v1`, for the same reason
 * `searchAsUser` does: the request carries the customer's session, so it costs their account
 * nothing beyond what the app already costs, and it reaches exactly what their plan allows. The
 * `/v1` twins of the two pickers exist for a customer's own code, where they are metered as the
 * published contract says.
 */
export type ProcedureOption = {
  code: string;
  description: string | null;
  drug: boolean;
  provider_count: number;
};

export type DrugOption = {
  name: string;
  kind: string;
  generics: string[];
  prescriber_count: number;
};

/**
 * Procedure codes matching what somebody typed - a code prefix, or words from the description.
 *
 * This is the whole point of a picker: "knee replacement" has to find 27447, because a customer
 * knows the operation and not the code. Null when the platform did not answer; an empty array
 * means it answered and nothing matched, which the screen says differently.
 */
export async function findProcedures(q: string): Promise<ProcedureOption[] | null> {
  const search = new URLSearchParams({ q, limit: "25" });
  return apiGet<ProcedureOption[]>(`/api/reference/hcpcs?${search}`);
}

/** Drug names, brand and generic, matching what somebody typed. */
export async function findDrugs(q: string): Promise<DrugOption[] | null> {
  const search = new URLSearchParams({ q, limit: "25" });
  const page = await apiGet<{ items: DrugOption[] }>(`/api/reference/drugs?${search}`);
  return page === null ? null : page.items;
}

/** One published procedure line for one provider. */
export type ProcedureLine = {
  code: string;
  description: string | null;
  drug: boolean;
  place_of_service: string;
  beneficiaries: number | null;
  services: number | null;
  avg_submitted_charge: number | null;
  avg_allowed_amount: number | null;
  avg_payment_amount: number | null;
};

/** One published prescribing line for one provider. */
export type PrescriptionLine = {
  brand_name: string | null;
  generic_name: string | null;
  claims: number | null;
  claims_suppressed: boolean;
  beneficiaries: number | null;
  beneficiaries_suppressed: boolean;
  drug_cost: number | null;
};

/**
 * What this provider billed and prescribed, as the platform publishes it.
 *
 * Three states have to survive this function, and the types are chosen so they cannot be
 * flattened into each other by a careless screen:
 *
 * - the whole call failed, or nobody is signed in: `null`. Say nothing.
 * - we hold none of that dataset: the member is `null`. A statement about us.
 * - we hold it and the provider has nothing in it: `items` is empty with a `year`. A statement
 *   about what was published, and not a statement that they do none of it.
 */
export type ProviderClaims = {
  npi: string;
  procedures: { year: number; total_rows: number; items: ProcedureLine[] } | null;
  prescribing: {
    year: string;
    total_rows: number;
    items: PrescriptionLine[];
    withheld: boolean;
  } | null;
};

export async function getProviderClaims(npi: string): Promise<ProviderClaims | null> {
  const detail = await apiGet<ProviderClaims>(`/api/providers/${encodeURIComponent(npi)}`);
  if (detail === null) return null;
  // Only the two panels, so nothing else on the platform's own provider record leaks into a
  // customer screen by being present in the payload.
  return {
    npi,
    procedures: detail.procedures ?? null,
    prescribing: detail.prescribing ?? null,
  };
}

export type ContactRow = {
  npi: string;
  type: string;
  value: string;
  tier: string | null;
  confidence: number | null;
  quarantined: boolean;
  source?: string | null;
  /**
   * Cell phones only: the vendor's Do-Not-Call flag as of its release, not the live registry.
   * `null` (or absent) is unknown - never "not flagged".
   */
  do_not_call?: boolean | null;
};

/** Why home address and cell phone were not shown - the API's `restricted_reason`. */
export type RestrictedReason = "plan" | "not_enabled" | "permission";

export type OpenedContacts = {
  rows: ContactRow[];
  /** Kinds the plan does not include (or not yet), as opposed to kinds with nothing on file. */
  restricted: string[];
  restrictedReason: RestrictedReason | null;
  /** Kinds held back because the value, or that field of this provider, is suppressed. */
  withheld: string[];
};

/**
 * The contact points already unlocked for one provider.
 *
 * Called after a reveal rather than holding the reveal's response through a redirect. It is free
 * to call: the charge happened at the reveal, and showing somebody again what they already paid
 * for should not cost them anything - including a second charge sneaked in by a page refresh.
 */
export async function getContacts(npi: string): Promise<OpenedContacts> {
  const page = await apiGet<{
    items: ContactRow[];
    restricted?: string[];
    restricted_reason?: RestrictedReason | null;
    withheld?: string[];
  }>(`/api/contacts?npi=${encodeURIComponent(npi)}&include_quarantined=false&page_size=10`);
  return {
    rows: page?.items ?? [],
    restricted: page?.restricted ?? [],
    restrictedReason: page?.restricted_reason ?? null,
    withheld: page?.withheld ?? [],
  };
}

export type RevealOutcome = {
  ok: boolean;
  charged?: boolean;
  used?: number;
  limit?: number | null;
  code?: string;
  detail?: string;
  /** A contact reveal that had nothing it could hand over, and so charged nothing. */
  empty?: boolean;
};

/** Open one provider's contact details, spending the organisation's allowance if it is new. */
export async function revealProvider(npi: string): Promise<RevealOutcome> {
  const token = await sessionToken();
  if (!token) return { ok: false, code: "signed_out", detail: "Sign in again." };
  const result = await apiPost<{
    charged: boolean;
    used: number;
    limit: number | null;
  }>(`/api/contacts/${encodeURIComponent(npi)}/reveal`, {}, { sessionToken: token });
  if (!result.ok) return { ok: false, code: result.code, detail: result.detail };
  return {
    ok: true,
    charged: result.data.charged,
    used: result.data.used,
    limit: result.data.limit,
  };
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: (process.env.SITE_BASE_URL ?? "").startsWith("https://"),
    path: "/",
    // Shorter than the API's own session so a forgotten tab stops working here first.
    maxAge: 60 * 60 * 24 * 7,
  };
}

export { SESSION_COOKIE };

// --- search everything, facilities and people with no NPI ------------------------------------

export type OmniItem = {
  title: string;
  subtitle: string | null;
  href: string;
  badges: string[];
  rank: number;
  /** The row's own identifier: an NPI, a CCN, or a non-NPI contact id. */
  ref?: string | null;
  /**
   * Whether a usable work email and a usable practice phone exist for this row - suppression
   * applied, so a provider whose only address is suppressed is `false`. Null where the question
   * does not apply to the kind.
   *
   * Flags, never values: the address itself stays behind the metered reveal. There is no
   * equivalent for a home address or a cell phone and there must not be - they are contract-only,
   * and marking which rows have one would publish for free what the reveal is for.
   */
  has_email?: boolean | null;
  has_phone?: boolean | null;
};

export type OmniGroup = {
  group: string;
  label: string;
  /** Hits this group had before the five-row cap. */
  count: number;
  items: OmniItem[];
};

export type OmniResult = {
  query: string;
  shapes: string[];
  groups: OmniGroup[];
  timed_out: string[];
  notes: string[];
};

/**
 * The one box, as the signed-in customer. The API decides which groups a customer organisation is
 * asked at all - providers, organisations, facilities and non-NPI contacts - so a group this page
 * does not know how to draw is a group it was never sent, not one it has to remember to hide.
 */
export async function searchEverything(q: string): Promise<OmniResult | null> {
  return apiGet<OmniResult>(`/api/search?q=${encodeURIComponent(q)}`);
}

export type FacilityContact = {
  id: number;
  source: string;
  source_label: string;
  name: string;
  title: string | null;
  role: string | null;
  role_group: string;
  has_phone: boolean;
  /** Only once this organisation revealed the person this month. */
  phone: string | null;
  phone_suppressed: boolean;
  revealed: boolean;
};

export type FacilityOwner = {
  owner_name: string | null;
  owner_type: string | null;
  role: string;
  private_equity: boolean;
  reit: boolean;
};

/**
 * One figure from a Medicare cost report, with where it came from.
 *
 * `source` is the point of the type: the worksheet, line and column a measure was read from, or
 * the formula a ratio was computed with. A hospital's revenue is only worth showing next to the
 * cell it came out of, and the API already carries it.
 */
export type FinancialValue = {
  slug: string;
  label: string;
  /** `usd`, `days`, `discharges`, `beds`, `fte`, `ratio`, or `pct` - where 5.2 means 5.2%. */
  unit: string;
  /** Null when the hospital did not file it. Not zero: a figure nobody filed is not a zero. */
  value: number | null;
  source: string;
};

export type CostReportYear = {
  rpt_rec_num: number;
  /** The HCRIS file year; the period it covers is `fy_begin` to `fy_end`. */
  fiscal_year: number;
  fy_begin: string | null;
  fy_end: string | null;
  report_status: string | null;
  report_status_label: string | null;
  control_type: string | null;
  control_type_label: string | null;
  processed_on: string | null;
  /** For example `2552-10`. */
  form: string;
  layout: string | null;
  measures: FinancialValue[];
  /** Computed from `measures` on read, never stored. Null whenever an input is missing. */
  ratios: FinancialValue[];
};

export type FacilityFinancials = {
  latest: CostReportYear;
  previous?: CostReportYear | null;
};

export type FacilityDetail = {
  network?: WorkspaceDecisionNetworkData | null;
  ccn: string;
  facility_type: string;
  name: string | null;
  address_line: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  county: string | null;
  /** The published main line - free to customers. Null when none is filed or it is suppressed. */
  phone: string | null;
  ownership_type: string | null;
  chain_organization: string | null;
  certified_beds: number | null;
  certification_date: string | null;
  overall_rating: number | null;
  health_inspection_rating: number | null;
  staffing_rating: number | null;
  quality_measure_rating: number | null;
  emergency_services: boolean | null;
  npi: string | null;
  npi_source: string | null;
  organization_name: string | null;
  listed_by: string;
  owners: FacilityOwner[];
  contacts: FacilityContact[];
  medicare: {
    category: string | null;
    category_code: string | null;
    subtype: string | null;
    subtype_code: string | null;
    bed_count: number | null;
    certified_bed_count: number | null;
    participation_date: string | null;
    certification_date: string | null;
    terminated: boolean;
    termination_date: string | null;
    control_type: string | null;
    pos_quarter: string;
  } | null;
  /** The Medicare cost report, when this facility filed one. Null for most non-hospitals. */
  financials?: FacilityFinancials | null;
};

export async function getFacility(ccn: string): Promise<FacilityDetail | null> {
  return apiGet<FacilityDetail>(`/api/facilities/${encodeURIComponent(ccn)}`);
}

export type Person = {
  id: number;
  source: string;
  full_name: string;
  title: string | null;
  role_group: string;
  credential: string | null;
  organization_npi: string | null;
  organization_name: string | null;
  city: string | null;
  state: string | null;
  facility_count: number;
  has_phone: boolean;
  phone: string | null;
  phone_suppressed: boolean;
  revealed: boolean;
};

export async function getPerson(id: string): Promise<Person | null> {
  return apiGet<Person>(`/api/people/${encodeURIComponent(id)}`);
}

/**
 * Open one non-NPI contact's number. The same allowance, pace rules, lock and audit as a provider
 * reveal - the API applies them; this only carries the answer back to the form.
 */
export async function revealContact(id: string): Promise<RevealOutcome> {
  const token = await sessionToken();
  if (!token) return { ok: false, code: "signed_out", detail: "Sign in again." };
  const result = await apiPost<{
    charged: boolean;
    used: number;
    limit: number | null;
    contacts: { kind: string; value: string }[];
    withheld: string[];
  }>(`/api/people/${encodeURIComponent(id)}/reveal`, {}, { sessionToken: token });
  if (!result.ok) return { ok: false, code: result.code, detail: result.detail };
  return {
    ok: true,
    charged: result.data.charged,
    used: result.data.used,
    limit: result.data.limit,
    // Nothing handed over: no number on file, or the only one is suppressed. Not charged.
    empty: result.data.contacts.length === 0,
  };
}

// --- "this is wrong": reporting a field, and what we have already reported --------------------

/** One field this organisation reported, as `GET /api/field-corrections/reported` returns it. */
export type ReportedField = {
  reference: string;
  subject_kind: string;
  subject_id: string;
  field: string;
  reason: string;
  /** `new` is what a page shows as "reported, under review". */
  status: string;
  created_at: string;
  reviewed_at: string | null;
};

/**
 * What this organisation has already said about these records - never anybody else's reports, and
 * never the public's; the API scopes it to the caller's own organisation.
 *
 * One call for a page of rows rather than one per row: `subject_id` repeats. A signed-out or failed
 * read gives an empty map, so a record page renders with no marker rather than not at all - the
 * marker is a courtesy, and losing it must not lose the page.
 */
export async function getReportedFields(
  subjectKind: string,
  subjectIds: string[],
): Promise<Map<string, ReportedField[]>> {
  const wanted = [...new Set(subjectIds.filter(Boolean))].slice(0, 200);
  const out = new Map<string, ReportedField[]>();
  if (wanted.length === 0) return out;
  const search = new URLSearchParams({ subject_kind: subjectKind });
  for (const id of wanted) search.append("subject_id", id);
  const result = await apiGet<{ items: ReportedField[] }>(
    `/api/field-corrections/reported?${search.toString()}`,
  );
  for (const item of result?.items ?? []) {
    out.set(item.subject_id, [...(out.get(item.subject_id) ?? []), item]);
  }
  return out;
}

export type ReportAccepted = {
  status: string;
  reference: string | null;
  already_reported: boolean;
};

/**
 * Report a field as wrong, as the signed-in customer. The API records which organisation and which
 * person said it; nothing on the record changes until somebody on our team decides.
 */
export async function reportCorrection(body: {
  subject_kind: string;
  subject_id: string;
  field: string;
  reason: string;
  note: string | null;
}): Promise<ApiResult<ReportAccepted>> {
  return postAsUser<ReportAccepted>("/api/field-corrections", body);
}

// --- two-step sign-in and the account's own security ------------------------------------------

/**
 * A sign-in waiting for its code: the opaque token the API handed back for a correct password.
 *
 * It is not the password and cannot become one; on its own it signs nobody in. It is still kept
 * as narrowly as a credential: httpOnly, Strict, sent only to the one handler that finishes the
 * sign-in, and gone after five minutes - the API's own lifetime for it - or at the first answer
 * that ends the attempt. Never in the URL, where history, logs and Referer headers would keep it.
 */
export const MFA_PENDING_COOKIE = "npim_mfa";
export const MFA_PENDING_PATH = "/api/auth/mfa";

export function mfaPendingCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: (process.env.SITE_BASE_URL ?? "").startsWith("https://"),
    path: MFA_PENDING_PATH,
    maxAge: 60 * 5,
  };
}

export type MfaSetup = { secret: string; otpauth_url: string };

export type MfaStatus = {
  enabled: boolean;
  recovery_codes_left: number;
  /** Set up but not yet confirmed. Absent once two-step sign-in is on: the secret is never shown again. */
  pending: MfaSetup | null;
};

export async function getMfaStatus(): Promise<MfaStatus | null> {
  return apiGet<MfaStatus>("/api/auth/mfa");
}

/** POST as the signed-in visitor; a clear refusal rather than a throw when there is no session. */
async function postAsUser<T>(
  path: string,
  body: unknown,
  method: "POST" | "PUT" | "PATCH" = "POST",
): Promise<ApiResult<T>> {
  const token = await sessionToken();
  if (!token) {
    return { ok: false, status: 401, code: "not_authenticated", detail: "Sign in again." };
  }
  return apiPost<T>(path, body, { sessionToken: token, method });
}

export async function changePassword(current: string, next: string): Promise<ApiResult<void>> {
  return postAsUser<void>("/api/auth/password", { current_password: current, new_password: next });
}

/** Sign out every other session on this account, keeping this one. Returns how many went. */
export async function revokeOtherSessions(): Promise<ApiResult<{ revoked: number }>> {
  return postAsUser<{ revoked: number }>("/api/auth/sessions/revoke-others", {});
}

export async function startMfaSetup(): Promise<ApiResult<MfaSetup>> {
  return postAsUser<MfaSetup>("/api/auth/mfa/setup", {});
}

export async function enableMfa(code: string): Promise<ApiResult<{ recovery_codes: string[] }>> {
  return postAsUser<{ recovery_codes: string[] }>("/api/auth/mfa/enable", { code });
}

export async function disableMfa(password: string): Promise<ApiResult<void>> {
  return postAsUser<void>("/api/auth/mfa/disable", { password });
}

export async function replaceRecoveryCodes(
  password: string,
): Promise<ApiResult<{ recovery_codes: string[] }>> {
  return postAsUser<{ recovery_codes: string[] }>("/api/auth/mfa/recovery-codes", { password });
}

// --- single sign-on ---------------------------------------------------------------------------

export type SsoProviderName = "google" | "microsoft";
export type SsoProvider = { name: SsoProviderName; label: string };

export const SSO_PROVIDERS: readonly SsoProviderName[] = ["google", "microsoft"];

export function isSsoProvider(name: string): name is SsoProviderName {
  return (SSO_PROVIDERS as readonly string[]).includes(name);
}

/**
 * The attempt in flight: which provider, the state we expect back, and the binding secret the API
 * checks to know this is the browser that started it. Scoped to the SSO routes, httpOnly, and gone
 * after ten minutes or the first callback, whichever comes first.
 *
 * SameSite=Lax rather than Strict on purpose: the provider sends the browser back with a top-level
 * GET from its own origin, and Strict would leave the cookie behind on exactly that request.
 */
export const SSO_ATTEMPT_COOKIE = "npim_sso";
export const SSO_ATTEMPT_PATH = "/api/auth/sso";

/**
 * A provider-confirmed address with no account yet, carried to the sign-up form so it can be
 * filled in. In a cookie rather than the URL, so the address stays out of history, logs and
 * Referer headers.
 */
export const SSO_EMAIL_COOKIE = "npim_sso_email";

export function ssoCookieOptions(path: string) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: (process.env.SITE_BASE_URL ?? "").startsWith("https://"),
    path,
    maxAge: 60 * 10,
  };
}

/**
 * Which sign-in providers are switched on, for the buttons. Empty when none are configured - the
 * normal state - and also when the API cannot be asked: a missing button is a far smaller failure
 * than a sign-in page that will not render.
 */
export async function getSsoProviders(): Promise<SsoProvider[]> {
  try {
    const response = await fetch(`${base()}/api/auth/sso/providers`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });
    if (!response.ok) return [];
    const body = (await response.json()) as { providers?: SsoProvider[] };
    return (body.providers ?? []).filter((p) => isSsoProvider(p.name));
  } catch {
    return [];
  }
}


// --- jobs and exports -------------------------------------------------------------------------

export type JobRow = {
  id: string;
  kind: string;
  label: string;
  status: "queued" | "running" | "succeeded" | "failed" | "cancelled";
  progress: { done: number; total: number | null; note?: string | null };
  created_at: string;
  finished_at: string | null;
  error: string | null;
  result: {
    row_count?: number;
    file_name?: string;
    byte_size?: number;
    /** Email addresses the suppression list withheld: blanked in the file, counted here. */
    suppressed_count?: number;
    /** Which shape the file was written in: csv, tsv, pipe, xlsx or json. */
    format?: string;
    /** The column preset it used, when it used one. */
    preset?: string | null;
  } | null;
};

/** This organisation's export jobs, newest first. */
export async function getExports(): Promise<JobRow[] | null> {
  const page = await apiGet<{ items: JobRow[] }>(
    "/api/jobs?kind=providers.export&page_size=20&sort=-created_at",
  );
  return page === null ? null : page.items;
}

/**
 * Queue an export of `filters` in one format, using one named column preset.
 *
 * The preset is posted by id and resolved by the API, which is where the columns and the CRM
 * header names are defined. This site never sends a column list: one list of columns, in one
 * place, is the whole reason presets exist.
 */
export async function startExport(
  // `string[]` for the repeatable filters - `hcpcs_code`, `drug`. The platform parses the body
  // with the same code its own search uses, so a list arrives as a list rather than as one value.
  filters: Record<string, string | string[]>,
  preset: string,
  format: string,
): Promise<ApiResult<JobRow>> {
  const token = await sessionToken();
  return apiPost<JobRow>(
    "/api/providers/export",
    { filters, preset, format },
    { sessionToken: token },
  );
}

/**
 * Stream one finished export back to the browser.
 *
 * The file lives behind the API and the browser has no credential for it, so the bytes come
 * through here. Streamed rather than buffered: an export can be hundreds of megabytes, and
 * holding one in memory to hand it over would be a way to fall down on the largest file a
 * customer ever asks for.
 */
export async function exportFile(jobId: string): Promise<Response | null> {
  const response = await exportFileResponse(jobId);
  return response?.ok ? response : null;
}

/** Preserve failure status for the download screen; delivery callers still use exportFile. */
export async function exportFileResponse(jobId: string): Promise<Response | null> {
  const token = await sessionToken();
  if (!token) return null;
  const response = await fetch(`${base()}/api/jobs/${encodeURIComponent(jobId)}/download`, {
    headers: { ...(await forwardedFor()), Cookie: `${API_SESSION_COOKIE}=${token}` },
    cache: "no-store",
  });
  return response;
}

// --- append -----------------------------------------------------------------------------------

/** This organisation's append jobs, newest first. */
export async function getAppends(): Promise<JobRow[] | null> {
  const page = await apiGet<{ items: JobRow[] }>(
    "/api/jobs?kind=append.enrich&page_size=20&sort=-created_at",
  );
  return page === null ? null : page.items;
}

/**
 * Hand an uploaded list to the API's append tool, as this visitor.
 *
 * Multipart rather than JSON, so it cannot share `apiPost`; the CSRF pair and the session travel
 * the same way. No Content-Type is set by hand - fetch writes the multipart boundary itself, and
 * a hand-written header without one is a request the API cannot parse.
 */
export async function startAppend(file: File, fields: string[]): Promise<ApiResult<JobRow>> {
  const token = await sessionToken();
  const { token: csrf, cookie } = await csrfPair();
  const jar = [`${CSRF_COOKIE}=${cookie}`];
  if (token) jar.push(`${API_SESSION_COOKIE}=${token}`);

  const body = new FormData();
  body.append("file", file, file.name);
  for (const field of fields) body.append("fields", field);

  const response = await fetch(`${base()}/api/append/jobs`, {
    method: "POST",
    headers: {
      ...(await forwardedFor()),
      Accept: "application/json",
      "X-CSRF-Token": csrf,
      Cookie: jar.join("; "),
    },
    body,
    cache: "no-store",
  });
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // Something in front of the API answered.
  }
  if (!response.ok) {
    const error = (payload ?? {}) as { detail?: string; code?: string };
    return {
      ok: false,
      status: response.status,
      code: error.code ?? "error",
      detail: error.detail ?? `The API answered ${response.status}.`,
    };
  }
  return { ok: true, data: payload as JobRow, sessionToken: null };
}

// --- API keys ---------------------------------------------------------------------------------

export type KeyRow = {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  status: string;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
};

export type ScopeRow = { scope: string; description: string; available: boolean };

export async function getKeys(): Promise<KeyRow[] | null> {
  return await apiGet<KeyRow[]>("/api/keys");
}

/** The scopes a key may be given. Reference data for the form, so an empty answer is one fewer
 *  checkbox rather than a claim about anything the customer owns - folded on purpose. */
export async function getScopes(): Promise<ScopeRow[]> {
  return (await apiGet<ScopeRow[]>("/api/keys/scopes")) ?? [];
}

export async function createKey(
  name: string,
  scopes: string[],
): Promise<ApiResult<KeyRow & { secret: string }>> {
  const token = await sessionToken();
  return apiPost<KeyRow & { secret: string }>(
    "/api/keys",
    { name, scopes },
    { sessionToken: token },
  );
}

/** DELETE as the signed-in visitor, with the CSRF pair the API requires of any unsafe method. */
async function apiDelete(path: string): Promise<boolean> {
  const session = await sessionToken();
  if (!session) return false;
  const { token, cookie } = await csrfPair();
  const response = await fetch(`${base()}${path}`, {
    method: "DELETE",
    headers: {
      ...(await forwardedFor()),
      "X-CSRF-Token": token,
      Cookie: `${CSRF_COOKIE}=${cookie}; ${API_SESSION_COOKIE}=${session}`,
    },
    cache: "no-store",
  });
  return response.ok;
}

export async function revokeKey(id: string): Promise<boolean> {
  return apiDelete(`/api/keys/${encodeURIComponent(id)}`);
}

/**
 * Switch off a colleague's two-step sign-in, for somebody who has lost their phone and their
 * recovery codes. The API allows it only inside the admin's own organisation, never on their own
 * account (that needs their password, on the security page), and records it in the audit log.
 */
export async function resetColleagueMfa(id: string): Promise<ApiResult<void>> {
  return postAsUser<void>(`/api/users/${encodeURIComponent(id)}/mfa/reset`, {});
}

/** Whether this team requires two-step sign-in, and how many people have not set one up. */
export type TwoStepPolicy = {
  required: boolean;
  members_total: number;
  members_without: number;
};

export async function getTwoStepPolicy(): Promise<TwoStepPolicy | null> {
  return apiGet<TwoStepPolicy>("/api/users/two-step");
}

export async function setTwoStepPolicy(required: boolean): Promise<ApiResult<TwoStepPolicy>> {
  return postAsUser<TwoStepPolicy>("/api/users/two-step", { required }, "PUT");
}

export async function revokeInvite(id: string): Promise<boolean> {
  return apiDelete(`/api/invites/${encodeURIComponent(id)}`);
}

// --- people and invites -----------------------------------------------------------------------

export type PersonRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  last_login_at: string | null;
  mfa_enabled?: boolean;
};

export type InviteRow = {
  id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
};

export async function getPeople(): Promise<PersonRow[] | null> {
  const page = await apiGet<{ items: PersonRow[] }>("/api/users?page_size=50");
  return page === null ? null : page.items;
}

export async function getInvites(): Promise<InviteRow[] | null> {
  const page = await apiGet<{ items: InviteRow[] }>("/api/invites?page_size=50");
  return page === null ? null : page.items;
}

export async function inviteColleague(
  email: string,
  role: string,
  name?: string,
): Promise<ApiResult<{ invite: InviteRow; invite_url: string }>> {
  const token = await sessionToken();
  return apiPost<{ invite: InviteRow; invite_url: string }>(
    "/api/invites",
    { email, role, name: name || undefined },
    { sessionToken: token },
  );
}

/**
 * Confirm an address from the link in the email.
 *
 * No session: the link is often opened in a different browser from the one that signed up, and
 * the token is the proof on its own. That is also why the token travels in a form post from our
 * own page rather than being acted on as the link is opened - a GET that mutates is a GET that
 * mail scanners and link previewers will fire for you.
 */
export async function verifyEmail(token: string): Promise<{ ok: boolean; code?: string }> {
  const result = await apiPost<void>("/api/auth/verify-email", { token });
  return result.ok ? { ok: true } : { ok: false, code: result.code };
}

/** Ask for another link. Throttled by the API to one every five minutes. */
export async function resendVerification(): Promise<{ ok: boolean; code?: string }> {
  const result = await apiPost<void>("/api/auth/resend-verification", {}, {
    sessionToken: await sessionToken(),
  });
  return result.ok ? { ok: true } : { ok: false, code: result.code };
}

// --- billing ----------------------------------------------------------------------------------

/**
 * Ask the API for a Stripe Checkout page for one plan.
 *
 * What comes back is a URL and nothing more. The plan changes when Stripe's signed webhook
 * reaches the API - never because the browser came back to our success page.
 */
export async function startCheckout(planCode: string, trial?: {consent_version: string; quoted_cents: number}): Promise<ApiResult<{ url: string }>> {
  return apiPost<{ url: string }>(
    "/api/billing/checkout",
    { plan_code: planCode, ...(trial ? {trial: true, ...trial} : {}) },
    { sessionToken: await sessionToken() },
  );
}

/** Ask the API for a Stripe billing-portal page: change card, change plan, cancel. */
export async function openBillingPortal(): Promise<ApiResult<{ url: string }>> {
  return apiPost<{ url: string }>("/api/billing/portal", {}, {
    sessionToken: await sessionToken(),
  });
}

/**
 * The URL the API handed back, if it really is a Stripe-hosted page - otherwise null.
 *
 * The API already checks this. Checking again here costs a line, and a redirect that follows
 * whatever it is handed is an open redirect the day something upstream goes wrong.
 */
export function stripeHostedUrl(raw: string): URL | null {
  try {
    const url = new URL(raw);
    const stripe = url.hostname === "stripe.com" || url.hostname.endsWith(".stripe.com");
    return url.protocol === "https:" && stripe ? url : null;
  } catch {
    return null;
  }
}

// --- standing alerts --------------------------------------------------------------------------

/** The event types an alert can watch, in the words the alerts page and the search form use. */
export const ALERT_EVENT_LABELS: Record<string, string> = {
  new_provider: "New providers",
  practice_moved: "Practice moves",
  hiring: "Organizations hiring",
  deactivated: "Deactivations",
};

export type AlertRunRow = {
  id: number;
  ran_at: string;
  window_start: string;
  window_end: string;
  /** Every event that matched, including any beyond what one run keeps. */
  matched: number;
  stored: number;
  /** Null when no email was attempted - there is no mail host yet, and that is fine. */
  emailed: boolean | null;
};

export type AlertRow = {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  event_types: string[];
  cadence: "daily" | "weekly";
  active: boolean;
  created_at: string;
  created_by_name: string | null;
  last_run_at: string | null;
  last_error: string | null;
  latest_run: AlertRunRow | null;
};

/** One hit: public-record fields only. Contact details are opened on the search page, metered. */
export type AlertHitRow = {
  event_id: number;
  event_type: string;
  label: string;
  event_date: string;
  npi: string;
  name: string;
  specialty: string | null;
  city: string | null;
  state: string | null;
};

export type AlertHits = { items: AlertHitRow[]; runs: AlertRunRow[]; stored_cap: number };

export async function getAlerts(): Promise<AlertRow[] | null> {
  return await apiGet<AlertRow[]>("/api/alerts");
}

export async function getAlertHits(id: string): Promise<AlertHits | null> {
  return apiGet<AlertHits>(`/api/alerts/${encodeURIComponent(id)}/hits?limit=100`);
}

export async function createAlert(body: {
  name: string;
  filters: Record<string, string>;
  event_types: string[];
  cadence: string;
}): Promise<ApiResult<AlertRow>> {
  return apiPost<AlertRow>("/api/alerts", body, { sessionToken: await sessionToken() });
}

/** Pause or resume. Resuming starts from now: the paused weeks are not reported afterwards. */
export async function setAlertActive(id: string, active: boolean): Promise<boolean> {
  const token = await sessionToken();
  if (!token) return false;
  const result = await apiPost<AlertRow>(
    `/api/alerts/${encodeURIComponent(id)}/${active ? "resume" : "pause"}`,
    {},
    { sessionToken: token },
  );
  return result.ok;
}

export async function deleteAlert(id: string): Promise<boolean> {
  return apiDelete(`/api/alerts/${encodeURIComponent(id)}`);
}

/**
 * What this organisation has and has not started yet (`/api/account/first-run`).
 *
 * Every field is counted from the table that records the thing - the reveal ledger, the saved
 * searches, the alerts, the export jobs, the invitations, the keys - rather than from a flag
 * somebody pressed, so the checklist and the pages that list those rows cannot drift apart.
 * `searched` is the exception and the API says so: nothing records a search, so it is answered
 * from work that can only have followed one.
 */
export type FirstRun = {
  searched: boolean;
  revealed: boolean;
  saved: boolean;
  exported: boolean;
  invited: boolean;
  keyed: boolean;
  /** True when there is nothing left to prompt about, so the panel can go. */
  complete: boolean;
};

export async function getFirstRun(): Promise<FirstRun | null> {
  return apiGet<FirstRun>("/api/account/first-run");
}

/** The optional mail this person gets. Both start on; neither is transactional. */
export type EmailPreferences = {
  alert_digests: boolean;
  allowance_warnings: boolean;
};

export async function getEmailPreferences(): Promise<EmailPreferences | null> {
  return apiGet<EmailPreferences>("/api/account/email-preferences");
}

/**
 * Change one or both switches. An omitted kind is left alone, which is why a form that posts one
 * checkbox cannot quietly switch the other off.
 */
export async function setEmailPreferences(
  changes: Partial<EmailPreferences>,
): Promise<ApiResult<EmailPreferences>> {
  return postAsUser<EmailPreferences>("/api/account/email-preferences", changes, "PATCH");
}

/**
 * Change a person's display name.
 *
 * The API guards this with `users.manage`, so somebody who cannot manage people cannot rename
 * themselves either. The settings page asks first rather than offering a field that fails.
 */
export async function renamePerson(id: string, name: string): Promise<ApiResult<PersonRow>> {
  return postAsUser<PersonRow>(`/api/users/${encodeURIComponent(id)}`, { name }, "PATCH");
}

/**
 * End every session this person has, including the one asking.
 *
 * The same endpoint an admin uses on a colleague who has lost a laptop, pointed at themselves.
 * There is nothing gentler to point it at: a session that survived would be the one thing the
 * person wanted gone.
 */
export async function signOutEverywhere(id: string): Promise<ApiResult<void>> {
  return postAsUser<void>(`/api/users/${encodeURIComponent(id)}/revoke-sessions`, {});
}

/* ------------------------------------------------------------------------------------------
 * The owner's business dashboard (`/app/owner`).
 *
 * Internal accounts only. The API refuses anybody else twice over - the permission is outside
 * the customer ceiling and the route checks the organisation kind - and the page checks the
 * permission as well, so a customer never sees the link or a blank screen.
 *
 * Every number arrives as a `Figure`: the value, what one unit of it is, and the window it
 * covers. The page prints those strings rather than writing captions of its own, because a
 * caption that drifts from the query is how a dashboard starts lying. A null `value` always
 * carries `unavailable`, and the tile says so instead of showing a zero.
 * ---------------------------------------------------------------------------------------- */

export type Figure = {
  value: number | null;
  what: string;
  window: string;
  unavailable: string | null;
  approximate: boolean;
};

export type Stamp = { at: string | null; what: string; unavailable: string | null };

export type Consumption = {
  label: string;
  window: string;
  reveals: Figure;
  export_rows: Figure;
  export_files: Figure;
  api_calls: Figure;
  append_rows: Figure;
  alert_emails: Figure;
};

export type TopOrg = {
  org_id: string;
  name: string;
  plan_code: string | null;
  metered_units: number;
  reveals: number;
  export_rows: number;
  api_calls: number;
  append_rows: number;
  export_files: number;
  downloads: number;
};

export type DashboardQueue = {
  key: string;
  label: string;
  description: string;
  waiting: number | null;
  detail: string;
  by_status: { status: string; count: number }[];
  oldest_waiting: string | null;
  path: string;
  unavailable: string | null;
};

export type OwnerMetrics = {
  generated_at: string;
  organisations: {
    total: Figure;
    active_30d: Figure;
    on_paid_plan: Figure;
    on_free_plan: Figure;
    no_subscription: Figure;
    lapsed_or_cancelled: Figure;
    past_due: Figure;
    new_7d: Figure;
    new_30d: Figure;
  };
  users: {
    total: Figure;
    active_30d: Figure;
    seats_used: Figure;
    seats_allowed: Figure;
    orgs_without_seat_cap: Figure;
    two_step_on: Figure;
  };
  today: Consumption;
  this_month: Consumption;
  previous_month: Consumption;
  consumption_trend: {
    what: string;
    window: string;
    days: { day: string; reveals: number; export_rows: number; api_calls: number }[];
    unavailable: string | null;
    rollup_from: string | null;
  };
  exports: {
    window: string;
    files: Figure;
    rows: Figure;
    downloads: Figure;
    top_orgs: TopOrg[];
    top_orgs_window: string;
    top_orgs_note: string;
  };
  growth: {
    what: string;
    window: string;
    days: number;
    signups: { day: string; signups: number }[];
    total: number;
  };
  queues: DashboardQueue[];
  freshness: {
    provider_data: Stamp;
    latest_load: Stamp;
    latest_load_source: string | null;
    providers_published: Figure;
    public_list_counts: Stamp;
  };
  revenue: {
    available: boolean;
    unavailable: string;
    mrr_cents: null;
    arr_cents: null;
    churn_rate: null;
    lifetime_value_cents: null;
    priced_plans: Figure;
    purchasable_plans: Figure;
  };
};

/**
 * Why this does not use `apiGet`: that helper answers null for every unhappy outcome, and this
 * page has to tell them apart. "The API refused you" and "the API is not answering" are
 * different sentences, and a dashboard that renders the same empty screen for both is exactly
 * what somebody would read as "the business has no customers".
 */
export type OwnerMetricsResult =
  | { ok: true; data: OwnerMetrics }
  | { ok: false; reason: "signed-out" | "forbidden" | "unreachable"; detail: string };

export async function getOwnerMetrics(): Promise<OwnerMetricsResult> {
  const token = await sessionToken();
  if (!token) {
    return { ok: false, reason: "signed-out", detail: "This browser is not signed in." };
  }
  let response: Response;
  try {
    response = await fetch(`${base()}/api/owner/metrics`, {
      headers: {
        ...(await forwardedFor()),
        Accept: "application/json",
        Cookie: `${API_SESSION_COOKIE}=${token}`,
      },
      cache: "no-store",
    });
  } catch {
    return {
      ok: false,
      reason: "unreachable",
      detail: "The API did not answer, so no figure on this page could be read.",
    };
  }
  if (response.status === 401) {
    return { ok: false, reason: "signed-out", detail: "The session has expired." };
  }
  if (response.status === 403) {
    return {
      ok: false,
      reason: "forbidden",
      detail: "This account is not an internal one, so the business figures are not readable.",
    };
  }
  if (!response.ok) {
    return {
      ok: false,
      reason: "unreachable",
      detail: `The API answered ${response.status}, so nothing on this page could be read.`,
    };
  }
  return { ok: true, data: (await response.json()) as OwnerMetrics };
}

// --------------------------------------------------------------------------------------
// Lists
// --------------------------------------------------------------------------------------

/**
 * A list is a set of providers somebody chose, kept by their organisation.
 *
 * The platform has carried these since before this site existed - `provider_lists`,
 * `provider_list_members`, and `lists.manage` inside `CUSTOMER_CEILING`, so a customer has always
 * been allowed them. Only the screens were missing, which is why nothing here is a new permission
 * or a new table: these functions call endpoints that were already there and already audited.
 *
 * Two things about a list are worth knowing before reading the pages that use it. Adding is
 * idempotent, so a customer who ticks the same provider twice has a list with one of them and
 * sees no error. And a list holds a provider whatever happens to them afterwards: the platform
 * answers `/lists/{id}/providers` with `status=any` unless asked otherwise, because somebody who
 * goes inactive should not vanish from a list that was built around them without being told.
 */
export type ListRow = {
  id: string;
  name: string;
  description: string | null;
  member_count: number;
  created_by: { id: string; name: string | null; email: string } | null;
  created_at: string;
  updated_at: string;
};

export type ListsPage = { items: ListRow[]; total: number; page: number; page_size: number };

/**
 * Every list this organisation keeps, newest change first - the platform's own default sort.
 *
 * `null` means the platform did not answer; an empty array means this organisation has no lists.
 * Flattening the two made the lists page say "You have no lists yet" to somebody with twenty of
 * them, which is a statement about their data made out of a silence from us. Callers that only
 * need a picker can still write `?? []`.
 */
export async function getLists(): Promise<ListRow[] | null> {
  const page = await apiGet<ListsPage>("/api/lists?page_size=100");
  return page === null ? null : page.items;
}

export async function getList(id: string): Promise<ListRow | null> {
  return apiGet<ListRow>(`/api/lists/${encodeURIComponent(id)}`);
}

/**
 * Start a list, optionally with the providers that prompted it.
 *
 * The refusal is returned rather than flattened: a name already taken is a 409 and the only
 * useful thing to say about it is which name, so the caller can put it back in the form.
 */
export async function createList(body: {
  name: string;
  description?: string;
  npis?: string[];
}): Promise<ApiResult<ListRow>> {
  return apiPost<ListRow>("/api/lists", body, { sessionToken: await sessionToken() });
}

export async function deleteList(id: string): Promise<boolean> {
  return apiDelete(`/api/lists/${encodeURIComponent(id)}`);
}

/** Add providers to a list. Already-members are not an error and not counted twice. */
export async function addToList(id: string, npis: string[]): Promise<ApiResult<ListRow>> {
  return apiPost<ListRow>(`/api/lists/${encodeURIComponent(id)}/members`, { npis }, {
    sessionToken: await sessionToken(),
  });
}

/**
 * Take providers off a list.
 *
 * Sent as repeatable query parameters rather than a body, because that is the shape a DELETE can
 * carry everywhere: the endpoint accepts either, and a DELETE with a JSON body is the one that
 * proxies and runtimes disagree about.
 */
export async function removeFromList(id: string, npis: string[]): Promise<boolean> {
  if (npis.length === 0) return false;
  const query = new URLSearchParams();
  for (const npi of npis) query.append("npis", npi);
  return apiDelete(`/api/lists/${encodeURIComponent(id)}/members?${query}`);
}

/**
 * The providers on a list, searched and paged like any other result.
 *
 * The same endpoint shape as `searchAsUser` on purpose - it takes the same filters - so the list
 * page renders the same rows with the same component and a customer can narrow inside a list
 * without learning a second screen.
 */
export async function listProviders(
  id: string,
  filters: Record<string, string | number | string[] | undefined>,
): Promise<SearchPage | null> {
  const search = new URLSearchParams();
  for (const [name, value] of Object.entries(filters)) {
    if (Array.isArray(value)) {
      for (const one of value) if (one !== "") search.append(name, one);
    } else if (value !== undefined && value !== "") {
      search.set(name, String(value));
    }
  }
  return apiGet<SearchPage>(`/api/lists/${encodeURIComponent(id)}/providers?${search}`);
}

/**
 * Queue the activation file: hashed identifiers for an ad platform or identity graph.
 *
 * `POST /api/audiences/onboard-export`, which needs `providers.export` - inside the customer
 * ceiling, so a customer plan already carries it. The job writes an opaque row id, the best
 * trusted email hashed three ways, the phone as SHA-256 of its E.164 form, first and last name
 * each hashed, and ZIP, state and country in the clear. No NPI and no plaintext identifier are in
 * the file, suppressed values are withheld before hashing, and people left with no key at all are
 * counted and left out.
 *
 * `only_trusted_emails` defaults to true on the platform and is passed explicitly here, because
 * the default being the safe one is not a reason for this call to be silent about which it chose:
 * every address in a file that leaves the building is a claim that it belongs to that person.
 */
export async function startActivationExport(
  filters: Record<string, string | string[]>,
  onlyTrustedEmails = true,
): Promise<ApiResult<JobRow>> {
  return apiPost<JobRow>(
    "/api/audiences/onboard-export",
    { filters, only_trusted_emails: onlyTrustedEmails },
    { sessionToken: await sessionToken() },
  );
}

// --------------------------------------------------------------------------------------
// One provider, as the signed-in customer
// --------------------------------------------------------------------------------------

/**
 * The record behind one NPI.
 *
 * Narrower than the platform's `ProviderDetail` on purpose: this types the fields the signed-in
 * provider page renders, and the platform's row carries a good deal more (mailing address, other
 * filed names, FHIR endpoints, Open Payments by product, Marketplace networks). Typing all of it
 * would be a second copy of a schema that changes, and a field nobody renders is a field nobody
 * notices has gone. Anything added to the page gets added here at the same time.
 *
 * Read as the customer, so what comes back is what *their* plan allows: an address they may not
 * see is one the API does not return, rather than one this code has to remember to hide.
 */
export type ProviderDetail = {
  npi: string;
  type: "individual" | "organization";
  status: string;
  name: string;
  credentials: string | null;
  first_name?: string | null;
  last_name?: string | null;
  primary_taxonomy: { code: string; display: string } | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  phone: string | null;
  employer_name: string | null;
  employer_domain?: string | null;
  updated_at: string | null;
  enumeration_date?: string | null;
  sole_proprietor?: boolean | null;
  practice_address?: {
    line1: string | null;
    line2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    phone: string | null;
    fax: string | null;
  } | null;
  taxonomies?: {
    sequence: number;
    code: string | null;
    display: string | null;
    classification: string | null;
    specialization: string | null;
    is_primary: boolean;
    license_number: string | null;
    license_state: string | null;
  }[];
  emails?: { email: string; type: string | null; source: string | null; is_primary: boolean }[];
  /** A suppressed number is listed, marked, and blank - never quietly dropped. */
  file_phones?: { phone: string; source: string; suppressed: boolean }[];
  organization?: { npi: string; name: string | null } | null;
  state_licenses?: {
    state: string;
    license_type: string;
    occupation: string | null;
    license_number: string;
    status: string;
    issue_date: string | null;
    expiry_date: string | null;
  }[];
  clinician_profile?: {
    medical_school: string | null;
    graduation_year: number | null;
    primary_specialty: string | null;
    secondary_specialties: string | null;
    telehealth: boolean | null;
    group_count: number | null;
  } | null;
  facility_affiliations?: {
    ccn: string;
    facility_type: string;
    facility_type_label: string | null;
    name: string | null;
  }[];
  hie_participation?: { hie_name: string | null; hie_identifier: string; via_name: string | null }[];
  /** True where the whole NPI is suppressed: it appears in no search, count, list or file. */
  suppressed?: boolean;
};

export async function getProviderDetail(npi: string): Promise<ProviderDetail | null> {
  return apiGet<ProviderDetail>(`/api/providers/${encodeURIComponent(npi)}`);
}

export type MembersAdded = {
  list: ListRow;
  /** How many the search matched, after the cap. */
  matched: number;
  /** How many were new. The list grew by exactly this. */
  added: number;
  /** How many of the matches were already members. Not an error and not a charge. */
  already: number;
  capped: boolean;
  cap: number;
};

/**
 * Add everyone a search matches to a list, rather than the rows one page rendered.
 *
 * The screen knows fifty NPIs; the search matches thousands. Posting the fifty would make "add
 * all" mean "add the page", which is the kind of half-feature somebody discovers by counting.
 * This sends the search and the platform resolves it, where the search already is - so
 * suppression, the organisation's scope and the plan's residence rules all apply exactly as they
 * do to the search itself.
 */
export async function addSearchToList(
  id: string,
  filters: Record<string, string | string[]>,
): Promise<ApiResult<MembersAdded>> {
  return apiPost<MembersAdded>(
    `/api/lists/${encodeURIComponent(id)}/members/from-search`,
    { filters },
    { sessionToken: await sessionToken() },
  );
}

// --------------------------------------------------------------------------------------
// Saved searches
// --------------------------------------------------------------------------------------

/**
 * A search kept by name, so a customer can run it again.
 *
 * The fourth capability the platform has carried with customer-level permission and no screen:
 * `saved_searches`, full CRUD under `lists.manage`, and nothing on this site referred to it. A
 * customer who narrowed a search across nine filter groups had no way to keep it - only to save it
 * as an *alert*, which is a different thing (a standing watch over four filters, on a schedule).
 *
 * `params` is the filter object itself, which is why it can be re-run by turning it back into a
 * query string: `searchFilters` is built to round-trip, so what came out goes back in. The
 * platform validates `params` against the same `FILTER_KEYS` an export does, so a name this site
 * emits that the platform does not accept is refused here too.
 */
export type SavedSearchRow = {
  id: string;
  name: string;
  entity: string;
  params: Record<string, string | string[]>;
  created_at: string;
};

/**
 * `null` when the platform did not answer, `[]` when this organisation has kept none.
 *
 * The same distinction `getLists` makes, for the same reason: the panel's empty state says "None
 * yet. Narrow a search and keep it", which is a sentence about what somebody has done, and a
 * failed request is not evidence of it.
 */
export async function getSavedSearches(): Promise<SavedSearchRow[] | null> {
  const page = await apiGet<{ items: SavedSearchRow[] }>(
    "/api/saved-searches?entity=provider&page_size=50",
  );
  return page === null ? null : page.items;
}

export async function createSavedSearch(body: {
  name: string;
  params: Record<string, string | string[]>;
}): Promise<ApiResult<SavedSearchRow>> {
  return apiPost<SavedSearchRow>(
    "/api/saved-searches",
    { ...body, entity: "provider" },
    { sessionToken: await sessionToken() },
  );
}

export async function deleteSavedSearch(id: string): Promise<boolean> {
  return apiDelete(`/api/saved-searches/${encodeURIComponent(id)}`);
}

/**
 * A saved search as a URL on the search screen.
 *
 * The rename is undone on the way out: the platform's filter is `taxonomy_classification` and the
 * form field is `classification`, so a saved search re-opened under the platform's spelling would
 * run correctly and render a form with the specialty box empty - a search that disagrees with the
 * screen showing it. `searchFilters` reads both, which is what makes this safe.
 */
export function savedSearchHref(row: SavedSearchRow): string {
  const query = new URLSearchParams();
  for (const [name, value] of Object.entries(row.params)) {
    const field = name === "taxonomy_classification" ? "classification" : name;
    for (const each of Array.isArray(value) ? value : [value]) {
      if (each !== "") query.append(field, String(each));
    }
  }
  return `/app/search?${query}`;
}

// --------------------------------------------------------------------------------------
// One organisation
// --------------------------------------------------------------------------------------

/**
 * The record behind an organisation NPI.
 *
 * The fifth capability the platform has carried with customer-level permission and no screen:
 * `/api/organizations/{npi}`, `/{npi}/providers` and three more, all behind `providers.view`,
 * and the customer site had never called one of them. An organisation that a customer clicked
 * landed on the individual's record, which shows a surname and a licence - neither of which an
 * organisation has - and none of what actually matters about one: who signs for it, how many
 * clinicians bill under it, what system it runs.
 *
 * Narrow on purpose, like `ProviderDetail`: this types what the page renders, and the platform's
 * row carries more. Anything added to the page gets added here at the same time.
 */
export type OrganizationDetail = {
  network?: WorkspaceDecisionNetworkData | null;
  npi: string;
  name: string | null;
  status: string;
  address_line: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  phone: string | null;
  /** Filed, but withheld because suppressed - named rather than silently blank. */
  suppressed_fields: string[];
  domain: string | null;
  ehr_system: string | null;
  ehr_source: string | null;
  ehr_confidence: number | null;
  hie_participation: { hie_name: string | null; hie_identifier: string; via_name: string | null }[];
  authorized_official: {
    first_name: string | null;
    last_name: string | null;
    title: string | null;
    phone: string | null;
  } | null;
  /** How many clinicians bill under it. */
  provider_count: number;
  email_count: number;
  taxonomies: {
    sequence: number;
    code: string | null;
    display: string | null;
    classification: string | null;
    specialization: string | null;
    is_primary: boolean;
  }[];
  other_locations: {
    line1: string | null;
    line2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    phone: string | null;
  }[];
};

export async function getOrganization(npi: string): Promise<OrganizationDetail | null> {
  return apiGet<OrganizationDetail>(`/api/organizations/${encodeURIComponent(npi)}`);
}

/**
 * The clinicians who bill under an organisation.
 *
 * Its own endpoint rather than a provider search with a filter: the link is an internal clause
 * (`members_condition`), not something the public filter set can express - which is also why this
 * page offers tick boxes and no "add all", since "add everything this search matches" needs a
 * search the platform can be handed.
 */
export async function organizationProviders(
  npi: string,
  filters: Record<string, string | number | string[] | undefined>,
): Promise<SearchPage | null> {
  const search = new URLSearchParams();
  for (const [name, value] of Object.entries(filters)) {
    if (Array.isArray(value)) {
      for (const one of value) if (one !== "") search.append(name, one);
    } else if (value !== undefined && value !== "") {
      search.set(name, String(value));
    }
  }
  return apiGet<SearchPage>(`/api/organizations/${encodeURIComponent(npi)}/providers?${search}`);
}

/** Existing people endpoint; caller session preserves access and suppression rules. */
export async function organizationPeople(npi: string, page = 1): Promise<{ items: Person[]; total: number } | null> {
  if (!/^\d{10}$/.test(npi)) return null;
  const safePage = Number.isSafeInteger(page) && page > 0 ? page : 1;
  return apiGet(`/api/people?organization_npi=${encodeURIComponent(npi)}&page=${safePage}&page_size=25`);
}


export type CustomerRegister = {
  summary?: {organizations: number; users: number; free: number; paid_plan: number; trialing: number; past_due: number; cancelled: number; suspended: number; unassigned: number} | null;
  items: {
    user_id: string; organization: string; name: string; email: string; role: string;
    user_status: string; signed_up_at: string; last_login_at: string | null;
    plan_code: string | null; plan_name: string | null;
    subscription_status: string | null; trial_ends_on: string | null;
  }[];
  total: number; page: number; page_size: number;
};

export async function getCustomerRegister(params: URLSearchParams): Promise<CustomerRegister | null> {
  try { return await apiGet<CustomerRegister>(`/api/owner/customers?${params}`); }
  catch { return null; }
}


export async function upgradeTrial(consent: string): Promise<ApiResult<{url: string}>> {
  return apiPost<{url: string}>("/api/billing/trial/upgrade", {consent}, {
    sessionToken: await sessionToken(),
  });
}

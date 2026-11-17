/** URL configuration only; no credentials or browser-side requests. */
function configuredBase(value: string | undefined, label: string): string {
  if (!value) throw new Error(`${label} is not set.`);
  const url = new URL(value);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error(`${label} must be an HTTP(S) base URL without credentials, query, or fragment.`);
  }
  return url.toString().replace(/\/+$/, '');
}

/** Explicit base includes /api on staging, but not on the public production edge. */
export function publicApiBase(explicit: string | undefined, legacy: string | undefined): string {
  if (explicit) return `${configuredBase(explicit, 'NPI_PUBLIC_API_BASE_URL')}/v1`;
  const base = configuredBase(legacy, 'NPI_API_BASE_URL');
  return `${base.endsWith('/api') ? base : `${base}/api`}/v1`;
}

/** Existing session operations already include /api; keep that prefix exactly once. */
export function accountApiOrigin(explicit: string | undefined, legacy: string | undefined): string {
  const base = configuredBase(explicit || legacy, explicit ? 'NPI_ACCOUNT_API_BASE_URL' : 'NPI_API_BASE_URL');
  return base.endsWith('/api') ? base.slice(0, -4) : base;
}

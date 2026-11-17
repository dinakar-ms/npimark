import { readFile, writeFile, link, unlink } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import { randomUUID } from 'node:crypto';

export type LaunchReceipt = { version: 1; launchedAt: string; operatorId: string };
export function launchEnabled() { return process.env.NPI_LAUNCH_GATE === 'enabled'; }
export function launchReady() { return process.env.NPI_LAUNCH_READY === 'approved'; }
export function launchOperator(id: string) {
  return (process.env.NPI_LAUNCH_OPERATOR_IDS ?? '').split(',').map(v => v.trim()).filter(Boolean).includes(id);
}
function directory() {
  const value = process.env.NPI_LAUNCH_STATE_DIR ?? '';
  if (!isAbsolute(value)) throw new Error('Launch storage is not configured');
  return value;
}
export async function readLaunch(): Promise<LaunchReceipt | null> {
  try {
    const value = JSON.parse(await readFile(join(directory(), 'launched.json'), 'utf8'));
    if (value.version !== 1 || typeof value.operatorId !== 'string' || !value.operatorId ||
      typeof value.launchedAt !== 'string' || !Number.isFinite(Date.parse(value.launchedAt))) return null;
    return value;
  } catch { return null; } // Closed on missing, corrupt or unreadable storage.
}
export async function commitLaunch(operatorId: string): Promise<LaunchReceipt> {
  if (!launchEnabled() || !launchReady() || !launchOperator(operatorId)) throw new Error('Launch is not authorized');
  const previous = await readLaunch();
  if (previous) return previous;
  const receipt: LaunchReceipt = { version: 1, launchedAt: new Date().toISOString(), operatorId };
  const temporary = join(directory(), `launch-${randomUUID()}.tmp`);
  try {
    await writeFile(temporary, JSON.stringify(receipt), { flag: 'wx', mode: 0o600, flush: true });
    // Atomic publication, never replace an existing receipt. Shared POSIX volume required.
    try { await link(temporary, join(directory(), 'launched.json')); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    }
    const stored = await readLaunch();
    if (!stored) throw new Error('Launch could not be confirmed');
    return stored;
  } finally { await unlink(temporary).catch(() => {}); }
}
export function launchExempt(path: string) {
  return ['/launch-control', '/sign-in', '/sign-in/code', '/api/auth/sign-in',
    '/api/auth/mfa', '/api/auth/sign-out', '/api/ready', '/api/health',
    '/privacy', '/terms', '/contact', '/remove-my-information',
    '/remove-my-information/confirm', '/privacy-choices', '/report-a-problem',
    '/report-a-problem/confirm', '/email-preferences', '/api/privacy/remove',
    '/api/privacy/confirm', '/api/privacy/report', '/api/privacy/report-confirm',
    '/api/email-preferences/unsubscribe',
    // Google's ownership proof must answer even while the gate is up (DevOps handoff 27 Oct 2026).
    '/googleae9e07c3f92b8c13.html'].includes(path);
}
export const launchHoldingHtml = `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>NPIMARK — launching soon</title>
<style>*{box-sizing:border-box}body{margin:0;min-height:100svh;display:grid;place-items:center;padding:32px;background:#f7f9ff;color:#142344;font-family:Arial,sans-serif}
main{max-width:850px;text-align:center}svg{width:80px;height:80px}p{font-size:clamp(18px,3vw,24px);line-height:1.6;color:#52617b}
h1{font-size:clamp(48px,9vw,100px);line-height:1.04;letter-spacing:-.065em;margin:36px 0 24px}.eyebrow{font-size:13px;font-weight:700;letter-spacing:.2em;color:#4563ef}
a{color:#304fce}footer{margin-top:56px;font-size:14px}.brand{font-size:24px;font-weight:800;letter-spacing:.05em}</style></head>
<body><main><svg viewBox="0 0 100 100" aria-hidden="true"><rect x="12" y="23" width="18" height="65" rx="9" fill="#4563ef"/><rect x="64" y="23" width="18" height="65" rx="9" fill="#4563ef"/><path d="M21 32 73 79" fill="none" stroke="#23c8df" stroke-width="18" stroke-linecap="round"/><circle cx="73" cy="12" r="5.562" fill="#ff8058"/></svg>
<div class="brand">NPIMARK</div><h1>A clearer view of healthcare.</h1><p>We’re preparing to open the doors.<br>Healthcare professionals, organizations and connections—all in one place.</p>
<p class="eyebrow">LAUNCHING SOON</p><p><a href="/">Check if we’re live</a></p>
<footer><a href="mailto:support@npimark.com">Contact support</a> · <a href="/privacy">Privacy</a> · <a href="/remove-my-information">Privacy requests</a></footer>
</main></body></html>`;

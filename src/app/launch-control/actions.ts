'use server';
import { getMe } from '@/lib/session';
import { commitLaunch, launchOperator } from '@/lib/launchGate';

export async function openPublicSite() {
  const me = await getMe();
  if (!me || !me.permissions.includes('settings.manage') || !launchOperator(me.id) ||
    (me.org.mfa_required && !me.mfa_enabled)) {
    return { ok: false as const, message: 'Your account is not authorized to launch. Sign in with the approved operator account.' };
  }
  try {
    const receipt = await commitLaunch(me.id);
    return { ok: true as const, launchedAt: receipt.launchedAt };
  } catch {
    return { ok: false as const, message: 'Opening was not confirmed. Ask DevOps to check readiness and launch storage, then retry. Retrying cannot open the site twice.' };
  }
}

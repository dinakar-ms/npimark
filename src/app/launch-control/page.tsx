import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getMe } from '@/lib/session';
import { launchEnabled, launchReady, launchOperator, readLaunch } from '@/lib/launchGate';
import LaunchConsole from './LaunchConsole';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Launch NPIMARK', robots: { index: false, follow: false } };
export default async function LaunchControl() {
  const me = await getMe();
  if (!me) redirect('/sign-in');
  if (!me.permissions.includes('settings.manage') || !launchOperator(me.id) ||
    (me.org.mfa_required && !me.mfa_enabled)) notFound();
  return <LaunchConsole enabled={launchEnabled()} ready={launchReady()} receipt={await readLaunch()} />;
}

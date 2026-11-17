import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCustomerRegister, getMe } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Customer accounts', robots: { index: false, follow: false } };
const SEGMENTS = [
  ['all', 'All customer accounts'], ['free', 'Active Free plan'],
  ['paid_plan', 'Active non-Free plan'], ['trialing', 'Trialing'], ['past_due', 'Past due'],
  ['cancelled', 'Canceled'], ['suspended', 'Suspended'], ['unassigned', 'No subscription'],
] as const;
function day(value: string | null) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? 'Not recorded' : date.toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' });
}
export default async function Customers({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const me = await getMe();
  if (!me) redirect('/sign-in');
  if (!me.permissions.includes('settings.manage')) notFound();
  const raw = await searchParams;
  const one = (key: string) => (Array.isArray(raw[key]) ? raw[key][0] : raw[key]) ?? '';
  const q = one('q').trim().slice(0, 120);
  const segment = SEGMENTS.some(([key]) => key === one('segment')) ? one('segment') : 'all';
  const page = /^\d+$/.test(one('page')) ? Math.max(1, Math.min(10000, Number(one('page')))) : 1;
  const params = new URLSearchParams({ q, segment, page: String(page) });
  const data = await getCustomerRegister(params);
  const href = (next: number) => `/app/owner/customers?${new URLSearchParams({ q, segment, page: String(next) })}`;
  return <main className="wrap app-main">
    <Link href="/app/owner">Back to business dashboard</Link>
    <div className="eyebrow rule" style={{ marginTop: 20 }}>Internal administration</div>
    <h1>Customer accounts</h1>
    <p className="lede">See who joined, their organization and its recorded subscription. Each row is one user account; several users can share the same subscription.</p>
    <p className="fine">Plan assignment is not proof of payment. Trial dates below are recorded end dates, not estimated renewal or charge times. All dates use UTC.</p>
    {data?.summary && <section aria-label="All customer organizations" style={{marginTop: 24}}>
      <h2>Customer overview</h2><p>All customer organizations, independent of the filters below. Users are counted separately from subscriptions.</p>
      <div className="grid">{([
        ['organizations', 'Organizations'], ['users', 'User accounts'], ['free', 'Active Free organizations'],
        ['paid_plan', 'Active non-Free organizations'], ['trialing', 'Trial organizations'], ['past_due', 'Past due organizations'],
      ] as const).map(([key,label]) => <div className="card" key={key}><h3>{label}</h3><p className="metric-value">{data.summary![key].toLocaleString('en-US')}</p></div>)}</div>
    </section>}
    <form className="filters" method="get" style={{ marginTop: 24 }}>
      <div className="field"><label htmlFor="customer-query">Name, email or organization</label><input id="customer-query" name="q" defaultValue={q} maxLength={120} /></div>
      <div className="field"><label htmlFor="customer-segment">Subscription filter</label><select id="customer-segment" name="segment" defaultValue={segment}>{SEGMENTS.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></div>
      <button className="btn primary" type="submit">Apply filters</button>
      <Link className="btn" href="/app/owner/customers">Reset</Link>
    </form>
    {!data ? <div className="notice warn" role="status" style={{ marginTop: 24 }}>Customer accounts could not be loaded. No customer count or subscription status can be confirmed. <Link href={href(page)}>Try again</Link>.</div> : <>
      <div className="results-head" style={{ marginTop: 24 }}><b>{data.total.toLocaleString('en-US')} matching user accounts</b><span className="fine">Page {page}</span></div>
      {data.items.length === 0 ? <div className="notice">{page > 1 ? 'No accounts on this page. Return to the first page or adjust your filters.' : 'No customer accounts match these filters.'} {page > 1 && <Link href={href(1)}>First page</Link>}</div> : <div className="table-wrap"><table>
        <caption className="sr-only">Customer user accounts and organization subscriptions</caption>
        <thead><tr>{['Customer','Organization','Plan','Subscription','Joined','Trial ends','Last sign-in'].map(label=><th scope="col" key={label}>{label}</th>)}</tr></thead>
        <tbody>{data.items.map(row=><tr key={row.user_id}>
          <td style={{ overflowWrap:'anywhere' }}><b>{row.name || 'Name not recorded'}</b><span className="fine" style={{display:'block'}}>{row.email}</span><span className="fine">{row.role} · {row.user_status}</span></td>
          <td>{row.organization}</td><td>{row.plan_name ?? row.plan_code ?? 'No plan recorded'}</td>
          <td>{row.subscription_status === 'cancelled' ? 'Canceled' : row.subscription_status?.replaceAll('_',' ') ?? 'No subscription'}</td>
          <td>{day(row.signed_up_at)}</td><td>{day(row.trial_ends_on)}</td><td>{day(row.last_login_at)}</td>
        </tr>)}</tbody></table></div>}
      <nav className="actions" aria-label="Customer account pages" style={{marginTop:20}}>
        {page > 1 && <Link className="btn" href={href(page-1)}>Previous</Link>}
        {page * data.page_size < data.total && page < 10000 && <Link className="btn" href={href(page+1)}>Next</Link>}
      </nav>
    </>}
  </main>;
}

import Link from 'next/link';
import type { Metadata } from 'next';
import { CAPABILITIES } from '@/content/capabilities';
import { JsonLd } from '@/components/JsonLd';
import { siteUrl, socialCard } from '@/lib/site';
import styles from './CapabilityPage.module.css';

export function capabilityMetadata(key: string): Metadata {
  const p = CAPABILITIES[key];
  return { title:p.label, description:p.description, alternates:{canonical:p.path},
    openGraph:socialCard(p.path,p.label,p.description),
    twitter:{card:'summary_large_image',title:p.label,description:p.description,images:['/opengraph-image']} };
}
export function CapabilityPage({ name }: { name: string }) {
  const p = CAPABILITIES[name];
  return <main className={styles.page}>
    <JsonLd data={{'@context':'https://schema.org','@type':'WebPage',name:p.label,url:siteUrl(p.path),description:p.description}} />
    <header className={styles.hero}>
      <div><p className={styles.eyebrow}>{p.label}</p><h1>{p.title}</h1><p className={styles.intro}>{p.intro}</p>
        <div className={styles.actions}><Link className="btn primary" href={p.primary[1]}>{p.primary[0]}</Link><Link className="btn" href={p.secondary[1]}>{p.secondary[0]}</Link></div>
      </div>
      <aside className={styles.aside}><span className={styles.dot} aria-hidden="true" /><h2>Where to start</h2><p>{p.status}</p><ol>{p.steps.map(step=><li key={step}>{step}</li>)}</ol></aside>
    </header>
    <section className={styles.cards} aria-label="Research approach">{p.cards.map((card,i)=><article key={card.title}><span className={styles.number}>0{i+1}</span><h2>{card.title}</h2><p>{card.text}</p></article>)}</section>
    <section className={styles.detail}><h2>{p.heading}</h2><dl>{p.rows.map(([term,description])=><div key={term}><dt>{term}</dt><dd>{description}</dd></div>)}</dl></section>
    <section className={styles.faq}><h2>Before you get started</h2>{p.faqs.map(([question,answer])=><details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</section>
    <nav className={styles.related} aria-label="Related capabilities"><h2>Explore more of NPIMARK</h2><div>{Object.entries(CAPABILITIES).filter(([key])=>key!==name).map(([key,item])=><Link key={key} href={item.path}>{item.label} <span aria-hidden="true">↗</span></Link>)}<Link href="/ehr-data">EHR & EMR intelligence <span aria-hidden="true">↗</span></Link></div></nav>
  </main>;
}

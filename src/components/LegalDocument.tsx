import type { ReactNode } from "react";
import styles from "./LegalDocument.module.css";
import Link from "next/link";
import type { Block, LegalDocument as Doc } from "@/content/legal/types";
import { TARGET_DAYS } from "@/content/legal/removal";
import { TERMS_VERSION, legalPagesApproved, privacyEmail, supportEmail } from "@/content/legal/version";

/**
 * Renders a legal document from `src/content/legal/`.
 *
 * While LEGAL_PAGES_APPROVED is off (the default) the page opens with a "Draft - under legal
 * review" banner. Internal counsel notes remain in source and never render publicly.
 * Switched on, the banner goes and the notes render as nothing - so an approved page can never
 * show a reader an unresolved question, even if one was left in the text by mistake.
 *
 * The text is turned into React elements, never into HTML, so nothing in it is interpreted.
 */

const TOKEN = /(\[LAWYER:[^\]]*\]|\[[^\]]+\]\((?:\/[^)\s]*|#[^)\s]+|mailto:[^)\s]+)\))/g;
const LINK = /^\[([^\]]+)\]\(([^)]+)\)$/;

function fill(text: string): string {
  const privacy = privacyEmail() ?? "the privacy address shown on our contact page";
  const support = supportEmail() ?? privacy;
  return text
    .replaceAll("{{PRIVACY_EMAIL}}", privacy)
    .replaceAll("{{SUPPORT_EMAIL}}", support)
    .replaceAll("{{TERMS_VERSION}}", TERMS_VERSION)
    .replaceAll("{{TARGET_DAYS}}", String(TARGET_DAYS));
}

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  fill(text)
    .split(TOKEN)
    .forEach((part, i) => {
      if (!part) return;
      if (part.startsWith("[LAWYER:")) {
        return;
      }
      const link = LINK.exec(part);
      if (link) {
        const [, label, href] = link;
        out.push(
          href.startsWith("/") ? (
            <Link key={i} href={href}>
              {label}
            </Link>
          ) : (
            <a key={i} href={href}>
              {label}
            </a>
          ),
        );
        return;
      }
      out.push(part);
    });
  return out;
}

/** A block that is nothing but a [LAWYER] note disappears entirely once approved. */
function onlyNote(text: string): boolean {
  return text.replace(/\[LAWYER:[^\]]*\]/g, "").trim() === "";
}

function block(b: Block, key: number): ReactNode {
  if (typeof b === "string") {
    if (onlyNote(b)) return null;
    return <p key={key}>{inline(b)}</p>;
  }
  const items = (b as readonly string[]).filter((item) => !(onlyNote(item)));
  if (items.length === 0) return null;
  return (
    <ul key={key}>
      {items.map((item, i) => (
        <li key={i}>{inline(item)}</li>
      ))}
    </ul>
  );
}

export function LegalDocument({ doc, eyebrow }: { doc: Doc; eyebrow: string }) {
  const approved = legalPagesApproved();
  return (
    <main className={styles.document}>
      <section className="wrap" style={{ paddingBlock: "clamp(32px, 6vw, 64px)" }}>
        {!approved && (
          <div className="notice warn legal-draft" role="note" style={{ marginBottom: 24 }}>
            <strong>Draft - under legal review.</strong> This text has not yet been approved and may
            change before it takes effect.
          </div>
        )}
        <div className="eyebrow rule">{eyebrow}</div>
        <h1>{doc.title}</h1>
        <p className="lede">{inline(doc.summary)}</p>
        <p className="fine" style={{ marginTop: 8 }}>
          Version {TERMS_VERSION}
        </p>

        <nav aria-label="Contents" className="legal-toc">
          <ol>
            {doc.sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`}>{s.heading}</a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="prose">
          {doc.sections.map((s) => (
            <section key={s.id} id={s.id}>
              <h2>
                {s.heading}
                {s.approved && !approved && <span className="legal-approved">Approved wording</span>}
              </h2>
              {s.blocks.map((b, i) => block(b, i))}
            </section>
          ))}
        </article>
      </section>
    </main>
  );
}

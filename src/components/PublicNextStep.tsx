"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Keep promotional actions out of account, legal and transactional journeys. */
export function PublicNextStep() {
  const path = usePathname() ?? "";
  const excluded = ["/app", "/sign-in", "/sign-up", "/forgot", "/reset-password", "/verify-email", "/invite", "/email-preferences", "/privacy", "/privacy-choices", "/terms", "/remove-my-information", "/report-a-problem", "/contact", "/test-your-list"];
  if (!path || excluded.some((route) => path === route || path.startsWith(`${route}/`))) return null;
  const directory = ["/directory", "/lists", "/npi", "/facility", "/specialty", "/systems", "/leadership"].some((route) => path === route || path.startsWith(`${route}/`));
  return (
    <section className="np-next-step" aria-labelledby="np-next-step-title">
      <div className="wrap np-next-step-inner">
        <div>
          <span className="eyebrow">Your next step</span>
          <h2 id="np-next-step-title">{directory ? "Turn your research into a focused provider list." : "Start with the providers you need to reach."}</h2>
          <p>Explore the public records, check your target segment, then choose the account or API access that fits your workflow.</p>
        </div>
        <div className="np-next-step-actions">
          <Link className="btn primary lg" href={directory ? "/sign-up" : "/search"}>{directory ? "Create your account" : "Find providers"}<span aria-hidden="true">↗</span></Link>
          <Link className="btn lg" href="/contact">Discuss your use case</Link>
          <Link className="np-text-link" href="/docs/api">Building an integration? Explore the API →</Link>
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import { AccountFooterLinks } from "@/components/AccountActions";
import { PublicNextStep } from "@/components/PublicNextStep";
import { GpcNotice } from "@/components/GpcNotice";
import { Wordmark } from "@/components/SiteNav";
import { AUDIENCES } from "@/lib/audiences";
import { glossaryPath } from "@/lib/glossary";
import { NO_TRACKING_NOTE } from "@/lib/gpc";
import { HELP_PAGES, helpPath } from "@/lib/help";
import { SITE_NAME, TAGLINE } from "@/lib/site";

/**
 * The footer: the system's ground, the whole site's links, and where the site answers for its
 * privacy choices: the cookie line on
 * every page, the "Your Privacy Choices" link the state laws name, and the Global Privacy Control
 * note.
 *
 * Nothing in here reads the request, and nothing in here may. The footer sits in the root layout,
 * so one `headers()` or `cookies()` call would make every public page dynamic - and those pages
 * are the site's SEO surface, prerendered and cached on purpose. So the GPC note is a client
 * component that asks the browser (`GpcNotice`), and the signed-in half of the signal is handled
 * in `app/app/layout.tsx`, which is per-request already.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <>
      <PublicNextStep />
    <footer className="footer">
      <div className="wrap">
        <div className="cols">
          <div className="footer-brand">
            {/* The same mark as the header, at the other end of the page, on the same ground. It
                is what makes the footer read as the bottom of one object rather than as a sitemap
                somebody bolted on. */}
            <Wordmark />
            <p>{TAGLINE}</p>
            {/* `signed-out-only`: the application hides these three. Somebody reading this footer
                from inside their own account has already started free. */}
            <Link href="/sign-up" className="btn primary sm signed-out-only">
              Get started
            </Link>
          </div>
          <div>
            <h2 className="footer-head">Product</h2>
            <ul>
              <li>
                <Link href="/search">Provider search</Link>
              </li>
              <li>
                <Link href="/directory">Directory</Link>
              </li>
              <li>
                <Link href="/lists">Lists</Link>
              </li>
              <li>
                <Link href="/systems">Health systems</Link>
              </li>
              <li><Link href="/idn-data">IDN intelligence</Link></li>
              <li><Link href="/pbm-data">PBMs & payer relationships</Link></li>
              <li><Link href="/mcp">MCP for AI assistants</Link></li>
              <li><Link href="/mobile-app">Mobile app</Link></li>
              <li>
                {/* The reference pages: people arrive on them from a definition search rather than
                    from a product one, so they need a link from every page like the rest. */}
                <Link href={glossaryPath()}>Specialty glossary</Link>
              </li>
              <li>
                <Link href="/data">What is in the data</Link>
              </li>
              <li>
                {/* The one measured accuracy figure on the site. Its own link because it is what
                    somebody searching "how accurate is this data" is looking for, and because a
                    page that answers the first sales question should not need to be found by
                    scrolling another page. */}
                <Link href="/data/deliverability">Measured deliverability</Link>
              </li>
              <li>
                {/* Arrived at by field name from a search rather than by browsing, so it needs a
                    link from every page the same way the reference pages do. */}
                <Link href="/fields">Field reference</Link>
              </li>
              <li>
                <Link href="/pricing">Pricing</Link>
              </li>
              <li>
                <Link href="/docs/api">API reference</Link>
              </li>
            </ul>
          </div>
          <div>
            {/* Every audience page, from the list they are registered in: these are the pages
                people arrive on from a search for their own profession, and a page nothing links
                to is a page nothing crawls. */}
            <h2 className="footer-head">By profession</h2>
            <ul>
              {AUDIENCES.map((audience) => (
                <li key={audience.slug}>
                  <Link href={`/${audience.slug}`}>{audience.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          {/* The whole column, not the two links inside it: the application hides this, and a
              column heading with nothing under it is worse than no column. */}
          <div className="signed-out-only">
            <h2 className="footer-head">Account</h2>
            <AccountFooterLinks />
          </div>
          <div>
            {/* The help hub and every page under it: each one answers a question somebody arrives
                with, so each one has to be reachable from any page they arrive on. */}
            <h2 className="footer-head">Help</h2>
            <ul>
              <li>
                <Link href={helpPath()}>Help and FAQ</Link>
              </li>
              {HELP_PAGES.map((page) => (
                <li key={page.slug}>
                  <Link href={helpPath(page.slug)}>{page.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            {/* The company pages. A buyer's security review and a provider who wants to be taken
                out both arrive from a search rather than from the product, so these have to be
                reachable from every page the same way the legal ones are. */}
            <h2 className="footer-head">Company</h2>
            <ul>
              <li>
                <Link href="/about">About</Link>
              </li>
              <li>
                <Link href="/contact">Contact</Link>
              </li>
              <li>
                <Link href="/security">Security and trust</Link>
              </li>
              {/* Somebody who thinks the platform is broken reaches for the footer, on whatever
                  page they were on when it stopped working. It is here rather than under Help
                  because it is a statement about us rather than an answer to a question. */}
              <li>
                <Link href="/status">Platform status</Link>
              </li>
              <li>
                <Link href="/why-npi-mark">Why NPI Mark</Link>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="footer-head">Legal</h2>
            <ul>
              <li>
                <Link href="/terms">Terms of Service</Link>
              </li>
              <li>
                <Link href="/privacy">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/privacy-choices">Your Privacy Choices</Link>
              </li>
              <li>
                <Link href="/remove-my-information">Remove my information</Link>
              </li>
              <li>
                <Link href="/report-a-problem">Report a problem with a listing</Link>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="footer-head">Machine readable</h2>
            <ul>
              <li>
                <Link href="/llms.txt">llms.txt</Link>
              </li>
              <li>
                <Link href="/fields.json">Field reference (JSON)</Link>
              </li>
              <li>
                <Link href="/sitemap-index.xml">Sitemap</Link>
              </li>
              <li>
                <Link href="/robots.txt">Robots</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="legal">
          <span>
            © {year} {SITE_NAME}. Provider records are public federal and state data; work email
            and licensed contact details are available to signed-in customers only.
          </span>
          <span>No scraping, resale or redistribution.</span>
          <span>{NO_TRACKING_NOTE}</span>
        </div>
        <GpcNotice />
      </div>
    </footer>
    </>
  );
}

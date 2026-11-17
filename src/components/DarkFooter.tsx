import Link from "next/link";

function LogoSvg() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" style={{ width: 40, height: 40 }}>
      <rect x="12" y="23" width="18" height="65" rx="9" fill="#4563ef" />
      <rect x="64" y="23" width="18" height="65" rx="9" fill="#4563ef" />
      <path d="M21 32 73 79" fill="none" stroke="#23c8df" strokeWidth="18" strokeLinecap="round" />
      <circle cx="73" cy="12" r="5.562" fill="#ff8058" />
    </svg>
  );
}

export function DarkFooter() {
  return (
    <footer className="nd-home nd-ft">
      <div className="wrap">
        <div className="ft-top">
          <div className="ft-brand">
            <Link className="ft-logo" href="/">
              <LogoSvg /><span>NPImark<small>Provider Data</small></span>
            </Link>
            <p className="ft-tag">Provider insights. <span>Better connections.</span></p>
          </div>
          <div className="ft-facts">
            <div className="ft-fact"><i className="ph-duotone ph-database" /><span><b>9,539,757</b>provider records</span></div>
            <div className="ft-fact"><i className="ph-duotone ph-arrows-clockwise" /><span><b>Weekly</b>refresh, dated per field</span></div>
            <a className="ft-status" href="#"><i />All systems operational</a>
          </div>
        </div>
        <nav className="ft-grid" aria-label="Footer">
          <div className="ft-col wide"><h2><i className="ph-duotone ph-squares-four" />Product</h2><ul>
            <li><Link href="/search">Provider search</Link></li>
            <li><Link href="/directory">Directory</Link></li>
            <li><Link href="/lists">Provider and facility lists</Link></li>
            <li><Link href="/systems">Health systems</Link></li>
            <li><Link href="/idn-data">IDN intelligence</Link></li>
            <li><a href="#">PBMs &amp; payer relationships</a></li>
            <li><a href="#">MCP for AI assistants</a></li>
          </ul></div>
          <div className="ft-col"><h2><i className="ph-duotone ph-files" />Documents</h2><ul>
            <li><Link href="/docs/api">API reference</Link></li>
            <li><Link href="/docs/api">Field reference</Link></li>
            <li><Link href="/data">What is in the data</Link></li>
            <li><a href="#">Measured deliverability</a></li>
            <li><Link href="/glossary">Specialty glossary</Link></li>
            <li><a href="#">Mobile app</a></li>
          </ul></div>
          <div className="ft-col"><h2><i className="ph-duotone ph-stethoscope" />By profession</h2><ul>
            <li><Link href="/physicians">Physicians</Link></li>
            <li><Link href="/healthcare-professionals">Nurses &amp; NPs</Link></li>
            <li><a href="#">NPs &amp; PAs</a></li>
            <li><Link href="/dentists">Dentists</Link></li>
            <li><Link href="/mental-health-providers">Mental health</Link></li>
            <li><a href="#">Pharmacists</a></li>
            <li><a href="#">PT, OT &amp; speech</a></li>
            <li><a href="#">Eye care</a></li>
            <li><a href="#">Chiropractors</a></li>
            <li><a href="#">Podiatrists</a></li>
            <li><a href="#">All professions</a></li>
          </ul></div>
          <div className="ft-col"><h2><i className="ph-duotone ph-buildings" />Company</h2><ul>
            <li><Link href="/about">About</Link></li>
            <li><a href="#">Contact</a></li>
            <li><Link href="/help">Help and FAQ</Link></li>
            <li><Link href="/pricing">Pricing</Link></li>
            <li><a href="#">Security and trust</a></li>
            <li><a href="#">Platform status</a></li>
            <li><Link href="/why-npi-mark">Why NPI Mark</Link></li>
            <li><a href="#">Sign in</a></li>
            <li><Link href="/#cta">Get started</Link></li>
          </ul></div>
          <div className="ft-col"><h2><i className="ph-duotone ph-scales" />Legal</h2><ul>
            <li><a href="#">Terms of Service</a></li>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Your Privacy Choices</a></li>
            <li><Link href="/report-a-problem">Remove my information</Link></li>
            <li><Link href="/report-a-problem">Report a problem with a listing</Link></li>
          </ul></div>
        </nav>
        <div className="ft-legal">
          <p>© 2026 NPImark. Provider records are public federal and state data; work email and licensed contact details are available to signed-in customers only.</p>
          <p>We use only essential cookies and no advertising or tracking. Page-view analytics runs only if you allow it, and you can switch it off at any time.</p>
          <span className="ft-badge"><i className="ph-fill ph-shield-check" />No scraping, resale or redistribution.</span>
        </div>
      </div>
    </footer>
  );
}

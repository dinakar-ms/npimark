import type { LegalDocument } from "./types";

/**
 * Privacy Policy - DRAFT for counsel's review.
 *
 * Two audiences, deliberately kept apart: Part A is about our customers and visitors to the site;
 * Part B is about the healthcare providers and organization leaders whose professional details
 * are in the database. See ./types.ts for the editing conventions.
 *
 * Facts this draft relies on, checked against the code on 2026-09-22 - re-check them if the site
 * changes:
 *   - The site sets only functional cookies: the signed-in session, a five-minute two-step
 *     sign-in cookie, single sign-on state and a sign-up prefill, and one-time cookies that show a
 *     new API key or invite link once. Google Analytics is loaded only after a visitor allows it
 *     on the consent bar, on the public marketing pages only; never advertising cookies or
 *     tracking pixels.
 *     CSRF protection happens between the site's server and the API; no CSRF cookie reaches the
 *     browser. Fonts are self-hosted.
 *   - The only third party the browser talks to is Cloudflare Turnstile, and only when it is
 *     switched on (the sign-up, password reset and removal forms).
 *   - Premium residence data is revealed one provider at a time, never exported or listed.
 *   - Removal requests become suppressions, which are never deleted, so a removal survives the
 *     next data refresh.
 *   - The site honours Global Privacy Control. `src/proxy.ts` reads `Sec-GPC` for the signed-in
 *     area; the footer's note is read in the browser (`components/GpcNotice.tsx`) so the public
 *     pages stay prerendered. Either way the signal is an opt-out of sale and sharing.
 *   - InfoDepots is a registered data broker in California, Texas, Oregon and Vermont (counsel,
 *     2026-09-22). That is what sections 9 to 13 are about, and it is no longer an open question.
 *   - An approved deletion writes the suppressions immediately and records the request as needing
 *     erasure (`needs_erasure` in backend/app/removal_requests.py). The privacy queue that performs
 *     the erasure is being built separately and is not in the product yet: nothing reads that flag,
 *     so the values are still held, suppressed. Section 12 is written to that behaviour rather than
 *     to the intended one - see the note above it.
 *
 * Never name a data supplier here. This is a working draft, not legal advice.
 */
export const PRIVACY: LegalDocument = {
  title: "Privacy Policy",
  summary:
    "What we collect about our customers, what we hold about the healthcare professionals in our database, how either can exercise their choices, and how to reach us.",
  sections: [
    {
      id: "about",
      heading: "1. Who we are",
      blocks: [
        "NPI Mark is operated by Lorann LLC, a New York limited liability company, trading as NPI Mark, in the United States (\"we\", \"us\"). Our published address is 382 NE 191st St, Ste 463398, Miami, Florida 33179-3899. We are responsible for the personal information described in this policy.",
        "This policy has two parts. [Part A](#customers) covers people who visit our website or use the Service for their organization. [Part B](#database) covers the healthcare providers and the leaders of healthcare organizations whose professional information is in our database. If you want information about you removed, go straight to [Remove my information](/remove-my-information).",
        "[LAWYER: confirm whether to address visitors outside the United States (GDPR / UK GDPR), or state that the Service is intended for US businesses only.]",
      ],
    },
    {
      id: "customers",
      heading: "Part A - Customers and site visitors",
      blocks: [],
    },
    {
      id: "customer-data",
      heading: "2. What we collect about customers",
      blocks: [
        [
          "Account details: your name, work email, organization name, password (stored only as a one-way hash), and, if you turn on two-step sign-in, an encrypted authenticator secret and hashed recovery codes.",
          "Billing details: the organization and contact we invoice. When card billing launches, card payments will be handled by our payment processor; we will not see or store full card numbers.",
          "Usage records: the searches, reveals, exports, Append runs, alerts and API calls made under your account, with the user or API key, the time, your IP address and browser type. We need these to meter your plan, keep the Service secure and detect misuse.",
          "Files you upload: lists you give the Append tool, and the results.",
          "Correspondence: what you send us, and our replies.",
        ],
      ],
    },
    {
      id: "cookies",
      heading: "3. Cookies",
      blocks: [
        "We use only cookies the site needs to work: one that keeps you signed in, a short-lived one used during two-step or single sign-on, and one-time cookies that show you a new API key or invite link once and then expire. We do not use advertising or tracking cookies, and we do not allow third parties to track you across our site.",
        "Analytics, only if you allow it: on our public pages we may ask whether we can measure which pages are read, using Google Analytics. Until you press Allow, no analytics script is loaded, no analytics cookie is set and nothing is sent. If you allow it, Google Analytics sets its _ga cookies and receives the address of the public page you are reading, with no query string, together with your browser type and an IP address that Google truncates. It receives nothing about provider pages, searches, sign-in, your account or any form. You can turn it off on Your Privacy Choices, which removes the cookies, and a browser sending Global Privacy Control is treated as having said no. [LAWYER: confirm this disclosure and the data-retention setting chosen in the Google Analytics property.]",
        "When our bot check is switched on, the sign-up, password-reset and removal forms load Cloudflare Turnstile, which processes information about your browser and connection to tell people from automated scripts. [LAWYER: confirm this disclosure of the bot-check provider is sufficient.]",
      ],
    },
    {
      id: "customer-use",
      heading: "4. How we use customer information",
      blocks: [
        [
          "to provide the Service, run your account and apply your plan's limits;",
          "to send service messages: address confirmation, password resets, alerts you set up, and notices about your account or these policies;",
          "to secure the Service and enforce our [Terms of Service](/terms), including detecting scraping, resale and unusual activity;",
          "to answer your questions, and to tell you about NPI Mark products where the law allows (you can opt out of marketing messages at any time).",
        ],
        "We do not sell customer account information, and we do not use the contents of your uploaded files to market to you.",
      ],
    },
    {
      id: "customer-sharing",
      heading: "5. Who we share customer information with",
      blocks: [
        "Service providers who host the Service, deliver our email, process payments and check for automated traffic, each under contract and only for that purpose; professional advisers; and authorities where the law requires it or to protect the Service and its users. If our business is sold or merged, customer information may pass to the new owner under this policy.",
      ],
    },
    {
      id: "database",
      heading: "Part B - Healthcare professionals in our database",
      blocks: [],
    },
    {
      id: "database-what",
      heading: "6. What we hold about healthcare professionals",
      blocks: [
        "NPI Mark is a business-to-business directory of US healthcare providers who hold a National Provider Identifier, and of the healthcare organizations they work in. We hold information about people in their professional capacity:",
        [
          "Identity and profession: name, credentials, NPI, specialty and taxonomy, license state, enumeration date, and whether the NPI is active.",
          "Practice: practice and mailing address, practice phone and fax, other practice locations, and group and employer affiliations.",
          "Professional standing: listings on public exclusion and sanction registers, with dates.",
          "Work email: a professional email address with its verification status and a trust tier.",
          "Organization leadership: the names and titles of owners, executives and other leaders of healthcare organizations, and business phone numbers where we have them.",
          "Premium residence data: for providers only, a provider-matched home address and cell phone number. This is licensed data we are entitled to resell. It is offered only to customers who have signed an agreement stating the permissible use, carries a confidence score (it is matched, not guaranteed), is revealed one provider at a time, and is never included in exports or lists.",
        ],
        "We do not hold clinical, patient or health information about anyone.",
      ],
    },
    {
      id: "database-sources",
      heading: "7. Where it comes from",
      blocks: [
        "Public government registers of healthcare providers and organizations; licensed commercial data providers; business information that organizations publish about themselves; and our own checks, for example confirming that an email address still accepts mail. Every field records when we last confirmed it.",
      ],
    },
    {
      id: "database-use",
      heading: "8. How it is used and who receives it",
      blocks: [
        "Our public pages show only public-record information (such as name, specialty, practice location and practice phone) and, for organization leaders, counts rather than names.",
        "Signed-in business customers may search the database and, within their plan's limits, reveal work email addresses and phone numbers one record at a time, export rows, and add fields to their own lists. They must use the information only for business purposes relevant to your professional role, must honor opt-outs, and are responsible for complying with email, calling and texting laws; our [Terms of Service](/terms) prohibit resale and redistribution, and we trace exports to the account that made them.",
        "[LAWYER: confirm whether making this information available to customers is a \"sale\" under the California Consumer Privacy Act and similar state laws, and the resulting wording here and in sections 11 and 14.]",
      ],
    },
    {
      id: "data-broker",
      heading: "9. Our data broker registrations",
      blocks: [
        "Lorann LLC has applied to register as a data broker in California, Texas, Oregon and Vermont - the states that keep a registry. Those applications are with the states and have not yet been granted, so we do not yet appear on those registries under this name. The existing entries in those four states are InfoDepots LLC's, and they are public records.",
        "[LAWYER: applications are filed and awaiting approval as of 2026-10-02; no registration numbers have been issued to Lorann LLC. Confirm this wording is accurate and sufficient for the pending period, what must be said once each registration is granted, and whether any further state has introduced a registry since. Registration numbers and registry links are published only once granted - this section must never say we are registered while an application is pending.]",
        "Being a registered data broker means we must let you opt out of the sale and sharing of your personal information, must process deletion requests - in California including requests made through the state's Delete Request and Opt-out Platform (DROP) - and must tell you here how to exercise those rights. Sections 10 to 13 say how, and [Your Privacy Choices](/privacy-choices) is the short version.",
      ],
    },
    {
      id: "remove",
      heading: "10. Removing your information",
      blocks: [
        "You can ask us to remove your work email, your phone number, your home address and cell phone, or your whole record from everything our customers can see. Use the [Remove my information](/remove-my-information) form or write to {{PRIVACY_EMAIL}}.",
        [
          "If we can send email, we will send a confirmation link to the address you give. Your request is reviewed once you follow it, so that nobody can remove someone else's listing. If we cannot confirm by email, we will verify you another way before acting.",
          "A member of our team reviews every request. Our target is to complete it within {{TARGET_DAYS}} days, and we will write to tell you the outcome.",
          "Removal takes effect across search, reveals, exports, list append and the API. We keep a minimal record of what was removed - for example your NPI or the email address - so that it stays removed when our data is next refreshed. That record is used for nothing else.",
        ],
        "Removal stops the information appearing in our Service from then on. We cannot recall copies a customer obtained before your request. [LAWYER: decide whether we should notify customers who previously revealed or exported the removed information.]",
      ],
    },
    {
      id: "opt-out",
      heading: "11. Do Not Sell or Share My Personal Information",
      blocks: [
        "You can tell us not to sell or share your personal information, whether or not you are a customer. Use [Your Privacy Choices](/privacy-choices), the [Remove my information](/remove-my-information) form, or write to {{PRIVACY_EMAIL}}.",
        "An opt-out is recorded as a suppression: your details stop being returned in search, contact reveals, exports, list append and the API, and the suppression stays in place when our data is next refreshed. We never delete a suppression, because deleting it would undo your opt-out.",
        "We honor the Global Privacy Control signal. If your browser or an extension sends the Sec-GPC header, we treat it as an opt-out of the sale and sharing of your personal information for that browser, with no form to fill in; the footer of every page says so when we see it. [LAWYER: confirm whether a Global Privacy Control signal from a signed-in customer must also be recorded against their account as a standing opt-out, and for how long.]",
        "We do not charge you for opting out, do not give you a lesser service for it, and do not ask you to create an account to do it.",
      ],
    },
    // NARROWED ON PURPOSE - 2026-09-22. This section used to describe suppression and erasure as
    // one act. Today an approved deletion writes the suppressions immediately and records the
    // request as needing erasure; the privacy queue that erases the values from our own copies is
    // being built separately and is not in the product yet, so nothing has been erased at the point
    // this policy is read. A registered data broker's deletion sentence is the first thing a
    // regulator reads, so it describes the two steps in order instead.
    //
    // RESTORE WHEN THE ERASURE QUEUE LANDS: fold the second block back into the first in the
    // present tense - suppression straight away, then erasure of the name, address, email address,
    // phone and cell phone from our copies, keeping only a one-way hash so the same details are
    // never loaded again from a later delivery - and delete the [LAWYER] note about the gap. The
    // same wording was narrowed in the same commit in src/app/privacy-choices/page.tsx and in
    // src/app/remove-my-information/page.tsx, and the fact list at the top of this file records why.
    {
      id: "delete",
      heading: "12. Deleting your information",
      blocks: [
        "You can ask us to delete your information. Once the request is verified we suppress the record straight away: from that moment we stop using your information and stop supplying it to anyone, so it no longer appears in search, contact reveals, exports, list append or the API, and the suppression stays in place when our data is next refreshed.",
        "Erasing the values from our own copies follows as a second step. Until it is carried out we still hold them, suppressed and supplied to nobody, and your request is recorded as awaiting erasure so that it is not lost. When it is carried out, all we keep is a one-way hash of those identifiers, used for nothing except making sure the same details are never loaded again from a later data delivery.",
        "[LAWYER: this section is deliberately narrower than the behavior we are building. Erasure from our own copies is queued for a privacy job that is not yet in the service, so today a verified deletion means immediate and permanent suppression plus a recorded erasure obligation. Confirm this description satisfies the Delete Act and the state deletion rights in the meantime, whether a deadline for completing the erasure must be stated here, and what we must tell somebody whose erasure is still pending.]",
        "If you are a California resident you may also send a deletion request through the state's Delete Request and Opt-out Platform (DROP). We process requests that reach us there in the same way as requests made on this site. [LAWYER: confirm the DROP processing cadence we must meet, what we must record for each request, and whether the hashed \"never reload\" record needs describing in different terms.]",
        "Some information we may have to keep: records we need to comply with the law, to establish or defend a legal claim, or to run security and fraud prevention. [LAWYER: confirm the statutory exceptions to list here.]",
      ],
    },
    {
      id: "verify",
      heading: "13. How we verify requests, how long we take, and authorized agents",
      blocks: [
        [
          "We email a confirmation link to the address you give and review the request only once you follow it, so nobody can opt out or delete on somebody else's behalf. If we cannot confirm by email we will verify you another way before acting.",
          "A member of our team matches the identifiers you gave - your name, email address, phone number, street address, ZIP code and, for providers, your NPI - against our records. We ask only for what we need to make the match, and we do not add any of it to the database.",
          "Our target is to complete a request within {{TARGET_DAYS}} days of verifying it, and we write to tell you the outcome. [LAWYER: confirm the response targets to state - 45 days for a verified consumer request, whether a data-broker deletion or a DROP request runs on a different clock, and whether an extension must be disclosed.]",
          "An authorized agent may make a request for you with your written permission; we may still contact you to confirm that you asked for it. [LAWYER: confirm the agent verification process to publish - what proof of authority we require, and whether a power of attorney removes the need to contact the consumer.]",
        ],
        "If we refuse a request we tell you why. [LAWYER: confirm whether an appeal process must be offered, and to which regulators a complaint may be made.]",
      ],
    },
    {
      id: "state-rights",
      heading: "14. California and other state privacy rights",
      blocks: [
        "Depending on where you live, you may have the right to know what personal information we hold about you and how we use and disclose it; to have it corrected or deleted; to opt out of its sale or sharing; and not to be treated differently for using these rights. To use any of them, use [Your Privacy Choices](/privacy-choices) or the [Remove my information](/remove-my-information) form, or write to {{PRIVACY_EMAIL}}. Sections 11 to 13 explain the opt-out, the deletion right and how we verify a request, including when an authorized agent makes one for you.",
        "[LAWYER: confirm whether the California Consumer Privacy Act applies to Lorann LLC (revenue and volume thresholds), and whether information held about providers in their professional capacity is covered now the business-to-business exemption has expired.]",
        "We are registered as a data broker in California, Texas, Oregon and Vermont; see [section 9](#data-broker). California's Delete Act requires registered data brokers to process deletion requests received through DROP, which we do.",
        "[LAWYER: confirm which other state privacy laws (for example Virginia, Colorado, Connecticut, Texas and Oregon) apply, and whether an appeal process must be described.]",
      ],
    },
    {
      id: "retention",
      heading: "15. How long we keep information",
      blocks: [
        [
          "Customer accounts: while the account is open, and for 2 years after it closes, for our records and to resolve disputes - longer where we are required to keep it for tax, accounting, contract or legal records.",
          "Usage and audit records: 3 years, because they are how we trace misuse of the data.",
          "Files uploaded to Append: at most 90 days after the run, unless you delete them sooner.",
          "Removal requests: the request itself for 3 years; the suppression it created for as long as we hold data about you, so the removal keeps working.",
          "Database records: for as long as they remain accurate and useful, subject to removal requests.",
        ],
      ],
    },
    {
      id: "security",
      heading: "16. Security",
      blocks: [
        "We protect information with encryption in transit, passwords stored only as one-way hashes, optional two-step sign-in, role-based access limited to the staff who need it, rate limits and automatic locks against scraping, and an audit log of access to contact information. No system is perfectly secure; if a breach affects your information we will tell you as the law requires.",
      ],
    },
    {
      id: "children",
      heading: "17. Children",
      blocks: [
        "The Service is for businesses and is not directed to children. We do not knowingly collect information from anyone under 16.",
      ],
    },
    {
      id: "changes",
      heading: "18. Changes to this policy",
      blocks: [
        "We will post any change here with a new version date, and tell customers by email or in the application before a material change takes effect. This is version {{TERMS_VERSION}}.",
      ],
    },
    {
      id: "contact",
      heading: "19. Contact",
      blocks: [
        "Privacy questions and requests: {{PRIVACY_EMAIL}}. Account and billing: {{SUPPORT_EMAIL}}. [LAWYER: postal address for privacy correspondence, and whether a toll-free number is required.]",
      ],
    },
  ],
};

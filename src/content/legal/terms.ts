import { FREE_PLAN, count } from "@/lib/plans";
import type { LegalDocument } from "./types";

/**
 * Terms of Service - DRAFT for counsel's review.
 *
 * Edit freely: see ./types.ts for the few conventions ([LAWYER: ...] notes, [links](/path),
 * {{PLACEHOLDERS}}). Sections marked `approved: true` carry wording counsel has already approved
 * (2026-09-22: resale rights for residence data, Do Not Call / TCPA, auto-renewal); change them only
 * with counsel. Bump TERMS_VERSION in ./version.ts (and backend/app/legal.py) when the substance
 * changes.
 *
 * This is a working draft prepared for review by the owner's lawyer. It is not legal advice.
 */
export const TERMS: LegalDocument = {
  title: "Terms of Service",
  summary:
    "The agreement between NPI Mark and every organization that uses it: what you may do with the data, what you may not, and what each of us is responsible for.",
  sections: [
    {
      id: "about",
      heading: "1. Who we are and what these terms cover",
      blocks: [
        "NPI Mark is a service operated by Lorann LLC, a New York limited liability company, trading as NPI Mark (\"NPI Mark\", \"we\", \"us\"). Our published address is 382 NE 191st St, Ste 463398, Miami, Florida 33179-3899.",
        "These terms govern your organization's use of the NPI Mark website, the signed-in application, exports, the Append tool, standing alerts and the API (together, the \"Service\"). \"You\" means the organization that opens the account and every person it lets use it. The person who creates the account confirms they are authorized to accept these terms for that organization.",
        "You accept these terms by ticking the box on the sign-up form, or by signing an order form that refers to them. We record which version you accepted and when. This is version {{TERMS_VERSION}}.",
        "If you have a signed order form or master agreement with us, it takes precedence over these terms where the two conflict.",
      ],
    },
    {
      id: "definitions",
      heading: "2. Words with a particular meaning",
      blocks: [
        [
          "\"Data\" means everything the Service returns about healthcare providers, healthcare organizations and the people who lead them, in any form, including on screen, in exports, through Append and through the API.",
          "\"Contact Data\" means work email addresses, phone numbers, and the Premium Residence Data described in section 9.",
          "\"Reveal\" means opening the Contact Data for one record. Reveals are counted per record per billing period.",
          "\"Plan\" means the allowance your organization is on: reveals, export rows, API calls, seats and alerts per month, and which products are switched on.",
          "\"Authorized User\" means a person your organization has given a login.",
        ],
      ],
    },
    {
      id: "accounts",
      heading: "3. Your account",
      blocks: [
        "Accounts are opened with a work email address. You must give accurate information and keep it current.",
        "Each login is for one named person. Do not share logins or API keys between people or organizations; add a seat instead. You are responsible for everything done under your organization's logins and keys, and for making sure each Authorized User follows these terms.",
        "Keep passwords and API keys secret. Two-step sign-in is available and we recommend it for every user. Tell us at once at {{SUPPORT_EMAIL}} if you believe a login or key has been used without your permission.",
      ],
    },
    {
      id: "plans",
      heading: "4. Plans and limits",
      blocks: [
        // The free plan's figures come from `@/lib/plans`, which is also what the pricing page
        // renders and what migration 0135_plan_prices seeds into the `plans` table. Typed out
        // here as well, they had already drifted from the pricing page once.
        `Every organization is on a Plan. The free plan currently includes, each month: ${count(FREE_PLAN.reveals)} reveals, ${count(FREE_PLAN.rows)} export rows, ${count(FREE_PLAN.apiCalls)} API calls, ${FREE_PLAN.seats} seats and ${FREE_PLAN.alerts} standing alerts. Paid plans are arranged with us and set out in an order form or on your invoice.`,
        "Limits are enforced by the Service. Opening several accounts, or using several organizations, to get around a limit is a breach of these terms. Unused allowance does not carry over to the next month. [LAWYER: confirm no carry-over, and whether we may change free-plan limits on notice (proposed: 30 days' notice by email).]",
        "Some products - the Premium Residence Data in section 9, and higher export and API volumes - are available only under a signed agreement.",
      ],
    },
    {
      id: "permitted-use",
      heading: "5. What you may use the Data for",
      blocks: [
        "While your account is in good standing we grant your organization a limited, non-exclusive, non-transferable, revocable license to use the Data for its own internal business purposes, which means:",
        [
          "contacting healthcare providers, healthcare organizations and their leaders about products, services, research or opportunities relevant to their professional role;",
          "recruiting and credentialing research;",
          "market sizing, territory planning and analysis;",
          "keeping your own records of healthcare providers accurate (including through Append).",
        ],
        "The license covers Data you obtained while your account was active and within your Plan. It does not transfer any ownership of the Data or of the Service.",
      ],
    },
    {
      id: "restrictions",
      heading: "6. What you must not do",
      blocks: [
        "You must not, and must not help anyone else to:",
        [
          "scrape, crawl, or harvest the website or application, or collect Data by any automated means other than the API within your Plan;",
          "resell, sublicense, publish, share or otherwise redistribute the Data, or give access to it to anyone outside your organization, in whole or in part, including as part of another product or dataset;",
          "use the Data to build, improve or validate a database or service that competes with NPI Mark;",
          "get around a limit, a rate limit, a lock or any other control on the Service, including by opening extra accounts;",
          "use the Data to decide anyone's eligibility for employment, credit, insurance, housing or any other purpose covered by the Fair Credit Reporting Act or similar laws - the Service is not a consumer reporting agency and the Data is not a consumer report;",
          "use the Data to harass, threaten, stalk or discriminate against anyone, or contact anyone at home except as your Premium Residence agreement permits;",
          "contact anyone who has asked you not to contact them;",
          "probe, scan or test the security of the Service, or reverse engineer it, without our written permission.",
        ],
        "[LAWYER: confirm the FCRA wording is sufficient for how the Data could be misused, and whether to add an express prohibition on use for law-enforcement or immigration purposes.]",
        "[LAWYER: confirm whether any state requires additional restrictions or notices before a customer contacts a provider at home using Premium Residence Data (section 9).]",
      ],
    },
    {
      id: "phone-dnc-tcpa",
      heading: "7. Phone numbers, Do Not Call and the TCPA",
      approved: true,
      blocks: [
        "Where a phone number we hold is listed on a Do Not Call registry, we show that flag when you reveal the number. The flag is information to help you. It reflects our records at the time you reveal the number and may be incomplete or out of date.",
        "You decide whether to call or text any number, flagged or not. You may reveal and call a flagged number, and if you do, that decision and every consequence of it are yours.",
        "You are solely responsible for complying with the Telephone Consumer Protection Act, the Telemarketing Sales Rule, and every federal and state telemarketing, Do Not Call, calling-time and text-messaging law that applies to your calls and messages. That includes, without limitation: scrubbing numbers against the national and state Do Not Call registries and your own internal do-not-call list before you call; obtaining any consent the law requires (including prior express written consent before autodialed or prerecorded calls or texts to a mobile number); keeping to permitted calling hours in the recipient's time zone; transmitting accurate caller identification; and honouring every request to stop.",
        "You will indemnify, defend and hold harmless NPI Mark and Lorann LLC, and their officers, employees and suppliers, from and against every claim, fine, penalty, damages award, settlement and cost (including reasonable legal fees) arising from calls or messages you or anyone acting for you make to numbers obtained through the Service, whether or not the number carried a Do Not Call flag.",
      ],
    },
    {
      id: "email",
      heading: "8. Email",
      blocks: [
        "Email addresses carry a verification status and a trust tier. A verified address can still bounce, change or belong to someone who has moved on. When you email anyone using the Data you are the sender and are solely responsible for complying with the CAN-SPAM Act and any other law that applies, including identifying yourself accurately, using honest subject lines, including a working unsubscribe mechanism and honouring opt-outs promptly. [LAWYER: confirm whether to add state email-law references and a matching indemnity.]",
      ],
    },
    {
      id: "residence",
      heading: "9. Premium Residence Data (home address and cell phone)",
      approved: true,
      blocks: [
        "Premium Residence Data is a provider-matched home address and cell phone number. It is licensed data that InfoDepots is entitled to resell, and we make it available only to organizations that have signed a separate agreement stating the permissible use it may be put to.",
        [
          "It is revealed one provider at a time, and never included in exports, lists or Append results.",
          "Each match carries a confidence score. A match is our best judgment that the address or number belongs to the provider; it is matched, not guaranteed, and you must allow for it being wrong.",
          "You may use it only for the permissible use in your agreement, and every other restriction in these terms applies to it, including section 7 for cell phone numbers.",
        ],
      ],
    },
    {
      id: "monitoring",
      heading: "10. Monitoring, audit and tracing",
      blocks: [
        "We record every reveal, export, Append run and API call made under your account, with the user or key that made it, the time and the connection it came from. We use those records to meter your Plan, to keep the Service secure, and to detect breaches of these terms.",
        "The Service limits how quickly contacts can be revealed. Activity that looks automated or far outside normal use may pause your organization's reveals until a person at NPI Mark has reviewed it.",
        "Exports and other deliveries contain seeded records that identify the account they were delivered to, so that a copy found outside your organization can be traced back. Seeded records are not errors in the Data, and removing or altering them is a breach of these terms.",
        "On reasonable request you will confirm in writing that your use of the Data complies with these terms. On reasonable notice we may also review documents relevant to that compliance. We will not ordinarily do either more than once in twelve months, unless there is credible evidence of scraping, resale, prohibited use or a security incident. A review is limited to what is needed to establish compliance, and we will protect your confidential information.",
      ],
    },
    {
      id: "suspension",
      heading: "11. Suspension and termination",
      blocks: [
        "We may suspend or close an account, immediately and without refund, if we reasonably believe it has been used to scrape, resell or redistribute the Data, to get around a limit or control, in breach of section 6 or section 7, or in a way that exposes us or the people in our database to legal risk. In other cases we will tell you what is wrong and give you a reasonable chance to put it right first.",
        "You may close your account at any time by writing to {{SUPPORT_EMAIL}}.",
        "When an account closes, the license in section 5 ends. [LAWYER: decide what happens to Data a customer already downloaded - proposed: stop using it and delete it within 30 days, except where the law requires it to be kept, and confirm deletion on request.]",
      ],
    },
    {
      id: "fees",
      heading: "12. Fees and invoices",
      blocks: [
        "The free plan needs no payment details. A paid plan bought through the Service is prepaid: the plan is paid for before the period it covers, so there are no payment terms to fall due and no late-payment interest. Where we have agreed an invoiced order instead, the fees, billing period and payment terms are those in that order form. Applicable taxes may be added where we are required to collect them.",
        "[LAWYER: the pricing page now publishes introductory monthly list prices, an overage rate of $10 per 1,000 rows beyond the monthly allowance, and two months free on an annual term. None of those three is stated in these terms yet, deliberately - please draft the wording, and say whether adding it is a substantive change that needs TERMS_VERSION bumped and existing customers re-accepting.]",
        "Fees are not refundable, except where the law requires otherwise or where we end the Service without any breach by you - in which case we refund the unused part of what you have prepaid, pro rata.",
        "[LAWYER: before card billing launches, confirm what the checkout page and reminder emails must show under state automatic-renewal laws in addition to the approved wording in section 13.]",
      ],
    },
    {
      id: "card-billing",
      heading: "13. Card billing, automatic renewal and cancellation",
      approved: true,
      blocks: [
        "This section applies from the day card billing launches on the Service. Until then no plan is charged to a card and the free plan needs no payment details.",
        "When offered at checkout, an eligible organization may start one seven-day trial of its selected plan with a card required. The trial begins after card setup is confirmed. Unless you cancel before the exact end time shown in Billing, your card is charged the renewal price you accepted for that plan. The subscription then renews monthly until canceled. You may explicitly choose to end the trial and pay earlier; using up the trial allowance alone does not authorize an early charge. The plan includes its stated number of separate user accounts at the plan price, not a per-seat charge. Existing Free accounts retain their current access.",
        "You can cancel, or turn off automatic renewal, at any time from the billing settings in the application or by emailing {{SUPPORT_EMAIL}}. Cancellation takes effect at the end of the current billing period: you keep access until then and are not charged again. Canceling during the trial means your card is not charged.",
      ],
    },
    {
      id: "accuracy",
      heading: "14. The Data and its accuracy",
      blocks: [
        "The Data is compiled from public records, licensed sources and our own verification, and every field carries the date we last confirmed it. People change jobs, numbers and addresses, and sources contain errors. We work to keep the Data accurate but we do not guarantee that any record is complete, current or correct, and residence matches in particular are matched, not guaranteed.",
        "People may ask us to remove their information. When we honor such a request, the affected Data stops appearing in the Service. Suppressed records are not credited back to your Plan. [LAWYER: confirm whether customers must stop using, and delete, Data about a person who later has it removed.]",
      ],
    },
    {
      id: "your-content",
      heading: "15. Files you upload",
      blocks: [
        "Lists you upload to Append, and the results, are yours. You grant us the right to process them to provide the Service, and you confirm you have the right to give them to us. We do not sell or share your uploaded lists with other customers.",
        "We may also use what we learn from your uploads to improve the NPI Mark database - for example, confirming that an email address we already hold is still current. We use the signal, not your list: your uploaded lists stay confidential, are never sold or shared with other customers, and are never offered as a list of ours.",
      ],
    },
    {
      id: "api",
      heading: "16. The API",
      blocks: [
        "API keys are issued per organization, are subject to the same limits and restrictions as the application, and may be revoked if misused. The API may change; we will give reasonable notice of changes that remove or break a published field or endpoint.",
      ],
    },
    {
      id: "disclaimers",
      heading: "17. Disclaimers",
      blocks: [
        "Except as expressly stated in these terms, the Service and the Data are provided \"as is\" and \"as available\", without warranties of any kind, express or implied, including warranties of merchantability, fitness for a particular purpose, accuracy and non-infringement. We do not promise the Service will be uninterrupted or error-free.",
      ],
    },
    {
      id: "liability",
      heading: "18. Limitation of liability",
      blocks: [
        "To the fullest extent the law allows, neither party is liable to the other for any indirect, incidental, special, consequential or punitive damages, or for lost profits, revenue or data, arising from these terms or the Service.",
        "To the fullest extent the law allows, our total liability for all claims arising from these terms or the Service is limited to the fees your organization paid us in the 12 months before the claim arose, or US$100 if you are on the free plan. [LAWYER: confirm the cap and the free-plan figure.]",
        "These limits do not apply to your obligations under sections 6, 7 and 19, or to your payment obligations.",
      ],
    },
    {
      id: "indemnity",
      heading: "19. Your indemnity",
      blocks: [
        "In addition to section 7, you will indemnify, defend and hold harmless NPI Mark and Lorann LLC from claims by third parties, and regulatory fines, arising from your use of the Data or the Service in breach of these terms or of the law, including your emails, calls, texts and mailings.",
      ],
    },
    {
      id: "changes",
      heading: "20. Changes to these terms",
      blocks: [
        "We may update these terms. When we make a material change we will tell account admins by email or in the application at least 30 days before it takes effect, and we may ask users to accept the new version before carrying on. A change may take effect immediately where the law requires it, or to address an urgent security problem or abuse. A change to prices applies from your next renewal unless you have agreed otherwise. Each version is dated.",
      ],
    },
    {
      id: "law",
      heading: "21. Governing law and disputes",
      blocks: [
        "[LAWYER: governing law and venue, and whether to require arbitration with a class-action waiver.]",
      ],
    },
    {
      id: "general",
      heading: "22. General",
      blocks: [
        "These terms, with any order form, are the whole agreement between us about the Service. If a court finds any part unenforceable, the rest stays in force. Neither party may assign these terms without the other's consent, except to a successor to its business. Neither party is liable for delay caused by events beyond its reasonable control. Notices to us go to {{SUPPORT_EMAIL}}.",
      ],
    },
  ],
};

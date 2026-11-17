import { SALES_EMAIL, salesHref } from "@/lib/site";
import { answerFor } from "@/content/answers";
import { privacyEmail, supportEmail } from "@/content/legal/version";

/**
 * The facts about the company itself that the company pages need, in one place.
 *
 * The product pages can be written from the code: what a record holds, what a scope grants, what
 * the API meters. The company pages cannot. Who the legal entity is, when it started, how many
 * people work here, where it sits and which mailbox somebody is watching are things only the
 * owner knows, and a page that guessed at any of them would be wrong in a way no test could catch.
 *
 * So each one is declared here as a fact with a question attached. While `value` is empty the
 * pages render the question, highlighted, exactly where the sentence needs it - the same way
 * `LegalDocument` renders counsel's [LAWYER: ...] notes while the legal pages are a draft. Fill
 * `value` in and the note disappears from every page that used it, and the draft banner on that
 * page goes with the last one. There is no switch to remember and nothing to grep for twice.
 *
 * Two rules for anything added here:
 *
 * 1. An unknown fact is a question, never a likely-sounding answer. "Founded in 2019", typed to make
 *    a paragraph read better is a false statement about a real company.
 * 2. A fact whose value is empty must be in a sentence the page can still lose. Nothing on a
 *    company page may depend on an answer we do not have - the note explains the gap to the
 *    owner, and the surrounding paragraph still has to make sense to a reader.
 */

export type CompanyFact = {
  /** Stable key. It is not rendered; it is how the owner and a report refer to one note. */
  readonly id: string;
  /** What the owner has to answer. Rendered as `[OWNER: ...]` until `value` is filled in. */
  readonly ask: string;
  /** The answer, once the owner has it. Empty means "still a question". */
  readonly value: string;
};

/**
 * One fact. `value` is a getter rather than a stored string so that the environment is read when
 * the page renders, not when this module was written: `COMPANY_OFFICE` answers the office
 * question on a running site, with no deploy. See `content/answers.ts` for the whole mechanism,
 * including why it carries answers and never prose.
 *
 * The company pages all `await connection()`, so they render per request and see the current
 * environment. A page that did not would bake whatever was set at build time and this would
 * quietly do nothing, which is why `answers.test.mjs` asserts that they all do.
 */
function fact(id: string, ask: string, value = ""): CompanyFact {
  return {
    id,
    ask,
    get value() {
      return answerFor(id, value);
    },
  };
}

/**
 * Every company fact the pages draw on.
 *
 * `legalEntity` was answered on 2026-10-02: Lorann LLC, a New York limited liability company,
 * trading as NPI Mark. The legal pages now name it too, so the two agree.
 *
 * `dataBrokerRegistration` replaced the sentence that used to assert it. The registrations in
 * California, Texas, Oregon and Vermont are held by **InfoDepots**, and the move to Lorann LLC has
 * not been made - counsel's instruction is to publish Lorann's numbers only once registration is
 * complete. Renaming the operator and leaving "we are a registered data broker" in place would
 * have turned a true sentence about one company into a false one about another, on two pages that
 * carry no draft banner. So it is a question until it is a fact.
 */
export const COMPANY = {
  legalEntity: fact(
    "legal-entity",
    "the legal entity's exact name and state of organization, and whether NPI Mark should be described as a trade name of it",
    "Lorann LLC, a New York limited liability company, trading as NPI Mark",
  ),
  dataBrokerRegistration: fact(
    "data-broker-registration",
    "which states Lorann LLC is registered as a data broker in - applications for California, Texas, Oregon and Vermont were filed by 2026-10-02 and are awaiting approval, so until each is granted this page must not say we are registered",
  ),
  founded: fact(
    "founded",
    "when the company was founded, or say to drop the sentence - we publish no date rather than an approximate one",
  ),
  teamSize: fact(
    "team-size",
    "how to describe the size of the team, or say to drop the sentence - a made-up headcount is worse than none",
  ),
  office: fact(
    "office",
    "the postal address to publish, or confirm that we publish none and say so here instead",
    "Business mailing address: 382 NE 191st St, Ste 463398, Miami, Florida 33179-3899, United States.",
  ),
  phone: fact(
    "phone",
    "a phone number for sales and support and the hours somebody answers it, or confirm there is none and that this page says email only",
  ),
  customerNames: fact(
    "customer-names",
    "whether any customer may be named on a public page, and in whose words - no name goes on this site without their written agreement",
  ),
  securityAssurance: fact(
    "security-assurance",
    "whether there is an audit report, a certification or a third-party penetration test a buyer's security review may be pointed at - until you say there is, this page claims none",
  ),
  securityRewards: fact(
    "security-rewards",
    "whether a security report can earn a reward, and on what terms - until you say so, this page says there is no program to point a researcher at",
  ),
} as const satisfies Record<string, CompanyFact>;

/**
 * The answer for a fact the owner has decided to publish nothing about.
 *
 * Several of the questions above are "or say to drop the sentence", and an owner who decides that
 * needs somewhere to record the decision. Setting a fact's value to this settles it: the note goes,
 * the draft banner stops counting it, and the sentence it was in disappears. It is a decision, in
 * writing, rather than a question somebody stopped noticing.
 */
export const PUBLISH_NOTHING = "publish nothing";

/** The answer to print, or null when there is nothing to print - unanswered, or settled as nothing. */
export function answered(f: CompanyFact): string | null {
  const value = f.value.trim();
  return value && value !== PUBLISH_NOTHING ? value : null;
}

/** True once the owner has answered, including an answer of "publish nothing". */
export function settled(f: CompanyFact): boolean {
  return f.value.trim() !== "";
}

/**
 * Whether this fact puts anything on the page at all - an answer, or the question.
 *
 * A heading over nothing is the failure this prevents: a section called "By phone or by post"
 * survives a decision to publish neither, and reads as though the page lost its content.
 */
export function visible(f: CompanyFact): boolean {
  return answered(f) !== null || !settled(f);
}

/** True when any of these facts is still a question, which is what puts the draft banner on a page. */
export function anyUnanswered(facts: readonly CompanyFact[]): boolean {
  return facts.some((f) => !settled(f));
}

/**
 * A way to reach the company, resolved against the environment at request time.
 *
 * `address` is null when the mailbox has not been set, and then `href` is null too: a page prints
 * the fallback and the note instead of a `mailto:` nobody reads. Which is the whole point of
 * reading these from the environment rather than writing them into the source - see `salesHref`
 * in lib/site.ts, which sends people to sign-up rather than to an address that bounces.
 */
export type Channel = {
  readonly key: string;
  readonly name: string;
  /** What this channel is for, in one sentence. */
  readonly what: string;
  readonly address: string | null;
  /** Where the link goes: a mailto when there is an address, a page when there is not. */
  readonly href: string;
  readonly label: string;
  /** What the environment variable is called, for the note. */
  readonly setting: string;
};

/** Where security reports go. Set SECURITY_EMAIL in the site's environment before launch. */
export function securityEmail(): string | null {
  const value = (process.env.SECURITY_EMAIL ?? "").trim();
  return value || null;
}

/**
 * The four channels, in the order the contact page lists them.
 *
 * Sales goes through `salesHref` so this page and the pricing cards can never disagree about
 * where "talk to us" leads. Support and privacy read the same settings the legal pages do, so an
 * address published here is the address the Privacy Policy prints. Security has no setting yet
 * and no code to point at; it is a new variable, and until it is set the page says so.
 */
export function channels(): readonly Channel[] {
  const support = supportEmail();
  const privacy = privacyEmail();
  const security = securityEmail();
  const mailto = (address: string, subject: string) =>
    `mailto:${address}?subject=${encodeURIComponent(subject)}`;

  return [
    {
      key: "sales",
      name: "Sales and plans",
      what: "Prices, what a plan includes, contract terms, and access to provider-matched home address and cell phone, which is contract-only.",
      address: SALES_EMAIL || null,
      href: salesHref("NPI Mark - plans"),
      label: SALES_EMAIL || "Choose a plan",
      setting: "SALES_EMAIL",
    },
    {
      key: "support",
      name: "Support for customers",
      what: "Your account, seats, billing, a search that is not returning what you expect, an export or append job that failed, and API keys.",
      address: support,
      href: support ? mailto(support, "NPI Mark support") : "/help",
      label: support ?? "Read the help pages",
      setting: "SUPPORT_EMAIL",
    },
    {
      key: "privacy",
      name: "Privacy and removal",
      what: "Opt out of the sale and sharing of your information, ask for it to be deleted, or have particular fields removed. You do not need an account, and we never charge for it.",
      address: privacy,
      href: privacy ? mailto(privacy, "Privacy request") : "/remove-my-information",
      label: privacy ?? "Use the removal form",
      setting: "PRIVACY_EMAIL",
    },
    {
      key: "security",
      name: "Security reports",
      what: "A vulnerability in the site, the API or the application. Tell us what you found and how to reproduce it, and we will confirm we have it.",
      address: security,
      href: security ? mailto(security, "Security report") : "/security",
      label: security ?? "Read the security page",
      setting: "SECURITY_EMAIL",
    },
  ];
}

/** One channel by key, for a page that needs a single route rather than the list. */
export function channel(key: Channel["key"]): Channel {
  const found = channels().find((c) => c.key === key);
  if (!found) throw new Error(`No contact channel named ${key}`);
  return found;
}

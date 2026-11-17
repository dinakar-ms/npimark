/**
 * The campaign builder: an audience, a channel, and the file the channel takes.
 *
 * What this is not, deliberately: a mail server. NPI Mark does not send the email. If it did, our
 * sending domains and addresses would carry the reputation of other people's cold outreach to
 * doctors, and the CAN-SPAM and consent obligations of every campaign would sit with us rather
 * than with the sender who chose the audience and wrote the words. So the builder's last step
 * hands the audience to the channel the customer already pays for.
 *
 * That is less of a compromise than it sounds, because the handoff is the part our data is
 * actually good at, and all four destinations below work today with no new platform code:
 *
 *   sequencer   a CSV their sequencer makes variables out of (Smartlead, Instantly, Outreach,
 *               Salesloft, Lemlist, Apollo)
 *   crm         the shaped exports that already exist - Salesforce Lead, HubSpot Contact,
 *               Pipedrive Person, Zoho Lead
 *   activation  `POST /api/audiences/onboard-export`: hashed identifiers for LiveRamp, The Trade
 *               Desk, Google Customer Match and Meta. No NPI and no plaintext identifier in the
 *               file, suppressed values withheld before hashing, and it needs `providers.export`,
 *               which a customer plan carries
 *   calls       a file with the practice phone on it, for a dialler or a call sheet
 *
 * The merge fields are the fiddly part and the reason this module exists rather than a paragraph
 * of copy on the page: a sequencer builds its variables out of the CSV's header row, so the
 * placeholders in somebody's first email have to be the headers our export actually writes. They
 * are listed here, spelled exactly as `app/jobs/exports.py` writes them.
 */

/** A header our export writes, and what it holds. Spelled as `EXPORT_COLUMNS` writes it. */
export type MergeField = {
  header: string;
  what: string;
  /** Empty for an organisation NPI, which has no person's name behind it. */
  blankForOrganisations?: boolean;
};

/**
 * The columns worth putting in an email, in the order the `contact` and `name_parts` presets
 * write them.
 *
 * `First name` and `Last name` come from the `name_parts` preset and are the two that make a mail
 * merge work; `Name` is the filed string and reads badly in a greeting ("Dear REYES, MARIA C").
 * Both are offered, because an organisation has no first name and a campaign aimed at
 * organisations wants the filed name instead.
 */
export const MERGE_FIELDS: readonly MergeField[] = [
  { header: "First name", what: "Their first name, as filed", blankForOrganisations: true },
  { header: "Last name", what: "Their surname, as filed", blankForOrganisations: true },
  { header: "Name", what: "The name as filed, in one string" },
  { header: "Credentials", what: "MD, DO, NP, and so on, where filed" },
  { header: "Specialty", what: "Their primary taxonomy classification" },
  { header: "Employer", what: "Who they work for, where known" },
  { header: "City", what: "Their practice city" },
  { header: "State", what: "Their practice state" },
  { header: "Phone", what: "The practice phone on the record" },
  { header: "Email", what: "Their work email" },
  { header: "NPI", what: "The 10-digit identifier, useful as your own key" },
];

export type DestinationId = "sequencer" | "crm" | "activation" | "calls";

export type Destination = {
  id: DestinationId;
  label: string;
  /** Named so somebody recognises their own tool in the list. */
  examples: string;
  /** What the handoff actually is. */
  how: string;
  /** The export preset that suits it, or null where the destination chooses its own. */
  preset: string | null;
  /** The channel it reaches, which decides which reachability number matters. */
  channel: "email" | "phone" | "identity";
};

export const DESTINATIONS: readonly Destination[] = [
  {
    id: "sequencer",
    label: "An email sequencer",
    examples: "Smartlead, Instantly, Outreach, Salesloft, Lemlist, Apollo",
    how: "A CSV your sequencer turns into variables, one column per merge field.",
    // `outreach`, not `name_parts`. name_parts carries the greeting and no email at all, so a
    // file drawn from it cannot be sent; `contact` carries the email and no name parts, so every
    // greeting reads "Hi ,". `outreach` exists for exactly this and its headers are MERGE_FIELDS.
    preset: "outreach",
    channel: "email",
  },
  {
    id: "crm",
    label: "Your CRM",
    examples: "Salesforce, HubSpot, Pipedrive, Zoho",
    how: "A file already shaped for that CRM's import, with its own field names as headers.",
    preset: null,
    channel: "email",
  },
  {
    id: "activation",
    label: "An ad platform or identity graph",
    examples: "LiveRamp, The Trade Desk, Google Customer Match, Meta",
    how:
      "Hashed identifiers only - no NPI and no plaintext - so the audience can be matched " +
      "without the file carrying anybody's details.",
    preset: null,
    channel: "identity",
  },
  {
    id: "calls",
    label: "A call list",
    examples: "a dialler, or a sheet somebody works down",
    how: "A file with the practice phone on every row.",
    preset: "practice",
    channel: "phone",
  },
];

export function destination(id: string): Destination | null {
  return DESTINATIONS.find((one) => one.id === id) ?? null;
}

/** The counts a campaign is worth deciding on. */
export type Reach = {
  total: number;
  withEmail: number;
  withTrustedEmail: number;
  withPhone: number;
};

export type Verdict = {
  /** The number that matters for this channel. */
  usable: number;
  /** What share of the audience that is, 0 to 1. */
  share: number;
  /** Said plainly, and never as a percentage of a number too small to take one. */
  note: string;
  /** True where the share is low enough that running it anyway is the mistake. */
  thin: boolean;
};

/** Below this there is no honest percentage, only a count. */
const TOO_FEW = 20;
/** Under this share, the campaign is mostly rows nobody can contact. */
const THIN = 0.4;

/**
 * What the chosen channel can actually reach, and whether that is enough to be worth sending.
 *
 * The share is of the whole audience rather than of the rows with an address, because the
 * question somebody is asking is "if I run this, how much of my list did I pay to reach" - and a
 * list where 90% of the addresses are trusted but only a fifth of the rows have one at all is a
 * thin campaign dressed up as a good one.
 */
export function verdict(reach: Reach, channel: Destination["channel"]): Verdict {
  const usable =
    channel === "phone"
      ? reach.withPhone
      : channel === "identity"
        ? // An identity file can be keyed on an email or a phone, so either reaches it. Counted as
          // the larger rather than the sum: a row with both is one person, and adding the two
          // columns would claim more people than the audience holds. Overlap is why this is a
          // floor and the file's own count, reported when the job finishes, is the real number.
          //
          // The *trusted* email count, not every address: the activation job hashes only
          // trusted-tier addresses unless it is told otherwise, and that is its default and the
          // one this builder recommends. Using the wider count here would have promised a match
          // rate the default file cannot reach.
          Math.max(reach.withTrustedEmail, reach.withPhone)
        : reach.withEmail;
  const share = reach.total > 0 ? usable / reach.total : 0;
  const thin = reach.total >= TOO_FEW && share < THIN;

  if (reach.total === 0) {
    return { usable: 0, share: 0, note: "This audience is empty.", thin: false };
  }
  const of =
    reach.total < TOO_FEW
      ? `${usable.toLocaleString("en-US")} of ${reach.total.toLocaleString("en-US")}`
      : `${Math.round(share * 100)}% of the audience`;

  if (channel === "phone") {
    return { usable, share, note: `${of} has a practice phone on the record.`, thin };
  }
  if (channel === "identity") {
    return {
      usable,
      share,
      note: `At least ${of} can be matched on a hashed trusted-tier address or a phone.`,
      thin,
    };
  }
  const trusted = reach.withEmail > 0
    ? ` ${reach.withTrustedEmail.toLocaleString("en-US")} of those addresses are trusted-tier.`
    : "";
  return { usable, share, note: `${of} has a work email.${trusted}`, thin };
}

/** One step of an outreach sequence, as the builder proposes it. */
export type Step = { day: number; what: string; body: string };

/**
 * A three-step sequence whose merge fields are the headers the export writes.
 *
 * Proposed rather than generated from anything: a template nobody edits is a template every
 * recipient has seen, and the honest thing is to say so on the page. What it is really for is the
 * placeholders - somebody who writes their own copy in their sequencer still has to know that the
 * variable is called `First name` and not `firstName`, and that it is empty for an organisation.
 */
export function proposedSteps(channel: Destination["channel"]): Step[] {
  if (channel === "phone") {
    return [
      {
        day: 1,
        what: "Call",
        body:
          "Ask for {{First name}} {{Last name}} at {{Employer}}. The number is the practice " +
          "switchboard, so expect a front desk first.",
      },
      { day: 4, what: "Call back", body: "A different time of day than the first attempt." },
      { day: 9, what: "Final call", body: "Leave a message with a way to reach you." },
    ];
  }
  return [
    {
      day: 1,
      what: "Email",
      body:
        "Hi {{First name}} - I work with {{Specialty}} teams on [the one thing you do]. " +
        "Worth a short conversation?",
    },
    {
      day: 4,
      what: "Reply in thread",
      body: "One sentence, one link, and a clear way to say no.",
    },
    {
      day: 10,
      what: "Last email",
      body: "Say it is the last one. Replies to a close go up, and so does your sender reputation.",
    },
  ];
}

/**
 * What the builder must say out loud before somebody sends anything.
 *
 * Each of these is a fact about our data or our position, not legal advice, and each is here
 * because getting it wrong is expensive for the customer and for us.
 */
export const OBLIGATIONS: readonly { title: string; body: string }[] = [
  {
    title: "You are the sender",
    body:
      "The file leaves here and the sending happens in your tool, on your domain. The " +
      "unsubscribe link, the physical address in the footer and the record of who asked not to " +
      "be contacted are yours, and CAN-SPAM holds the sender to them.",
  },
  {
    title: "A practice phone is a business line",
    body:
      "The phone on a provider record is the one they published for their practice. We hold no " +
      "do-not-call flag against it, because it is not a residential number.",
  },
  {
    title: "A revealed cell is not",
    body:
      "A personal cell comes from the licensed file, carries the vendor's do-not-call flag where " +
      "there is one, and reaching it with an automatic dialler or a text is a TCPA question " +
      "rather than a CAN-SPAM one. Calls to it are a different decision from calls to a practice.",
  },
  {
    title: "Tell us who opted out",
    body:
      "Somebody who asks you not to contact them should be suppressed here as well, or the next " +
      "search will hand them back. Suppression is global and it is never a delete.",
  },
];

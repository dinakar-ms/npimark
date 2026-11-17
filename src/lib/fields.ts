/**
 * The field reference: every attribute the product supplies, one entry each.
 *
 * Why this file exists
 * --------------------
 * `/data` describes groups of facts and how often each is refreshed. `/docs/api` describes
 * endpoints. The export column picker and the append field picker describe columns. None of them
 * answers the question a procurement reviewer actually asks - *what is this field, what is it for,
 * how full is it, and what does it cost me* - so support answered it by email, one buyer at a
 * time. This is that answer, written down once.
 *
 * Five rules this catalogue keeps, and the reason for each
 * -------------------------------------------------------
 * 1. **No source is named.** Not a registry, not a federal agency, not a verifier, not a supplier.
 *    Where a record is assembled from is a competitor's question, not a customer's. The page says
 *    "the public record", "what the provider files", "federal filings", "a verifier". The same
 *    rule `/data` keeps, for the same reason.
 * 2. **No invented numbers.** Coverage is read live from the platform's own published list
 *    counts, or the entry says "not published". A fill rate nobody measured is the single most
 *    expensive thing a data sheet can contain, because a buyer plans against it.
 * 3. **Every example is illustrative and says so.** The shape of the value, in obviously
 *    fictional data. Never a real provider's details on a public page, and never an invented
 *    value presented as a real one.
 * 4. **The asymmetries are the point.** A field that is appendable but not exportable, or on the
 *    API but not in a file, is exactly what people write in about. Every entry names its API
 *    field, its export header and its append field, and `null` in any of the three is published
 *    rather than hidden.
 * 5. **A field can always name its own parameter.** Three append fields - the billing group, the
 *    programme-exclusion flag and the industry-payments total - are stored under names that say
 *    which filing or published dataset they are read from, which rule 1 forbids printing. The
 *    platform accepts a neutral alias for each (`FIELD_ALIASES` in
 *    `backend/app/jobs/append_enrich.py`) so this page can give a caller a name that works,
 *    rather than an entry with a blank where the parameter should be. A programme a *provider*
 *    participates in is not the same thing and needs no alias: "opted out of Medicare" is a fact
 *    about the clinician, so it is named plainly here and in the parameter.
 * 6. **The premium fields are described as they behave.** Contract only, matched with a
 *    confidence score, counted whenever they are handed over, never in a list and never over the
 *    API. Nothing here may make them read as purchasable online - what an agreement covers is
 *    settled with us, not read off this page.
 *
 * `app/fields/page.tsx` renders this and `app/fields.json/route.ts` serves it, so the human page
 * and the machine-readable dictionary cannot drift from one another.
 */

/** Which live coverage figure, if any, answers "how complete is this". */
/**
 * Which coverage figure, if any, answers "how complete is this".
 *
 * The first four are read live from the platform's published list counts. The last two are
 * different and the page says so where it quotes them: counting distinct providers across ten
 * million procedure lines and twenty-eight million prescribing rows is not a per-request query,
 * so they are measured by the platform's coverage job and published with the date they were
 * measured on. Measured-and-dated is the third case beside "live" and "not published", and it is
 * only allowed because the alternative was to print "not published" for a number we know.
 */
export type CoverageKey =
  | "email"
  | "trustedEmail"
  | "phone"
  | "location"
  | "procedures"
  | "prescribing";

/**
 * What it costs to get a field, in the plan's own terms.
 *
 * `public` - on the open pages and in open search, no account needed.
 * `account` - comes with a signed-in account, inside whatever your plan meters.
 * `reveal` - handed over one provider at a time, against the month's reveal allowance.
 * `contract` - licensed, and switched on only under an agreement naming the permissible use.
 *
 * The band is a property of the field, not of the door. A record taken out of the platform costs
 * a row against the plan's row allowance whatever bands its fields are in - in an export and in
 * an API response alike - and a `reveal` field costs its reveal on top, wherever it is asked for.
 */
export type CostBand = "public" | "account" | "reveal" | "contract";

export const COST_LABELS: Record<CostBand, string> = {
  public: "Free and public",
  account: "Included with an account",
  reveal: "Metered reveal",
  contract: "Contract only",
};

export type Field = {
  /** Stable key. The anchor on the page and the key in the JSON; never renamed. */
  key: string;
  /** What to call it in a sentence. */
  name: string;
  /** One plain sentence a non-technical buyer understands. */
  what: string;
  /** An illustrative value - fictional, and labelled as such wherever it is shown. */
  example: string;
  /** The job the field actually does. Honest about fields that only work in combination. */
  uses: string;
  /** The live coverage figure that answers this field, or null for "not published". */
  coverage: CoverageKey | null;
  /** The field name in a `/v1` provider response, or null when the API does not carry it. */
  api: string | null;
  /** The column header an export writes, or null when the field cannot be exported. */
  exportHeader: string | null;
  /** The field name the append tool accepts, or null when the field cannot be appended. */
  append: string | null;
  band: CostBand;
  /** What it costs, said in the plan's own terms. */
  cost: string;
  /** Anything a reader would otherwise write in to ask. */
  note?: string;
};

export type FieldGroup = {
  /** Stable key: the anchor for the group, and the key in the JSON. */
  key: string;
  title: string;
  /** What the group is, in one line, above its entries. */
  blurb: string;
  fields: Field[];
};

/*
 * Said once, rather than on twenty entries that would then drift apart.
 *
 * Neither names a surface, and that is the point. Both sentences used to end "it travels in
 * exports and appends" / "in files and over the API", which was wrong on twenty-one of the
 * sixty-eight entries - the licence number is appendable and not exportable, the Company column is
 * exportable and not appendable, and the sentence claimed both for each of them. Which surfaces a
 * field is on is a fact the entry already states three times, precisely, in its API, export and
 * append rows; `surfaceClause` below reads those rather than restating them by hand.
 */
const IN_A_FILE = "Included with an account, against your plan's row and call allowances.";
const PUBLIC_RECORD =
  "Free and public. It is on the open record pages and in search without an account.";

export const FIELD_GROUPS: FieldGroup[] = [
  {
    key: "identity",
    title: "Identity",
    blurb:
      "Who the record is about, and whether it is still live. Every other field on this page hangs off the identifier.",
    fields: [
      {
        key: "npi",
        name: "NPI",
        what: "The ten-digit national identifier a healthcare provider is enumerated under. One provider, one number, for life.",
        example: "0000000000",
        uses:
          "The join key for everything. It is what makes a record you hold and a record we hold the same record, so it is the column to keep when you load a file into a CRM and the column to send when you ask us to fill one in. It is also the only identifier here that survives a name change, a move and a change of employer.",
        coverage: null,
        api: "npi",
        exportHeader: "NPI",
        append: "npi",
        band: "public",
        cost: PUBLIC_RECORD,
        note:
          "Every export preset carries it, including the ones named after a CRM, because no CRM has a standard field for it and it is the column that makes the file worth re-loading later.",
      },
      {
        key: "type",
        name: "Type",
        what: "Whether the record is a person or an organization.",
        example: "individual",
        uses:
          "It decides which half of the record is populated: a person has name parts and no organization name, an organization is the other way round. Filtering on it is how you stop a list of clinicians filling up with practices, and it is the first thing to check when a mail merge starts writing \"Dear NORTHSIDE HOSPITAL\".",
        coverage: null,
        api: "type",
        exportHeader: "Type",
        append: "type",
        band: "public",
        cost: PUBLIC_RECORD,
      },
      {
        key: "status",
        name: "Status",
        what: "Whether the identifier is still active, or has been retired.",
        example: "active",
        uses:
          "Suppressing spend. An inactive identifier is a provider who has retired, died or given the number up, and mailing them costs the same as mailing anybody else. Search returns active records unless you ask for the rest, so this is mostly a field you read rather than one you set.",
        coverage: null,
        api: "status",
        exportHeader: "Status",
        append: "status",
        band: "public",
        cost: PUBLIC_RECORD,
      },
      {
        key: "credentials",
        name: "Credentials",
        what: "The post-nominal letters the provider filed - MD, DO, NP, RN and the rest - exactly as they filed them.",
        example: "MD",
        uses:
          "Salutation and segmentation. It is what lets an email open correctly, and it is a rougher but faster cut than specialty when you only need to separate physicians from everybody else. It is filed free-text, so treat it as a label rather than a controlled list: the same qualification appears as MD, M.D. and MD, FACP.",
        coverage: null,
        api: "credentials",
        exportHeader: "Credentials",
        append: "credentials",
        band: "public",
        cost: PUBLIC_RECORD,
        note:
          "Post-nominal qualifications live here. Generational suffixes - JR, SR, III - are a different field, and neither is derived from the other.",
      },
      {
        key: "enumeration_date",
        name: "Identifier issued",
        what: "The date the identifier was first issued.",
        example: "2011-04-18",
        uses:
          "A proxy for how long somebody has been practicing, useful when you are separating a new graduate from a thirty-year practice and have nothing else to go on. It is a floor, not a career start: an identifier is issued when it is first needed.",
        coverage: null,
        api: null,
        exportHeader: null,
        append: "enumeration_date",
        band: "account",
        cost: IN_A_FILE,
        note:
          "Appendable and on the record page, but not an export column and not on the v1 search row. Ask for it by appending your own file of identifiers.",
      },
      {
        key: "sole_proprietor",
        name: "Sole proprietor",
        what: "Whether the provider filed as a sole proprietor.",
        example: "no",
        uses:
          "A cheap read on practice size when you are separating independents from employed clinicians. It is what the provider filed rather than what an accountant would say today, so it is a hint that pairs with the employer field rather than a fact to route a rep on.",
        coverage: null,
        api: null,
        exportHeader: null,
        append: "sole_proprietor",
        band: "account",
        cost: IN_A_FILE,
        note: "Blank where nothing was filed, which is not the same as \"no\".",
      },
    ],
  },
  {
    key: "name",
    title: "Name, in one piece and in parts",
    blurb:
      "The filed name as one string, and the parts it was filed in. Nothing is ever split to fill a part: where only one string was filed, the parts are empty rather than guessed at.",
    fields: [
      {
        key: "name",
        name: "Name",
        what: "The whole filed name as one string, inverted for reading.",
        example: "SAMPLE JR, JORDAN E",
        uses:
          "Reading, matching and display. It is the string to show a human and the string to match against when you are reconciling a list that has names but no identifiers. It is not the string to put in a CRM's surname field - that is what the parts are for.",
        coverage: null,
        api: "name",
        exportHeader: "Name",
        append: "name",
        band: "public",
        cost: PUBLIC_RECORD,
      },
      {
        key: "first_name",
        name: "First name",
        what: "The given name, as filed.",
        example: "JORDAN",
        uses:
          "A mail merge that says \"Hi Jordan\" rather than \"Hi SAMPLE JR, JORDAN E\". Pair it with the surname; on its own it is not enough to identify anybody.",
        coverage: null,
        api: "first_name",
        exportHeader: "First name",
        append: "first_name",
        band: "public",
        cost: PUBLIC_RECORD,
      },
      {
        key: "middle_name",
        name: "Middle name",
        what: "The middle name or initial, as filed.",
        example: "E",
        uses:
          "Deduplication, almost exclusively. Two records with the same surname, first name and city are one person or two, and the middle initial is usually what decides it. Rarely worth showing a reader.",
        coverage: null,
        api: "middle_name",
        exportHeader: "Middle name",
        append: "middle_name",
        band: "public",
        cost: PUBLIC_RECORD,
      },
      {
        key: "last_name",
        name: "Last name",
        what: "The surname, as filed. Empty on an organization, which has no surname.",
        example: "SAMPLE",
        uses:
          "The surname field of every CRM, and the strongest half of a name match. An organization gets an empty cell here on purpose: putting a hospital's name in a surname field is how a merge ends up addressing a building.",
        coverage: null,
        api: "last_name",
        exportHeader: "Last name",
        append: "last_name",
        band: "public",
        cost: PUBLIC_RECORD,
      },
      {
        key: "name_prefix",
        name: "Prefix",
        what: "DR, MR and the like, where one was filed.",
        example: "DR",
        uses:
          "Formal salutations. It is filed in the register's own spelling, which is upper case and full-stopped, so most importers want it cased before it goes into a picklist.",
        coverage: null,
        api: "name_prefix",
        exportHeader: "Prefix",
        append: null,
        band: "public",
        cost: PUBLIC_RECORD,
        note:
          "On the API and in an export, but not an append field. If you need it against your own file, take it from an export keyed on the identifier.",
      },
      {
        key: "name_suffix",
        name: "Suffix",
        what: "A generational suffix - JR, SR, III - where one was filed.",
        example: "JR",
        uses:
          "Telling a father and a son apart, which matters more than it sounds: they often share a surname, a first name, a speciality and a practice address. Never treat a suffix as a qualification; those are in credentials.",
        coverage: null,
        api: "name_suffix",
        exportHeader: "Suffix",
        append: "suffix",
        band: "public",
        cost: PUBLIC_RECORD,
      },
      {
        key: "organization_name",
        name: "Organization name",
        what: "The filed name of an organization record. Empty on a person.",
        example: "Example Health Partners",
        uses:
          "The account name. On an organization record this is the name on the door, and it is what an account-based list is keyed on. A person's record leaves it empty; their employer is a different field.",
        coverage: null,
        api: "organization_name",
        exportHeader: "Organization name",
        append: null,
        band: "public",
        cost: PUBLIC_RECORD,
        note:
          "On the API and in an export, but not an append field - an append is keyed on the identifier, and the Name field already carries an organization's name.",
      },
      {
        key: "company",
        name: "Company",
        what: "One column that holds the right company whichever kind of record the row is: an organization's own name, or a person's employer.",
        example: "Example Health Partners",
        uses:
          "Loading a mixed file into a CRM without a formula. Every importer has one company field and it has to be filled from two different places depending on the row; this does that once, on our side.",
        coverage: null,
        api: null,
        exportHeader: "Company",
        append: null,
        band: "account",
        cost: IN_A_FILE,
        note:
          "An export column only - it is composed for the file rather than stored, so there is nothing for the API to return. Every CRM preset uses it.",
      },
      {
        key: "crm_last_name",
        name: "Last name for an importer",
        what: "The surname a CRM's own Last Name field should be given, with the fallbacks an importer needs so no row arrives nameless.",
        example: "SAMPLE",
        uses:
          "Getting a file past an importer that refuses a row with an empty Last Name. It is the filed surname where there is one, the whole filed string where the register filed no parts at all, and empty for an organization, whose name belongs in Company.",
        coverage: null,
        api: null,
        exportHeader: "Last name for an importer",
        append: null,
        band: "account",
        cost: IN_A_FILE,
        note: "An export column only, and the one the CRM presets use in place of the plain surname.",
      },
    ],
  },
  {
    key: "specialty",
    title: "Specialty and taxonomy",
    blurb:
      "What the provider practices, as a code and as three levels of plain English. Asking for a classification matches every specialty beneath it.",
    fields: [
      {
        key: "specialty",
        name: "Specialty",
        what: "The display name of the provider's primary specialty.",
        example: "Internal Medicine Physician",
        uses:
          "The single most useful segmentation field on the record, and the one every list is cut by. It is also what the CRM presets map to the Title or Job Title field, because that is the field a rep reads before a call.",
        coverage: null,
        api: "primary_taxonomy.display",
        exportHeader: "Specialty",
        append: "specialty",
        band: "public",
        cost: PUBLIC_RECORD,
      },
      {
        key: "taxonomy_code",
        name: "Taxonomy code",
        what: "The reference code behind the specialty.",
        example: "207R00000X",
        uses:
          "Filtering precisely and reproducibly. Display names change wording between reference releases; the code does not, so a saved segment built on codes still means the same thing a year later. This is the field to store if you are keeping our segment definition in your own system.",
        coverage: null,
        api: "primary_taxonomy.code",
        exportHeader: null,
        append: "taxonomy_code",
        band: "account",
        cost: IN_A_FILE,
        note: "On the API and appendable, but there is no export column for the raw code - exports carry the display name and the classification instead.",
      },
      {
        key: "taxonomy_classification",
        name: "Specialty group",
        what: "The heading the specialty sits under.",
        example: "Internal Medicine",
        uses:
          "Sizing a segment at the level a plan is actually written at. \"Internal Medicine\" is a market; \"Internal Medicine, Interventional Cardiology\" is a territory. Filtering on the classification matches every specialization beneath it, so this is the field to use when you do not yet know how far down you want to go.",
        coverage: null,
        api: "primary_taxonomy.classification",
        exportHeader: "Specialty group",
        append: "taxonomy_classification",
        band: "public",
        cost: PUBLIC_RECORD,
      },
      {
        key: "taxonomy_specialization",
        name: "Specialisation",
        what: "The narrower specialization inside the classification, where the provider filed one.",
        example: "Endocrinology",
        uses:
          "The last cut before a named list. Most providers file no specialization at all, so a filter on it is a much smaller audience than the classification above it - which is the right answer when the product only fits the sub-specialty, and the wrong one when you wanted the whole field.",
        coverage: null,
        api: null,
        exportHeader: null,
        append: "taxonomy_specialization",
        band: "account",
        cost: IN_A_FILE,
        note: "Appendable, and on the record page inside the full taxonomy list. Not an export column and not on the v1 search row.",
      },
      {
        key: "matched_taxonomy",
        name: "Matched specialty",
        what: "When a specialty filter matched something other than the primary specialty, the one it actually matched.",
        example: "Cardiovascular Disease",
        uses:
          "Explaining a result that otherwise looks wrong. A provider whose primary is Internal Medicine and whose second is Cardiovascular Disease is a cardiologist, and will appear in a cardiology search labeled Internal Medicine; this field is the reason. Null when no specialty filter was used, or when the primary is what matched.",
        coverage: null,
        api: "matched_taxonomy",
        exportHeader: null,
        append: null,
        band: "account",
        cost: "Included with an account. It is returned by the API and shown on screen; there is no column for it in a file.",
      },
    ],
  },
  {
    key: "practice",
    title: "Practice location",
    blurb:
      "Where the provider practices, as filed - not where they live. The home address is a different, contracted product with its own section below.",
    fields: [
      {
        key: "address_line",
        name: "Practice street",
        what: "The street line of the practice address.",
        example: "100 Sample Way, Suite 4",
        uses:
          "Routing a rep to a door, and collapsing a group practice: eleven clinicians at one suite is eleven letters through one door, which is why an export can cap how many rows it writes per address.",
        coverage: "location",
        api: null,
        exportHeader: null,
        append: "address_line",
        band: "account",
        cost: IN_A_FILE,
        note:
          "This is the asymmetry people write in about most. City, state and ZIP are on the API and in every export; the street line is appendable and on the record page, and is in neither the v1 search row nor an export column.",
      },
      {
        key: "city",
        name: "Practice city",
        what: "The town or city of the practice address.",
        example: "Anytown",
        uses:
          "Territory lines and metro sizing, and half of the weakest name-match rule the append tool will use. On its own a city is ambiguous - there are towns of the same name in a dozen states - so it is always read with the state.",
        coverage: "location",
        api: "city",
        exportHeader: "City",
        append: "city",
        band: "public",
        cost: PUBLIC_RECORD,
      },
      {
        key: "state",
        name: "Practice state",
        what: "The two-letter state of the practice address.",
        example: "ST",
        uses:
          "The first cut on almost every list, the unit most sales territories are drawn in, and the field a licensing question is asked against. Note that it is the practice state, not the license state, and the two disagree more often than people expect.",
        coverage: "location",
        api: "state",
        exportHeader: "State",
        append: "state",
        band: "public",
        cost: PUBLIC_RECORD,
      },
      {
        key: "postal_code",
        name: "Practice ZIP",
        what: "The five-digit postal code of the practice address. A nine-digit code is cut to its first five.",
        example: "00000",
        uses:
          "Radius search, catchment modeling and the single strongest of the name-based match rules - a surname plus a practice ZIP identifies one provider far more often than a surname plus a state. It is also what a territory is really drawn in once it gets below state level.",
        coverage: "location",
        api: "postal_code",
        exportHeader: "ZIP",
        append: "postal_code",
        band: "public",
        cost: PUBLIC_RECORD,
      },
      {
        key: "mailing_address",
        name: "Mailing address",
        what: "The separate mailing address, where the provider filed one: street, city, state and ZIP.",
        example: "PO Box 100, Anytown, ST 00000",
        uses:
          "Physical mail that has to arrive. A practice address is where care happens and is frequently a suite in a building with a shared mailroom; the mailing address is where the provider asked to be written to. For anything posted, prefer it and fall back to the practice address.",
        coverage: null,
        api: null,
        exportHeader: null,
        append: "mailing_address, mailing_city, mailing_state, mailing_zip",
        band: "account",
        cost: IN_A_FILE,
        note: "Four append fields, and on the record page. Not on the API row, and not export columns.",
      },
      {
        key: "practice_locations_count",
        name: "Practice locations",
        what: "How many practice locations we hold for the record - the main practice address plus every additional location filed under the same identifier.",
        example: "3",
        uses:
          "Separating a single-site clinician from one who covers a network, and a good early filter for anything sold by site count. It is a count of what was filed, so a provider who covers four sites and filed one reads as one.",
        coverage: null,
        api: null,
        exportHeader: null,
        append: "practice_locations_count",
        band: "account",
        cost: IN_A_FILE,
      },
      {
        key: "distance_miles",
        name: "Distance",
        what: "How far the practice is from the center of the ZIP you searched around, in miles.",
        example: "4.2",
        uses:
          "Ordering a radius search by how close somebody actually is, and defending a territory boundary. It exists only on a search that used a ZIP and a radius; on any other search it is empty.",
        coverage: null,
        api: "distance_miles",
        exportHeader: "Distance (miles)",
        append: null,
        band: "account",
        cost:
          "Included with an account. It is computed for the search that asked for it rather than stored, so there is nothing to append.",
      },
    ],
  },
  {
    key: "contact",
    title: "Contact",
    blurb:
      "The practice phone is filed on the public record. The work email is not - it has to be confirmed, so it is the one field on the record that carries a measured tier.",
    fields: [
      {
        key: "phone",
        name: "Practice phone",
        what: "The phone number filed against the practice location. A practice line, not a personal one.",
        example: "(555) 010-0123",
        uses:
          "Calling the practice and reaching whoever answers it. It is the number to give a rep for a first call and the wrong number for anything that has to reach one named person. Paired with a surname it is also one of the stronger rules the append tool matches on.",
        coverage: "phone",
        api: "phone",
        exportHeader: "Phone",
        append: "phone",
        band: "public",
        cost: PUBLIC_RECORD,
      },
      {
        key: "phone_source",
        name: "Phone source",
        what: "A short phrase saying where the practice phone came from.",
        example: "(a short phrase naming the public register the number was filed in)",
        uses:
          "Defending a number to a compliance reviewer who wants to know how you came by it. It is a single fixed phrase rather than a varying label, so it is more useful in an audit file than on a screen.",
        coverage: null,
        api: null,
        exportHeader: "Phone source",
        append: null,
        band: "account",
        cost: IN_A_FILE,
        note: "An export column only.",
      },
      {
        key: "email",
        name: "Work email",
        what: "The best work email address we hold for the provider.",
        example: "jordan.sample@example.com",
        uses:
          "Reaching one named person directly, which is the thing a practice phone cannot do. Read it with its trust tier below: the address alone is a string, and the tier is what tells you whether to send to it.",
        coverage: "email",
        api: "email",
        exportHeader: "Email",
        append: "work_email",
        band: "reveal",
        cost:
          "A metered reveal on screen: one provider at a time, counted, and free for the rest of the month if the same provider is opened again. In a file or over the API it comes with an account, against your plan's export, append and call allowances.",
      },
      {
        key: "email_trust_tier",
        name: "Work email trust tier",
        what: "How much we stand behind an address: trusted, probable, doubtful or rejected - and null when it has not been measured at all.",
        example: "trusted",
        uses:
          "Deciding what to send and what to sit on. Trusted is safe to send; probable is good enough to tell you where somebody works but not to mail without care; doubtful is kept and shown and never acted on; rejected is not usable. Null is \"not measured\", which fails every trust filter - it is never treated as fine.",
        coverage: "trustedEmail",
        api: "email_trust_tier",
        exportHeader: null,
        append: null,
        band: "account",
        cost:
          "Included with an account. There is no tier column in a file; instead a file can be told to write only trusted-tier addresses, and an append does that by default.",
        note:
          "No column of its own in an export or an append - the switch is a trusted-only option on the job, and the job result counts how many cells it blanked. The tiers are explained on the email trust page.",
      },
      {
        key: "email_source",
        name: "Work email source",
        what: "A short phrase saying how the address reached us.",
        example: "Practice website",
        uses:
          "Two jobs. It is how a compliance reviewer traces an address, and it is how you decide which of several addresses for one provider to prefer when the tiers are equal. An address and its source column always agree: a blanked address never leaves its source behind.",
        coverage: null,
        api: "email_source",
        exportHeader: "Email source",
        append: "work_email_source",
        band: "account",
        cost: IN_A_FILE,
      },
      {
        key: "emails",
        name: "Further work emails",
        what: "The other addresses we hold for the same provider, best first, each with its own source.",
        example: "j.sample@example.com; jordan.sample@example.org",
        uses:
          "Coverage on a provider who has moved, or who is reachable at two organizations. A second address is the difference between a bounce and a delivery on somebody who changed jobs and kept practicing. A file carries up to four further addresses beside the best one.",
        coverage: null,
        api: "emails",
        exportHeader: "Email 2 … Email 5, with Email 2 source … Email 5 source",
        append: "all_emails, all_emails_with_sources",
        band: "reveal",
        cost:
          "The same as the work email: a metered reveal on screen, and in a file or over the API against your plan's allowances.",
      },
      {
        key: "email_count",
        name: "Email count",
        what: "How many addresses we hold for the provider. Always exact, even where the row lists only the best few.",
        example: "2",
        uses:
          "Judging a list before you buy it, and judging a row before you mail it. A count of zero is the honest statement that this provider is not reachable by email through us, and it is the field to filter on when you want a segment that is.",
        coverage: null,
        api: "email_count",
        exportHeader: "Emails",
        append: "email_count",
        band: "account",
        cost: IN_A_FILE,
      },
      {
        key: "email_domains",
        name: "Email domains",
        what: "The distinct domains of the addresses we hold for the provider.",
        example: "example.com; example.org",
        uses:
          "Rolling a list of clinicians up to the organizations behind them without a name match. Two providers on the same domain are usually two colleagues, which is the cheapest account grouping there is - and it is a hint rather than a fact, because a domain can be a shared consumer mailbox.",
        coverage: null,
        api: null,
        exportHeader: null,
        append: "email_domains",
        band: "account",
        cost: IN_A_FILE,
      },
      {
        key: "personal_email",
        name: "Personal email",
        what: "A known personal address, where one is on the record and marked as personal rather than work.",
        example: "j.sample@example.net",
        uses:
          "Recruiting, mostly - the case where a work address is the wrong place to write. It is far thinner than the work address and should never be the only route in a campaign.",
        coverage: null,
        api: null,
        exportHeader: null,
        append: "personal_email",
        band: "reveal",
        cost:
          "A metered reveal on screen, and appendable against your plan's append rows. It is not an export column and not on the v1 search row.",
      },
      {
        key: "file_phones",
        name: "Phones from your own contact files",
        what: "Numbers your own organization supplied for a provider in a contact file, given back beside the record.",
        example: "(555) 010-0124 (office); (555) 010-0125 (cell)",
        uses:
          "Keeping what you already knew. If you have loaded your own numbers, this is how they come back out attached to the identifier rather than to whatever row they arrived on. Empty for an organization that has loaded none, which is most.",
        coverage: null,
        api: null,
        exportHeader: "Phones from contact files",
        append: null,
        band: "account",
        cost: IN_A_FILE,
        note:
          "An export column only, and it holds your own data rather than ours. Suppressed numbers are left out of it like any other.",
      },
    ],
  },
  {
    key: "employer",
    title: "Employment and affiliation",
    blurb:
      "Who a provider works for, how that was established, and the systems the practice runs. Everything in this group is worked out rather than filed, so everything in it carries how it was worked out.",
    fields: [
      {
        key: "employer_name",
        name: "Employer",
        what: "The organization a provider works for, where one can be justified.",
        example: "Example Health Partners",
        uses:
          "Rolling clinicians up to the account that signs. It is the field that turns a list of names into a list of opportunities, and the field a territory is really assigned on once a team sells to systems rather than to individuals. Read it with the employer source: an employer nobody can justify is not published.",
        coverage: null,
        api: "employer_name",
        exportHeader: "Employer",
        append: "employer_name",
        band: "account",
        cost: IN_A_FILE,
      },
      {
        key: "employer_domain",
        name: "Employer domain",
        what: "The employer's web domain.",
        example: "examplehealth.com",
        uses:
          "The account key every CRM already has. Matching a provider to an account by domain is faster and far more reliable than matching by name, which is why the CRM presets map this to the Website field rather than mapping the employer name to it.",
        coverage: null,
        api: "employer_domain",
        exportHeader: "Employer domain",
        append: "employer_domain",
        band: "account",
        cost: IN_A_FILE,
      },
      {
        key: "employer_source",
        name: "Employer source",
        what: "How the employer was worked out, in plain words.",
        example: "The provider's own email domain",
        uses:
          "Deciding how much weight to put on the employer. Some routes are a federal filing saying so; others are an inference from colleagues at the same address. The column tells you which, which is what a careful buyer wants before they route an account on it.",
        coverage: null,
        api: "employer_source",
        exportHeader: "Employer source",
        append: "employer_source",
        band: "account",
        cost: IN_A_FILE,
        note: "The API returns a short code; an export writes the sentence.",
      },
      {
        key: "billing_group",
        name: "Billing group",
        what: "The group a provider reassigns their billing to, as named in federal enrollment filings.",
        example: "Example Health Partners LLC",
        uses:
          "The hardest evidence of employment there is, because it is a filing rather than an inference. It is also frequently a legal entity rather than the name on the door, so it is better as a join key and a corroboration than as something to print in a letter.",
        coverage: null,
        api: null,
        exportHeader: null,
        append: "billing_group",
        band: "account",
        cost: IN_A_FILE,
      },
      {
        key: "ehr_system",
        name: "Record system",
        what: "The electronic health record the practice runs, where that is evidenced.",
        example: "Example EHR",
        uses:
          "Qualifying anything that has to integrate. If your product plugs into two systems and not a third, this field is the difference between a pipeline and a list. It is evidenced rather than surveyed, so absence means \"no evidence\", not \"no system\".",
        coverage: null,
        api: "ehr_system",
        exportHeader: "EHR system",
        append: "ehr_system",
        band: "account",
        cost: IN_A_FILE,
      },
      {
        key: "ehr_source",
        name: "Record system source",
        what: "How the record system was identified, in plain words.",
        example: "Most colleagues at the same employer",
        uses:
          "The same job the employer source does. Some routes are the practice publishing its own technical endpoint; others are what the majority of colleagues at the same organization run. Treat the second as a strong hint and the first as a fact.",
        coverage: null,
        api: "ehr_source",
        exportHeader: "EHR source",
        append: "ehr_source",
        band: "account",
        cost: IN_A_FILE,
      },
      // "Organisation website and profile" (`organization_website`,
      // `organization_linkedin`, `organization_web_source`) is held back from this catalogue
      // while the platform cannot fill it. This is NOT a licence restriction: counsel ruled on
      // 2026-09-27 that the data is ours to resell, and the change that would refill the
      // columns is blocked on a permission rather than on any terms. Listed here it would
      // advertise a column that arrives empty, which is the one thing this catalogue must
      // never do (rule 2). Put it back as soon as the API fills it again - the entry is in
      // git, the restore is a revert, and nothing has to be rewritten from scratch.
      // Background: docs/entity-search-terms.md.
    ],
  },
  {
    key: "licence",
    title: "Licenses",
    blurb:
      "The license numbers and states filed against the record. A license is filed by the provider against a specialty, so one record can carry several.",
    fields: [
      {
        key: "license_number",
        name: "License number",
        what: "The state license number as filed against the provider's specialty.",
        example: "A00000",
        uses:
          "Credentialling and verification. It is the number somebody takes to a state board to check standing, and it is the join key when you are reconciling our record against a board's own roster. It is what was filed, so treat it as a lead for verification rather than as verification.",
        coverage: null,
        api: null,
        exportHeader: null,
        append: "license_number",
        band: "account",
        cost: IN_A_FILE,
        note: "Appendable, and on the record page with the full license list. Not an export column and not on the v1 search row.",
      },
      {
        key: "license_state",
        name: "License state",
        what: "The state that issued the license.",
        example: "ST",
        uses:
          "Checking that somebody may practice where you want to place them, which is not the same question as where they practice today. A clinician near a state line commonly holds licenses on both sides, and only this field shows it.",
        coverage: null,
        api: null,
        exportHeader: null,
        append: "license_state",
        band: "account",
        cost: IN_A_FILE,
      },
    ],
  },
  {
    key: "standing",
    title: "Standing",
    blurb:
      "Whether a provider can be billed for at all, and what federal programs say about them. This is the group that saves money before it is spent.",
    fields: [
      {
        key: "excluded",
        name: "Program exclusion",
        what: "Whether the provider is on a federal exclusion list and has not been reinstated.",
        example: "no",
        uses:
          "The check before anything else. An excluded provider cannot be billed for, and a contract signed with one is a problem that gets more expensive the longer it runs. It is also a clean reason to drop rows from a campaign before you pay to mail them.",
        coverage: null,
        api: null,
        exportHeader: null,
        append: "excluded",
        band: "account",
        cost: IN_A_FILE,
        note:
          "Appendable, and a filter on search. Not an export column and not on the v1 search row.",
      },
      {
        key: "opted_out",
        name: "Opted out",
        what: "Whether the provider has opted out of the federal program.",
        example: "no",
        uses:
          "Reimbursement and eligibility questions. A provider who has opted out is not billing the program, which changes both what you can sell them and how their patients pay. Often the explanation for a busy clinician with no utilization figures at all.",
        coverage: null,
        api: null,
        exportHeader: null,
        append: "medicare_opted_out",
        band: "account",
        cost: IN_A_FILE,
      },
      {
        key: "beneficiaries",
        name: "Program patients",
        what: "How many program patients the provider saw, in the latest published year.",
        example: "1,240",
        uses:
          "Sizing a practice by what it does rather than by how many people work there. It is a floor rather than a total - small counts are withheld by the publisher and stay withheld here rather than being filled in with a zero - and it says nothing about patients outside the program.",
        coverage: null,
        api: null,
        exportHeader: null,
        append: "medicare_beneficiaries",
        band: "account",
        cost: IN_A_FILE,
        note: "Nothing under eleven patients is published, so a blank is not a zero.",
      },
      {
        key: "industry_payments",
        name: "Industry payments",
        what: "Money reported as paid to this provider by industry - consulting, speaking, travel, food - totalled in dollars over the latest year published.",
        example: "4,820.00",
        uses:
          "Two very different jobs. It is a conflict-of-interest check for anyone who has to run one, and it is a relationship signal for anyone selling into a speciality where the field already pays for speaking and consulting. Read it as one year's published total rather than a career total: the year moves as new figures are published, and what you get is always the latest one held.",
        coverage: null,
        api: null,
        exportHeader: null,
        append: "industry_payments_total",
        band: "account",
        cost: IN_A_FILE,
      },
    ],
  },
  {
    key: "utilisation",
    title: "What they do",
    blurb:
      "Not who a provider is but what they actually did: the procedures they billed and the drugs they prescribed, from published Medicare data for one year. This is the group that answers “find me the surgeons who really do this operation” rather than “find me the surgeons”. A provider has many lines and a file has one row per provider, so a file carries a summary of them — the highest-volume few, and the sizes — under headers that name the data year, while the lines themselves stay on their own API call. Those columns widen a row and never add one, so a file costs the same rows with them as without. Read the limits on each entry before you plan around it - it is Medicare fee-for-service only, it covers about one in six clinicians, and low-volume providers are removed from the published file before we receive it, so five rows in six carry “No published volume” rather than a number.",
    fields: [
      {
        key: "procedure_code",
        name: "Procedure billed",
        what: "A procedure the provider billed Medicare for, as its published code with a plain-English description, at each place of service.",
        example: "27447 - total knee replacement, office",
        uses:
          "Finding the clinicians who demonstrably perform a procedure, rather than the ones whose specialty suggests they might. It is the difference between a list of orthopedic surgeons and a list of orthopedic surgeons who billed knee replacements. You can search by name rather than by code, so “knee replacement” finds the code for you, and the filter works as an exclusion too.",
        coverage: "procedures",
        api: "code, description, place_of_service",
        exportHeader: "Top Medicare procedures",
        append: "top_procedures",
        band: "account",
        cost: IN_A_FILE,
        note:
          "Every line has its own API call per provider, because a busy surgeon has dozens of codes and a large group has hundreds. A file has one row per provider, so it carries a summary instead: the three highest-volume procedures in one cell, each as its published code, its description and its volume, separated by “; ” — the same separator the phone and email columns already use. Three, because that is what a cell holds and a person reads, and the same three in an export and in an append. The header carries the data year, so the file says which year the numbers are from. An absence is not a no: low-volume rows are removed before publication, so a provider not shown for a code may still do it for a small number of Medicare patients, or for patients on any other insurance.",
      },
      {
        key: "procedure_volume",
        name: "Procedure volume",
        what: "For each procedure: how many services and how many Medicare patients, with the published average submitted charge, allowed amount and payment.",
        example: "112 services, 94 patients, 1,480.00 allowed",
        uses:
          "Sizing and ranking. “At least fifty of these last year” is a different and much better target than “does these”, and the published averages tell you what the procedure is worth where they practice, which is what a device or service priced against it needs. Read a volume as Medicare volume, not total volume - the same clinician may do several times as much outside the program.",
        coverage: "procedures",
        api: "beneficiaries, services, avg_submitted_charge, avg_allowed_amount, avg_payment_amount",
        exportHeader: "Top Medicare procedures, Medicare services, Medicare procedure codes",
        append: "top_procedures, procedure_services, procedure_codes",
        band: "account",
        cost: IN_A_FILE,
        note:
          "In a file this is two numbers, plus the volume beside each procedure in the top cell: how many services were published for the provider across every line, and how many distinct codes those lines cover. There is no total-patients column and there will not be one built from these lines — patients are published per line and the same patient appears on as many lines as they had procedures, so adding them up produces a number that counts nobody. The separately published per-provider patient total is its own entry on this page. A provider with nothing published reads “No published volume”, never 0 and never an empty cell: the published data carries no zeros, because a low-volume line is removed rather than published small. Each header carries the data year. One year is held, so there is no previous year to compare with: nothing here supports “rising”, “falling” or “recently started”, and we will not imply otherwise until earlier years are loaded.",
      },
      {
        key: "prescribed_drug",
        name: "Drug prescribed",
        what: "A drug the provider prescribed under Medicare Part D, by brand name and by generic name.",
        example: "ELIQUIS (APIXABAN)",
        uses:
          "Reaching prescribers by what they actually write. A generic name means the molecule - every prescription filed under it, whichever brand - so you can target a therapy class or one brand within it, and search by either name without knowing which is which. As an exclusion it is just as useful: leave out everybody already writing a competitor.",
        coverage: "prescribing",
        api: "brand_name, generic_name",
        exportHeader: "Top Part D drugs",
        append: "top_drugs",
        band: "account",
        cost: IN_A_FILE,
        note:
          "Part D only: what a prescriber writes for patients with Medicare drug coverage, not what they write for everybody. Every line has its own API call per provider; a file carries the three highest-volume drugs in one cell, separated by “; ”, each written as “BRAND / GENERIC” where the two differ and as the one name where they do not — both, because a search means one or the other depending on who is asking. The header carries the data year.",
      },
      {
        key: "prescribing_volume",
        name: "Prescribing volume",
        what: "For each drug: claims, patients and total drug cost as published, with the share for patients aged 65 and over.",
        example: "412 claims, 96 patients, 184,300.00",
        uses:
          "Ranking prescribers inside a therapy class, which is the whole job for anyone selling against one. “At least four hundred claims” separates the prescribers worth a visit from the ones who wrote it twice, and the cost figure is what a formulary conversation is actually about.",
        coverage: "prescribing",
        api: "claims, beneficiaries, drug_cost, claims_65_plus",
        exportHeader: "Top Part D drugs, Part D claims, Part D drugs",
        append: "top_drugs, prescribing_claims, prescribing_drugs",
        band: "account",
        cost: IN_A_FILE,
        note:
          "In a file this is two numbers, plus the volume beside each drug in the top cell: how many claims were published for the prescriber across every drug, and how many drugs they have a published row for, counting one brand-and-generic combination as one drug. A missing count is never a zero, so the cell reads “No published volume” rather than being left blank. The published file leaves out low-volume prescribing entirely rather than flagging it, so a prescriber with nothing here may be below the publication threshold - and we cannot tell you which. Each header carries the data year. One year, so no trend.",
      },
    ],
  },
  {
    key: "organisation",
    title: "Organization and facility",
    blurb:
      "A certified facility carries everything a provider record does, plus what only an organization has: a certification, a size, an owner, a chain and a leadership team.",
    fields: [
      {
        key: "ccn",
        name: "Certification number",
        what: "The number a certified facility is certified under. One number, one certified facility.",
        example: "000000",
        uses:
          "The join key for a facility, the way the identifier is for a provider. It is what links a facility to its published ratings, its bed count and its ownership, and it is the key to keep when you load facilities into a CRM as accounts.",
        coverage: null,
        api: "ccn",
        exportHeader: null,
        append: null,
        band: "public",
        cost:
          "Free and public. It is on the facility pages and over the API. Facility records are their own product and are not columns in a provider export.",
      },
      {
        key: "facility_type",
        name: "Facility family and category",
        what: "Which kind of certified organization it is - hospital, nursing home, hospice, home health agency, dialysis center or another certified type - and the category beneath it.",
        example: "hospital",
        uses:
          "The first cut on any facility list, and the level at which a product is usually sold. The category beneath it is what separates a critical-access hospital from a general one, which is frequently the difference between a fit and a waste of a call.",
        coverage: null,
        api: "facility_type, category, subtype",
        exportHeader: null,
        append: null,
        band: "public",
        cost: "Free and public, on the facility pages and over the API.",
      },
      {
        key: "beds",
        name: "Certified beds",
        what: "How many beds the facility is certified for.",
        example: "120",
        uses:
          "The size field. Almost everything sold into an inpatient setting is priced or sized on beds, and it is the most reliable proxy for budget on a facility record. Empty on facility families where beds are not the unit - a home health agency has none.",
        coverage: null,
        api: "beds",
        exportHeader: null,
        append: null,
        band: "public",
        cost: "Free and public, on the facility pages and over the API.",
      },
      {
        key: "ownership_type",
        name: "Ownership type",
        what: "Whether the facility is for-profit, non-profit or government, in the publisher's own words.",
        example: "Non-profit - Corporation",
        uses:
          "Qualifying how a purchase gets made. A government facility buys on a schedule and a procurement process; a for-profit chain buys centrally; an independent non-profit buys locally. It changes the sales motion more than the size field does.",
        coverage: null,
        api: "ownership_type",
        exportHeader: null,
        append: null,
        band: "public",
        cost: "Free and public, on the facility pages and over the API.",
      },
      {
        key: "chain_organization",
        name: "Chain",
        what: "The chain the facility reports under, where it reports one.",
        example: "Example Care Group",
        uses:
          "Finding the buyer above the building. A chain name is how twelve separate facility records become one account, and it is the field to group on before anybody calls, so two reps do not call the same head office.",
        coverage: null,
        api: "chain_organization",
        exportHeader: null,
        append: null,
        band: "public",
        cost: "Free and public, on the facility pages and over the API.",
      },
      {
        key: "ratings",
        name: "Published ratings",
        what: "The facility's published quality ratings - overall, health inspection, staffing and quality measures - as the publisher released them.",
        example: "4",
        uses:
          "Prioritising, and qualifying anything sold on quality improvement. A low staffing rating is a live problem somebody is being asked about. The ratings are carried as published: we neither recompute them nor infer anything beneath them.",
        coverage: null,
        api: "overall_rating, health_inspection_rating, staffing_rating, quality_measure_rating",
        exportHeader: null,
        append: null,
        band: "public",
        cost: "Free and public, on the facility pages and over the API.",
      },
      {
        key: "emergency_services",
        name: "Emergency services",
        what: "Whether the facility offers emergency services.",
        example: "yes",
        uses:
          "A fast qualifier for anything that only applies to a facility with an emergency department. Empty where the publisher did not say, which is not the same as no.",
        coverage: null,
        api: "emergency_services",
        exportHeader: null,
        append: null,
        band: "public",
        cost: "Free and public, on the facility pages and over the API.",
      },
      {
        key: "facility_npi",
        name: "The facility's billing identifier",
        what: "The organization identifier the facility bills under, where the two are linked.",
        example: "0000000000",
        uses:
          "Crossing between the two halves of the product. It is what joins a certified facility to the clinicians who bill under it, so an account plan can carry both the building and the people in it. Not every facility is linked to one.",
        coverage: null,
        api: "npi",
        exportHeader: null,
        append: null,
        band: "public",
        cost: "Free and public, on the facility pages and over the API.",
      },
      {
        key: "leadership_counts",
        name: "Leadership, counted by role",
        what: "How many named leadership people an organization has, by role - chief executives, finance, nursing, medical directors, administrators, compliance, board members and owners.",
        example: "Executive 2 · Finance 1 · Owner 3",
        uses:
          "Sizing the buying committee before you go looking for it, and deciding which accounts are worth the effort. A facility with a named compliance officer and a named chief nursing officer is a different sale from one with neither.",
        coverage: null,
        api: "leadership.total, leadership.by_role",
        exportHeader: null,
        append: null,
        band: "public",
        cost:
          "Free and public as counts. The names and titles behind the counts are for signed-in customers.",
        note:
          "Counts on every public page and over the API. Nobody without an identifier of their own is named in public, anywhere on this site.",
      },
      {
        key: "affiliated_providers",
        name: "Linked providers",
        what: "The clinicians who bill under the organization or practice at the facility, counted by specialty.",
        example: "Internal Medicine 24 · Cardiology 6",
        uses:
          "Reading what a facility actually does, which its type does not tell you. It is also the bridge from an account to the individuals inside it, and the counts are what a territory is sized on before a rep is hired.",
        coverage: null,
        api: "affiliated_providers, by_specialty",
        exportHeader: null,
        append: null,
        band: "public",
        cost: "Free and public, on the organization and facility pages and over the API.",
      },
    ],
  },
  {
    key: "system",
    title: "Health system",
    blurb:
      "The layer above a facility: the system or chain it belongs to, and what else that system operates.",
    fields: [
      {
        key: "system_name",
        name: "Health system",
        what: "The system or chain the facility belongs to, where it belongs to one large enough to publish.",
        example: "Example Care Group",
        uses:
          "The account, when the account is bigger than a building. This is the level a framework agreement is signed at, and grouping on it is how a list of two hundred facilities becomes a list of twenty conversations.",
        coverage: null,
        api: "system.slug, system.label",
        exportHeader: null,
        append: null,
        band: "public",
        cost: "Free and public, on the facility and system pages and over the API.",
      },
      {
        key: "system_footprint",
        name: "System footprint",
        what: "How many certified facilities the system operates, how many beds between them, which states they are in, and how the facilities split by family.",
        example: "18 facilities · 2,400 beds · 4 states",
        uses:
          "Deciding whether a system is worth a named account team, and sizing the deal before the first call. The state list is also the fastest way to see whether a system sits inside one territory or crosses several.",
        coverage: null,
        api: "facilities, beds, states, by_type",
        exportHeader: null,
        append: null,
        band: "public",
        cost: "Free and public, on the system pages and over the API.",
        note:
          "A system gets a page of its own only above a published floor of active facilities; smaller chains are still named on their facilities.",
      },
    ],
  },
  {
    key: "premium",
    title: "Home address and cell phone",
    blurb:
      "Licensed data, available only under an agreement that names what it may be used for. These are matched to the provider rather than filed by them, which is why each one carries a confidence score - and why they are never in a list and never over the API.",
    fields: [
      {
        key: "home_address",
        name: "Home address",
        what: "Where a provider lives, matched to the named provider from a licensed file rather than filed by them.",
        example: "(not shown here - revealed one provider at a time, under contract)",
        uses:
          "Reaching a clinician who is not reachable at a practice, which is a narrow and genuine need - recruiting, and mail that must not go through a practice mailroom. It is the wrong tool for volume, and it is not sold that way.",
        coverage: null,
        api: null,
        exportHeader: null,
        append: null,
        band: "contract",
        cost:
          "Contract only. It is switched on for an organization by a person here, after an agreement stating the permissible use; plans that include it are not in online checkout. Revealing it costs more than an ordinary reveal, because the data underneath has a cost.",
        note:
          "There is no home address column in an export on any plan, not even an empty one, and asking for it over the API is refused by name rather than answered with blanks. Only a confirmed match under the current matching model is ever handed over: a probable one, one waiting on review, or one made by an older model is treated exactly as if nothing were on file.",
      },
      {
        key: "cell_phone",
        name: "Cell phone",
        what: "A provider's personal mobile number, matched to the named provider the same way the home address is.",
        example: "(not shown here - revealed one provider at a time, under contract)",
        uses:
          "The same narrow job as the home address, for a call rather than a letter. Whether to call or text it at all is a decision you make, not one the field makes for you.",
        coverage: null,
        api: null,
        exportHeader: null,
        append: null,
        band: "contract",
        cost:
          "Contract only, revealed one provider at a time and counted, on the same terms as the home address. A key that asks for it is refused by name rather than answered with blanks, because a column of empties looks like poor coverage and a refusal tells the truth.",
      },
      {
        key: "match_confidence",
        name: "Match confidence",
        what: "How well the link between the provider and a person in the licensed file is evidenced, out of a hundred.",
        example: "92",
        uses:
          "Knowing what you are holding. The score is built from signals that are each named and weighted - how closely the first name agrees, how rare the name is, how far the home is from the practice, and the middle initial, age, gender and suffix where they are known. Every signal agreeing on a name almost nobody has is a confident match; the same signals agreeing on one of forty people with a common name in one dense metropolitan area is not a match at all, and is not treated as one.",
        coverage: null,
        api: null,
        exportHeader: null,
        append: null,
        band: "contract",
        cost: "Contract only. It travels with the value it describes, every time one is revealed.",
        note:
          "Distance from the practice is measured in miles rather than as a state, because roughly one American worker in ten crosses a state line to get to work: matching on state alone both misses real people and invents others.",
      },
      {
        key: "do_not_call",
        name: "Do Not Call flag",
        what: "Whether the records we hold for a revealed cell number carry a Do Not Call flag. It has three states, not two: flagged, not flagged, and unknown.",
        example: "unknown",
        uses:
          "Not being handed a number blind. Unknown means we could not determine it, and it is never reported as not flagged. The flag decides nothing - it never stops a reveal and never changes what you are charged, and it is looked up after the reveal is settled, so a failed lookup produces unknown rather than a failed reveal.",
        coverage: null,
        api: null,
        exportHeader: null,
        append: null,
        band: "contract",
        cost: "Contract only, shown with the cell phone it belongs to, at no extra cost.",
        note:
          "It is not the live national registry, and nothing here may be read as saying a number is safe to call. Whether to call or text a number, flagged or not, is your decision, and compliance with do-not-call and telemarketing rules is yours.",
      },
    ],
  },
  {
    key: "metadata",
    title: "What every record carries",
    blurb:
      "The two fields that are about the record rather than about the provider, and that decide how far you can trust the rest of it.",
    fields: [
      {
        key: "updated_at",
        name: "Last confirmed",
        what: "The date the record was last confirmed against a refresh.",
        example: "2026-01-01T00:00:00Z",
        uses:
          "Deciding what is fresh enough for what you are doing. It is not the date the page was built and not the date the record was created; it is when we last saw the values stand up. Groups of fields are refreshed on different schedules, so a record is never uniformly current or stale.",
        coverage: null,
        api: "updated_at",
        exportHeader: "Updated",
        append: null,
        band: "public",
        cost: PUBLIC_RECORD,
      },
      {
        key: "suppressed_fields",
        name: "Suppressed fields",
        what: "The fields on a record that were withheld because somebody asked for them to be, listed by name rather than left silently empty.",
        example: "phone",
        uses:
          "Telling \"withheld\" apart from \"nothing on file\", which are opposite facts and look identical in a blank cell. On a page a withheld value says so; in a file the value is left out and counted in the job result, so the gap is a number you can check rather than one you have to notice.",
        coverage: null,
        api: "suppressed_fields",
        exportHeader: null,
        append: null,
        band: "public",
        cost: PUBLIC_RECORD,
        note:
          "Suppression reaches the public pages, the signed-in search, the counts, every export and every appended file, and it keeps applying through later refreshes. A record is never deleted outright, because a deleted record is one the next refresh recreates.",
      },
    ],
  },
];

/**
 * Which surfaces a field is actually on, as a sentence, derived from the three names it carries.
 *
 * Derived rather than written, so it cannot contradict the rows underneath it. A field on none of
 * the three is not a gap in the catalogue - it is the premium group, and saying so out loud is
 * half of what those four entries are for.
 */
export function surfaceClause(field: Field): string {
  const on: string[] = [];
  if (field.api !== null) on.push("over the API");
  if (field.exportHeader !== null) on.push("in an export");
  if (field.append !== null) on.push("in an append");
  if (on.length === 0) return "It is in no file and on no API route: it is revealed, or not at all.";
  const list =
    on.length === 1 ? on[0] : `${on.slice(0, -1).join(", ")} and ${on[on.length - 1]}`;
  return `Available ${list}.`;
}

/** Every field, flat, in the order the page shows them. */
export const ALL_FIELDS: Field[] = FIELD_GROUPS.flatMap((group) => group.fields);

export const FIELD_COUNT = ALL_FIELDS.length;

/** How many fields each of the three surfaces carries - said on the page, counted here. */
export const SURFACE_COUNTS = {
  api: ALL_FIELDS.filter((f) => f.api !== null).length,
  exports: ALL_FIELDS.filter((f) => f.exportHeader !== null).length,
  append: ALL_FIELDS.filter((f) => f.append !== null).length,
};

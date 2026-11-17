// Run with `npm test` (node --test; Node strips the types from the imported .ts files).
import assert from "node:assert/strict";
import { test } from "node:test";

import { DESTINATIONS, MERGE_FIELDS, destination, proposedSteps, verdict } from "./campaign.ts";
import { readFileSync } from "node:fs";

// Read as text rather than imported: exportPresets.ts imports through the `@/lib` alias, which
// `node --test` does not resolve. Still one source - the ids come from the file that defines
// them, not from a copy written here, which is the point.
const EXPORT_PRESET_IDS = new Set(
  [...readFileSync(new URL("./exportPresets.ts", import.meta.url), "utf8")
    // `crm:` is what distinguishes a preset entry from a *format* entry, which has the same
    // `{ id: "..." }` shape - without it this set would also accept "csv" as a column preset.
    .matchAll(/\{ id: "([a-z_]+)", label: "[^"]*", crm:/g)].map((m) => m[1]),
);

const reach = (total, withEmail, withTrustedEmail = 0, withPhone = 0) => ({
  total,
  withEmail,
  withTrustedEmail,
  withPhone,
});

test("an identity audience is the larger channel, never the sum", () => {
  // A row with both an email and a phone is one person. Adding the two columns would claim more
  // people than the audience holds - the same mistake as summing overlapping role counts.
  //
  // And it is the TRUSTED email count, not every address: the activation job hashes only
  // trusted-tier addresses unless told otherwise, so counting the wider 80 here would promise a
  // match rate the default file cannot reach. 70 phones beats 60 trusted addresses.
  const out = verdict(reach(100, 80, 60, 70), "identity");
  assert.equal(out.usable, 70);
  assert.ok(out.note.startsWith("At least "), out.note);
  assert.match(out.note, /trusted-tier/);
});

test("an identity audience falls back to the trusted addresses when there are more of them", () => {
  const out = verdict(reach(100, 80, 60, 20), "identity");
  assert.equal(out.usable, 60);
});

test("a thin audience says so", () => {
  const out = verdict(reach(1000, 150, 100, 0), "email");
  assert.equal(out.thin, true);
  assert.match(out.note, /15% of the audience/);
});

test("a healthy audience is not flagged thin", () => {
  assert.equal(verdict(reach(1000, 900, 700, 0), "email").thin, false);
});

test("too small for a percentage gets a count instead", () => {
  // The same floor the rest of the product uses: a share of 7 rows is a number that invites a
  // conclusion the base cannot support.
  const out = verdict(reach(7, 2, 1, 0), "email");
  assert.match(out.note, /2 of 7/);
  assert.equal(out.thin, false, "7 rows is too few to call thin");
});

test("an empty audience is not a division by zero", () => {
  const out = verdict(reach(0, 0, 0, 0), "email");
  assert.deepEqual([out.usable, out.share, out.thin], [0, 0, false]);
  assert.equal(out.note, "This audience is empty.");
});

test("the phone channel counts phones, not emails", () => {
  const out = verdict(reach(100, 90, 90, 10), "phone");
  assert.equal(out.usable, 10);
  assert.match(out.note, /practice phone/);
  assert.equal(out.thin, true);
});

test("the trusted count is only mentioned when there are addresses at all", () => {
  assert.doesNotMatch(verdict(reach(100, 0, 0, 0), "email").note, /trusted/);
  assert.match(verdict(reach(100, 50, 20, 0), "email").note, /20 of those addresses are trusted/);
});

test("every destination names a real export preset or chooses its own", () => {
  // `null` is the signal for "the destination picks" - the CRM presets and the activation job -
  // and anything else has to be an id the site actually offers. Read from EXPORT_PRESETS rather
  // than from a list written here: a copy of it was exactly the kind of second list this codebase
  // keeps getting bitten by, and it went stale the first time a preset was added (`outreach`).
  // That list is itself checked against the API's registry, and every column in it against
  // the export column catalogue, by backend/tests/test_site_export_columns.py.
  const known = EXPORT_PRESET_IDS;
  for (const one of DESTINATIONS) {
    if (one.preset !== null) {
      assert.ok(known.has(one.preset), `${one.id} names an unknown preset: ${one.preset}`);
    }
  }
});

test("the sequencer file can actually be sent", () => {
  // The bug this exists for: the sequencer pointed at `name_parts`, which carries the greeting
  // and no email column at all - so the file a customer took to Smartlead had nobody to send to.
  // Whatever preset it names must be one whose headers include an address.
  const sequencer = DESTINATIONS.find((one) => one.id === "sequencer");
  assert.equal(sequencer.preset, "outreach");
  const headers = MERGE_FIELDS.map((field) => field.header);
  assert.ok(headers.includes("Email"), "the merge fields must include an address to send to");
  assert.ok(headers.includes("First name"), "and a greeting");
});

test("a destination can be looked up, and an unknown one is null rather than a default", () => {
  assert.equal(destination("activation")?.channel, "identity");
  assert.equal(destination("not-a-destination"), null);
});

test("every proposed merge field is a header the export actually writes", () => {
  // The whole point of the module: a sequencer builds its variables from the CSV header row, so a
  // placeholder that is not a header is a gap in somebody's first email. These are the headers in
  // backend/app/jobs/exports.py EXPORT_COLUMNS.
  const written = new Set([
    "NPI", "Name", "First name", "Last name", "Credentials", "Specialty", "City", "State",
    "Phone", "Employer", "Email",
  ]);
  for (const field of MERGE_FIELDS) {
    assert.ok(written.has(field.header), `not a header the export writes: ${field.header}`);
  }
});

test("the proposed copy only uses merge fields that exist", () => {
  const headers = new Set(MERGE_FIELDS.map((field) => field.header));
  for (const channel of ["email", "phone"]) {
    for (const step of proposedSteps(channel)) {
      for (const [, name] of step.body.matchAll(/\{\{([^}]+)\}\}/g)) {
        assert.ok(headers.has(name), `step copy uses {{${name}}}, which is not a column`);
      }
    }
  }
});

test("the two name parts are marked as empty for an organization", () => {
  // An organisation NPI has no person behind it, so "Hi {{First name}}" sends "Hi ". The page
  // warns about it, and this is what the page reads to know which fields to warn about.
  const blank = MERGE_FIELDS.filter((field) => field.blankForOrganisations).map((f) => f.header);
  assert.deepEqual(blank, ["First name", "Last name"]);
});
